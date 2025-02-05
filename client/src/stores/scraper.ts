import axios from 'axios'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { useUser } from './user'

interface ScraperSettings {
  started: boolean
  attribute: string
  delay: number
  limit: number
  minPrice: number
  maxPrice: number
  nbAccountsToUse: number
  currentEvents: number[]
}

export const useScraperStore = defineStore('scraper', () => {
  const settings = ref<ScraperSettings>({
    started: false,
    attribute: '',
    delay: 0,
    limit: 0,
    minPrice: 0,
    maxPrice: 999,
    nbAccountsToUse: 1,
    currentEvents: [],
  })

  function start(url: string, nbAccountsToUse: number) {
    const user = useUser()
    axios
      .post(
        'http://localhost:3000/api/v1/crawler/hold-event',
        {
          url,
          nbAccountsToUse,
        },
        {
          headers: {
            Authorization: `Bearer ${user.jwt}`,
          },
        },
      )
      .catch(console.error)
  }

  function stop() {}

  return { settings, start, stop }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScraperStore, import.meta.hot))
}
