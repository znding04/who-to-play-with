<script setup>
import { ref, computed } from 'vue'
import { useFriends } from '../composables/useFriends'
import { useCustomTypes } from '../composables/useCustomTypes'
import { HANGOUT_TYPES } from '../types/index.js'

const { friends, hangouts } = useFriends()
const { customTypes } = useCustomTypes()

const today = new Date()
const todayKey = fmt(today)

const viewMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedDate = ref(todayKey)

function fmt(d) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const monthLabel = computed(() => {
  const y = viewMonth.value.getFullYear()
  const m = viewMonth.value.getMonth() + 1
  return `${y} 年 ${m} 月`
})

// Monday-start week labels
const weekdayLabels = ['一', '二', '三', '四', '五', '六', '日']

// Build the day grid for the current viewMonth: previous-month padding, current
// month days, next-month padding so the grid is a clean N×7.
const monthGrid = computed(() => {
  const year = viewMonth.value.getFullYear()
  const month = viewMonth.value.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const lastOfMonth = new Date(year, month + 1, 0)

  // JS getDay: 0=Sun..6=Sat. Convert to 0=Mon..6=Sun.
  const leadingPad = (firstOfMonth.getDay() + 6) % 7

  const days = []
  for (let i = leadingPad; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    days.push({ date: d, inMonth: false })
  }
  for (let d = 1; d <= lastOfMonth.getDate(); d++) {
    days.push({ date: new Date(year, month, d), inMonth: true })
  }
  while (days.length % 7 !== 0) {
    const last = days[days.length - 1].date
    const d = new Date(last)
    d.setDate(d.getDate() + 1)
    days.push({ date: d, inMonth: false })
  }
  return days
})

// Index hangouts by date for O(1) day lookup
const hangoutsByDay = computed(() => {
  const map = {}
  hangouts.value.forEach((h) => {
    if (!map[h.date]) map[h.date] = []
    map[h.date].push(h)
  })
  return map
})

const selectedHangouts = computed(() => {
  const list = hangoutsByDay.value[selectedDate.value] || []
  // Sort by createdAt within the day for stable ordering
  return [...list].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
})

function changeMonth(delta) {
  const m = new Date(viewMonth.value)
  m.setMonth(m.getMonth() + delta)
  viewMonth.value = m
}

function goToToday() {
  viewMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  selectedDate.value = todayKey
}

function selectDay(d) {
  selectedDate.value = fmt(d)
  // Pull viewMonth along if user taps a leading/trailing pad day
  if (d.getMonth() !== viewMonth.value.getMonth() || d.getFullYear() !== viewMonth.value.getFullYear()) {
    viewMonth.value = new Date(d.getFullYear(), d.getMonth(), 1)
  }
}

const typeMap = computed(() =>
  Object.fromEntries([...HANGOUT_TYPES, ...customTypes.value].map((t) => [t.value, t]))
)

const friendMap = computed(() =>
  Object.fromEntries(friends.value.map((f) => [f.id, f]))
)

function friendNames(ids) {
  return ids
    .map((id) => friendMap.value[id]?.name)
    .filter(Boolean)
    .join('、')
}

function durationLabel(value) {
  const map = { '30min': '30分钟', '1hr': '1小时', '2hr': '2小时', halfday: '半天', fullday: '一天', trip: '旅行' }
  return map[value] || value
}

// Bottom stats — same flavor as the old 统计 page
const totalHangouts = computed(() => hangouts.value.length)

const avgQuality = computed(() => {
  if (hangouts.value.length === 0) return '-'
  return (hangouts.value.reduce((s, h) => s + h.quality, 0) / hangouts.value.length).toFixed(1)
})

const mostCommonType = computed(() => {
  if (hangouts.value.length === 0) return null
  const counts = {}
  hangouts.value.forEach((h) => { counts[h.type] = (counts[h.type] || 0) + 1 })
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]
  if (!top) return null
  const info = typeMap.value[top[0]]
  return info ? `${info.icon} ${info.label}` : top[0]
})

const mostFrequentFriend = computed(() => {
  if (hangouts.value.length === 0 || friends.value.length === 0) return null
  const counts = {}
  hangouts.value.forEach((h) => {
    h.friendIds.forEach((id) => { counts[id] = (counts[id] || 0) + 1 })
  })
  const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
  return friendMap.value[topId]?.name || null
})

