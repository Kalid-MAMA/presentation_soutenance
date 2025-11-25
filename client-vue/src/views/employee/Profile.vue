<template>
  <div class="space-y-6">
    <!-- Tableau de bord -->
    <EmployeeDashboard :employee="employee" />

    <div v-if="loading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>

    <div v-else-if="error" class="bg-red-50 p-4 rounded-md">
      <p class="text-red-700">{{ error }}</p>
    </div>

    <div v-else>
      <!-- Informations personnelles -->
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Informations Personnelles</h3>
          <p class="mt-1 max-w-2xl text-sm text-gray-500">Détails de votre profil.</p>
        </div>
        <div class="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl class="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">Nom complet</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ employee?.lastName }} {{ employee?.firstName }}</dd>
            </div>
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">Matricule</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ employee?.matricule }}</dd>
            </div>
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">Grade</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ employee?.grade }}</dd>
            </div>
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">Service</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ employee?.service }}</dd>
            </div>
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">Date d'entrée</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ formatDate(employee?.entryDate) }}</dd>
            </div>
            <div class="sm:col-span-1">
              <dt class="text-sm font-medium text-gray-500">Département</dt>
              <dd class="mt-1 text-sm text-gray-900">{{ employee?.department }}</dd>
            </div>
          </dl>
        </div>
      </div>

      <!-- Grade actuel -->
      <div class="bg-white shadow sm:rounded-lg mt-6">
        <div class="px-4 py-5 sm:px-6">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Grade Actuel</h3>
        </div>
        <div class="border-t border-gray-200">
          <div class="px-4 py-4 sm:px-6">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900">
                {{ employee?.grade }}
              </p>
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-900 text-white">
                Actuel
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import EmployeeDashboard from '@/components/layout/EmployeeDashboard.vue'
import { useEmployeeStore } from '@/stores/employees'
import { useToast } from '@/composables/useToast'
import type { EmployeeInfo } from '@/services/employee.service'

const employeeStore = useEmployeeStore()
const toast = useToast()

const employee = ref<EmployeeInfo | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

const formatDate = (timestamp: number | null) => {
  if (!timestamp) return '-'
  return format(new Date(timestamp), 'dd/MM/yyyy', { locale: fr })
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    console.log('Chargement des données du profil...')
    
    const response = await employeeStore.fetchCurrentEmployee()
    console.log('Réponse reçue:', response)
    
    employee.value = response.employee
    
    console.log('Données employé:', employee.value)
  } catch (err) {
    console.error('Erreur lors du chargement du profil:', err)
    error.value = err instanceof Error ? err.message : 'Impossible de charger les informations du profil'
    toast.error({
      title: 'Erreur',
      message: 'Impossible de charger les informations du profil'
    })
  } finally {
    loading.value = false
  }
})
</script> 