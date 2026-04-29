import { ref, watch } from 'vue'

const KEY = 'wtpw_custom_hangout_types'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const customTypes = ref(load())

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

export function useCustomTypes() {
  function addCustomType(rawLabel) {
    const raw = (rawLabel || '').trim()
    if (!raw) return null
    const { icon, label } = splitEmoji(raw)
    if (!label) return null
    const existing = customTypes.value.find((t) => t.label === label)
    if (existing) return existing
    const value = `c_${crypto.randomUUID().slice(0, 8)}`
    const created = { value, label, icon }
    customTypes.value.push(created)
    return created
  }

  function removeCustomType(value) {
    const idx = customTypes.value.findIndex((t) => t.value === value)
    if (idx >= 0) customTypes.value.splice(idx, 1)
  }

  return { customTypes, addCustomType, removeCustomType }
}
