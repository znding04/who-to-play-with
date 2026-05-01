import { computed } from 'vue'
import { useFriends } from './useFriends'
import { useCustomTypes } from './useCustomTypes'
import { useScaleMode } from './useScaleMode'
import { useViewMode } from './useViewMode'
import { useI18n } from './useI18n.js'
import { HANGOUT_TYPES, displayLabel, getHangoutTypes } from '../types/index.js'

/**
 * Normalize activity scores using the same log + range approach as useScoring.
 * Each item must have { rawFreq, rawQual, ... }.
 */
function normalizeActivityScores(rawScores, scaleMode) {
  const useLog = scaleMode !== 'linear'

  const valX = rawScores.map(s => s.rawFreq > 0 ? (useLog ? Math.log(1 + s.rawFreq) : s.rawFreq) : 0)
  const valY = rawScores.map(s => s.rawQual > 0 ? (useLog ? Math.log(1 + s.rawQual) : s.rawQual) : 0)

  const nonZeroX = valX.filter(v => v > 0)
  const nonZeroY = valY.filter(v => v > 0)

  const minX = nonZeroX.length > 0 ? Math.min(...nonZeroX) : 0
  const maxX = nonZeroX.length > 0 ? Math.max(...nonZeroX) : 0
  const minY = nonZeroY.length > 0 ? Math.min(...nonZeroY) : 0
  const maxY = nonZeroY.length > 0 ? Math.max(...nonZeroY) : 0

  const rangeX = maxX - minX
  const rangeY = maxY - minY

  return rawScores.map((s) => {
    const vx = s.rawFreq > 0 ? (useLog ? Math.log(1 + s.rawFreq) : s.rawFreq) : 0
    const vy = s.rawQual > 0 ? (useLog ? Math.log(1 + s.rawQual) : s.rawQual) : 0
    const quantity = vx > 0 ? (rangeX > 0 ? Math.max(1, Math.round(((vx - minX) / rangeX) * 100)) : 50) : 0
    const quality = vy > 0 ? (rangeY > 0 ? Math.max(1, Math.round(((vy - minY) / rangeY) * 100)) : 50) : 0
    return { ...s, quantity, quality, gap: quality - quantity }
  })
}

function absoluteActivityScores(rawScores) {
  return rawScores.map((s) => {
    // rawQual is avg * 10 (0-100), rawFreq is count — clamp to 0-100
    const quantity = Math.min(100, Math.max(0, s.rawFreq))
    const quality = Math.min(100, Math.max(0, s.rawQual))
    return { ...s, quantity, quality, gap: quality - quantity }
  })
}

/**
 * Compute raw activity scores from a list of hangouts.
 * Returns [{ id, label, rawFreq, rawQual }]
 */
function computeRawActivityScores(hangouts, typeMap, t) {
  const stats = {}
  for (const h of hangouts) {
    for (const tp of getHangoutTypes(h)) {
      if (!stats[tp]) stats[tp] = { count: 0, totalQuality: 0 }
      stats[tp].count++
      stats[tp].totalQuality += h.quality
    }
  }
  return Object.entries(stats).map(([type, s]) => {
    const info = typeMap[type]
    const label = info ? `${info.icon || '📦'} ${displayLabel(info, t)}` : type
    return {
      id: type,
      label,
      rawFreq: s.count,
      rawQual: (s.totalQuality / s.count) * 10, // same 0-100 scale as friend quality
    }
  })
}

export function useActivityScoring() {
  const { hangouts } = useFriends()
  const { customTypes } = useCustomTypes()
  const { scaleMode } = useScaleMode()
  const { mode } = useViewMode()
  const { t } = useI18n()

  const typeMap = computed(() =>
    Object.fromEntries([...HANGOUT_TYPES, ...customTypes.value].map(tp => [tp.value, tp]))
  )

  /** Global activity scores (all friends, all hangouts) */
  const activityPlotScores = computed(() => {
    const raw = computeRawActivityScores(hangouts.value, typeMap.value, t)
    return mode.value === 'absolute'
      ? absoluteActivityScores(raw)
      : normalizeActivityScores(raw, scaleMode.value)
  })

  return { activityPlotScores, computeRawActivityScores, typeMap }
}

/**
 * Compute activity scores for a specific set of hangouts (e.g. for one friend).
 * Used by FriendDetail — not a composable, just a helper.
 */
export function computeFriendActivityPlotScores(hangouts, typeMap, t, scaleMode, viewMode) {
  const raw = computeRawActivityScores(hangouts, typeMap, t)
  return viewMode === 'absolute'
    ? absoluteActivityScores(raw)
    : normalizeActivityScores(raw, scaleMode)
}
