import { ref, watch } from 'vue'

const KEY = 'wtpw_show_seed'

function load() {
  const raw = localStorage.getItem(KEY)
  if (raw === 'false') return false
  return true // default: show seed data
}

const showSeed = ref(load())

watch(showSeed, (v) => {
  localStorage.setItem(KEY, v ? 'true' : 'false')
})

export function useDataFilter() {
  return { showSeed }
}
