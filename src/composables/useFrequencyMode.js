import { ref, watch } from 'vue'

const KEY = 'wtpw_freq_mode'
const VALID = ['lifetime', 'permonth']

function load() {
  const raw = localStorage.getItem(KEY)
  return VALID.includes(raw) ? raw : 'lifetime'
}

const freqMode = ref(load())

watch(freqMode, (v) => {
  localStorage.setItem(KEY, v)
})

export function useFrequencyMode() {
  return { freqMode }
}
