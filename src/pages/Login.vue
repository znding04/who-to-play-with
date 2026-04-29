<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth.js';

const route = useRoute();
const router = useRouter();
const { signup, login, loginWithProvider, loginWithMagicLink, handleAuthCallback, handleMagicCallback, isLoggedIn, user, logout, loading, error } = useAuth();

const email = ref('');
const password = ref('');
const name = ref('');
const isSignup = ref(false);
const emailSent = ref(false);
const magicLink = ref('');
const processing = ref(false);
const authMode = ref('password'); // 'password' or 'magic'

onMounted(async () => {
  // Handle OAuth callback (token in URL hash)
  const hash = route.hash;
  if (hash) {
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('token');
    if (token) {
      await handleAuthCallback(token);
      router.replace('/');
      return;
    }
  }

  // Handle query params (from OAuth redirect)
  const queryToken = route.query.token;
  const magicToken = route.query.magic;
  const errorParam = route.query.error;

  if (queryToken) {
    await handleAuthCallback(queryToken);
    router.replace('/');
    return;
  }

  if (magicToken) {
    processing.value = true;
    const success = await handleMagicCallback(magicToken);
    processing.value = false;
    if (success) {
      router.replace('/');
    } else {
      router.replace('/login');
    }
    return;
  }
});

async function handleEmailSubmit() {
  if (!email.value) return;

  if (authMode.value === 'magic') {
    processing.value = true;
    const result = await loginWithMagicLink(email.value);
    processing.value = false;
    if (result && result.magicLink) {
      magicLink.value = result.magicLink;
      emailSent.value = true;
    } else if (result && !result.error) {
      emailSent.value = true;
    }
    return;
  }

  if (!password.value) return;
  processing.value = true;

  let result;
  if (isSignup.value) {
    result = await signup(email.value, password.value, name.value || undefined);
  } else {
    result = await login(email.value, password.value);
  }

  processing.value = false;

  if (result && !result.error) {
    router.replace('/');
  }
}

async function handleGoogleLogin() {
  processing.value = true;
  await loginWithProvider('google');
}

async function handleGitHubLogin() {
  processing.value = true;
  await loginWithProvider('github');
}

async function handleLogout() {
  await logout();
}

function skipLogin() {
  router.push('/');
}
</script>

