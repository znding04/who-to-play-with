<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useGapThreshold } from '../composables/useGapThreshold'
import { useCustomTypes } from '../composables/useCustomTypes'
import { useI18n } from '../composables/useI18n.js'
import { HANGOUT_TYPES, displayLabel, getHangoutTypes } from '../types/index.js'
import ScatterPlot from '../components/ScatterPlot.vue'

const route = useRoute()
const router = useRouter()
const { getFriendById, getHangoutsForFriend, deleteFriend, deleteHangout } = useFriends()
const { scoredFriends } = useScoring()
const { gapThreshold } = useGapThreshold()
const { customTypes } = useCustomTypes()
const { t } = useI18n()

function handleEdit() {
  if (!friend.value) return
  router.push({ path: '/friends', query: { edit: friend.value.id } })
}

function handleDelete() {
  if (!friend.value) return
  if (confirm(t('friends.confirmDelete', { name: friend.value.name }))) {
    deleteFriend(friend.value.id)
    router.push('/friends')
  }
}

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

const typeMap = computed(() =>
  Object.fromEntries([...HANGOUT_TYPES, ...customTypes.value].map(tp => [tp.value, tp]))
)

function typeLabel(type) {
  const info = typeMap.value[type]
  return info ? displayLabel(info, t) : type
}

function gapText(gap) {
  if (gap < -gapThreshold.value) return t('friendDetail.gapInvested', { name: friend.value.name })
  if (gap > gapThreshold.value) return t('friendDetail.gapWorth')
  return t('friendDetail.gapBalanced')
}

function gapTone(gap) {
  if (gap < -gapThreshold.value) return 'text-rose-500'
  if (gap > gapThreshold.value) return 'text-emerald-600'
  return 'text-stone-500'
}

function handleEditHangout(hangoutId) {
  router.push({ path: '/log', query: { edit: hangoutId } })
}

function handleDeleteHangout(hangoutId) {
  if (confirm(t('friendDetail.confirmDeleteHangout'))) {
    deleteHangout(hangoutId)
  }
}

function rating(n) {
  return `${n}/10`
}

const infoRows = computed(() => {
  if (!friend.value) return []
  const rows = []
  if (friend.value.phone) rows.push({ label: t('friendDetail.phone'), value: friend.value.phone })
  if (friend.value.birthday) rows.push({ label: t('friendDetail.birthday'), value: friend.value.birthday })
  if (friend.value.location) rows.push({ label: t('friendDetail.location'), value: friend.value.location })
  if (friend.value.howWeMet) rows.push({ label: t('friendDetail.howWeMet'), value: friend.value.howWeMet })
  return rows
})
</script>

