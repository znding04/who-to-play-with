import { computed } from 'vue'
import { useFriends } from './useFriends'

const TYPE_WEIGHTS = { trip: 2.0, activity: 1.2, meal: 1.0, hangout: 1.0, call: 0.6, online: 0.3, other: 0.5 }

// Duration multiplier for quantity scoring
const DURATION_MULT = { '30min': 0.5, '1hr': 1, '2hr': 1.5, 'halfday': 2, 'fullday': 3, 'trip': 4 }

function computeRawQuantityScore(friendId, hangouts) {
  const friendHangouts = hangouts.filter(h => h.friendIds.includes(friendId))
  if (friendHangouts.length === 0) return 0
  const total = friendHangouts.reduce((sum, h) => sum + (DURATION_MULT[h.duration] || 1), 0)
  const lastDate = friendHangouts.map(h => new Date(h.date)).reduce((max, d) => d > max ? d : max, new Date(0))
  const daysSince = (Date.now() - lastDate) / (1000 * 60 * 60 * 24)
  const decay = Math.exp(-daysSince / 60)
  return Math.log(1 + total) * 25 * (0.3 + 0.7 * decay)
}

function computeRawQualityScore(friendId, hangouts) {
  const friendHangouts = hangouts.filter(h => h.friendIds.includes(friendId))
  if (friendHangouts.length === 0) return 0
  const avgQuality = friendHangouts.reduce((sum, h) => sum + h.quality, 0) / friendHangouts.length
  const avgWeight = friendHangouts.reduce((sum, h) => sum + (TYPE_WEIGHTS[h.type] || 0.5), 0) / friendHangouts.length
  return avgQuality * avgWeight * 20
}

/**
 * Normalize scores so the global mean of all friends is at (50, 50).
 * Uses z-score normalization scaled to ~20 std dev, then shifted to 50.
 * This keeps the distribution stable as friends/hangouts are added.
 */
export function computeFriendScores(friends, hangouts) {
  if (friends.length === 0) return []

  // Compute raw scores for all friends
  const rawScores = friends.map(friend => ({
    friend,
    rawQ: computeRawQuantityScore(friend.id, hangouts),
    rawY: computeRawQualityScore(friend.id, hangouts),
  }))

  // Global statistics (mean of non-zero raw scores)
  const nonZeroQ = rawScores.filter(s => s.rawQ > 0).map(s => s.rawQ)
  const nonZeroY = rawScores.filter(s => s.rawY > 0).map(s => s.rawY)

  const meanQ = nonZeroQ.length > 0 ? nonZeroQ.reduce((a, b) => a + b, 0) / nonZeroQ.length : 0
  const meanY = nonZeroY.length > 0 ? nonZeroY.reduce((a, b) => a + b, 0) / nonZeroY.length : 0

  // Standard deviation (population)
  const stdQ = nonZeroQ.length > 0 ? Math.sqrt(nonZeroQ.reduce((s, v) => s + (v - meanQ) ** 2, 0) / nonZeroQ.length) : 1
  const stdY = nonZeroY.length > 0 ? Math.sqrt(nonZeroY.reduce((s, v) => s + (v - meanY) ** 2, 0) / nonZeroY.length) : 1

  // Normalization parameters: scale 20 means ~68% of friends fall in 30-70 range
  const SCALE = 20
  const OFFSET = 50

  // Handle edge case: all raw scores are ~0 (no hangouts)
  const safeStdQ = stdQ < 1 ? 1 : stdQ
  const safeStdY = stdY < 1 ? 1 : stdY

  return rawScores
    .map(({ friend, rawQ, rawY }) => {
      // Normalize: z-score * scale + offset
      // For friends with 0 hangouts, they get quantity=0 (centered below mean)
      const quantity = rawQ > 0 ? Math.min(100, Math.max(0, ((rawQ - meanQ) / safeStdQ) * SCALE + OFFSET)) : 0
      const quality = rawY > 0 ? Math.min(100, Math.max(0, ((rawY - meanY) / safeStdY) * SCALE + OFFSET)) : 0
      return { friend, quantity, quality, gap: quality - quantity }
    })
    .sort((a, b) => a.gap - b.gap)
}

export function useScoring() {
  const { friends, hangouts } = useFriends()

  const scoredFriends = computed(() => computeFriendScores(friends.value, hangouts.value))

  return { scoredFriends }
}
