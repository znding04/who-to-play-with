import { ref, watch } from 'vue'

const FRIENDS_KEY = 'wtpw_friends'
const HANGOUTS_KEY = 'wtpw_hangouts'

function load(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Singleton reactive state
const friends = ref(load(FRIENDS_KEY))
const hangouts = ref(load(HANGOUTS_KEY))

watch(friends, (val) => {
  localStorage.setItem(FRIENDS_KEY, JSON.stringify(val))
}, { deep: true })

watch(hangouts, (val) => {
  localStorage.setItem(HANGOUTS_KEY, JSON.stringify(val))
}, { deep: true })

export function useFriends() {
  function addFriend({ name, tags = [], phone, birthday, location, howWeMet, importantEvents, values }) {
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
    }
    friends.value.push(friend)
    return friend
  }

  function updateFriend(id, updates) {
    const idx = friends.value.findIndex(f => f.id === id)
    if (idx < 0) return null
    friends.value[idx] = { ...friends.value[idx], ...updates }
    return friends.value[idx]
  }

  function deleteFriend(id) {
    friends.value = friends.value.filter((f) => f.id !== id)
  }

  function getFriendById(id) {
    return friends.value.find((f) => f.id === id)
  }

  function addHangout({ friendIds, type, duration, quality, note, date }) {
    const hangout = {
      id: crypto.randomUUID(),
      friendIds,
      type,
      duration,
      quality,
      note: note || '',
      date,
      createdAt: Date.now(),
    }
    hangouts.value.push(hangout)
    return hangout
  }

  function deleteHangout(id) {
    hangouts.value = hangouts.value.filter((h) => h.id !== id)
  }

  function getHangoutsForFriend(friendId) {
    return hangouts.value.filter((h) => h.friendIds.includes(friendId))
  }

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
  }
}
