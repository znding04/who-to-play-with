import { ref, watch } from 'vue'

const KEY = 'wtpw_custom_durations'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const customDurations = ref(load())

watch(customDurations, (v) => {
  localStorage.setItem(KEY, JSON.stringify(v))
}, { deep: true })

export function useCustomDurations() {
  function addCustomDuration(rawLabel) {
    const label = (rawLabel || '').trim()
    if (!label) return null
    const existing = customDurations.value.find((d) => d.label === label)
    if (existing) return existing
    const value = `c_${crypto.randomUUID().slice(0, 8)}`
    const created = { value, label }
    customDurations.value.push(created)
    return created
  }

  function removeCustomDuration(value) {
    const idx = customDurations.value.findIndex((d) => d.value === value)
    if (idx >= 0) customDurations.value.splice(idx, 1)
  }

  return { customDurations, addCustomDuration, removeCustomDuration }
}
