import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '@/services/api'

interface User {
  id: number
  matricule: string
  role: string
  firstName: string
  lastName: string
}

interface UserFilters {
  page: number
  limit: number
  search?: string
  sortBy?: string
  sortDesc?: boolean
}

interface CreateUserData {
  matricule: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  grade: string
  function: string
  service: string
  password?: string
}

interface UpdateUserData {
  role: string
}

export const useUserStore = defineStore('users', () => {
  const users = ref<User[]>([])
  const total = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (filters: UserFilters) => {
    loading.value = true
    error.value = null
    try {
      console.log('Store: Fetching users with filters:', filters)
      const response = await api.get('/api/users', {
        params: {
          page: filters.page,
          limit: filters.limit,
          search: filters.search,
          sortBy: filters.sortBy,
          sortDesc: filters.sortDesc
        }
      })
      console.log('Store: Users response:', response.data)
      
      if (!response.data || !Array.isArray(response.data.items)) {
        throw new Error('Invalid response format')
      }
      
      users.value = response.data.items
      total.value = response.data.total
    } catch (err) {
      console.error('Store: Error fetching users:', err)
      error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des utilisateurs'
      users.value = []
      total.value = 0
      throw err
    } finally {
      loading.value = false
    }
  }

  const createUser = async (data: CreateUserData) => {
    try {
      // Générer un mot de passe plus complexe
      const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
      const lowercase = 'abcdefghijkmnopqrstuvwxyz';
      const numbers = '23456789';
      const symbols = '!@#$%^&*';
      
      // Garantir au moins un caractère de chaque type
      let password = 
        uppercase.charAt(Math.floor(Math.random() * uppercase.length)) +
        lowercase.charAt(Math.floor(Math.random() * lowercase.length)) +
        numbers.charAt(Math.floor(Math.random() * numbers.length)) +
        symbols.charAt(Math.floor(Math.random() * symbols.length));
      
      // Ajouter des caractères supplémentaires pour atteindre 12 caractères
      const allChars = uppercase + lowercase + numbers + symbols;
      for (let i = 0; i < 8; i++) {
        password += allChars.charAt(Math.floor(Math.random() * allChars.length));
      }
      
      // Mélanger le mot de passe
      password = password.split('').sort(() => 0.5 - Math.random()).join('');
      
      console.log('Generated password before API call:', password); // Log pour debug
      
      // Envoyer les données avec le mot de passe
      const response = await api.post('/api/users', {
        ...data,
        password
      });
      
      console.log('API raw response:', response); // Log de la réponse complète
      console.log('API response data:', response.data); // Log des données de la réponse
      
      // S'assurer que le mot de passe est inclus dans la réponse
      if (!response.data.password) {
        console.log('Password not found in response, adding it manually');
        response.data.password = password;
      }
      
      console.log('Final response with password:', response.data); // Log pour debug
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      throw error;
    }
  }

  const updateUser = async (id: number, data: UpdateUserData) => {
    try {
      const response = await api.put(`/api/users/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  const deleteUser = async (id: number) => {
    try {
      await api.delete(`/api/users/${id}`)
    } catch (error) {
      console.error('Error deleting user:', error)
      throw error
    }
  }

  const resetPassword = async (id: number) => {
    try {
      const response = await api.post(`/api/users/${id}/reset-password`)
      return response.data
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  return {
    users,
    total,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword
  }
}) 