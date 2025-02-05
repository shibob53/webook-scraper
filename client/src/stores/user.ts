import axios from 'axios'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, onMounted, ref } from 'vue'

export const useUser = defineStore('user', () => {
  const jwt = ref('')
  const isLoggedIn = ref(false)
  const isLoading = ref(false)
  const isLoggingIn = computed(() => isLoading.value)

  async function login(username: string, password: string) {
    try {
      isLoading.value = true
      const res = await axios.post('http://localhost:3000/api/v1/user/login', {
        username,
        password,
      })
      localStorage.setItem('token', res.data.token)
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
    if (token) {
      jwt.value = token
      isLoggedIn.value = true
    }
  }

  return {
    jwt,
    isLoggedIn,
    isLoggingIn,
    login,
    init,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useUser, import.meta.hot))
}
