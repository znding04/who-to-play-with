<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useFriends } from '../composables/useFriends'
import { useScoring } from '../composables/useScoring'
import { useGapThreshold } from '../composables/useGapThreshold'
import { useDataFilter } from '../composables/useDataFilter'

const router = useRouter()
const route = useRoute()
const { friends, addFriend, updateFriend, deleteFriend, getFriendById, deleteSeedData, hasSeedData } = useFriends()
const { scoredFriends } = useScoring()
const { gapThreshold } = useGapThreshold()
const { showSeed } = useDataFilter()

function handleClearSeed() {
  if (confirm('永久删除所有示例数据？此操作不可撤销。')) {
    deleteSeedData()
  }
}

function maybeOpenEditFromQuery() {
  const id = route.query.edit
  if (!id) return
  const target = getFriendById(id)
  if (target) openEdit(target)
  router.replace({ path: route.path })
}

onMounted(maybeOpenEditFromQuery)
watch(() => route.query.edit, maybeOpenEditFromQuery)

const showAdd = ref(false)
const showEdit = ref(false)
const editingFriend = ref(null)

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
  const tags = newTags.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  const importantEvents = newImportantEvents.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  const values = newValues.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  addFriend({
    name, tags,
    phone: newPhone.value.trim(),
    birthday: newBirthday.value,
    location: newLocation.value.trim(),
    howWeMet: newHowWeMet.value.trim(),
    importantEvents, values,
  })
  resetForm()
}

