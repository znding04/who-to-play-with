import { ref, watch } from 'vue'

const KEY = 'wtpw_gap_threshold'
const DEFAULT = 12
const MIN = 2
const MAX = 30

function load() {
  const raw = Number(localStorage.getItem(KEY))
  if (!Number.isFinite(raw) || raw < MIN || raw > MAX) return DEFAULT
  return raw
}

const gapThreshold = ref(load())

watch(gapThreshold, (v) => {
  localStorage.setItem(KEY, String(v))
})

export function useGapThreshold() {
  return { gapThreshold, MIN, MAX, DEFAULT }
}
