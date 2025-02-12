import axios from 'axios'
import { acceptHMRUpdate, defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useUser } from './user'
import { useSocket } from './socket'

interface ScraperSettings {
  userId?: number
  minPrice: number
  maxPrice: number
  maxTickets: number
  useProxies: boolean
  discordWebhook: string
  recheckInterval: number
  randomMode: boolean
  isStopped: boolean
  currentEventUrl: string
  simConnections: number
  lastUsedAccountId?: number | null
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
    isStopped: true,
    currentEventUrl: '',
    simConnections: 1,
    lastUsedAccountId: null,
  })

  const settingsComputed = computed(() => settings.value)

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

  async function start(url: string, nbAccountsToUse: number) {
    const user = useUser()
    axios
      .post(
        import.meta.env.VITE_API_BASE + '/api/v1/crawler/hold-event',
        {
          url: settings.value.currentEventUrl,
          nbAccountsToUse: settings.value.simConnections,
          resume: settings.value.lastUsedAccountId !== null,
        },
        {
          headers: {
            Authorization: `Bearer ${user.jwt}`,
          },
        },
      )
      .catch(console.error)

    settings.value.isStopped = false
    saveSettings()
  }

  function stop() {
    const { socket } = useSocket()
    settings.value.isStopped = true
    socket?.emit('scraper:stop', {
      ...settings.value,
      userId: useUser().user?.id,
    })
  }

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

  function resetSettings() {
    settings.value = {
      userId: undefined,
      minPrice: 0,
      maxPrice: 0,
      maxTickets: 0,
      useProxies: false,
      discordWebhook: '',
      recheckInterval: 0,
      randomMode: false,
      isStopped: true,
      currentEventUrl: settings.value.currentEventUrl,
      simConnections: 1,
      lastUsedAccountId: null,
    }
  }

  return { settings, settingsComputed, start, stop, saveSettings, fetchSettings, resetSettings }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScraperStore, import.meta.hot))
}
