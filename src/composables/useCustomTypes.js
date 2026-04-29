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

export function useCustomTypes() {
  function addCustomType(rawLabel) {
    const label = (rawLabel || '').trim()
    if (!label) return null
    const existing = customTypes.value.find((t) => t.label === label)
    if (existing) return existing
    const value = `c_${crypto.randomUUID().slice(0, 8)}`
    const created = { value, label, icon: '📦' }
    customTypes.value.push(created)
    return created
  }

  return { customTypes, addCustomType }
}
