<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { HANGOUT_TYPES } from '../types/index.js'
import ScatterPlot from '../components/ScatterPlot.vue'

const route = useRoute()
const { getFriendById, getHangoutsForFriend } = useFriends()
const { scoredFriends } = useScoring()

const friendId = computed(() => route.params.id)
const friend = computed(() => getFriendById(friendId.value))

const friendScore = computed(() => {
  return scoredFriends.value.find(s => s.friend.id === friendId.value) || null
})

const friendHangouts = computed(() => {
  return getHangoutsForFriend(friendId.value)
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const typeMap = Object.fromEntries(HANGOUT_TYPES.map(t => [t.value, t]))

function gapText(gap) {
  if (gap < -5) return `你在 ${friend.value.name} 身上投入很多但感觉一般`
  if (gap > 5) return '这段友谊很值得'
  return '平衡得很好'
}

function gapColor(gap) {
  if (gap < -5) return 'text-red-500'
  if (gap > 5) return 'text-green-500'
  return 'text-blue-500'
}

function stars(n) {
  return '★'.repeat(n) + '☆'.repeat(5 - n)
}
</script>

<template>
  <div class="px-4 pt-6 pb-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <router-link to="/friends" class="text-blue-500 text-sm no-underline">&larr; 朋友列表</router-link>
      <div class="w-10"></div>
    </div>

    <div v-if="!friend" class="text-center text-gray-400 py-16 text-sm">
      找不到这位朋友
    </div>

    <template v-else>
      <!-- Friend name & tags -->
      <h1 class="text-xl font-bold text-gray-800 mb-1">{{ friend.name }}</h1>
      <div v-if="friend.tags && friend.tags.length" class="flex flex-wrap gap-1.5 mb-4">
        <span
          v-for="tag in friend.tags" :key="tag"
          class="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full"
        >{{ tag }}</span>
      </div>

      <!-- Basic info section -->
      <div v-if="friend.phone || friend.birthday || friend.location || friend.howWeMet"
        class="bg-gray-50 rounded-xl p-4 mb-4 space-y-2">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">基本信息</h2>
        <div v-if="friend.phone" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">📱</span>
          <span class="text-gray-600">{{ friend.phone }}</span>
        </div>
        <div v-if="friend.birthday" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">🎂</span>
          <span class="text-gray-600">{{ friend.birthday }}</span>
        </div>
        <div v-if="friend.location" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">📍</span>
          <span class="text-gray-600">{{ friend.location }}</span>
        </div>
        <div v-if="friend.howWeMet" class="flex items-center gap-2 text-sm">
          <span class="text-gray-400">🤝</span>
          <span class="text-gray-600">{{ friend.howWeMet }}</span>
        </div>
      </div>

      <!-- Values section -->
      <div v-if="friend.values && friend.values.length"
        class="bg-gray-50 rounded-xl p-4 mb-4">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">TA 的价值</h2>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="val in friend.values" :key="val"
            class="px-3 py-1 bg-green-50 text-green-600 text-xs rounded-full"
          >{{ val }}</span>
        </div>
      </div>

      <!-- Important events section -->
      <div v-if="friend.importantEvents && friend.importantEvents.length"
        class="bg-gray-50 rounded-xl p-4 mb-4">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">重要时刻</h2>
        <div class="space-y-1.5">
          <div v-for="(event, i) in friend.importantEvents" :key="i" class="flex items-center gap-2 text-sm">
            <span class="text-gray-400">✨</span>
            <span class="text-gray-600">{{ event }}</span>
          </div>
        </div>
      </div>

      <!-- Gap indicator -->
      <div v-if="friendScore" class="bg-gray-50 rounded-xl p-4 mb-4 text-center">
        <p class="text-xs text-gray-400 mb-1">差值 (感受 − 频率)</p>
        <p class="text-3xl font-bold" :class="gapColor(friendScore.gap)">
          {{ friendScore.gap > 0 ? '+' : '' }}{{ Math.round(friendScore.gap) }}
        </p>
        <p class="text-sm text-gray-500 mt-1">{{ gapText(friendScore.gap) }}</p>
      </div>

      <!-- Mini scatter plot -->
      <div v-if="scoredFriends.length > 0" class="bg-gray-50 rounded-xl p-3 mb-4">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">在散点图中的位置</h2>
        <ScatterPlot :scores="scoredFriends" :highlight-id="friendId" />
      </div>

      <!-- Hangout history -->
      <div class="mb-4">
        <h2 class="text-sm font-semibold text-gray-600 mb-2">聚会记录</h2>
        <div v-if="friendHangouts.length === 0" class="text-center text-gray-400 py-6 text-sm">
          还没有聚会记录
        </div>
        <div v-else class="space-y-2">
          <div
            v-for="h in friendHangouts" :key="h.id"
            class="bg-gray-50 rounded-xl px-4 py-3"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-700">
                {{ typeMap[h.type]?.icon || '📦' }} {{ typeMap[h.type]?.label || h.type }}
              </span>
              <span class="text-xs text-gray-400">{{ h.date }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-xs text-gray-400">{{ h.duration }}</span>
              <span class="text-xs text-amber-500">{{ stars(h.quality) }}</span>
            </div>
            <p v-if="h.note" class="text-xs text-gray-500 mt-1">{{ h.note }}</p>
          </div>
        </div>
      </div>

      <!-- Log hangout button -->
      <router-link
        to="/log"
        class="block w-full py-3 bg-blue-500 text-white text-center font-semibold text-base rounded-xl no-underline"
      >
        记录聚会
      </router-link>
    </template>
  </div>
</template>
