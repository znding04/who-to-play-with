import { ref, computed, watch } from 'vue'
import { useDataFilter } from './useDataFilter'

const FRIENDS_KEY = 'wtpw_friends'
const HANGOUTS_KEY = 'wtpw_hangouts'
const SCHEMA_VERSION_KEY = 'wtpw_schema_version'
const CURRENT_SCHEMA = 3

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Migrations:
// v1 → v2: 1-5 ratings doubled to 1-10 scale.
// v2 → v3: existing data is treated as seed (isSeed=true). Newly added friends/
//          hangouts default to isSeed=false so they survive the cleanup button.
function migrate() {
  const stored = Number(localStorage.getItem(SCHEMA_VERSION_KEY) || 0)
  if (stored >= CURRENT_SCHEMA) return

  if (stored < 2) {
    const list = load(HANGOUTS_KEY)
    if (list.length > 0) {
      const upgraded = list.map((h) => (h.quality <= 5 ? { ...h, quality: h.quality * 2 } : h))
      localStorage.setItem(HANGOUTS_KEY, JSON.stringify(upgraded))
    }
  }

  if (stored < 3) {
    const friendsList = load(FRIENDS_KEY)
    if (friendsList.length > 0) {
      const tagged = friendsList.map((f) => (f.isSeed === undefined ? { ...f, isSeed: true } : f))
      localStorage.setItem(FRIENDS_KEY, JSON.stringify(tagged))
    }
    const hangoutsList = load(HANGOUTS_KEY)
    if (hangoutsList.length > 0) {
      const tagged = hangoutsList.map((h) => (h.isSeed === undefined ? { ...h, isSeed: true } : h))
      localStorage.setItem(HANGOUTS_KEY, JSON.stringify(tagged))
    }
  }

  localStorage.setItem(SCHEMA_VERSION_KEY, String(CURRENT_SCHEMA))
}

migrate()

// Raw, unfiltered state. Mutations always target these refs.
const _friends = ref(load(FRIENDS_KEY))
const _hangouts = ref(load(HANGOUTS_KEY))

watch(_friends, (val) => {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(val))
}, { deep: true })

watch(_hangouts, (val) => {
  localStorage.setItem(HANGOUTS_KEY, JSON.stringify(val))
}, { deep: true })

const { showSeed } = useDataFilter()

// Filtered views — what most consumers should use for read.
const friends = computed(() =>
  showSeed.value ? _friends.value : _friends.value.filter((f) => !f.isSeed)
)

const hangouts = computed(() =>
  showSeed.value ? _hangouts.value : _hangouts.value.filter((h) => !h.isSeed)
)

// Internal handle for the seed module to wipe / replace state.
export const _internalState = { friends: _friends, hangouts: _hangouts }

export function useFriends() {
  function addFriend({ name, tags = [], phone, birthday, location, howWeMet, importantEvents, values, isSeed = false }) {
    const friend = {
      id: crypto.randomUUID(),
      name,
      tags,
      addedAt: Date.now(),
      phone: phone || '',
      birthday: birthday || '',
      location: location || '',
      howWeMet: howWeMet || '',
      importantEvents: importantEvents || [],
      values: values || [],
      isSeed,
    }
    _friends.value.push(friend)
    return friend
  }

  function updateFriend(id, updates) {
    const idx = _friends.value.findIndex((f) => f.id === id)
    if (idx < 0) return null
    _friends.value[idx] = { ..._friends.value[idx], ...updates }
    return _friends.value[idx]
  }

  function deleteFriend(id) {
    _friends.value = _friends.value.filter((f) => f.id !== id)
  }

  // Lookup uses the raw store so deep links to seed friends still resolve
  // even when seed data is hidden in lists.
  function getFriendById(id) {
    return _friends.value.find((f) => f.id === id)
  }

  function addHangout({ friendIds, type, duration, quality, note, date, isSeed = false }) {
    const hangout = {
      id: crypto.randomUUID(),
      friendIds,
      type,
      duration,
      quality,
      note: note || '',
      date,
      createdAt: Date.now(),
      isSeed,
    }
    _hangouts.value.push(hangout)
    return hangout
  }

  function deleteHangout(id) {
    _hangouts.value = _hangouts.value.filter((h) => h.id !== id)
  }

  function getHangoutsForFriend(friendId) {
    return hangouts.value.filter((h) => h.friendIds.includes(friendId))
  }

  function deleteSeedData() {
    _friends.value = _friends.value.filter((f) => !f.isSeed)
    _hangouts.value = _hangouts.value.filter((h) => !h.isSeed)
  }

  const hasSeedData = computed(() =>
    _friends.value.some((f) => f.isSeed) || _hangouts.value.some((h) => h.isSeed)
  )

  return {
    friends,
    hangouts,
    addFriend,
    updateFriend,
    deleteFriend,
    getFriendById,
    addHangout,
    deleteHangout,
    getHangoutsForFriend,
    deleteSeedData,
    hasSeedData,
  }
}
