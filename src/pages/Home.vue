<script setup>
import { ref, computed } from 'vue'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useActivityScoring } from '../composables/useActivityScoring'
import { useUnavailable } from '../composables/useUnavailable'
import { useCustomTypes } from '../composables/useCustomTypes'
import { useI18n } from '../composables/useI18n.js'
import { HANGOUT_TYPES, displayLabel, getHangoutTypes } from '../types/index.js'
import ScatterPlot from '../components/ScatterPlot.vue'
import InsightsPanel from '../components/InsightsPanel.vue'

const { friends, hangouts } = useFriends()
const { scoredFriends, plotScores } = useScoring()
const { activityPlotScores } = useActivityScoring()
const { isUnavailable, markUnavailable, resetToday, count: unavailableCount } = useUnavailable()
const { customTypes } = useCustomTypes()
const { t } = useI18n()

const scatterMode = ref('friends') // 'friends' | 'activities'

const friendCount = computed(() => friends.value.length)

const hangoutsThisWeek = computed(() => {
  const now = new Date()
  const weekAgo = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
  return hangouts.value.filter(h => new Date(h.date) >= weekAgo).length
})

const typeMap = computed(() =>
  Object.fromEntries([...HANGOUT_TYPES, ...customTypes.value].map((tp) => [tp.value, tp]))
)

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

// Returns "🍜 Meal"-style label for the best-scoring hangout type with this friend, or null.
function bestActivityFor(friendId) {
  const fh = hangouts.value.filter((h) => h.friendIds.includes(friendId))
  if (fh.length === 0) return null
  const stats = {}
  for (const h of fh) {
    for (const tp of getHangoutTypes(h)) {
      if (!stats[tp]) stats[tp] = { sum: 0, count: 0 }
      stats[tp].sum += h.quality
      stats[tp].count++
    }
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
  return info ? `${info.icon} ${displayLabel(info, t)}` : `📦 ${displayLabel(bestType, t)}`
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

  const phraseKey = activity
    ? (isStale ? 'home.phrases.stale' : 'home.phrases.fresh')
    : (isStale ? 'home.phrases.staleNoActivity' : 'home.phrases.freshNoActivity')
  const pool = t(phraseKey)

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
  <div class="px-5 pt-14 pb-2">
    <!-- Recommendation -->
    <div v-if="recommendation" class="mb-9">
      <div class="flex items-center justify-between mb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-1.5 h-1.5 rounded-full" :class="toneDot[recommendation.tone]"></span>
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">{{ t('home.todayRecommendation') }}</p>
        </div>
        <button
          v-if="unavailableCount > 0"
          @click="resetToday"
          class="text-[11px] text-stone-400 hover:text-stone-700 bg-transparent border-none cursor-pointer touch-manipulation"
        >{{ t('home.resetToday') }} ({{ unavailableCount }})</button>
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
        >{{ t('home.notAvailable') }}</button>
      </div>
    </div>

    <!-- Reset link (visible even when no recommendation, e.g. all dismissed) -->
    <div v-else-if="unavailableCount > 0" class="mb-9">
      <p class="text-[13px] text-stone-500 mb-2">{{ t('home.allDismissed') }}</p>
      <button
        @click="resetToday"
        class="text-[12px] text-stone-700 underline-offset-2 hover:underline bg-transparent border-none cursor-pointer touch-manipulation"
      >{{ t('home.resetToday') }} ({{ unavailableCount }})</button>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-2 border-t border-stone-150 mb-10" style="border-color: #ece9e4">
      <div class="py-5 pr-4">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">{{ t('home.friendsLabel') }}</p>
        <p class="text-3xl font-light text-stone-900 mt-1.5 tabular-nums tracking-tight">{{ friendCount }}</p>
      </div>
      <div class="py-5 pl-4 border-l" style="border-color: #ece9e4">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">{{ t('home.weeklyHangouts') }}</p>
        <p class="text-3xl font-light text-stone-900 mt-1.5 tabular-nums tracking-tight">{{ hangoutsThisWeek }}</p>
      </div>
    </div>

    <!-- Empty state -->
    <div v-if="friends.length === 0" class="text-center text-stone-400 py-10 text-sm">
      {{ t('home.emptyState') }}
    </div>

    <!-- Scatter -->
    <div v-else>
      <div class="flex items-center justify-between mb-3">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">{{ t('home.scatterTitle') }}</p>
        <div class="flex gap-1">
          <button
            type="button"
            @click="scatterMode = 'friends'"
            class="px-2.5 py-0.5 rounded-full text-[11px] border-none cursor-pointer transition-colors touch-manipulation"
            :class="scatterMode === 'friends' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'"
          >{{ t('home.scatterFriends') }}</button>
          <button
            type="button"
            @click="scatterMode = 'activities'"
            class="px-2.5 py-0.5 rounded-full text-[11px] border-none cursor-pointer transition-colors touch-manipulation"
            :class="scatterMode === 'activities' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'"
          >{{ t('home.scatterActivities') }}</button>
        </div>
      </div>
      <div class="rounded-lg p-3 border" style="border-color: #ece9e4; background: #fbfaf7">
        <ScatterPlot
          v-if="scatterMode === 'friends'"
          :scores="plotScores"
          :highlight-id="recommendation?.friend.id || null"
          :dim-others="false"
        />
        <ScatterPlot
          v-else
          :scores="activityPlotScores"
          :activity-mode="true"
          :dim-others="false"
        />
      </div>
      <div class="flex justify-center gap-5 text-[11px] text-stone-500 mt-3">
        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{{ t('home.legend.worth') }}</span>
        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-stone-400"></span>{{ t('home.legend.balanced') }}</span>
        <span class="flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>{{ t('home.legend.notWorth') }}</span>
      </div>

      <div class="mt-9">
        <InsightsPanel />
      </div>
    </div>
  </div>
</template>