<template>
  <div class="min-h-screen bg-stone-50 flex flex-col items-center justify-center px-6">
    <!-- Logo area -->
    <div class="text-center mb-10">
      <h1 class="text-3xl font-semibold text-stone-900 tracking-tight">找谁玩<span class="text-lg font-light text-stone-400">.AI</span></h1>
      <p class="text-sm text-stone-500 mt-2">登录以同步你的数据到云端</p>
    </div>

    <!-- Already logged in -->
    <div v-if="isLoggedIn" class="w-full max-w-[320px] p-6 bg-white border border-stone-200 rounded-2xl shadow-sm text-center space-y-4">
      <div class="flex items-center justify-center gap-3">
        <img v-if="user?.avatarUrl" :src="user.avatarUrl" :alt="user.name" class="w-12 h-12 rounded-full object-cover" />
        <span v-else class="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-white text-lg font-medium">
          {{ user?.name?.charAt(0) || '?' }}
        </span>
        <div class="text-left">
          <div class="font-medium text-stone-800">{{ user?.name }}</div>
          <div class="text-xs text-stone-500">{{ user?.email }}</div>
        </div>
      </div>
      <div class="flex gap-2">
        <button @click="$router.push('/')" class="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-xl text-sm font-medium text-white transition-colors">返回首页</button>
        <button @click="handleLogout" class="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 rounded-xl text-sm font-medium text-stone-600 transition-colors">退出</button>
      </div>
    </div>

    <!-- Error display -->
    <div v-else>
      <div v-if="error" class="w-full max-w-[320px] mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-600 text-center">
        {{ error }}
      </div>

      <!-- Magic link sent -->
      <div v-if="emailSent" class="w-full max-w-[320px] p-6 bg-white border border-stone-200 rounded-2xl shadow-sm text-center">
        <div class="text-3xl mb-3">✉️</div>
        <h2 class="text-lg font-medium text-stone-800 mb-2">检查你的邮箱</h2>
        <p class="text-sm text-stone-500 mb-4">我们向 <span class="font-medium text-stone-700">{{ email }}</span> 发送了登录链接</p>
        <div v-if="magicLink" class="mt-4 p-3 bg-stone-50 rounded-lg text-xs text-stone-400 break-all">
          预览链接: <a :href="magicLink" class="text-blue-500 underline">{{ magicLink }}</a>
        </div>
        <button @click="emailSent = false; email = ''" class="mt-4 text-sm text-stone-500 hover:text-stone-700 bg-transparent border-none cursor-pointer">
          重新输入邮箱
        </button>
      </div>

      <!-- Login form -->
      <div v-else class="w-full max-w-[320px] space-y-3">
        <!-- OAuth buttons -->
        <button
          @click="handleGoogleLogin"
          :disabled="processing"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-stone-200 rounded-xl shadow-sm text-sm font-medium text-stone-700 hover:bg-stone-50 active:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          使用 Google 登录
        </button>

        <button
          @click="handleGitHubLogin"
          :disabled="processing"
          class="w-full flex items-center justify-center gap-3 px-4 py-3 bg-stone-900 border border-stone-900 rounded-xl shadow-sm text-sm font-medium text-white hover:bg-stone-800 active:bg-stone-950 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1-.02-1.96-3.2.7-3.87-1.54-3.87-1.54-.52-1.32-1.27-1.67-1.27-1.67-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.69 1.25 3.34.95.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.78 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.58.23 2.75.12 3.04.73.8 1.18 1.83 1.18 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.13 0 1.54-.01 2.78-.01 3.16 0 .31.21.67.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/>
          </svg>
          使用 GitHub 登录
        </button>

        <!-- Divider -->
        <div class="flex items-center gap-3 py-1">
          <div class="flex-1 h-px bg-stone-200"></div>
          <span class="text-xs text-stone-400 uppercase tracking-wider">或</span>
          <div class="flex-1 h-px bg-stone-200"></div>
        </div>

        <!-- Email/password form -->
        <div class="space-y-2">
          <!-- Toggle signup/login -->
          <div class="flex rounded-xl border border-stone-200 overflow-hidden bg-white">
            <button
              @click="isSignup = false; authMode = 'password'"
              class="flex-1 py-2 text-sm font-medium transition-colors border-none cursor-pointer"
              :class="!isSignup && authMode === 'password' ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'"
            >登录</button>
            <button
              @click="isSignup = true; authMode = 'password'"
              class="flex-1 py-2 text-sm font-medium transition-colors border-none cursor-pointer"
              :class="isSignup ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'"
            >注册</button>
            <button
              @click="isSignup = false; authMode = 'magic'"
              class="flex-1 py-2 text-sm font-medium transition-colors border-none cursor-pointer"
              :class="authMode === 'magic' ? 'bg-amber-500 text-white' : 'bg-white text-stone-500 hover:bg-stone-50'"
            >邮箱链接</button>
          </div>

          <!-- Name field (signup only) -->
          <input
            v-if="isSignup"
            v-model="name"
            type="text"
            placeholder="昵称 (可选)"
            class="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
          />

          <!-- Email field -->
          <input
            v-model="email"
            type="email"
            placeholder="输入邮箱地址"
            class="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            @keyup.enter="authMode === 'password' ? null : handleEmailSubmit()"
          />

          <!-- Password field (not for magic link) -->
          <input
            v-if="authMode === 'password'"
            v-model="password"
            type="password"
            :placeholder="isSignup ? '设置密码 (至少6位)' : '输入密码'"
            class="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-shadow"
            @keyup.enter="handleEmailSubmit"
          />

          <!-- Submit button -->
          <button
            @click="handleEmailSubmit"
            :disabled="processing || !email || (authMode === 'password' && !password)"
            class="w-full px-4 py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 rounded-xl text-sm font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="processing">处理中...</span>
            <span v-else-if="authMode === 'magic'">发送登录链接</span>
            <span v-else-if="isSignup">创建账户</span>
            <span v-else>登录</span>
          </button>
        </div>

        <!-- Skip for now -->
        <div class="text-center pt-2">
          <button
            @click="skipLogin"
            class="text-sm text-stone-400 hover:text-stone-600 bg-transparent border-none cursor-pointer"
          >
            暂不登录，继续使用本地数据
          </button>
        </div>
      </div>
    </div>

    <!-- Footer note -->
    <p class="mt-8 text-xs text-stone-400 text-center max-w-[280px]">
      登录后你的数据将同步到云端<br>可以在任何设备上访问
    </p>
  </div>
</template>
