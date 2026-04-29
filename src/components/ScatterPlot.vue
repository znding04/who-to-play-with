<script setup>
import { ref, computed } from 'vue'
import { useGapThreshold } from '../composables/useGapThreshold'
import { useViewMode } from '../composables/useViewMode'

const props = defineProps({
  scores: { type: Array, required: true },
  highlightId: { type: String, default: null },
  showTuner: { type: Boolean, default: true },
  // When true (default), non-highlighted dots fade. Set false on Home so the
  // recommended star pops without dimming the rest of the picture.
  dimOthers: { type: Boolean, default: true },
})

const emit = defineEmits(['select'])

const { gapThreshold, MIN, MAX } = useGapThreshold()
const { mode } = useViewMode()

const popup = ref(null)

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
  if (gap > gapThreshold.value) return '#10b981' // emerald-500
  if (gap < -gapThreshold.value) return '#fb7185' // rose-400
  return '#a8a29e' // stone-400
}

const bandPoints = computed(() => {
  const t = Math.min(100, gapThreshold.value)
  const pts = [
    [t, 0],
    [100, 100 - t],
    [100, 100],
    [100 - t, 100],
    [0, t],
    [0, 0],
  ]
  return pts.map(([qx, qy]) => `${x(qx)},${y(qy)}`).join(' ')
})

function handleDotClick(s) {
  popup.value = {
    friend: s.friend,
    quantity: s.quantity,
    quality: s.quality,
    gap: s.gap,
    x: x(s.quantity),
    y: y(s.quality),
  }
}

// 5-point star polygon centered at (cx, cy) with outer radius r.
function starPoints(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2
    const radius = i % 2 === 0 ? r : r * 0.45
    pts.push(`${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)}`)
  }
  return pts.join(' ')
}

// Render order: highlighted last so the star sits on top of any nearby dots.
const orderedScores = computed(() => {
  if (!props.highlightId) return props.scores
  const others = props.scores.filter((s) => s.friend.id !== props.highlightId)
  const highlighted = props.scores.find((s) => s.friend.id === props.highlightId)
  return highlighted ? [...others, highlighted] : others
})

function closePopup() {
  popup.value = null
}

function gapLabel(gap) {
  if (gap > gapThreshold.value) return '很值得'
  if (gap < -gapThreshold.value) return '不平衡'
  return '平衡'
}

function gapToneClass(gap) {
  if (gap > gapThreshold.value) return 'text-emerald-600'
  if (gap < -gapThreshold.value) return 'text-rose-500'
  return 'text-stone-500'
}
</script>

