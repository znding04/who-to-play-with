import { ref, watch } from 'vue'

const KEY = 'wtpw_plot_exclusions'

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const excluded = ref(load())

watch(excluded, (v) => {
  localStorage.setItem(KEY, JSON.stringify(v))
}, { deep: true })

export function usePlotExclusions() {
  function isExcluded(friendId) {
    return excluded.value.includes(friendId)
  }

  function toggleExclusion(friendId) {
    const idx = excluded.value.indexOf(friendId)
    if (idx >= 0) {
      excluded.value.splice(idx, 1)
    } else {
      excluded.value.push(friendId)
    }
  }

  return { excluded, isExcluded, toggleExclusion }
}
