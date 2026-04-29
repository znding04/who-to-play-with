<script setup>
import { ref, computed } from 'vue'
import { useGapThreshold } from '../composables/useGapThreshold'

const props = defineProps({
  scores: { type: Array, required: true },
  highlightId: { type: String, default: null },
  showTuner: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])

const { gapThreshold, MIN, MAX } = useGapThreshold()

// Popup state
const popup = ref(null) // { friend, quantity, quality, gap, x, y }

const padding = 40
const size = 340
const inner = size - padding * 2

function x(val) {
  return padding + (val / 100) * inner
}

function y(val) {
  return size - padding - (val / 100) * inner
}

function dotColor(gap) {
  if (gap > gapThreshold.value) return '#22c55e'
  if (gap < -gapThreshold.value) return '#ef4444'
  return '#3b82f6'
}

// Hexagonal balanced band: |quality - quantity| <= threshold, intersected with [0,100]^2.
// Includes the upper-right (100,100) and lower-left (0,0) corners.
const bandPoints = computed(() => {
  const t = Math.min(100, gapThreshold.value)
  const pts = [
    [t, 0],          // bottom edge enter (lower line)
    [100, 100 - t],  // right edge exit (lower line)
    [100, 100],      // upper-right corner
    [100 - t, 100],  // top edge exit (upper line)
    [0, t],          // left edge exit (upper line)
    [0, 0],          // lower-left corner
  ]
  return pts.map(([qx, qy]) => `${x(qx)},${y(qy)}`).join(' ')
})

function handleDotClick(s, event) {
  // Show popup with friend info instead of navigation
  const svgEl = event.currentTarget.closest('svg')
  const rect = svgEl.getBoundingClientRect()
  const dotEl = event.currentTarget.querySelector('circle')
  const dotRect = dotEl.getBoundingClientRect()

  // Position popup near the dot, offset to stay within bounds
  const relativeX = ((dotRect.left + dotRect.width / 2) - rect.left) / rect.width * size
  const relativeY = ((dotRect.top + dotRect.height / 2) - rect.top) / rect.height * size

  popup.value = {
    friend: s.friend,
    quantity: s.quantity,
    quality: s.quality,
    gap: s.gap,
    x: relativeX,
    y: relativeY,
  }
}

function closePopup() {
  popup.value = null
}

function gapLabel(gap) {
  if (gap > gapThreshold.value) return '很值得'
  if (gap < -gapThreshold.value) return '不平衡'
  return '平衡'
}
</script>