function handleEdit() {
  if (!editingFriend.value) return
  const name = newName.value.trim()
  if (!name) return
  const tags = newTags.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  const importantEvents = newImportantEvents.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  const values = newValues.value.split(/[,，]/).map((t) => t.trim()).filter(Boolean)
  updateFriend(editingFriend.value.id, {
    name, tags,
    phone: newPhone.value.trim(),
    birthday: newBirthday.value,
    location: newLocation.value.trim(),
    howWeMet: newHowWeMet.value.trim(),
    importantEvents, values,
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

function gapTone(gap) {
  if (gap > gapThreshold.value) return 'text-emerald-600'
  if (gap < -gapThreshold.value) return 'text-rose-500'
  return 'text-stone-400'
}

const sortedFriends = computed(() =>
  [...scoredFriends.value].sort((a, b) => b.gap - a.gap)
)
</script>

<template>
  <div class="px-5 pt-9 pb-2">
    <!-- Header -->
    <div class="flex items-end justify-between mb-9">
      <div>
        <p class="text-[11px] uppercase tracking-[0.22em] text-stone-400">Friends</p>
        <h1 class="text-[22px] font-semibold text-stone-900 mt-1.5 tracking-tight">朋友们</h1>
      </div>
      <button
        @click="toggleAdd"
        class="px-3.5 py-1.5 text-[13px] font-medium border-none cursor-pointer transition-colors rounded-full"
        :class="showAdd ? 'bg-stone-100 text-stone-600' : 'bg-stone-900 text-white'"
      >
        {{ showAdd ? '取消' : '+ 添加' }}
      </button>
    </div>

    <!-- Seed data filter -->
    <div v-if="hasSeedData" class="flex items-center justify-between text-[12px] text-stone-500 mb-5 -mt-5">
      <label class="flex items-center gap-2 cursor-pointer touch-manipulation">
        <input
          type="checkbox"
          v-model="showSeed"
          class="w-3.5 h-3.5"
          style="accent-color: #1c1917"
        />
        显示示例数据
      </label>
      <button
        @click="handleClearSeed"
        class="text-[12px] text-stone-500 hover:text-rose-500 bg-transparent border-none cursor-pointer touch-manipulation"
      >清除示例</button>
    </div>

    <!-- Add / Edit form -->
    <div
      v-if="showAdd || showEdit"
      class="mb-7 rounded-xl p-4 space-y-2.5"
      style="border: 1px solid #ece9e4; background: #fbfaf7"
    >
      <p v-if="showEdit" class="text-[11px] uppercase tracking-[0.22em] text-stone-400 font-medium mb-1">
        编辑 · {{ editingFriend?.name }}
      </p>
      <input
        v-model="newName"
        placeholder="名字 *"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none transition-colors"
        style="border: 1px solid #ece9e4"
        onfocus="this.style.borderColor='#1c1917'"
        onblur="this.style.borderColor='#ece9e4'"
        @keyup.enter="showEdit ? handleEdit() : handleAdd()"
      />
      <input
        v-model="newTags"
        placeholder="标签（逗号分隔，如：大学, 球友）"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
        style="border: 1px solid #ece9e4"
      />
      <div class="grid grid-cols-2 gap-2">
        <input
          v-model="newPhone"
          placeholder="电话"
          class="bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
          style="border: 1px solid #ece9e4"
        />
        <input
          v-model="newBirthday"
          type="date"
          class="bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 outline-none"
          style="border: 1px solid #ece9e4"
        />
      </div>
      <input
        v-model="newLocation"
        placeholder="所在地"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
        style="border: 1px solid #ece9e4"
      />
      <input
        v-model="newHowWeMet"
        placeholder="怎么认识的"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
        style="border: 1px solid #ece9e4"
      />
      <input
        v-model="newImportantEvents"
        placeholder="重要事件（逗号分隔）"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
        style="border: 1px solid #ece9e4"
      />
      <input
        v-model="newValues"
        placeholder="价值（如：篮球搭档, 倾听者）"
        class="w-full bg-white rounded-lg px-3.5 py-2.5 text-[14px] text-stone-800 placeholder:text-stone-400 outline-none"
        style="border: 1px solid #ece9e4"
      />
      <div v-if="showEdit" class="flex gap-2 pt-1">
        <button
          @click="handleEdit"
          class="flex-1 py-2.5 bg-stone-900 text-white text-[14px] font-medium rounded-lg border-none cursor-pointer"
        >保存修改</button>
        <button
          @click="resetForm"
          class="px-5 py-2.5 bg-stone-100 text-stone-600 text-[14px] rounded-lg border-none cursor-pointer"
        >取消</button>
      </div>
      <button
        v-else
        @click="handleAdd"
        class="w-full py-2.5 bg-stone-900 text-white text-[14px] font-medium rounded-lg border-none cursor-pointer mt-1"
      >保存朋友</button>
    </div>

    <!-- Empty -->
    <div v-if="friends.length === 0" class="text-center text-stone-400 py-16 text-[13.5px]">
      还没有朋友<br />
      <span class="text-[12px] mt-1 inline-block">点击右上角 + 添加 开始</span>
    </div>

    <!-- Friend list -->
    <div v-else class="rounded-xl overflow-hidden" style="border: 1px solid #ece9e4">
      <div
        v-for="(s, i) in sortedFriends"
        :key="s.friend.id"
        class="flex items-center justify-between px-4 py-3.5 cursor-pointer active:bg-stone-50 transition-colors"
        :class="i > 0 ? 'border-t' : ''"
        :style="i > 0 ? 'border-color: #ece9e4' : ''"
        @click="router.push(`/friends/${s.friend.id}`)"
      >
        <div class="min-w-0 flex-1">
          <p class="text-[14px] font-medium text-stone-900 truncate">{{ s.friend.name }}</p>
          <p v-if="s.friend.tags.length" class="text-[11.5px] text-stone-400 mt-0.5 truncate">
            {{ s.friend.tags.join(' · ') }}
          </p>
        </div>
        <div class="flex items-center gap-2.5 ml-3">
          <span class="text-[12px] font-medium tabular-nums" :class="gapTone(s.gap)">
            {{ s.gap > 0 ? '+' : '' }}{{ Math.round(s.gap) }}
          </span>
          <button
            @click.stop="openEdit(s.friend)"
            class="px-2 py-1 text-[11.5px] text-stone-500 bg-stone-100 active:bg-stone-200 rounded-md border-none cursor-pointer touch-manipulation"
          >编辑</button>
          <button
            @click.stop="handleDelete(s.friend)"
            class="px-2 py-1 text-[11.5px] text-rose-500 bg-rose-50 active:bg-rose-100 rounded-md border-none cursor-pointer touch-manipulation"
          >删除</button>
        </div>
      </div>
    </div>
  </div>
</template>
