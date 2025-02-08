import axios from 'axios'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { ref } from 'vue'
import { useUser } from './user'

interface ScraperSettings {
  userId?: number
  minPrice: number
  maxPrice: number
  maxTickets: number
  useProxies: boolean
  discordWebhook: string
  recheckInterval: number
  randomMode: boolean
}

export const useScraperStore = defineStore('scraper', () => {
  const settings = ref<ScraperSettings>({
    userId: undefined,
    minPrice: 0,
    maxPrice: 0,
    maxTickets: 0,
    useProxies: false,
    discordWebhook: '',
    recheckInterval: 0,
    randomMode: false,
  })

  function saveSettings() {
    const user = useUser()

    axios
      .post(
        import.meta.env.VITE_API_BASE + '/api/v1/settings',
        {
          ...settings.value,
        },
        {
          headers: {
            Authorization: `Bearer ${user.jwt}`,
          },
        },
      )
      .catch(console.error)
  }

  function start(url: string, nbAccountsToUse: number) {
    const user = useUser()
    axios
      .post(
        import.meta.env.VITE_API_BASE + '/api/v1/crawler/hold-event',
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

  function fetchSettings() {
    const user = useUser()
    axios
      .get(import.meta.env.VITE_API_BASE + '/api/v1/settings', {
        headers: {
          Authorization: `Bearer ${user.jwt}`,
        },
      })
      .then((res) => {
        settings.value = res.data
      })
      .catch(console.error)
  }

  return { settings, start, stop, saveSettings, fetchSettings }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScraperStore, import.meta.hot))
}
