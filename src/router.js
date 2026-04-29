import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from './composables/useAuth.js'

const routes = [
  { path: '/', name: 'home', component: () => import('./pages/Home.vue') },
  { path: '/friends', name: 'friends', component: () => import('./pages/Friends.vue') },
  { path: '/friends/:id', name: 'friend-detail', component: () => import('./pages/FriendDetail.vue') },
  { path: '/log', name: 'log', component: () => import('./pages/LogHangout.vue') },
  { path: '/calendar', name: 'calendar', component: () => import('./pages/Calendar.vue') },
  { path: '/login', name: 'login', component: () => import('./pages/Login.vue') },
  { path: '/auth-callback', name: 'auth-callback', component: () => import('./pages/Login.vue') },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Auth-aware navigation guard
// Skip auth check for: /login, /auth-callback, and routes that don't need auth
const publicRoutes = ['login', 'auth-callback']

router.beforeEach((to) => {
  // Always allow public routes
  if (publicRoutes.includes(to.name)) return true

  // Allow navigation to any route, but the data layer will handle auth
  // For a stricter implementation, uncomment below:
  // const { isLoggedIn } = useAuth()
  // if (!isLoggedIn.value) return { name: 'login' }
  return true
})

export default router
