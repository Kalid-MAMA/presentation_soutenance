import { defineStore } from 'pinia'
import { ref } from 'vue'
import { adminService, type DashboardStats } from '@/services/admin.service'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor: string
  }>
}

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    newEmployees: 0,
    totalComplaints: 0,
    resolvedComplaints: 0,
    departments: []
  })

  const chartData = ref<ChartData>({
    labels: [],
    datasets: [{
      label: 'Croissance des employés',
      data: [],
      backgroundColor: '#0ea5e9'
    }]
  })

  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDashboardData = async () => {
    loading.value = true
    error.value = null
    try {
      console.log('Store: Fetching dashboard data...')
      // Récupérer les statistiques générales
      const dashboardStats = await adminService.getDashboardStats()
      console.log('Store: Dashboard stats received:', dashboardStats)
      stats.value = dashboardStats
      
      // Récupérer les données de croissance pour l'année en cours
      console.log('Store: Fetching growth data...')
      const growthData = await adminService.getEmployeeGrowth(new Date().getFullYear())
      console.log('Store: Growth data received:', growthData)
      
      // Mettre à jour le graphique
      chartData.value = {
        labels: growthData.months.map((date: string) => 
          format(new Date(date), 'MMM', { locale: fr })
        ),
        datasets: [{
          label: 'Croissance des employés',
          data: growthData.counts,
          backgroundColor: '#0ea5e9'
        }]
      }
    } catch (err) {
      console.error('Store: Error fetching dashboard data:', err)
      error.value = err instanceof Error ? err.message : 'Erreur lors de la récupération des données'
    } finally {
      loading.value = false
    }
  }

  return {
    stats,
    chartData,
    loading,
    error,
    fetchDashboardData
  }
}) 