import { api } from './api'

export interface ReportParams {
  type: 'monthly' | 'quarterly' | 'yearly'
  startDate: string
  endDate: string
  departments?: number[]
}

export interface Report {
  id: number
  name: string
  type: ReportParams['type']
  startDate: string
  endDate: string
  departments: number[]
  status: 'generating' | 'completed' | 'failed'
  url?: string
  createdAt: string
}

export const reportService = {
  // Générer un nouveau rapport
  generateReport: async (params: ReportParams) => {
    const response = await api.post('/reports/generate', params)
    return response.data
  },

  // Récupérer la liste des rapports
  getReports: async (page: number, limit: number) => {
    const response = await api.get(`/reports?page=${page}&limit=${limit}`)
    return response.data
  },

  // Récupérer un rapport par son ID
  getReport: async (id: number) => {
    const response = await api.get(`/reports/${id}`)
    return response.data
  },

  // Télécharger un rapport
  downloadReport: async (id: number) => {
    const response = await api.get(`/reports/${id}/download`, {
      responseType: 'blob'
    })
    return response.data
  },

  // Supprimer un rapport
  deleteReport: async (id: number) => {
    const response = await api.delete(`/reports/${id}`)
    return response.data
  },

  // Récupérer les données analytiques pour les graphiques
  getAnalytics: async (type: 'costs' | 'budget', period: string) => {
    const response = await api.get(`/reports/analytics/${type}?period=${period}`)
    return response.data
  }
} 