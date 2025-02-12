import { defineStore } from 'pinia'
import axios from 'axios'
import { useUser } from './user' // Adjust the path to your user store

export interface WebookAccount {
  id: number
  email: string
  password: string
  jwt?: string
  jwtExpiresIn?: number
  cookiesJson?: string
  disabled: boolean
  apiToken: string
}

interface WebookAccountState {
  accounts: WebookAccount[]
  loading: boolean
  error: string | null
}

export const useWebookAccountStore = defineStore('webookAccount', {
  state: (): WebookAccountState => ({
    accounts: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAccounts() {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.get(
          import.meta.env.VITE_API_BASE + '/api/v1/webook-accounts',
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        this.accounts = response.data.accounts
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error fetching accounts'
      } finally {
        this.loading = false
      }
    },

    async addAccount(accountData: Omit<WebookAccount, 'id'>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/webook-accounts',
          accountData,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        this.accounts.push(response.data.account)
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error adding account'
      } finally {
        this.loading = false
      }
    },

    async updateAccount(id: number, updatedData: Partial<WebookAccount>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.put(
          import.meta.env.VITE_API_BASE + `/api/v1/webook-accounts/${id}`,
          updatedData,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        const updatedAccount = response.data.account
        const index = this.accounts.findIndex((a) => a.id === id)
        if (index !== -1) {
          this.accounts[index] = updatedAccount
        }
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error updating account'
      } finally {
        this.loading = false
      }
    },

    async toggleAccount(id: number) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.patch(
          import.meta.env.VITE_API_BASE + `/api/v1/webook-accounts/${id}/toggle`,
          null,
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        const toggledAccount = response.data.account
        const index = this.accounts.findIndex((a) => a.id === id)
        if (index !== -1) {
          this.accounts[index] = toggledAccount
        }
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error toggling account'
      } finally {
        this.loading = false
      }
    },

    async deleteAccount(id: number) {
      this.loading = true
      try {
        const userStore = useUser()
        await axios.delete(import.meta.env.VITE_API_BASE + `/api/v1/webook-accounts/${id}`, {
          headers: { Authorization: `Bearer ${userStore.jwt}` },
        })
        this.accounts = this.accounts.filter((a) => a.id !== id)
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error deleting account'
      } finally {
        this.loading = false
      }
    },

    async importAccounts(accounts: Array<Omit<WebookAccount, 'id'>>) {
      this.loading = true
      try {
        const userStore = useUser()
        const response = await axios.post(
          import.meta.env.VITE_API_BASE + '/api/v1/webook-accounts/import',
          { accounts },
          { headers: { Authorization: `Bearer ${userStore.jwt}` } },
        )
        this.accounts = [...this.accounts, ...response.data.accounts]
        this.error = null
      } catch (error: any) {
        this.error = error.response?.data?.message || error.message || 'Error importing accounts'
      } finally {
        this.loading = false
      }
    },

    async clear() {
      const userStore = useUser()
      this.accounts = []
      const response = await axios.post(
        import.meta.env.VITE_API_BASE + '/api/v1/webook-accounts/clear',
        {},
        { headers: { Authorization: `Bearer ${userStore.jwt}` } },
      )
    },
  },
  getters: {
    activeAccounts: (state): WebookAccount[] =>
      state.accounts.filter((account) => !account.disabled),
  },
})