<template>
  <div class="relative">
    <svg :viewBox="`0 0 ${size} ${size}`" class="w-full" style="max-width: 400px;">
      <!-- Axes -->
      <line :x1="padding" :y1="size - padding" :x2="size - padding" :y2="size - padding" stroke="#d6d3d1" stroke-width="1" />
      <line :x1="padding" :y1="size - padding" :x2="padding" :y2="padding" stroke="#d6d3d1" stroke-width="1" />

      <!-- Axis tick labels -->
      <text v-for="v in [0, 50, 100]" :key="'x' + v"
        :x="x(v)" :y="size - padding + 14" text-anchor="middle" font-size="9" fill="#a8a29e">{{ v }}</text>
      <text v-for="v in [0, 50, 100]" :key="'y' + v"
        :x="padding - 8" :y="y(v) + 3" text-anchor="end" font-size="9" fill="#a8a29e">{{ v }}</text>

      <!-- Axis titles -->
      <text :x="size / 2" :y="size - 4" text-anchor="middle" font-size="10" fill="#78716c">频率 →</text>
      <text :x="12" :y="size / 2" text-anchor="middle" font-size="10" fill="#78716c" transform="rotate(-90, 12, 150)">感受 →</text>

      <!-- Balanced band -->
      <polygon :points="bandPoints" fill="#a8a29e" fill-opacity="0.06" stroke="#d6d3d1" stroke-width="1" stroke-dasharray="3 3" />

      <!-- Y=X diagonal -->
      <line :x1="x(0)" :y1="y(0)" :x2="x(100)" :y2="y(100)" stroke="#e7e5e4" stroke-width="1" stroke-dasharray="4 3" />

      <!-- Center crosshair -->
      <line :x1="x(50) - 6" :y1="y(50)" :x2="x(50) + 6" :y2="y(50)" stroke="#a8a29e" stroke-width="1" />
      <line :x1="x(50)" :y1="y(50) - 6" :x2="x(50)" :y2="y(50) + 6" stroke="#a8a29e" stroke-width="1" />

      <!-- Friend dots / star -->
      <g v-for="s in orderedScores" :key="s.friend.id" class="cursor-pointer" @click="handleDotClick(s)">
        <text
          :x="x(s.quantity)"
          :y="y(s.quality) - (highlightId === s.friend.id ? 17 : 13)"
          text-anchor="middle"
          :font-size="highlightId === s.friend.id ? 10 : 9"
          :font-weight="highlightId === s.friend.id ? 600 : 400"
          fill="#44403c"
          :opacity="dimOthers && highlightId && highlightId !== s.friend.id ? 0.2 : 0.85"
        >{{ s.friend.name }}</text>

        <polygon
          v-if="highlightId === s.friend.id"
          :points="starPoints(x(s.quantity), y(s.quality), 12)"
          :fill="dotColor(s.gap)"
          stroke="#1c1917"
          stroke-width="1.5"
          stroke-linejoin="round"
        />
        <circle
          v-else
          :cx="x(s.quantity)" :cy="y(s.quality)" r="9"
          :fill="dotColor(s.gap)"
          :opacity="dimOthers && highlightId ? 0.2 : 0.9"
          stroke="white"
          stroke-width="1"
        />
        <title>{{ s.friend.name }} (频率: {{ Math.round(s.quantity) }}, 感受: {{ Math.round(s.quality) }})</title>
      </g>
    </svg>

    <!-- View mode toggle + threshold tuner -->
    <div v-if="showTuner" class="mt-3 px-1 space-y-3">
      <div class="flex items-center justify-between text-[11px] text-stone-500">
        <span>显示</span>
        <div class="flex gap-1">
          <button
            type="button"
            @click="mode = 'normalized'"
            class="px-2.5 py-0.5 rounded-full text-[11px] border-none cursor-pointer transition-colors touch-manipulation"
            :class="mode === 'normalized' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'"
          >标准化</button>
          <button
            type="button"
            @click="mode = 'absolute'"
            class="px-2.5 py-0.5 rounded-full text-[11px] border-none cursor-pointer transition-colors touch-manipulation"
            :class="mode === 'absolute' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'"
          >绝对值</button>
        </div>
      </div>
      <div>
        <div class="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
          <span>平衡范围 ±{{ gapThreshold }}</span>
          <span class="text-stone-400">越大越宽容</span>
        </div>
        <input
          type="range"
          :min="MIN"
          :max="MAX"
          v-model.number="gapThreshold"
          class="w-full touch-manipulation"
          style="accent-color: #1c1917"
        />
      </div>
    </div>

    <!-- Popup -->
    <div
      v-if="popup"
      class="absolute z-10 bg-white rounded-xl p-3 text-sm"
      style="min-width: 160px; max-width: 200px; border: 1px solid #ece9e4; box-shadow: 0 4px 16px rgba(28, 25, 23, 0.06);"
      :style="{
        left: Math.min(popup.x * (400 / size) + 'px', '260px'),
        top: Math.max(popup.y * (400 / size) - 60, 0) + 'px',
      }"
      @click.stop
    >
      <button
        class="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-stone-400 hover:text-stone-600 bg-transparent border-none cursor-pointer text-xs"
        @click="closePopup"
      >✕</button>

      <router-link
        :to="`/friends/${popup.friend.id}`"
        class="block font-semibold text-stone-900 text-base mb-1 no-underline"
        @click="closePopup"
      >{{ popup.friend.name }} ›</router-link>

      <p v-if="popup.friend.tags && popup.friend.tags.length" class="text-[11px] text-stone-400 mb-2">
        {{ popup.friend.tags.join(' · ') }}
      </p>

      <div class="mb-1">
        <span class="text-[11px] text-stone-500">差值: </span>
        <span class="text-[11px] font-semibold" :class="gapToneClass(popup.gap)">
          {{ popup.gap > 0 ? '+' : '' }}{{ Math.round(popup.gap) }}
        </span>
        <span class="text-[11px] text-stone-400 ml-1">{{ gapLabel(popup.gap) }}</span>
      </div>

      <div class="text-[11px] text-stone-500 space-y-0.5">
        <div>频率: {{ Math.round(popup.quantity) }}</div>
        <div>感受: {{ Math.round(popup.quality) }}</div>
      </div>
    </div>

    <div v-if="popup" class="fixed inset-0 z-0" @click="closePopup"></div>
  </div>
</template>
