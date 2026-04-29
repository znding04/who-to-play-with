<script setup>
import { computed } from 'vue'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import ScatterPlot from '../components/ScatterPlot.vue'
import { HANGOUT_TYPES } from '../types/index.js'

const { friends, hangouts } = useFriends()
const { scoredFriends } = useScoring()

// Section 2: Rankings
const mostRewarding = computed(() =>
  [...scoredFriends.value].sort((a, b) => b.gap - a.gap).slice(0, 5)
)

const needsAttention = computed(() =>
  [...scoredFriends.value].sort((a, b) => a.gap - b.gap).slice(0, 5)
)

const longTimeNoSee = computed(() => {
  const now = Date.now()
  const dayMs = 1000 * 60 * 60 * 24
  return scoredFriends.value
    .filter(s => {
      const fh = hangouts.value.filter(h => h.friendIds.includes(s.friend.id))
      if (fh.length === 0) return true
      const last = fh.map(h => new Date(h.date)).reduce((max, d) => d > max ? d : max, new Date(0))
      return (now - last) / dayMs >= 30
    })
    .sort((a, b) => b.gap - a.gap)
})

// Section 3: Overall stats
const totalHangouts = computed(() => hangouts.value.length)

const avgQuality = computed(() => {
  if (hangouts.value.length === 0) return 0
  return (hangouts.value.reduce((sum, h) => sum + h.quality, 0) / hangouts.value.length).toFixed(1)
})

const mostCommonType = computed(() => {
  if (hangouts.value.length === 0) return null
  const counts = {}
  hangouts.value.forEach(h => { counts[h.type] = (counts[h.type] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  const info = HANGOUT_TYPES.find(t => t.value === top[0])
  return info ? `${info.icon} ${info.label}` : top[0]
})

const mostFrequentFriend = computed(() => {
  if (hangouts.value.length === 0 || friends.value.length === 0) return null
  const counts = {}
  hangouts.value.forEach(h => {
    h.friendIds.forEach(id => { counts[id] = (counts[id] || 0) + 1 })
  })
  const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const friend = friends.value.find(f => f.id === topId)
  return friend ? friend.name : null
})

function gapColor(gap) {
  if (gap > 5) return 'text-green-600'
  if (gap < -5) return 'text-red-500'
  return 'text-blue-500'
}
</script>

<template>
  <div class="px-4 pt-6 pb-6">
    <h1 class="text-xl font-bold text-gray-800 mb-1">统计</h1>
    <p class="text-sm text-gray-400 mb-6">Stats</p>

    <div v-if="friends.length === 0" class="text-center text-gray-400 py-16 text-sm">
      添加朋友和记录聚会后这里会显示统计
    </div>

    <template v-else>
      <!-- Section 1: Global Scatter Plot -->
      <section class="mb-6">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">友谊散点图</h2>
        <div class="bg-gray-50 rounded-xl p-3">
          <ScatterPlot :scores="scoredFriends" />
        </div>
        <p class="text-xs text-gray-400 mt-2 text-center">
          <span class="text-green-500">●</span> 很值得
          <span class="ml-2 text-red-500">●</span> 不平衡
          <span class="ml-2 text-blue-500">●</span> 平衡
        </p>
      </section>

      <!-- Section 2: Friend Rankings -->
      <section class="mb-6 space-y-4">
        <!-- Most Rewarding -->
        <div>
          <h2 class="text-sm font-semibold text-gray-600 mb-2">💎 最值得</h2>
          <div v-if="mostRewarding.length === 0" class="text-xs text-gray-400">暂无数据</div>
          <div
            v-for="s in mostRewarding"
            :key="s.friend.id"
            class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-1"
          >
            <span class="text-sm text-gray-700">{{ s.friend.name }}</span>
            <span class="text-sm font-medium" :class="gapColor(s.gap)">{{ s.gap > 0 ? '+' : '' }}{{ Math.round(s.gap) }}</span>
          </div>
        </div>

        <!-- Needs Attention -->
        <div>
          <h2 class="text-sm font-semibold text-gray-600 mb-2">⚠️ 需要关注</h2>
          <div v-if="needsAttention.length === 0" class="text-xs text-gray-400">暂无数据</div>
          <div
            v-for="s in needsAttention"
            :key="s.friend.id"
            class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-1"
          >
            <span class="text-sm text-gray-700">{{ s.friend.name }}</span>
            <span class="text-sm font-medium" :class="gapColor(s.gap)">{{ s.gap > 0 ? '+' : '' }}{{ Math.round(s.gap) }}</span>
          </div>
        </div>

        <!-- Long Time No See -->
        <div>
          <h2 class="text-sm font-semibold text-gray-600 mb-2">👋 好久不见</h2>
          <div v-if="longTimeNoSee.length === 0" class="text-xs text-gray-400">最近都有联系，很棒！</div>
          <div
            v-for="s in longTimeNoSee"
            :key="s.friend.id"
            class="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg mb-1"
          >
            <span class="text-sm text-gray-700">{{ s.friend.name }}</span>
            <span class="text-sm font-medium" :class="gapColor(s.gap)">{{ s.gap > 0 ? '+' : '' }}{{ Math.round(s.gap) }}</span>
          </div>
        </div>
      </section>

      <!-- Section 3: Overall Stats -->
      <section class="mb-4">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">📊 总览</h2>
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-4 text-white shadow-md">
          <div class="grid grid-cols-2 gap-4 text-center">
            <div>
              <p class="text-xs opacity-70">总聚会次数</p>
              <p class="text-2xl font-bold mt-1">{{ totalHangouts }}</p>
            </div>
            <div>
              <p class="text-xs opacity-70">平均感受</p>
              <p class="text-2xl font-bold mt-1">{{ avgQuality }}</p>
            </div>
            <div>
              <p class="text-xs opacity-70">最常见类型</p>
              <p class="text-lg font-bold mt-1">{{ mostCommonType || '-' }}</p>
            </div>
            <div>
              <p class="text-xs opacity-70">最常见的朋友</p>
              <p class="text-lg font-bold mt-1">{{ mostFrequentFriend || '-' }}</p>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
