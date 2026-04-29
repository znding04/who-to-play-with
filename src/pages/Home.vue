<script setup>
import { computed } from 'vue'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useUnavailable } from '../composables/useUnavailable'
import { useCustomTypes } from '../composables/useCustomTypes'
import { HANGOUT_TYPES } from '../types/index.js'
import ScatterPlot from '../components/ScatterPlot.vue'
import InsightsPanel from '../components/InsightsPanel.vue'

const { friends, hangouts } = useFriends()
const { scoredFriends } = useScoring()
const { isUnavailable, markUnavailable, resetToday, count: unavailableCount } = useUnavailable()
const { customTypes } = useCustomTypes()

const friendCount = computed(() => friends.value.length)

const hangoutsThisWeek = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  return hangouts.value.filter(h => new Date(h.date) >= weekAgo).length
})

const typeMap = computed(() =>
  Object.fromEntries([...HANGOUT_TYPES, ...customTypes.value].map((t) => [t.value, t]))
)

const PHRASES = {
  stale: [
    '好久没见 {name} 了 — 下次一起 {activity} 吧',
    '是时候联系 {name} 了 — 你们一起 {activity} 总是很开心',
    '想 {name} 了吗？上次一起 {activity} 的回忆值得再来一次',
    '{name} 已经太久没出现在你日程里 — {activity} 约起？',
    '别让 {name} 从你生活里淡出 — 下次一起 {activity} 吧',
  ],
  fresh: [
    '{name} 一直让你开心 — 不如再 {activity} 一次',
    '{name} 是值得珍惜的人 — {activity} 是你们最契合的方式',
    '继续保持跟 {name} 的节奏 — 再约个 {activity}',
    '跟 {name} 一起 {activity} 总是不会错',
    '{name} 在你的生活里发光 — 下次 {activity} 走起',
  ],
  staleNoActivity: [
    '好久没见 {name} 了 — 出来约一下吧',
    '想起 {name} 了吗？也许该联系一下了',
    '{name} 已经太久没出现在你日程里 — 约起？',
    '别让 {name} 从你生活里淡出 — 找个时间见见',
    '{name} 值得你的时间 — 约出来玩玩吧',
  ],
  freshNoActivity: [
    '{name} 是值得珍惜的人 — 多花点时间在 TA 身上',
    '{name} 一直让你开心 — 继续保持联系',
    '{name} 在你的生活里发光 — 多见见',
    '跟 {name} 在一起的时光值得珍惜',
    '{name} 是个值得继续投入的朋友',
  ],
}

