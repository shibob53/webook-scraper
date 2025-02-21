import axios from 'axios'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUser } from './user'

export const useOwnedStore = defineStore('owned', () => {
  const tickets = ref([])
  const list = computed(() => tickets.value)

  const fetch = async () => {
    const { data } = await axios.get(import.meta.env.VITE_API_BASE + '/api/v1/owned/list', {
      headers: { Authorization: `Bearer ${useUser().jwt}` },
    })
    tickets.value = data
  }

  return {
    tickets: list,
    fetch,
  }
})
