import { api } from './api'

export interface DepartmentRate {
  id: number
  departmentId: number
  hourlyRate: number
  effectiveDate: string
}

export interface BonusRate {
  id: number
  type: 'seniority' | 'performance'
  percentage: number
  effectiveDate: string
}

export const rateService = {
  // Récupérer les taux par département
  getDepartmentRates: async () => {
    const response = await api.get('/rates/departments')
    return response.data
  },

  // Mettre à jour les taux d'un département
  updateDepartmentRate: async (departmentId: number, rate: Partial<DepartmentRate>) => {
    const response = await api.put(`/rates/departments/${departmentId}`, rate)
    return response.data
  },

  // Récupérer les taux de primes
  getBonusRates: async () => {
    const response = await api.get('/rates/bonuses')
    return response.data
  },

  // Mettre à jour un taux de prime
  updateBonusRate: async (type: string, rate: Partial<BonusRate>) => {
    const response = await api.put(`/rates/bonuses/${type}`, rate)
    return response.data
  },

  // Récupérer l'historique des modifications de taux
  getRateHistory: async (page: number, limit: number) => {
    const response = await api.get(`/rates/history?page=${page}&limit=${limit}`)
    return response.data
  }
} 