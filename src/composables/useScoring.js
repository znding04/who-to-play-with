import { computed } from 'vue'
import { useFriends } from './useFriends'
import { useViewMode } from './useViewMode'
import { useFrequencyMode } from './useFrequencyMode'
import { useCustomDurations } from './useCustomDurations'
import { usePlotExclusions } from './usePlotExclusions'
import { useScaleMode } from './useScaleMode'

// Duration multiplier for lifetime quantity scoring (compressed, not real hours)
const DURATION_MULT = { '30min': 0.5, '1hr': 1, '2hr': 1.5, 'halfday': 2, 'fullday': 3, 'trip': 4 }

// Real hours per duration bucket — used for the per-month rate metric
const DURATION_HOURS = { '30min': 0.5, '1hr': 1, '2hr': 2, 'halfday': 4, 'fullday': 8, 'trip': 24 }

const MS_PER_DAY = 1000 * 60 * 60 * 24
const DAYS_PER_MONTH = 30

function computeRawLifetimeScore(friendId, hangouts, customDurations) {
  const friendHangouts = hangouts.filter(h => h.friendIds.includes(friendId))
  if (friendHangouts.length === 0) return 0
  const total = friendHangouts.reduce((sum, h) => {
    if (DURATION_MULT[h.duration] !== undefined) return sum + DURATION_MULT[h.duration]
    const custom = customDurations.find(d => d.value === h.duration)
    if (custom) {
      if (custom.days > 0) return sum + Math.log2(1 + custom.days * 8) * 0.5
      if (custom.hours > 0) return sum + Math.log2(1 + custom.hours) * 0.5
    }
    return sum + 1
  }, 0)
  const lastDate = friendHangouts.map(h => new Date(h.date)).reduce((max, d) => d > max ? d : max, new Date(0))
  const daysSince = (Date.now() - lastDate) / MS_PER_DAY
  const decay = Math.exp(-daysSince / 60)
  return Math.log(1 + total) * 25 * (0.3 + 0.7 * decay)
}

function computeRawPerMonthScore(friendId, hangouts, customDurations) {
  const friendHangouts = hangouts.filter(h => h.friendIds.includes(friendId))
  if (friendHangouts.length === 0) return 0
  const totalHours = friendHangouts.reduce((sum, h) => {
    if (DURATION_HOURS[h.duration] !== undefined) return sum + DURATION_HOURS[h.duration]
    const custom = customDurations.find(d => d.value === h.duration)
    if (custom) {
      if (custom.days > 0) return sum + custom.days * 24
      if (custom.hours > 0) return sum + custom.hours
    }
    return sum + 1
  }, 0)
  const firstDate = friendHangouts.map(h => new Date(h.date)).reduce((min, d) => d < min ? d : min, new Date())
  const daysSinceFirst = Math.max(0, (Date.now() - firstDate) / MS_PER_DAY)
  // Floor at half a month so a brand-new friend with one hangout doesn't dominate the axis.
  const months = Math.max(0.5, daysSinceFirst / DAYS_PER_MONTH)
  const hoursPerMonth = totalHours / months
  return Math.log(1 + hoursPerMonth) * 25
}

function computeRawQuantityScore(friendId, hangouts, freqMode, customDurations) {
  return freqMode === 'permonth'
    ? computeRawPerMonthScore(friendId, hangouts, customDurations)
    : computeRawLifetimeScore(friendId, hangouts, customDurations)
}

function computeRawQualityScore(friendId, hangouts) {
  // Quality = pure average rating (1-10 → 10-100). Type weight intentionally
  // excluded: it represents "investment" (belongs in quantity), not how the
  // experience felt. A 8/10 online call is still an 8/10 experience.
  const friendHangouts = hangouts.filter(h => h.friendIds.includes(friendId))
  if (friendHangouts.length === 0) return 0
  const avgQuality = friendHangouts.reduce((sum, h) => sum + h.quality, 0) / friendHangouts.length
  return avgQuality * 10
}

function computeRawScores(friends, hangouts, freqMode, customDurations) {
  return friends.map(friend => ({
    friend,
    rawQ: computeRawQuantityScore(friend.id, hangouts, freqMode, customDurations),
    rawY: computeRawQualityScore(friend.id, hangouts),
  }))
}

/**
 * Log + Range normalization: applies log(1+x) to compress outliers, then
 * range-normalizes to 0-100.  This prevents one "hangout monster" friend from
 * pushing everyone else into the corner of the scatter plot.
 *
 * Linear mode: skips the log transform and uses raw scores directly with
 * range normalization.
 */
function normalizeScores(rawScores, scaleMode) {
  const useLog = scaleMode !== 'linear'

  const valQ = rawScores.map(s => s.rawQ > 0 ? (useLog ? Math.log(1 + s.rawQ) : s.rawQ) : 0)
  const valY = rawScores.map(s => s.rawY > 0 ? (useLog ? Math.log(1 + s.rawY) : s.rawY) : 0)

  const nonZeroQ = valQ.filter(v => v > 0)
  const nonZeroY = valY.filter(v => v > 0)

  const minQ = nonZeroQ.length > 0 ? Math.min(...nonZeroQ) : 0
  const maxQ = nonZeroQ.length > 0 ? Math.max(...nonZeroQ) : 0
  const minY = nonZeroY.length > 0 ? Math.min(...nonZeroY) : 0
  const maxY = nonZeroY.length > 0 ? Math.max(...nonZeroY) : 0

  const rangeQ = maxQ - minQ
  const rangeY = maxY - minY

  return rawScores.map(({ friend, rawQ, rawY }) => {
    const vq = rawQ > 0 ? (useLog ? Math.log(1 + rawQ) : rawQ) : 0
    const vy = rawY > 0 ? (useLog ? Math.log(1 + rawY) : rawY) : 0
    // Use Math.max(1, …) so friends with data never normalize to 0 —
    // 0 is reserved for friends with NO hangouts at all.
    const quantity = vq > 0 ? (rangeQ > 0 ? Math.max(1, Math.round(((vq - minQ) / rangeQ) * 100)) : 50) : 0
    const quality = vy > 0 ? (rangeY > 0 ? Math.max(1, Math.round(((vy - minY) / rangeY) * 100)) : 50) : 0
    return { friend, quantity, quality, gap: quality - quantity }
  })
}

function absoluteScores(rawScores) {
  // Raw quality is naturally 10-100 (rating × 10); raw quantity is bounded
  // by log(1 + total) × 25 × decay which tops out around 100 in practice.
  return rawScores.map(({ friend, rawQ, rawY }) => {
    const quantity = Math.min(100, Math.max(0, rawQ))
    const quality = Math.min(100, Math.max(0, rawY))
    return { friend, quantity, quality, gap: quality - quantity }
  })
}

export function useScoring() {
  const { friends, hangouts } = useFriends()
  const { mode } = useViewMode()
  const { freqMode } = useFrequencyMode()
  const { customDurations } = useCustomDurations()
  const { isExcluded } = usePlotExclusions()
  const { scaleMode } = useScaleMode()

  const scoredFriends = computed(() => {
    const includedFriends = friends.value.filter(f => !isExcluded(f.id))
    const raw = computeRawScores(includedFriends, hangouts.value, freqMode.value, customDurations.value)
    const scored = mode.value === 'absolute' ? absoluteScores(raw) : normalizeScores(raw, scaleMode.value)
    return scored.sort((a, b) => a.gap - b.gap)
  })

  return { scoredFriends }
}
