<template>
  <div>
    <h1 class="text-2xl font-semibold text-gray-900">Tableau de bord</h1>

    <div v-if="isLoading" class="mt-6 flex justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
    </div>

    <div v-else-if="error" class="mt-6">
      <ErrorFallback
        title="Erreur de chargement"
        message="Impossible de charger les données du tableau de bord. Veuillez réessayer."
        @retry="fetchDashboardData"
      />
    </div>

    <div v-else-if="stats" class="mt-6 space-y-8">
      <!-- Cartes de statistiques -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total des dossiers créés"
          :value="stats.totalFiles"
          trend="up"
          :trend-value="2.5"
          icon="document"
        />
        <StatsCard
          title="Total liquidé"
          :value="new Intl.NumberFormat('fr-FR').format(stats.totalPaid)"
          suffix="FCFA"
          trend="up"
          :trend-value="3.2"
          icon="banknotes"
        />
        <StatsCard
          title="Total rappels dus"
          :value="new Intl.NumberFormat('fr-FR').format(stats.totalRecallsDue)"
          suffix="FCFA"
          trend="down"
          :trend-value="1.5"
          icon="currency-dollar"
        />
        <StatsCard
          title="Nombre d'employés traités"
          :value="stats.totalEmployeesProcessed"
          trend="up"
          :trend-value="4.2"
          icon="user-group"
        />
      </div>

      <!-- Graphiques -->
      <div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <!-- Graphique des rappels dus par mois -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Rappels dus par mois
          </h3>
          <div style="height: 300px;">
            <BarChart
              :chart-data="recallsByMonthChart"
              :options="{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => 
                        new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
                    }
                  }
                }
              }"
            />
          </div>
        </div>

        <!-- Évolution de la masse salariale -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">
            Évolution de la masse salariale
          </h3>
          <div style="height: 300px;">
            <LineChart
              :chart-data="payrollChart"
              :options="{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => 
                        new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
                    }
                  }
                }
              }"
            />
          </div>
        </div>
      </div>

      <!-- Liste des 5 derniers dossiers saisis -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">
            Derniers dossiers saisis
          </h3>
        </div>
        <div class="border-t border-gray-200">
          <ul role="list" class="divide-y divide-gray-200">
            <li v-for="(file, index) in recentFiles" :key="index" class="px-4 py-4 sm:px-6">
              <div class="flex items-center justify-between">
                <p class="text-sm font-medium text-primary-600 truncate">
                  {{ file.employeeName }} ({{ file.matricule }})
                </p>
                <div class="ml-2 flex-shrink-0 flex">
                  <p :class="getStatusClass(file.status)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                    {{ getStatusText(file.status) }}
                  </p>
                </div>
              </div>
              <div class="mt-2 sm:flex sm:justify-between">
                <div class="sm:flex">
                  <p class="flex items-center text-sm text-gray-500">
                    Période: {{ file.period }}
                  </p>
                  <p class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                    Rappel dû: {{ new Intl.NumberFormat('fr-FR').format(file.recallAmount) }} FCFA
                  </p>
                </div>
                <div class="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                  <p>
                    {{ formatFileDate(file.createdAt) }}
                  </p>
                </div>
              </div>
            </li>
            <li v-if="recentFiles.length === 0" class="px-4 py-5 text-center text-sm text-gray-500">
              Aucun dossier récent
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { accountantService, type AccountantStats } from '@/services/accountant.service'
import { useToast } from '@/composables/useToast'
import BarChart from '@/components/charts/BarChart.vue'
import LineChart from '@/components/charts/LineChart.vue'
import StatsCard from '@/components/ui/stats-card.vue'
import ErrorFallback from '@/components/ui/error-fallback.vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const { showToast } = useToast()
const isLoading = ref(true)
const loading = ref(true)
const stats = ref<AccountantStats | null>(null)
const dashboardStats = ref<any>(null)
const recentFiles = ref([])
const error = ref(false)
const isMounted = ref(true)

// Données pour les graphiques
const recallsByMonthChart = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Rappels dus',
      data: [] as number[],
      backgroundColor: '#60A5FA'
    }
  ]
})

const payrollChart = ref({
  labels: [] as string[],
  datasets: [
    {
      label: 'Masse salariale',
      data: [] as number[],
      borderColor: '#2563EB',
      tension: 0.4
    }
  ]
})

const chartData = ref({
  files: {
    labels: [] as string[],
    datasets: [{
      label: 'Nombre de dossiers',
      data: [] as number[],
      backgroundColor: '#4F46E5',
      borderColor: '#4338CA',
      borderWidth: 1
    }]
  },
  payments: {
    labels: [] as string[],
    datasets: [{
      label: 'Montant des paiements',
      data: [] as number[],
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      tension: 0.4
    }]
  }
})

// Récupération des données du tableau de bord
const fetchDashboardData = async () => {
  try {
    isLoading.value = true
    loading.value = true
    
    // Récupérer les statistiques
    const statsData = await accountantService.getStats()
    stats.value = statsData
    dashboardStats.value = statsData
    
    // Récupérer les fichiers récents
    const files = await accountantService.getRecentFiles(5)
    recentFiles.value = files
    
    // Préparer les données pour les graphiques
    chartData.value = {
      files: {
        labels: statsData.filesByMonth.map(item => item.month),
        datasets: [{
          label: 'Nombre de dossiers',
          data: statsData.filesByMonth.map(item => item.count),
          backgroundColor: '#4F46E5',
          borderColor: '#4338CA',
          borderWidth: 1
        }]
      },
      payments: {
        labels: statsData.paymentsByMonth.map(item => item.month),
        datasets: [{
          label: 'Montant des paiements',
          data: statsData.paymentsByMonth.map(item => item.amount),
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.2)',
          tension: 0.4
        }]
      }
    }
    
    // Mettre à jour les graphiques pour la compatibilité avec le template
    recallsByMonthChart.value.labels = statsData.recallsByMonth.map(item => item.month)
    recallsByMonthChart.value.datasets[0].data = statsData.recallsByMonth.map(item => item.amount)
    
    payrollChart.value.labels = statsData.paymentsByMonth.map(item => item.month)
    payrollChart.value.datasets[0].data = statsData.paymentsByMonth.map(item => item.amount)
    
    isLoading.value = false
    loading.value = false
    console.log('Stats récupérées:', dashboardStats.value)
    console.log('Fichiers récents:', recentFiles.value)
  } catch (error) {
    console.error('Erreur lors du chargement des données du tableau de bord:', error)
    isLoading.value = false
    loading.value = false
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger les données du tableau de bord',
      type: 'error'
    })
  }
}

const getStatusClass = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'partially_paid':
      return 'bg-yellow-100 text-yellow-800'
    case 'unpaid':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'paid':
      return 'Payé'
    case 'partially_paid':
      return 'Partiellement payé'
    case 'unpaid':
      return 'Non payé'
    default:
      return status
  }
}

// Formater les dates pour l'affichage
const formatFileDate = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return "Aujourd'hui"
    } else if (diffDays === 1) {
      return "Hier"
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`
    } else {
      return format(date, 'dd/MM/yyyy', { locale: fr })
    }
  } catch (error) {
    return dateString
  }
}

onMounted(() => {
  isMounted.value = true
  fetchDashboardData()
})

onBeforeUnmount(() => {
  isMounted.value = false
})
</script> 

<style scoped>

</style>