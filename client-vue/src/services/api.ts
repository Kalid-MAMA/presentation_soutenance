import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true // Important pour les cookies de session
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', {
      url: response.config.url,
      method: response.config.method?.toUpperCase(),
      status: response.status,
      data: response.data
    })
    return response
  },
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
      fullError: error
    })
    
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      await authStore.logout()
      window.location.href = '/login'
      return Promise.reject(new Error('Session expirée'))
      }

    // Créer une erreur avec les détails de validation si disponibles
    if (error.response?.data?.errors) {
      const validationError = new Error('Erreur de validation')
      validationError.name = 'ValidationError'
      validationError.errors = error.response.data.errors
      return Promise.reject(validationError)
      }

    // Propager l'erreur avec le message du serveur si disponible
    return Promise.reject(error.response?.data?.message 
      ? new Error(error.response.data.message)
      : error)
      }
)

// Intercepteur pour les requêtes
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', {
      url: config.url,
      method: config.method?.toUpperCase(),
      headers: config.headers,
      data: config.data,
      withCredentials: config.withCredentials
    })
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
) 