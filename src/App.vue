<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const route = useRoute()
const router = useRouter()
const { user, isLoggedIn, logout } = useAuth()

const tabs = [
  { name: 'home', path: '/', label: '首页' },
  { name: 'friends', path: '/friends', label: '朋友' },
  { name: 'log', path: '/log', label: '记录' },
  { name: 'calendar', path: '/calendar', label: '日历' },
]

const showLogin = computed(() => route.name !== 'login' && route.name !== 'auth-callback')

async function handleLogout() {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div class="mx-auto max-w-[480px] min-h-screen bg-white relative" style="padding-top: var(--safe-top); padding-bottom: calc(4.5rem + var(--safe-bottom))">
    <!-- User avatar / login button -->
    <div v-if="showLogin" class="absolute top-3 right-3 z-30 flex items-center gap-2" style="margin-top: env(safe-area-inset-top, 0px)">
      <router-link
        v-if="isLoggedIn"
        to="/login"
        class="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-stone-100 transition-colors"
        title="账户"
      >
        <img
          v-if="user?.avatarUrl"
          :src="user.avatarUrl"
          :alt="user.name"
          class="w-7 h-7 rounded-full object-cover"
        />
        <span v-else class="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-medium">
          {{ user?.name?.charAt(0) || '?' }}
        </span>
        <button @click.stop.prevent="handleLogout" class="text-stone-400 hover:text-stone-600 text-xs" title="退出登录">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </router-link>
      <router-link
        v-else
        to="/login"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-colors"
      >
        登录
      </router-link>
    </div>

    <!-- GitHub repo link -->
    <a
      v-if="showLogin"
      href="https://github.com/znding04/who-to-play-with"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="GitHub 仓库"
      class="absolute top-3 z-30 w-8 h-8 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors"
      style="margin-top: env(safe-area-inset-top, 0px)"
      :style="isLoggedIn ? 'right-28' : 'right-3'"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.12 3.04.73.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
      </svg>
    </a>

    <router-view />

    <!-- Bottom tab bar -->
    <nav
      class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-40 backdrop-blur-xl"
      style="padding-bottom: env(safe-area-inset-bottom, 0px); background: rgba(255, 255, 255, 0.82); border-top: 1px solid #ece9e4"
    >
      <div class="flex justify-around pt-2.5 pb-1.5">
        <router-link
          v-for="tab in tabs"
          :key="tab.name"
          :to="tab.path"
          class="relative flex flex-col items-center gap-1 no-underline transition-colors duration-200 px-3"
          :class="route.name === tab.name ? 'text-stone-900' : 'text-stone-400'"
        >
          <!-- Home -->
          <svg v-if="tab.name === 'home'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 11.5 L12 4 L21 11.5" />
            <path d="M5.5 10 L5.5 20 L18.5 20 L18.5 10" />
            <path d="M10 20 L10 14.5 L14 14.5 L14 20" />
          </svg>

          <!-- Friends -->
          <svg v-else-if="tab.name === 'friends'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="9" cy="8.5" r="3.5" />
            <path d="M2.5 20 C2.5 16 5.5 14 9 14 C12.5 14 15.5 16 15.5 20" />
            <path d="M16 6.2 A3 3 0 0 1 16 12.5" />
            <path d="M17.5 14.5 C20 15 21.5 17 21.5 19.5" />
          </svg>

          <!-- Log / plus -->
          <svg v-else-if="tab.name === 'log'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8 L12 16" />
            <path d="M8 12 L16 12" />
          </svg>

          <!-- Calendar -->
          <svg v-else-if="tab.name === 'calendar'" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
            <path d="M3.5 9.5 L20.5 9.5" />
            <path d="M8 3.5 L8 6.5" />
            <path d="M16 3.5 L16 6.5" />
          </svg>

          <span class="text-[10px] font-medium tracking-wide">{{ tab.label }}</span>

          <!-- Active dot -->
          <span
            class="absolute -bottom-0.5 w-1 h-1 rounded-full transition-opacity duration-200"
            :class="route.name === tab.name ? 'opacity-100 bg-amber-500' : 'opacity-0'"
          ></span>
        </router-link>
      </div>
    </nav>
  </div>
</template>