<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${size} ${size}`" class="w-full" style="max-width: 400px;">
      <!-- Axes -->
      <line :x1="padding" :y1="size - padding" :x2="size - padding" :y2="size - padding" stroke="#d1d5db" stroke-width="1" />
      <line :x1="padding" :y1="size - padding" :x2="padding" :y2="padding" stroke="#d1d5db" stroke-width="1" />

      <!-- Axis labels -->
      <text v-for="v in [0, 50, 100]" :key="'x' + v"
        :x="x(v)" :y="size - padding + 14" text-anchor="middle" font-size="9" fill="#9ca3af">{{ v }}</text>
      <text v-for="v in [0, 50, 100]" :key="'y' + v"
        :x="padding - 8" :y="y(v) + 3" text-anchor="end" font-size="9" fill="#9ca3af">{{ v }}</text>

      <!-- Axis titles -->
      <text :x="size / 2" :y="size - 4" text-anchor="middle" font-size="10" fill="#6b7280">频率 →</text>
      <text :x="12" :y="size / 2" text-anchor="middle" font-size="10" fill="#6b7280" transform="rotate(-90, 12, 150)">感受 →</text>

      <!-- Balanced band along x=y -->
      <polygon :points="bandPoints" fill="#3b82f6" fill-opacity="0.08" stroke="#93c5fd" stroke-width="1" stroke-dasharray="3 3" />

      <!-- Y=X diagonal reference line -->
      <line :x1="x(0)" :y1="y(0)" :x2="x(100)" :y2="y(100)" stroke="#d1d5db" stroke-width="1" stroke-dasharray="4 3" />

      <!-- Center crosshair at (50, 50) -->
      <line :x1="x(50) - 6" :y1="y(50)" :x2="x(50) + 6" :y2="y(50)" stroke="#9ca3af" stroke-width="1" />
      <line :x1="x(50)" :y1="y(50) - 6" :x2="x(50)" :y2="y(50) + 6" stroke="#9ca3af" stroke-width="1" />

      <!-- Friend dots with name labels -->
      <g v-for="s in scores" :key="s.friend.id" class="cursor-pointer" @click="handleDotClick(s, $event)">
        <!-- Name label (offset to the right of the dot) -->
        <text
          :x="x(s.quantity) + 14"
          :y="y(s.quality) + 3"
          font-size="9"
          fill="#374151"
          :opacity="highlightId && highlightId !== s.friend.id ? 0.2 : 0.85"
        >{{ s.friend.name }}</text>

        <!-- Dot -->
        <circle
          :cx="x(s.quantity)" :cy="y(s.quality)" r="10"
          :fill="dotColor(s.gap)"
          :opacity="highlightId && highlightId !== s.friend.id ? 0.2 : 0.85"
          :stroke="highlightId === s.friend.id ? '#1e3a5f' : 'white'"
          :stroke-width="highlightId === s.friend.id ? 2 : 1"
        />
        <title>{{ s.friend.name }} (频率: {{ Math.round(s.quantity) }}, 感受: {{ Math.round(s.quality) }})</title>
      </g>
    </svg>

    <!-- Threshold tuner -->
    <div v-if="showTuner" class="mt-2 px-1">
      <div class="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>平衡范围 ±{{ gapThreshold }}</span>
        <span class="text-gray-400">越大越宽容</span>
      </div>
      <input
        type="range"
        :min="MIN"
        :max="MAX"
        v-model.number="gapThreshold"
        class="w-full accent-blue-500 touch-manipulation"
      />
    </div>

    <!-- Popup card -->
    <div
      v-if="popup"
      class="absolute z-10 bg-white rounded-xl shadow-lg border border-gray-200 p-3 text-sm"
      style="min-width: 160px; max-width: 200px;"
      :style="{
        left: Math.min(popup.x * (400 / size) + 'px', '260px'),
        top: Math.max(popup.y * (400 / size) - 60, 0) + 'px',
      }"
      @click.stop
    >
      <!-- Close button -->
      <button
        class="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-gray-600 bg-transparent border-none cursor-pointer text-xs"
        @click="closePopup"
      >✕</button>

      <!-- Friend name (click to open detail page) -->
      <router-link
        :to="`/friends/${popup.friend.id}`"
        class="block font-semibold text-blue-600 text-base mb-1 no-underline active:text-blue-700"
        @click="closePopup"
      >{{ popup.friend.name }} ›</router-link>

      <!-- Tags -->
      <p v-if="popup.friend.tags && popup.friend.tags.length" class="text-xs text-gray-400 mb-2">
        {{ popup.friend.tags.join(' · ') }}
      </p>

      <!-- Gap score -->
      <div class="mb-1">
        <span class="text-xs text-gray-500">差值: </span>
        <span
          class="text-xs font-semibold"
          :class="popup.gap > gapThreshold ? 'text-green-500' : popup.gap < -gapThreshold ? 'text-red-500' : 'text-blue-500'"
        >
          {{ popup.gap > 0 ? '+' : '' }}{{ Math.round(popup.gap) }}
        </span>
        <span class="text-xs text-gray-400 ml-1">{{ gapLabel(popup.gap) }}</span>
      </div>

      <!-- Scores -->
      <div class="text-xs text-gray-500 space-y-0.5">
        <div>频率: {{ Math.round(popup.quantity) }}</div>
        <div>感受: {{ Math.round(popup.quality) }}</div>
      </div>
    </div>

    <!-- Popup overlay (click outside to close) -->
    <div v-if="popup" class="fixed inset-0 z-0" @click="closePopup"></div>
  </div>
</template>
