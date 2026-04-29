<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriends } from '../composables/useFriends'
import { useCustomTypes } from '../composables/useCustomTypes'
import { HANGOUT_TYPES, DURATION_OPTIONS } from '../types/index.js'

const router = useRouter()
const route = useRoute()
const { friends, addFriend, addHangout } = useFriends()
const { customTypes, addCustomType } = useCustomTypes()

// Form state
const selectedFriendIds = ref([])
const hangoutType = ref('meal')
const duration = ref('1hr')
const quality = ref(3)
const date = ref(new Date().toISOString().slice(0, 10))
const note = ref('')

// Custom type input (only used when 其他 is selected)
const customTypeLabel = ref('')

// Predefined + saved custom types in the picker
const allTypes = computed(() => [...HANGOUT_TYPES, ...customTypes.value])

// Inline add friend
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
  const friend = addFriend({ name, tags: [] })
  selectedFriendIds.value.push(friend.id)
  newFriendName.value = ''
  showAddFriend.value = false
}

const canSubmit = computed(() => selectedFriendIds.value.length > 0)

function submit() {
  if (!canSubmit.value) return

  // If 其他 is selected and the user typed a custom label, persist it as a new type
  // and use the new type's value for this hangout.
  let typeToSave = hangoutType.value
  if (hangoutType.value === 'other' && customTypeLabel.value.trim()) {
    const created = addCustomType(customTypeLabel.value)
    if (created) typeToSave = created.value
  }

  addHangout({
    friendIds: [...selectedFriendIds.value],
    type: typeToSave,
    duration: duration.value,
    quality: quality.value,
    note: note.value,
    date: date.value,
  })
  router.push('/friends')
}
</script>

<template>
  <div class="px-4 pt-6 pb-6">
    <!-- Header -->
    <div class="flex items-center justify-between mb-5">
      <router-link to="/" class="text-blue-500 text-sm no-underline">&larr; 返回</router-link>
      <h1 class="text-lg font-bold text-gray-800">记录聚会</h1>
      <div class="w-10"></div>
    </div>

    <!-- Friend selector -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-gray-600 mb-2">和谁玩了？</h2>
      <div v-if="friends.length === 0" class="text-sm text-gray-400 mb-2">
        还没有朋友，先添加一个吧
      </div>
      <div class="space-y-1 max-h-48 overflow-y-auto">
        <label
          v-for="f in friends"
          :key="f.id"
          class="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 cursor-pointer"
          :class="selectedFriendIds.includes(f.id) ? 'ring-2 ring-blue-400 bg-blue-50' : ''"
        >
          <input
            type="checkbox"
            :checked="selectedFriendIds.includes(f.id)"
            @change="toggleFriend(f.id)"
            class="w-4 h-4 accent-blue-500"
          />
          <span class="text-sm text-gray-700">{{ f.name }}</span>
          <span v-if="f.tags.length" class="text-xs text-gray-400">{{ f.tags.join(', ') }}</span>
        </label>
      </div>

      <!-- Inline add friend -->
      <button
        v-if="!showAddFriend"
        @click="showAddFriend = true"
        class="mt-2 text-sm text-blue-500 bg-transparent border-none cursor-pointer"
      >
        + 添加新朋友
      </button>
      <div v-else class="flex gap-2 mt-2">
        <input
          v-model="newFriendName"
          placeholder="朋友名字"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          @keyup.enter="handleAddFriend"
        />
        <button
          @click="handleAddFriend"
          class="px-3 py-2 bg-blue-500 text-white text-sm rounded-lg border-none cursor-pointer"
        >
          添加
        </button>
        <button
          @click="showAddFriend = false; newFriendName = ''"
          class="px-3 py-2 bg-gray-200 text-gray-600 text-sm rounded-lg border-none cursor-pointer"
        >
          取消
        </button>
      </div>
    </section>

    <!-- Type picker -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-gray-600 mb-2">类型</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="t in allTypes"
          :key="t.value"
          @click="hangoutType = t.value; customTypeLabel = ''"
          class="px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors"
          :class="hangoutType === t.value
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white text-gray-600 border-gray-300'"
        >
          {{ t.icon }} {{ t.label }}
        </button>
      </div>
      <input
        v-if="hangoutType === 'other'"
        v-model="customTypeLabel"
        placeholder="自定义类型名（如：桌游、剧本杀）"
        class="mt-2 w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <p v-if="hangoutType === 'other' && customTypeLabel.trim()" class="text-xs text-gray-400 mt-1">
        保存后 "{{ customTypeLabel.trim() }}" 会出现在类型选项里
      </p>
    </section>

    <!-- Duration picker -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-gray-600 mb-2">时长</h2>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="d in DURATION_OPTIONS"
          :key="d.value"
          @click="duration = d.value"
          class="px-3 py-1.5 rounded-full text-sm border cursor-pointer transition-colors"
          :class="duration === d.value
            ? 'bg-blue-500 text-white border-blue-500'
            : 'bg-white text-gray-600 border-gray-300'"
        >
          {{ d.label }}
        </button>
      </div>
    </section>

    <!-- Quality stars -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-gray-600 mb-2">感受 ({{ quality }}/5)</h2>
      <div class="flex gap-1">
        <button
          v-for="s in 5"
          :key="s"
          @click="quality = s"
          class="text-2xl bg-transparent border-none cursor-pointer p-1"
        >
          {{ s <= quality ? '★' : '☆' }}
        </button>
      </div>
    </section>

    <!-- Date picker -->
    <section class="mb-5">
      <h2 class="text-sm font-semibold text-gray-600 mb-2">日期</h2>
      <input
        v-model="date"
        type="date"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
    </section>

    <!-- Note -->
    <section class="mb-6">
      <h2 class="text-sm font-semibold text-gray-600 mb-2">备注</h2>
      <textarea
        v-model="note"
        placeholder="记点什么..."
        rows="3"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
      />
    </section>

    <!-- Submit -->
    <button
      @click="submit"
      :disabled="!canSubmit"
      class="w-full py-3 rounded-xl text-white font-semibold text-base border-none cursor-pointer transition-colors"
      :class="canSubmit ? 'bg-blue-500 active:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'"
    >
      保存
    </button>
  </div>
</template>
