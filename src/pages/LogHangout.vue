<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriends } from '../composables/useFriends'
import { useCustomTypes } from '../composables/useCustomTypes'
import { useCustomDurations } from '../composables/useCustomDurations'
import { HANGOUT_TYPES, DURATION_OPTIONS } from '../types/index.js'

const router = useRouter()
const route = useRoute()
const { friends, addFriend, addHangout } = useFriends()
const { customTypes, addCustomType, removeCustomType } = useCustomTypes()
const { customDurations, addCustomDuration, removeCustomDuration } = useCustomDurations()

const selectedFriendIds = ref([])
const hangoutType = ref('meal')
const duration = ref('1hr')
const quality = ref(6)
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')

// "其他" stays in HANGOUT_TYPES for legacy data display, but we hide it from the picker —
// users now create their own types via the "+ 新增" button.
const visibleTypes = computed(() => [
  ...HANGOUT_TYPES.filter((t) => t.value !== 'other'),
  ...customTypes.value,
])
const visibleDurations = computed(() => [
  ...DURATION_OPTIONS,
  ...customDurations.value,
])

const showAddType = ref(false)
const newTypeLabel = ref('')
const showAddDuration = ref(false)
const newDurationLabel = ref('')

const showAddFriend = ref(false)
const newFriendName = ref('')

onMounted(() => {
  const id = route.query.friend
  if (id && friends.value.some((f) => f.id === id)) {
    selectedFriendIds.value = [id]
  }
})

function toggleFriend(id) {
  const idx = selectedFriendIds.value.indexOf(id)
  if (idx >= 0) {
    selectedFriendIds.value.splice(idx, 1)
  } else {
    selectedFriendIds.value.push(id)
  }
}

function handleAddFriend() {
  const name = newFriendName.value.trim()
  if (!name) return
  const friend = addFriend({ name, tags: [], isSeed: false })
  selectedFriendIds.value.push(friend.id)
  newFriendName.value = ''
  showAddFriend.value = false
}

function handleAddType() {
  const created = addCustomType(newTypeLabel.value)
  if (created) {
    hangoutType.value = created.value
    newTypeLabel.value = ''
    showAddType.value = false
  }
}

function handleAddDuration() {
  const created = addCustomDuration(newDurationLabel.value)
  if (created) {
    duration.value = created.value
    newDurationLabel.value = ''
    showAddDuration.value = false
  }
}

let longPressTimer = null
function startLongPress(item, kind) {
  cancelLongPress()
  if (!item.value || !String(item.value).startsWith('c_')) return
  longPressTimer = setTimeout(() => {
    longPressTimer = null
    if (confirm(`删除自定义${kind === 'type' ? '类型' : '时长'}「${item.label}」？`)) {
      if (kind === 'type') {
        removeCustomType(item.value)
        if (hangoutType.value === item.value) hangoutType.value = 'meal'
      } else {
        removeCustomDuration(item.value)
        if (duration.value === item.value) duration.value = '1hr'
      }
    }
  }, 600)
}
function cancelLongPress() {
  if (longPressTimer) {
    clearTimeout(longPressTimer)
    longPressTimer = null
  }
}

const canSubmit = computed(() => selectedFriendIds.value.length > 0)

function submit() {
  if (!canSubmit.value) return
  addHangout({
    friendIds: [...selectedFriendIds.value],
    type: hangoutType.value,
    duration: duration.value,
    quality: quality.value,
    note: note.value,
    date: date.value,
    isSeed: false,
  })
  router.push('/friends')
}
</script>

