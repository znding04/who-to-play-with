import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'
import { useSeedData } from './composables/useSeedData'
import { useAuth } from './composables/useAuth.js'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Initialize auth session on app load
const { refreshSession } = useAuth()
refreshSession()

// Seed demo data on first-ever visit (only for non-logged-in users)
const { seedIfEmpty } = useSeedData()
seedIfEmpty()
