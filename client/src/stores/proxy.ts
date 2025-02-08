// src/stores/proxies.ts
import { defineStore } from 'pinia'
import axios from 'axios'
import { useUser } from './user' // Adjust the path to your user store

// Define the shape of a Proxy object.
export interface Proxy {
  id: number
  ip: string
  port: number
  username?: string
  password?: string
  active: boolean
}

// Define the state interface.
interface ProxiesState {
  proxies: Proxy[]
  loading: boolean
  error: string | null
}

export const useProxiesStore = defineStore('proxies', {
  state: (): ProxiesState => ({
    proxies: [],
    loading: false,
    error: null,
  }),

  actions: {
    // Fetch all proxies from the API.
    async fetchProxies() {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.get(import.meta.env.VITE_API_BASE + '/api/v1/proxies', {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        })
        // Assuming the response structure is: { proxies: [...] }
        this.proxies = response.data.proxies
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error fetching proxies'
      } finally {
        this.loading = false
      }
    },

    // Add a new proxy.
    // Expects a proxy object (without the id) to be passed.
    async addProxy(proxyData: Omit<Proxy, 'id'>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/proxies',
          proxyData,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { proxy: { ... } }
        this.proxies.push(response.data.proxy)
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error adding proxy'
      } finally {
        this.loading = false
      }
    },

    // Update an existing proxy.
    async updateProxy(id: number, updatedData: Partial<Proxy>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.put(
          import.meta.env.VITE_API_BASE + `/api/v1/proxies/${id}`,
          updatedData,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { proxy: { ... } }
        const updatedProxy = response.data.proxy
        const index = this.proxies.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.proxies[index] = updatedProxy
        }
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error updating proxy'
      } finally {
        this.loading = false
      }
    },

    // Toggle the active status of a proxy.
    async toggleProxy(id: number) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.patch(
          import.meta.env.VITE_API_BASE + `/api/v1/proxies/${id}/toggle`,
          null,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { proxy: { ... } }
        const toggledProxy = response.data.proxy
        const index = this.proxies.findIndex((p) => p.id === id)
        if (index !== -1) {
          this.proxies[index] = toggledProxy
        }
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error toggling proxy'
      } finally {
        this.loading = false
      }
    },

    // Delete a proxy.
    async deleteProxy(id: number) {
      this.loading = true
      try {
        const userStore = useUser()
        await axios.delete(import.meta.env.VITE_API_BASE + `/api/v1/proxies/${id}`, {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        })
        this.proxies = this.proxies.filter((p) => p.id !== id)
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error deleting proxy'
      } finally {
        this.loading = false
      }
    },

    // Import a list of proxies.
    // Expects an array of proxy objects (without id) passed as the parameter.
    async importProxyList(proxies: Array<Omit<Proxy, 'id'>>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/proxies/import',
          { proxies },
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        // Assuming the response structure is: { proxies: [ ... ] }
        this.proxies = [...this.proxies, ...response.data.proxies]
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error importing proxy list'
      } finally {
        this.loading = false
      }
    },
  },

  getters: {
    // Example getter to filter and return only active proxies.
    activeProxies: (state): Proxy[] => state.proxies.filter((proxy) => proxy.active),
  },
})