<template>
  <div class="px-5 pt-9 pb-2">
    <!-- Header -->
    <div class="flex items-center justify-between mb-9">
      <router-link to="/" class="text-stone-500 text-[13px] no-underline flex items-center gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18 L9 12 L15 6" />
        </svg>
        返回
      </router-link>
      <div>
        <p class="text-[11px] uppercase tracking-[0.22em] text-stone-400 text-right">Log</p>
        <h1 class="text-[18px] font-semibold text-stone-900 tracking-tight">记录聚会</h1>
      </div>
    </div>

    <!-- Friend selector -->
    <section class="mb-7">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">和谁玩了</p>
      <div v-if="friends.length === 0" class="text-[13px] text-stone-400 mb-2">
        还没有朋友，先添加一个吧
      </div>
      <div class="rounded-xl overflow-hidden max-h-56 overflow-y-auto" style="border: 1px solid #ece9e4">
        <label
          v-for="(f, i) in friends"
          :key="f.id"
          class="flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors"
          :class="[
            i > 0 ? 'border-t' : '',
            selectedFriendIds.includes(f.id) ? 'bg-stone-900 text-white' : 'bg-white active:bg-stone-50',
          ]"
          :style="i > 0 ? 'border-color: #ece9e4' : ''"
        >
          <input
            type="checkbox"
            :checked="selectedFriendIds.includes(f.id)"
            @change="toggleFriend(f.id)"
            class="w-4 h-4"
            style="accent-color: #1c1917"
          />
          <span class="text-[14px] flex-1" :class="selectedFriendIds.includes(f.id) ? 'text-white' : 'text-stone-800'">{{ f.name }}</span>
          <span v-if="f.tags.length" class="text-[11px]" :class="selectedFriendIds.includes(f.id) ? 'text-stone-300' : 'text-stone-400'">{{ f.tags.join(', ') }}</span>
        </label>
      </div>

      <button
        v-if="!showAddFriend"
        @click="showAddFriend = true"
        class="mt-2.5 text-[12.5px] text-stone-500 hover:text-stone-900 bg-transparent border-none cursor-pointer"
      >
        + 添加新朋友
      </button>
      <div v-else class="flex gap-2 mt-2.5">
        <input
          v-model="newFriendName"
          placeholder="朋友名字"
          class="flex-1 bg-white rounded-lg px-3.5 py-2 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
          style="border: 1px solid #ece9e4"
          @keyup.enter="handleAddFriend"
        />
        <button
          @click="handleAddFriend"
          class="px-3.5 py-2 bg-stone-900 text-white text-[13px] rounded-lg border-none cursor-pointer"
        >添加</button>
        <button
          @click="showAddFriend = false; newFriendName = ''"
          class="px-3.5 py-2 bg-stone-100 text-stone-600 text-[13px] rounded-lg border-none cursor-pointer"
        >取消</button>
      </div>
    </section>

    <!-- Type picker -->
    <section class="mb-7">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">类型</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in visibleTypes"
          :key="t.value"
          @click="hangoutType = t.value"
          @pointerdown="startLongPress(t, 'type')"
          @pointerup="cancelLongPress"
          @pointerleave="cancelLongPress"
          @pointercancel="cancelLongPress"
          @contextmenu.prevent
          class="px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer transition-colors select-none"
          :class="hangoutType === t.value
            ? 'bg-stone-900 text-white'
            : 'bg-white text-stone-600'"
          :style="hangoutType === t.value ? 'border: 1px solid #1c1917' : 'border: 1px solid #ece9e4'"
        >
          {{ t.icon }} {{ t.label }}
        </button>
        <button
          @click="showAddType = !showAddType; newTypeLabel = ''"
          class="px-3 py-1.5 rounded-full text-[13px] text-stone-500 bg-stone-50 cursor-pointer transition-colors"
          style="border: 1px dashed #d6d3d1"
        >+ 新增</button>
      </div>
      <div v-if="showAddType" class="flex gap-2 mt-2.5">
        <input
          v-model="newTypeLabel"
          placeholder="新类型（可加 emoji，如：🎲 桌游）"
          class="flex-1 bg-white rounded-lg px-3.5 py-2 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
          style="border: 1px solid #ece9e4"
          @keyup.enter="handleAddType"
        />
        <button
          @click="handleAddType"
          class="px-3.5 py-2 bg-stone-900 text-white text-[13px] rounded-lg border-none cursor-pointer"
        >添加</button>
      </div>
      <p v-if="customTypes.length" class="text-[11px] text-stone-400 mt-2">长按自定义类型可删除</p>
    </section>

    <!-- Duration picker -->
    <section class="mb-7">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">时长</p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="d in visibleDurations"
          :key="d.value"
          @click="duration = d.value"
          @pointerdown="startLongPress(d, 'duration')"
          @pointerup="cancelLongPress"
          @pointerleave="cancelLongPress"
          @pointercancel="cancelLongPress"
          @contextmenu.prevent
          class="px-3.5 py-1.5 rounded-full text-[13px] cursor-pointer transition-colors select-none"
          :class="duration === d.value
            ? 'bg-stone-900 text-white'
            : 'bg-white text-stone-600'"
          :style="duration === d.value ? 'border: 1px solid #1c1917' : 'border: 1px solid #ece9e4'"
        >
          {{ d.label }}
        </button>
        <button
          @click="showAddDuration = !showAddDuration; newDurationLabel = ''"
          class="px-3 py-1.5 rounded-full text-[13px] text-stone-500 bg-stone-50 cursor-pointer transition-colors"
          style="border: 1px dashed #d6d3d1"
        >+ 新增</button>
      </div>
      <div v-if="showAddDuration" class="flex gap-2 mt-2.5">
        <input
          v-model="newDurationLabel"
          placeholder="新时长（如：3小时、一周）"
          class="flex-1 bg-white rounded-lg px-3.5 py-2 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
          style="border: 1px solid #ece9e4"
          @keyup.enter="handleAddDuration"
        />
        <button
          @click="handleAddDuration"
          class="px-3.5 py-2 bg-stone-900 text-white text-[13px] rounded-lg border-none cursor-pointer"
        >添加</button>
      </div>
      <p v-if="customDurations.length" class="text-[11px] text-stone-400 mt-2">长按自定义时长可删除</p>
    </section>

    <!-- Quality rating (1-10) -->
    <section class="mb-7">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">感受 · {{ quality }}/10</p>
      <div class="flex flex-wrap gap-0.5">
        <button
          v-for="s in 10"
          :key="s"
          @click="quality = s"
          class="text-xl bg-transparent border-none cursor-pointer px-0.5 py-0.5 transition-colors touch-manipulation"
          :class="s <= quality ? 'text-amber-500' : 'text-stone-300'"
        >★</button>
      </div>
    </section>

    <!-- Date picker -->
    <section class="mb-7">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">日期</p>
      <input
        v-model="date"
        type="date"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 outline-none"
        style="border: 1px solid #ece9e4"
      />
    </section>

    <!-- Note -->
    <section class="mb-9">
      <p class="text-[10px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-3">备注</p>
      <textarea
        v-model="note"
        placeholder="记点什么..."
        rows="3"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none resize-none"
        style="border: 1px solid #ece9e4"
      />
    </section>

    <!-- Submit -->
    <button
      @click="submit"
      :disabled="!canSubmit"
      class="w-full py-3 rounded-xl text-[15px] font-medium border-none cursor-pointer transition-colors"
      :class="canSubmit ? 'bg-stone-900 text-white active:bg-stone-800' : 'bg-stone-100 text-stone-400 cursor-not-allowed'"
    >
      保存
    </button>
  </div>
</template>