const thisMonthHangouts = computed(() => {
  const year = viewMonth.value.getFullYear()
  const month = viewMonth.value.getMonth()
  return hangouts.value.filter((h) => {
    const d = new Date(h.date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
})
</script>

<template>
  <div class="px-5 pt-9 pb-2">
    <!-- Header -->
    <div class="mb-7">
      <p class="text-[11px] uppercase tracking-[0.22em] text-stone-400">Calendar</p>
      <h1 class="text-[22px] font-semibold text-stone-900 mt-1.5 tracking-tight">日历</h1>
    </div>

    <!-- Month nav -->
    <div class="flex items-center justify-between mb-4">
      <button
        @click="changeMonth(-1)"
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-stone-100 active:bg-stone-200 border-none cursor-pointer touch-manipulation"
        aria-label="上个月"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="text-stone-600">
          <path d="M15 18 L9 12 L15 6" />
        </svg>
      </button>
      <button
        @click="goToToday"
        class="text-[14px] font-medium text-stone-800 bg-transparent border-none cursor-pointer tabular-nums tracking-tight"
      >{{ monthLabel }}</button>
      <button
        @click="changeMonth(1)"
        class="w-9 h-9 flex items-center justify-center rounded-lg bg-stone-100 active:bg-stone-200 border-none cursor-pointer touch-manipulation"
        aria-label="下个月"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="text-stone-600">
          <path d="M9 18 L15 12 L9 6" />
        </svg>
      </button>
    </div>

    <!-- Weekday header -->
    <div class="grid grid-cols-7 gap-1 mb-1">
      <div
        v-for="w in weekdayLabels" :key="w"
        class="text-center text-[10px] uppercase tracking-[0.18em] text-stone-400 py-1"
      >{{ w }}</div>
    </div>

    <!-- Day grid -->
    <div class="grid grid-cols-7 gap-1 mb-7">
      <button
        v-for="(cell, i) in monthGrid" :key="i"
        @click="selectDay(cell.date)"
        type="button"
        class="relative aspect-square flex flex-col items-center justify-center rounded-lg border-none cursor-pointer transition-colors touch-manipulation"
        :class="[
          fmt(cell.date) === selectedDate
            ? 'bg-stone-900 text-white'
            : cell.inMonth
              ? 'bg-white text-stone-700 active:bg-stone-100'
              : 'bg-transparent text-stone-300',
          fmt(cell.date) === todayKey && fmt(cell.date) !== selectedDate ? 'ring-1 ring-stone-300' : '',
        ]"
      >
        <span class="text-[13px] tabular-nums" :class="fmt(cell.date) === todayKey && fmt(cell.date) !== selectedDate ? 'font-semibold' : ''">{{ cell.date.getDate() }}</span>
        <span
          v-if="hangoutsByDay[fmt(cell.date)]"
          class="absolute bottom-1 w-1 h-1 rounded-full"
          :class="fmt(cell.date) === selectedDate ? 'bg-amber-300' : 'bg-amber-500'"
        ></span>
      </button>
    </div>

    <!-- Selected day section -->
    <section class="mb-9">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3 tabular-nums">
        {{ selectedDate }}
      </p>
      <div v-if="selectedHangouts.length === 0" class="text-center text-stone-400 py-6 text-[13px]">
        这天没有聚会记录
      </div>
      <div v-else class="rounded-xl overflow-hidden" style="border: 1px solid #ece9e4">
        <div
          v-for="(h, i) in selectedHangouts" :key="h.id"
          class="px-4 py-3"
          :class="i > 0 ? 'border-t' : ''"
          :style="i > 0 ? 'border-color: #ece9e4' : ''"
        >
          <div class="flex items-center justify-between mb-1">
            <span class="text-[14px] font-medium text-stone-800">
              {{ typeMap[h.type]?.icon || '' }} {{ typeMap[h.type]?.label || h.type }}
            </span>
            <span class="text-[11.5px] text-amber-500 font-medium tabular-nums">★ {{ h.quality }}/10</span>
          </div>
          <div class="flex items-center justify-between mb-1">
            <span class="text-[12.5px] text-stone-600">{{ friendNames(h.friendIds) }}</span>
            <span class="text-[11.5px] text-stone-400">{{ durationLabel(h.duration) }}</span>
          </div>
          <p v-if="h.note" class="text-[12.5px] text-stone-500 mt-1.5 leading-relaxed">{{ h.note }}</p>
        </div>
      </div>
    </section>

    <!-- Stats summary -->
    <section v-if="hangouts.length > 0" class="mb-2">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">总览</p>
      <div class="grid grid-cols-2 rounded-xl overflow-hidden" style="border: 1px solid #ece9e4">
        <div class="p-4">
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">总聚会次数</p>
          <p class="text-[26px] font-light text-stone-900 mt-1 tabular-nums tracking-tight">{{ totalHangouts }}</p>
        </div>
        <div class="p-4 border-l" style="border-color: #ece9e4">
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">本月聚会</p>
          <p class="text-[26px] font-light text-stone-900 mt-1 tabular-nums tracking-tight">{{ thisMonthHangouts }}</p>
        </div>
        <div class="p-4 border-t" style="border-color: #ece9e4">
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">平均感受</p>
          <p class="text-[20px] font-light text-stone-900 mt-1 tabular-nums tracking-tight">{{ avgQuality }}<span v-if="avgQuality !== '-'" class="text-[12px] text-stone-400">/10</span></p>
        </div>
        <div class="p-4 border-t border-l" style="border-color: #ece9e4">
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">最常见类型</p>
          <p class="text-[15px] font-medium text-stone-800 mt-1.5">{{ mostCommonType || '-' }}</p>
        </div>
        <div class="p-4 border-t col-span-2" style="border-color: #ece9e4">
          <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium">最常聚的朋友</p>
          <p class="text-[15px] font-medium text-stone-800 mt-1.5">{{ mostFrequentFriend || '-' }}</p>
        </div>
      </div>
    </section>
  </div>
</template>
