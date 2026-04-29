<script setup>
import { computed } from 'vue'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useGapThreshold } from '../composables/useGapThreshold'
import ScatterPlot from '../components/ScatterPlot.vue'
import InsightsPanel from '../components/InsightsPanel.vue'

const { friends, hangouts } = useFriends()
const { scoredFriends } = useScoring()
const { gapThreshold } = useGapThreshold()

const friendCount = computed(() => friends.value.length)

const hangoutsThisWeek = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  return hangouts.value.filter(h => new Date(h.date) >= weekAgo).length
})

const recommendation = computed(() => {
  const scored = scoredFriends.value
  if (scored.length === 0) return null

  const now = Date.now()
  const dayMs = 1000 * 60 * 60 * 24

  // Priority 1: most negative gap, active in last 30 days
  const negativeActive = scored
    .filter(s => s.gap < -gapThreshold.value)
    .filter(s => {
      const fh = hangouts.value.filter(h => h.friendIds.includes(s.friend.id))
      if (fh.length === 0) return false
      const last = fh.map(h => new Date(h.date)).reduce((max, d) => d > max ? d : max, new Date(0))
      return (now - last) / dayMs <= 30
    })
  if (negativeActive.length > 0) {
    const pick = negativeActive[0]
    return {
      friend: pick.friend,
      text: `你应该找 ${pick.friend.name} 聊聊 — 你付出了很多但感觉一般，可以认真聊一次`,
      color: 'from-red-400 to-red-500',
    }
  }

  // Priority 2: most positive gap, not seen in 14+ days
  const positiveStale = [...scored]
    .reverse()
    .filter(s => s.gap > gapThreshold.value)
    .filter(s => {
      const fh = hangouts.value.filter(h => h.friendIds.includes(s.friend.id))
      if (fh.length === 0) return true
      const last = fh.map(h => new Date(h.date)).reduce((max, d) => d > max ? d : max, new Date(0))
      return (now - last) / dayMs >= 14
    })
  if (positiveStale.length > 0) {
    const pick = positiveStale[0]
    return {
      friend: pick.friend,
      text: `你应该找 ${pick.friend.name} 玩玩 — 这段友谊总是让你很开心，但好久没见了`,
      color: 'from-green-400 to-green-500',
    }
  }

  // Priority 3: lowest quantity overall
  const byQuantity = [...scored].sort((a, b) => a.quantity - b.quantity)
  const pick = byQuantity[0]
  return {
    friend: pick.friend,
    text: `你应该找 ${pick.friend.name} 重新建立联系 — 你们好久没联系了`,
    color: 'from-amber-400 to-amber-500',
  }
})
</script>

<template>
  <div class="px-4 pt-6">
    <h1 class="text-xl font-bold text-gray-800 mb-1">找谁玩</h1>
    <p class="text-sm text-gray-400 mb-4">Who To Play With</p>

    <!-- Recommendation card -->
    <div
      v-if="recommendation"
      class="rounded-2xl p-4 text-white mb-4 shadow-md cursor-pointer bg-gradient-to-br"
      :class="recommendation.color"
    >
      <p class="text-xs opacity-80 mb-1">💡 推荐</p>
      <p class="text-sm font-medium leading-relaxed">{{ recommendation.text }}</p>
    </div>

    <!-- Quick stats -->
    <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white mb-4 shadow-md">
      <div class="grid grid-cols-2 gap-3 text-center">
        <div>
          <p class="text-xs opacity-70">朋友</p>
          <p class="text-2xl font-bold mt-1">{{ friendCount }}</p>
        </div>
        <div>
          <p class="text-xs opacity-70">本周聚会</p>
          <p class="text-2xl font-bold mt-1">{{ hangoutsThisWeek }}</p>
        </div>
      </div>
    </div>

    <!-- Scatter plot or empty state -->
    <div v-if="friends.length === 0" class="text-center text-gray-400 py-10 text-sm">
      添加朋友开始记录吧
    </div>

    <div v-else>
      <h2 class="text-sm font-semibold text-gray-600 mb-2">友谊散点图</h2>
      <div class="bg-gray-50 rounded-xl p-3">
        <ScatterPlot :scores="scoredFriends" />
      </div>
      <p class="text-xs text-gray-400 mt-2 text-center">
        <span class="text-green-500">●</span> 很值得
        <span class="ml-2 text-red-500">●</span> 不平衡
        <span class="ml-2 text-blue-500">●</span> 平衡
      </p>

      <div class="mt-4">
        <InsightsPanel />
      </div>
    </div>
  </div>
</template>
