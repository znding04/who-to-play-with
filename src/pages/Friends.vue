<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useGapThreshold } from '../composables/useGapThreshold'

const router = useRouter()
const route = useRoute()
const { friends, addFriend, updateFriend, deleteFriend, getFriendById } = useFriends()
const { scoredFriends } = useScoring()
const { gapThreshold } = useGapThreshold()

function maybeOpenEditFromQuery() {
  const id = route.query.edit
  if (!id) return
  const target = getFriendById(id)
  if (target) openEdit(target)
  // Clear the query so reloading the page doesn't reopen the form.
  router.replace({ path: route.path })
}

onMounted(maybeOpenEditFromQuery)
watch(() => route.query.edit, maybeOpenEditFromQuery)

const showAdd = ref(false)
const showEdit = ref(false)
const editingFriend = ref(null)

// Form fields
const newName = ref('')
const newTags = ref('')
const newPhone = ref('')
const newBirthday = ref('')
const newLocation = ref('')
const newHowWeMet = ref('')
const newImportantEvents = ref('')
const newValues = ref('')

function openEdit(friend) {
  editingFriend.value = friend
  newName.value = friend.name
  newTags.value = (friend.tags || []).join(', ')
  newPhone.value = friend.phone || ''
  newBirthday.value = friend.birthday || ''
  newLocation.value = friend.location || ''
  newHowWeMet.value = friend.howWeMet || ''
  newImportantEvents.value = (friend.importantEvents || []).join(', ')
  newValues.value = (friend.values || []).join(', ')
  showEdit.value = true
  showAdd.value = false
}

function handleAdd() {
  const name = newName.value.trim()
  if (!name) return
  const tags = newTags.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const importantEvents = newImportantEvents.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const values = newValues.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  addFriend({
    name,
    tags,
    phone: newPhone.value.trim(),
    birthday: newBirthday.value,
    location: newLocation.value.trim(),
    howWeMet: newHowWeMet.value.trim(),
    importantEvents,
    values,
  })
  resetForm()
}

function handleEdit() {
  if (!editingFriend.value) return
  const name = newName.value.trim()
  if (!name) return
  const tags = newTags.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const importantEvents = newImportantEvents.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  const values = newValues.value
    .split(/[,，]/)
    .map((t) => t.trim())
    .filter(Boolean)
  updateFriend(editingFriend.value.id, {
    name,
    tags,
    phone: newPhone.value.trim(),
    birthday: newBirthday.value,
    location: newLocation.value.trim(),
    howWeMet: newHowWeMet.value.trim(),
    importantEvents,
    values,
  })
  resetForm()
}

function clearFormFields() {
  newName.value = ''
  newTags.value = ''
  newPhone.value = ''
  newBirthday.value = ''
  newLocation.value = ''
  newHowWeMet.value = ''
  newImportantEvents.value = ''
  newValues.value = ''
}

function resetForm() {
  clearFormFields()
  editingFriend.value = null
  showAdd.value = false
  showEdit.value = false
}

function toggleAdd() {
  if (showAdd.value) {
    resetForm()
  } else {
    clearFormFields()
    editingFriend.value = null
    showEdit.value = false
    showAdd.value = true
  }
}

function handleDelete(friend) {
  if (confirm(`确定删除 ${friend.name}？`)) {
    deleteFriend(friend.id)
  }
}
</script>

<template>
  <div class="px-4 pt-6 pb-6">
    <div class="flex items-center justify-between mb-5">
      <h1 class="text-xl font-bold text-gray-800">朋友们</h1>
      <button
        @click="toggleAdd"
        class="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg border-none cursor-pointer"
      >
        {{ showAdd ? '取消' : '+ 添加' }}
      </button>
    </div>

    <!-- Add friend form -->
    <div v-if="showAdd" class="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
      <input
        v-model="newName"
        placeholder="名字 *"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        @keyup.enter="handleAdd"
      />
      <input
        v-model="newTags"
        placeholder="标签（逗号分隔，如：大学, 球友）"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model="newPhone"
          placeholder="电话"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <input
          v-model="newBirthday"
          type="date"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
      </div>
      <input
        v-model="newLocation"
        placeholder="所在地"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <input
        v-model="newHowWeMet"
        placeholder="怎么认识的"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <input
        v-model="newImportantEvents"
        placeholder="重要事件（逗号分隔）"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <input
        v-model="newValues"
        placeholder="价值（如：篮球搭档, 倾听者，逗号分隔）"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <button
        @click="handleAdd"
        class="w-full py-2 bg-blue-500 text-white text-sm rounded-lg border-none cursor-pointer"
      >
        保存朋友
      </button>
    </div>

    <!-- Edit friend form -->
    <div v-if="showEdit" class="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">
      <p class="text-sm font-semibold text-gray-700 mb-1">编辑 {{ editingFriend?.name }}</p>
      <input
        v-model="newName"
        placeholder="名字 *"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        @keyup.enter="handleEdit"
      />
      <input
        v-model="newTags"
        placeholder="标签（逗号分隔）"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model="newPhone"
          placeholder="电话"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <input
          v-model="newBirthday"
          type="date"
          class="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
      </div>
      <input
        v-model="newLocation"
        placeholder="所在地"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <input
        v-model="newHowWeMet"
        placeholder="怎么认识的"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <input
        v-model="newImportantEvents"
        placeholder="重要事件（逗号分隔）"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <input
        v-model="newValues"
        placeholder="价值（如：篮球搭档, 倾听者，逗号分隔）"
        class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
      />
      <div class="flex gap-2">
        <button
          @click="handleEdit"
          class="flex-1 py-2 bg-blue-500 text-white text-sm rounded-lg border-none cursor-pointer"
        >
          保存修改
        </button>
        <button
          @click="showEdit = false; editingFriend = null"
          class="px-4 py-2 bg-gray-200 text-gray-600 text-sm rounded-lg border-none cursor-pointer"
        >
          取消
        </button>
      </div>
    </div>

    <!-- Friend list -->
    <div v-if="friends.length === 0" class="text-center text-gray-400 py-16 text-sm">
      还没有朋友<br />点击上方 + 添加 开始
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="s in scoredFriends"
        :key="s.friend.id"
        class="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 cursor-pointer active:bg-gray-100 transition-colors"
        @click="router.push(`/friends/${s.friend.id}`)"
      >
        <div>
          <p class="text-sm font-medium text-gray-700">{{ s.friend.name }}</p>
          <p v-if="s.friend.tags.length" class="text-xs text-gray-400 mt-0.5">
            {{ s.friend.tags.join(' · ') }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <span
            class="text-xs font-medium"
            :class="s.gap > gapThreshold ? 'text-green-500' : s.gap < -gapThreshold ? 'text-red-500' : 'text-blue-500'"
          >
            {{ s.gap > 0 ? '+' : '' }}{{ Math.round(s.gap) }}
          </span>
          <button
            @click.stop="openEdit(s.friend)"
            class="px-2.5 py-1.5 text-xs text-blue-600 bg-blue-50 active:bg-blue-100 rounded-lg border-none cursor-pointer touch-manipulation"
          >编辑</button>
          <button
            @click.stop="handleDelete(s.friend)"
            class="px-2.5 py-1.5 text-xs text-red-500 bg-red-50 active:bg-red-100 rounded-lg border-none cursor-pointer touch-manipulation"
          >删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
