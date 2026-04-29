import { watch } from 'vue'
import { useFriends, _internalState } from './useFriends'
import { useI18n } from './useI18n.js'
import { seedZh } from '../data/seedFriends.zh.js'
import { seedEn } from '../data/seedFriends.en.js'

const SEED_KEY = 'wtpw_seeded'
const LOCALE_KEY = 'wtpw_seeded_locale'
const SEED_VERSION = '3'

export function useSeedData() {
  const { addFriend: addFriendBase, addHangout: addHangoutBase } = useFriends()
  const { locale } = useI18n()
  const addFriend = (props) => addFriendBase({ ...props, isSeed: true })
  const addHangout = (props) => addHangoutBase({ ...props, isSeed: true })

  function runSeed(loc) {
    _internalState.friends.value = []
    _internalState.hangouts.value = []

    const today = new Date()
    const d = (daysAgo) => {
      const dt = new Date(today)
      dt.setDate(dt.getDate() - daysAgo)
      return dt.toISOString().slice(0, 10)
    }

    const seed = loc === 'en' ? seedEn : seedZh
    seed({ addFriend, addHangout, d })

    localStorage.setItem(SEED_KEY, SEED_VERSION)
    localStorage.setItem(LOCALE_KEY, loc)
  }

  // True iff every entry is seed-flagged — protects users who've added real data.
  function onlySeedData() {
    const friends = _internalState.friends.value
    const hangouts = _internalState.hangouts.value
    if (friends.length === 0) return false
    return friends.every((f) => f.isSeed) && hangouts.every((h) => h.isSeed)
  }

  function seedIfEmpty() {
    const seeded = localStorage.getItem(SEED_KEY) === SEED_VERSION
    const seededLocale = localStorage.getItem(LOCALE_KEY)

    if (!seeded) {
      runSeed(locale.value)
      return
    }

    // Migration: pre-locale-aware seeds have no LOCALE_KEY. Re-seed in the
    // current locale if the data is still only the original samples.
    if (!seededLocale && onlySeedData()) {
      runSeed(locale.value)
      return
    }

    if (seededLocale && seededLocale !== locale.value && onlySeedData()) {
      runSeed(locale.value)
    }
  }

  // Auto re-seed when the user toggles language, but only if they haven't
  // added their own friends/hangouts yet.
  watch(locale, (newLocale) => {
    const seededLocale = localStorage.getItem(LOCALE_KEY)
    if (seededLocale === newLocale) return
    if (onlySeedData()) runSeed(newLocale)
  })

  return { seedIfEmpty }
}