function hashSeed(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function pickPhrase(pool, seed) {
  return pool[hashSeed(seed) % pool.length]
}

// Returns "🍜 吃饭"-style label for the best-scoring hangout type with this friend, or null.
function bestActivityFor(friendId) {
  const fh = hangouts.value.filter((h) => h.friendIds.includes(friendId))
  if (fh.length === 0) return null
  const stats = {}
  for (const h of fh) {
    if (!stats[h.type]) stats[h.type] = { sum: 0, count: 0 }
    stats[h.type].sum += h.quality
    stats[h.type].count++
  }
  let bestType = null
  let bestAvg = -Infinity
  for (const [type, s] of Object.entries(stats)) {
    const avg = s.sum / s.count
    if (avg > bestAvg) {
      bestAvg = avg
      bestType = type
    }
  }
  const info = typeMap.value[bestType]
  return info ? `${info.icon} ${info.label}` : null
}

const recommendation = computed(() => {
  const candidates = scoredFriends.value
    .filter((s) => !isUnavailable(s.friend.id))
    .filter((s) => s.gap > 0)
    .sort((a, b) => b.gap - a.gap)

  if (candidates.length === 0) return null
  const pick = candidates[0]

  const dayMs = 1000 * 60 * 60 * 24
  const fh = hangouts.value.filter((h) => h.friendIds.includes(pick.friend.id))
  const lastDate = fh.length > 0
    ? fh.map((h) => new Date(h.date)).reduce((max, d) => d > max ? d : max, new Date(0))
    : null
  const isStale = !lastDate || (Date.now() - lastDate) / dayMs >= 14

  const activity = bestActivityFor(pick.friend.id)
  const today = new Date().toISOString().slice(0, 10)
  // Seed by friend + date so the phrase is stable through the day but rotates daily.
  const seed = `${pick.friend.id}-${today}`

  const pool = activity
    ? (isStale ? PHRASES.stale : PHRASES.fresh)
    : (isStale ? PHRASES.staleNoActivity : PHRASES.freshNoActivity)

  const text = pickPhrase(pool, seed)
    .replace('{name}', pick.friend.name)
    .replace('{activity}', activity || '')

  return { friend: pick.friend, text, tone: 'positive' }
})

function dismissCurrent() {
  if (recommendation.value) {
    markUnavailable(recommendation.value.friend.id)
  }
}

const toneDot = {
  positive: 'bg-emerald-500',
  negative: 'bg-rose-400',
  neutral: 'bg-amber-500',
}
</script>

<template>
  <div class="px-5 pt-9 pb-2">
    <!-- Header -->
    <div class="mb-9">
      <p class="text-[11px] uppercase tracking-[0.22em] text-stone-400">Who to hang with</p>
      <h1 class="text-[22px] font-semibold text-stone-900 mt-1.5 tracking-tight">找谁玩</h1>
    </div>

    <!-- Recommendation -->
    <div v-if="recommendation" class="mb-9">
      <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full" :class="toneDot[recommendation.tone]"></span>
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">今日推荐</p>
        </div>
        <button
          v-if="unavailableCount > 0"
          @click="resetToday"
          class="text-[11px] text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer touch-manipulation"
        >重置今日 ({{ unavailableCount }})</button>
      </div>
      <div class="flex items-start justify-between gap-3">
        <router-link
          :to="`/friends/${recommendation.friend.id}`"
          class="flex-1 text-[15px] leading-[1.65] text-stone-800 font-normal no-underline"
        >
          {{ recommendation.text }}
        </router-link>
        <button
          @click="dismissCurrent"
          class="flex-shrink-0 mt-0.5 px-2.5 py-1 text-[11.5px] text-stone-500 bg-stone-100 active:bg-stone-200 rounded-full border-none cursor-pointer touch-manipulation whitespace-nowrap"
        >TA 没空</button>
      </div>
    </div>

    <!-- Reset link (visible even when no recommendation, e.g. all dismissed) -->
    <div v-else-if="unavailableCount > 0" class="mb-9">
      <p class="text-[13px] text-stone-500 mb-2">今天没有可推荐的朋友了 — 都被标记为没空</p>
      <button
        @click="resetToday"
        class="text-[12px] text-stone-700 underline-offset-2 hover:underline bg-transparent border-none cursor-pointer touch-manipulation"
      >重置今日 ({{ unavailableCount }})</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 border-t border-stone-150 mb-10" style="border-color: #ece9e4">
      <div class="py-5 pr-4">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">朋友</p>
        <p class="text-3xl font-light text-stone-900 mt-1.5 tabular-nums tracking-tight">{{ friendCount }}</p>
      </div>
      <div class="py-5 pl-4 border-l" style="border-color: #ece9e4">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">本周聚会</p>
        <p class="text-3xl font-light text-stone-900 mt-1.5 tabular-nums tracking-tight">{{ hangoutsThisWeek }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="friends.length === 0" class="text-center text-stone-400 py-10 text-sm">
      添加朋友开始记录吧
    </div>

    <!-- Scatter -->
    <div v-else>
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">友谊散点图</p>
      <div class="rounded-lg p-3 border" style="border-color: #ece9e4; background: #fbfaf7">
        <ScatterPlot :scores="scoredFriends" :highlight-id="recommendation?.friend.id || null" :dim-others="false" />
      </div>
      <div class="flex justify-center gap-5 text-[11px] text-stone-500 mt-3">
        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>很值得</span>
        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>不平衡</span>
        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-stone-400"></span>平衡</span>
      </div>

      <div class="mt-9">
        <InsightsPanel />
      </div>
    </div>
  </div>
</template>