<template>
  <div class="px-5 pt-14 pb-2">
    <!-- Header -->
    <div class="flex items-center justify-between mb-7">
      <router-link to="/friends" class="text-stone-500 text-[13px] no-underline flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18 L9 12 L15 6" />
        </svg>
        {{ t('friendDetail.back') }}
      </router-link>
      <div v-if="friend" class="flex items-center gap-2">
        <button
          @click="handleEdit"
          class="px-2.5 py-1 text-[11.5px] text-stone-500 bg-stone-100 active:bg-stone-200 rounded-md border-none cursor-pointer touch-manipulation"
        >{{ t('friendDetail.edit') }}</button>
        <button
          @click="handleDelete"
          class="px-2.5 py-1 text-[11.5px] text-rose-500 bg-rose-50 active:bg-rose-100 rounded-md border-none cursor-pointer touch-manipulation"
        >{{ t('friendDetail.delete') }}</button>
      </div>
    </div>

    <div v-if="!friend" class="text-center text-stone-400 py-16 text-[13.5px]">
      {{ t('friendDetail.notFound') }}
    </div>

    <template v-else>
      <!-- Name & tags -->
      <h1 class="text-[26px] font-semibold text-stone-900 tracking-tight">{{ friend.name }}</h1>
      <div v-if="friend.tags && friend.tags.length" class="flex flex-wrap gap-1.5 mt-2 mb-7">
        <span
          v-for="tag in friend.tags" :key="tag"
          class="px-2.5 py-0.5 bg-stone-100 text-stone-600 text-[11.5px] rounded-full"
        >{{ tag }}</span>
      </div>
      <div v-else class="mb-7"></div>

      <!-- Gap indicator -->
      <div v-if="friendScore" class="mb-9 pb-7 border-b" style="border-color: #ece9e4">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-2">{{ t('friendDetail.gapTitle') }}</p>
        <p class="text-[40px] font-light tabular-nums tracking-tight" :class="gapTone(friendScore.gap)">
          {{ friendScore.gap > 0 ? '+' : '' }}{{ Math.round(friendScore.gap) }}
        </p>
        <p class="text-[13px] text-stone-500 mt-1">{{ gapText(friendScore.gap) }}</p>
      </div>

      <!-- Basic info -->
      <div v-if="infoRows.length" class="mb-9">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">{{ t('friendDetail.info') }}</p>
        <div class="rounded-xl overflow-hidden" style="border: 1px solid #ece9e4">
          <div
            v-for="(row, i) in infoRows" :key="row.label"
            class="flex items-center justify-between px-4 py-3"
            :class="i > 0 ? 'border-t' : ''"
            :style="i > 0 ? 'border-color: #ece9e4' : ''"
          >
            <span class="text-[12.5px] text-stone-400">{{ row.label }}</span>
            <span class="text-[13.5px] text-stone-800 text-right">{{ row.value }}</span>
          </div>
        </div>
      </div>

      <!-- Values -->
      <div v-if="friend.values && friend.values.length" class="mb-9">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">{{ t('friendDetail.values') }}</p>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="val in friend.values" :key="val"
            class="px-3 py-1 text-[12px] rounded-full"
            style="background: #fef3c7; color: #92400e"
          >{{ val }}</span>
        </div>
      </div>

      <!-- Important events -->
      <div v-if="friend.importantEvents && friend.importantEvents.length" class="mb-9">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">{{ t('friendDetail.importantEvents') }}</p>
        <div class="rounded-xl overflow-hidden" style="border: 1px solid #ece9e4">
          <div
            v-for="(event, i) in friend.importantEvents" :key="i"
            class="flex items-start gap-3 px-4 py-3"
            :class="i > 0 ? 'border-t' : ''"
            :style="i > 0 ? 'border-color: #ece9e4' : ''"
          >
            <span class="w-1 h-1 rounded-full bg-stone-400 mt-2 flex-shrink-0"></span>
            <span class="text-[13.5px] text-stone-700 leading-relaxed">{{ event }}</span>
          </div>
        </div>
      </div>

      <!-- Mini scatter -->
      <div v-if="scoredFriends.length > 0" class="mb-9">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">{{ t('friendDetail.scatterPosition') }}</p>
        <div class="rounded-xl p-3" style="border: 1px solid #ece9e4; background: #fbfaf7">
          <ScatterPlot :scores="scoredFriends" :highlight-id="friendId" :show-tuner="false" />
        </div>
      </div>

      <!-- Hangout history -->
      <div class="mb-7">
        <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">{{ t('friendDetail.hangoutHistory') }}</p>
        <div v-if="friendHangouts.length === 0" class="text-center text-stone-400 py-6 text-[13px]">
          {{ t('friendDetail.noHangouts') }}
        </div>
        <div v-else class="rounded-xl overflow-hidden" style="border: 1px solid #ece9e4">
          <div
            v-for="(h, i) in friendHangouts" :key="h.id"
            class="px-4 py-3"
            :class="i > 0 ? 'border-t' : ''"
            :style="i > 0 ? 'border-color: #ece9e4' : ''"
          >
            <div class="flex items-center justify-between mb-1">
              <span class="text-[13.5px] font-medium text-stone-800">
                <template v-for="(tp, ti) in getHangoutTypes(h)" :key="tp">
                  <span v-if="ti > 0" class="text-stone-300"> · </span>{{ typeMap[tp]?.icon || '' }} {{ typeLabel(tp) }}
                </template>
              </span>
              <span class="text-[11.5px] text-stone-400 tabular-nums">{{ h.date }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-[11.5px] text-stone-400">{{ h.duration }}</span>
              <span class="text-[11.5px] text-amber-500 font-medium tabular-nums">★ {{ rating(h.quality) }}</span>
            </div>
            <p v-if="h.note" class="text-[12.5px] text-stone-500 mt-1.5 leading-relaxed">{{ h.note }}</p>
            <div class="flex items-center gap-2 mt-2">
              <button
                @click="handleEditHangout(h.id)"
                class="px-2 py-0.5 text-[11px] text-stone-500 bg-stone-100 active:bg-stone-200 rounded border-none cursor-pointer touch-manipulation"
              >{{ t('friendDetail.editHangout') }}</button>
              <button
                @click="handleDeleteHangout(h.id)"
                class="px-2 py-0.5 text-[11px] text-rose-500 bg-rose-50 active:bg-rose-100 rounded border-none cursor-pointer touch-manipulation"
              >{{ t('friendDetail.deleteHangout') }}</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Log button -->
      <router-link
        :to="`/log?friend=${friend.id}`"
        class="block w-full py-3 bg-stone-900 text-white text-center font-medium text-[15px] rounded-xl no-underline active:bg-stone-800"
      >
        {{ t('friendDetail.logHangout') }}
      </router-link>
    </template>
  </div>
</template>
