import axios from 'axios'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, onMounted, ref } from 'vue'

type User = {
  id: number
  username: string
  email: string
}

export const useUser = defineStore('user', () => {
  const jwt = ref('')
  const user = ref<User | null>(null)
  const isLoggedIn = ref(false)
  const isLoading = ref(false)
  const isLoggingIn = computed(() => isLoading.value)

  async function login(username: string, password: string) {
    try {
      isLoading.value = true
      const res = await axios.post(import.meta.env.VITE_API_BASE + '/api/v1/user/login', {
        username,
        password,
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      jwt.value = res.data.token

      await new Promise<void>((resolve) =>
        setTimeout(() => {
          isLoggedIn.value = true
          isLoading.value = false
          resolve()
        }, 1000),
      )
    } catch (err) {
      console.error(err)
      isLoading.value = false
    }
  }

  async function init() {
    const token = localStorage.getItem('token')
    const userObj = localStorage.getItem('user')
    if (token && userObj) {
      jwt.value = token
      user.value = JSON.parse(userObj)
      isLoggedIn.value = true
    }
  }

  return {
    jwt: computed(() => jwt.value),
    user: computed(() => user.value),
    isLoggedIn,
    isLoggingIn,
    login,
    init,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot))
}
