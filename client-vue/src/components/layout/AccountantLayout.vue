<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import StatsCard from '@/components/ui/stats-card.vue'

const auth = useAuthStore()

const stats = ref({
  totalEmployees: 0,
  pendingPayments: 0,
  totalPayroll: 0,
  pendingRecalls: 0
})

// Ces données seront récupérées depuis l'API
const fetchStats = async () => {
  // TODO: Implémenter l'appel API
  stats.value = {
    totalEmployees: 150,
    pendingPayments: 12,
    totalPayroll: 75000000,
    pendingRecalls: 8
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- En-tête avec statistiques -->
    <div class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Effectif total"
            :value="stats.totalEmployees"
            trend="up"
            :trend-value="2.5"
            icon="users"
          />
          <StatsCard
            title="Paiements en attente"
            :value="stats.pendingPayments"
            trend="down"
            :trend-value="1.5"
            icon="credit-card"
          />
          <StatsCard
            title="Masse salariale"
            :value="new Intl.NumberFormat('fr-FR').format(stats.totalPayroll)"
            suffix="FCFA"
            trend="up"
            :trend-value="3.2"
            icon="chart-bar"
          />
          <StatsCard
            title="Rappels en attente"
            :value="stats.pendingRecalls"
            trend="neutral"
            :trend-value="0"
            icon="clock"
          />
        </div>
      </div>
    </div>

    <!-- Menu de navigation -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
      <nav class="flex space-x-4">
        <router-link
          to="/accountant/dashboard"
          class="px-3 py-2 rounded-md text-sm font-medium"
          :class="[
            $route.path === '/accountant/dashboard'
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          Tableau de bord
        </router-link>
        <router-link
          to="/accountant/employees"
          class="px-3 py-2 rounded-md text-sm font-medium"
          :class="[
            $route.path === '/accountant/employees'
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          Employés
        </router-link>
        <router-link
          to="/accountant/rates"
          class="px-3 py-2 rounded-md text-sm font-medium"
          :class="[
            $route.path === '/accountant/rates'
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          Barèmes
        </router-link>
        <router-link
          to="/accountant/reports"
          class="px-3 py-2 rounded-md text-sm font-medium"
          :class="[
            $route.path === '/accountant/reports'
              ? 'bg-primary-100 text-primary-700'
              : 'text-gray-700 hover:bg-gray-100'
          ]"
        >
          Rapports
        </router-link>
      </nav>
    </div>

    <!-- Contenu principal -->
    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template> 