import { ref, watch } from 'vue'

const KEY = 'wtpw_scale_mode'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw === 'linear' ? 'linear' : 'log'
  } catch {
    return 'log'
  }
}

const scaleMode = ref(load())

watch(scaleMode, (v) => {
  localStorage.setItem(KEY, v)
})

export function useScaleMode() {
  function toggleScaleMode() {
    scaleMode.value = scaleMode.value === 'log' ? 'linear' : 'log'
  }

  return { scaleMode, toggleScaleMode }
}
