import { ref, watch } from 'vue'
import { api } from '../utils/api.js'
import { useAuth } from './useAuth.js'

const KEY = 'wtpw_custom_hangout_types'
const CLEANUP_KEY = 'wtpw_custom_types_deduped'

// Remove duplicate types, keeping the first occurrence of each `value`.
// Also collapses entries that share a `label` but have different generated values.
function dedupeTypes(types) {
  const seenValues = new Set()
  const seenLabels = new Set()
  const result = []
  for (const t of types) {
    const lowerLabel = t.label.toLowerCase()
    if (seenValues.has(t.value) || seenLabels.has(lowerLabel)) continue
    seenValues.add(t.value)
    seenLabels.add(lowerLabel)
    result.push(t)
  }
  return result
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? dedupeTypes(parsed) : []
  } catch {
    return []
  }
}

const customTypes = ref(load())
const _cloudSynced = ref(false)
const _cloudLoading = ref(false)

watch(customTypes, (v) => {
  localStorage.setItem(KEY, JSON.stringify(v))
}, { deep: true })

// Split a leading emoji off the input so users can type "🎲 桌游" to set
// both the icon and the label in one field.
function splitEmoji(input) {
  const trimmed = input.trim()
  const match = trimmed.match(/^(\p{Extended_Pictographic}(?:\u200D\p{Extended_Pictographic})*\uFE0F?)\s*(.*)$/u)
  if (match && match[2]) {
    return { icon: match[1], label: match[2].trim() }
  }
  return { icon: '📦', label: trimmed }
}

async function syncFromCloud() {
  if (_cloudLoading.value) return
  _cloudLoading.value = true
  try {
    // Fetch cloud types first
    const cloudData = await api.getCustomTypes()
    const cloudTypes = cloudData.customTypes || []

    // Merge: cloud types take priority, then add any local-only items
    const cloudValues = new Set(cloudTypes.map((t) => t.value))
    const localOnly = customTypes.value.filter((t) => !cloudValues.has(t.value))

    // Push local-only items to cloud
    for (const t of localOnly) {
      try {
        await api.createCustomType(t)
      } catch (e) {
        console.error('Failed to push custom type:', e)
      }
    }

    // Deduplicate the merged result
    const merged = dedupeTypes([...cloudTypes, ...localOnly])
    customTypes.value = merged
    _cloudSynced.value = true
  } catch (err) {
    console.error('Custom types sync failed:', err)
  } finally {
    _cloudLoading.value = false
  }
}

// One-time cleanup: deduplicate existing types on first load
function runOneTimeCleanup() {
  if (localStorage.getItem(CLEANUP_KEY)) return
  const before = customTypes.value.length
  customTypes.value = dedupeTypes(customTypes.value)
  if (before !== customTypes.value.length) {
    console.log(`Cleaned up ${before - customTypes.value.length} duplicate custom types`)
  }
  localStorage.setItem(CLEANUP_KEY, '1')
}
runOneTimeCleanup()

const { isLoggedIn: _isLoggedInRef } = useAuth()
watch(
  _isLoggedInRef,
  (loggedIn) => {
    if (loggedIn) {
      if (!_cloudSynced.value && !_cloudLoading.value) syncFromCloud()
    } else {
      _cloudSynced.value = false
    }
  },
  { immediate: true }
)

export function useCustomTypes() {
  function addCustomType(rawLabel) {
    const raw = (rawLabel || '').trim()
    if (!raw) return null
    const { icon, label } = splitEmoji(raw)
    if (!label) return null
    // Check for duplicates by both label and value
    const existingByLabel = customTypes.value.find((t) => t.label.toLowerCase() === label.toLowerCase())
    if (existingByLabel) return existingByLabel
    const value = `c_${crypto.randomUUID().slice(0, 8)}`
    const created = { value, label, icon }
    customTypes.value.push(created)

    if (_isLoggedInRef.value) {
      api.createCustomType(created).catch((err) => console.error('Failed to sync custom type:', err))
    }
    return created
  }

  function removeCustomType(value) {
    const idx = customTypes.value.findIndex((t) => t.value === value)
    if (idx >= 0) customTypes.value.splice(idx, 1)

    if (_isLoggedInRef.value) {
      api.deleteCustomType(value).catch((err) => console.error('Failed to sync custom type delete:', err))
    }
  }

  return { customTypes, addCustomType, removeCustomType }
}
