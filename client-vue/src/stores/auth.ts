import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import { api } from '@/services/api'

interface User {
  id: number
  matricule: string
  role: string
  firstName: string
  lastName: string
}

interface LoginCredentials {
  matricule: string
  password: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: useStorage('auth_user', null as User | null),
    loading: false,
    initialized: false,
    initializationPromise: null as Promise<void> | null
  }),

  getters: {
    isAuthenticated: state => !!state.user,
    userRole: state => state.user?.role,
    fullName: state => state.user ? `${state.user.firstName} ${state.user.lastName}` : ''
  },

  actions: {
    async initialize() {
      if (this.initializationPromise) {
        return this.initializationPromise
      }
      
      this.initializationPromise = new Promise(async (resolve) => {
      try {
          console.log('[Auth Store] Initializing auth store...')
        if (this.isAuthenticated) {
            console.log('[Auth Store] User is authenticated, fetching user data...')
          await this.fetchUser()
        }
      } catch (error) {
          console.error('[Auth Store] Error during initialization:', error)
        await this.logout()
      } finally {
        this.initialized = true
          console.log('[Auth Store] Initialization complete')
          resolve()
      }
      })
      
      return this.initializationPromise
    },

    async login(credentials: LoginCredentials) {
      this.loading = true
      try {
        console.log('[Auth Store] Attempting login with credentials:', { 
          matricule: credentials.matricule,
          passwordLength: credentials.password.length 
        })

        const response = await api.post('/api/auth/login', credentials)
        console.log('[Auth Store] Login response:', response.data)
        
        if (!response.data.user) {
          console.error('[Auth Store] Invalid server response - no user data')
          throw new Error('Réponse invalide du serveur')
        }
        
        const { user } = response.data
        console.log('[Auth Store] Setting user data:', user)
        this.user = user
        this.initialized = true
        this.initializationPromise = null
        return user.role
      } catch (error: any) {
        console.error('[Auth Store] Login error:', {
          error: error,
          response: error.response?.data,
          status: error.response?.status
        })
        this.user = null
        throw error.response?.data?.message || error.message || 'Erreur de connexion'
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        if (this.user) {
          console.log('[Auth Store] Logging out user:', this.user.matricule)
          await api.post('/api/auth/logout')
        }
      } catch (error) {
        console.error('[Auth Store] Logout error:', error)
      } finally {
        this.user = null
        this.initialized = false
        this.initializationPromise = null
      }
    },

    async fetchUser() {
      try {
        console.log('[Auth Store] Fetching user data...')
        const response = await api.get('/api/auth/me')
        console.log('[Auth Store] User data response:', response.data)
        
        if (!response.data.user) {
          console.error('[Auth Store] Invalid server response - no user data')
          throw new Error('Réponse invalide du serveur')
        }
        
        this.user = response.data.user
        console.log('[Auth Store] User data updated:', this.user)
      } catch (error) {
        console.error('[Auth Store] Error fetching user data:', error)
        await this.logout()
        throw error
      }
    },

    async updateProfile(profileData: Partial<User>) {
      try {
        const response = await api.put('/auth/profile', profileData)
        this.user = response.data
      } catch (error) {
        throw error
      }
    },

    async updatePassword(oldPassword: string, newPassword: string) {
      try {
        await api.put('/auth/password', {
          oldPassword,
          newPassword
        })
      } catch (error) {
        throw error
      }
    },

    async updateAvatar(file: File) {
      try {
        const formData = new FormData()
        formData.append('avatar', file)
        const response = await api.put('/auth/avatar', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        })
        this.user = response.data
      } catch (error) {
        throw error
      }
    }
  }
}) 