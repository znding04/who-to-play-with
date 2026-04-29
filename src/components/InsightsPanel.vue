<script setup>
import { computed } from 'vue'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useGapThreshold } from '../composables/useGapThreshold'

const { hangouts } = useFriends()
const { scoredFriends } = useScoring()
const { gapThreshold } = useGapThreshold()

const insights = computed(() => {
  const scored = scoredFriends.value
  const result = []

  // Insight 1: High frequency low quality
  const freqLowQuality = scored.filter(s => s.quantity > 30 && s.gap < -gapThreshold.value)
  if (freqLowQuality.length > 0) {
    result.push({
      icon: '⚠️',
      text: `你和 ${freqLowQuality[0].friend.name} 见面很多但感觉一般，可能投入太多了`,
      color: 'from-red-50 to-red-100 border-red-200',
    })
  }

  // Insight 2: Great friend but rare
  const greatRare = scored.filter(s => s.gap > 10 && s.quantity < 20)
  if (greatRare.length > 0) {
    result.push({
      icon: '💎',
      text: `${greatRare[0].friend.name} 总是让你很开心，但好久没见了${greatRare.length > 1 ? '，还有其他朋友也是' : ''}`,
      color: 'from-green-50 to-green-100 border-green-200',
    })
  }

  // Insight 3: This week busy
  const now = new Date()
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  const thisWeek = hangouts.value.filter(h => new Date(h.date) >= weekAgo).length
  if (thisWeek >= 5) {
    result.push({
      icon: '🔥',
      text: `你这周聚会 ${thisWeek} 次！继续保持社交活跃`,
      color: 'from-amber-50 to-amber-100 border-amber-200',
    })
  }

  // Insight 4: Neglected friend with quality
  const neglected = scored.filter(s => s.quantity < 10 && s.gap > 0)
  if (neglected.length > 0) {
    result.push({
      icon: '💬',
      text: `${neglected[0].friend.name} 的友谊质量很高但很少联系，找时间聊聊天吧`,
      color: 'from-blue-50 to-blue-100 border-blue-200',
    })
  }

  return result
})
</script>

<template>
  <div v-if="insights.length > 0" class="space-y-2">
    <h2 class="text-sm font-semibold text-gray-600 mb-2">洞察</h2>
    <div
      v-for="(insight, i) in insights"
      :key="i"
      class="rounded-xl border p-3 bg-gradient-to-r"
      :class="insight.color"
    >
      <p class="text-sm text-gray-700">
        <span class="mr-1">{{ insight.icon }}</span>
        {{ insight.text }}
      </p>
    </div>
  </div>
  <div v-else-if="scoredFriends.length > 0" class="text-center text-gray-400 py-4 text-sm">
    暂时没有洞察，多记录几次聚会吧
  </div>
</template>
