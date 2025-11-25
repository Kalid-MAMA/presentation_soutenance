<script setup lang="ts">
import { onMounted } from 'vue'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'vue-chartjs'
import { storeToRefs } from 'pinia'
import { useDashboardStore } from '@/stores/dashboard'
import StatsCard from '@/components/ui/stats-card.vue'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const dashboardStore = useDashboardStore()
const { stats, chartData, loading } = storeToRefs(dashboardStore)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: true,
      text: `Croissance des employés ${new Date().getFullYear()}`
    }
  }
}

onMounted(() => {
  dashboardStore.fetchDashboardData()
})
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold text-gray-900">Tableau de bord</h1>
      <button 
        @click="dashboardStore.fetchDashboardData" 
        class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        :disabled="loading"
      >
        <template v-if="loading">
          Chargement...
        </template>
        <template v-else>
        Actualiser
        </template>
      </button>
    </div>
    
    <!-- Stats Cards -->
    <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        title="Total des employés"
        :value="stats.totalEmployees"
        description="Tous les employés enregistrés"
        trend="up"
      />
      <StatsCard
        title="Employés actifs"
        :value="stats.activeEmployees"
        :description="`${((stats.activeEmployees / stats.totalEmployees) * 100).toFixed(1)}% du total`"
        trend="up"
      />
      <StatsCard
        title="Nouveaux employés"
        :value="stats.newEmployees"
        description="Ce mois-ci"
        trend="up"
      />
      <StatsCard
        title="Total réclamations"
        :value="stats.totalComplaints"
        description="Toutes les réclamations"
        trend="neutral"
      />
      <StatsCard
        title="Réclamations résolues"
        :value="stats.resolvedComplaints"
        :description="`${((stats.resolvedComplaints / stats.totalComplaints) * 100).toFixed(1)}% du total`"
        trend="up"
      />
      <StatsCard
        title="Réclamations en attente"
        :value="stats.totalComplaints - stats.resolvedComplaints"
        description="À traiter"
        trend="down"
      />
    </div>

    <!-- Chart -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="text-lg font-medium text-gray-900">Croissance des employés</h2>
      <div class="mt-4 h-96">
        <Bar :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Départements -->
    <div class="rounded-lg bg-white p-6 shadow">
      <h2 class="text-lg font-medium text-gray-900">Répartition par département</h2>
      <div class="mt-4">
        <div class="flow-root">
          <ul role="list" class="divide-y divide-gray-200">
            <li v-for="(dept, index) in stats.departments" :key="index" class="py-4">
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 truncate">{{ dept.name }}</p>
                  <p class="text-sm text-gray-500">{{ ((dept.count / stats.totalEmployees) * 100).toFixed(1) }}% des employés</p>
                </div>
                <div class="flex items-center">
                  <span class="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
                    {{ dept.count }} employés
                  </span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template> 