<template>
  <div class="bg-white shadow">
    <div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Matricule et date d'entrée -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-sm font-medium text-gray-500">Matricule</div>
          <div class="mt-1 text-lg font-semibold text-gray-900">{{ employee?.matricule }}</div>
          <div class="mt-1 text-sm text-gray-500">
            Entrée le {{ formatDate(employee?.entryDate) }}
          </div>
        </div>

        <!-- Grade et indice -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="text-sm font-medium text-gray-500">Grade</div>
          <div class="mt-1 text-lg font-semibold text-gray-900">{{ employee?.grade }}</div>
          <div class="mt-1 text-sm text-gray-500">
            Indice {{ employee?.gradeIndex }}
          </div>
        </div>

        <!-- Total des rappels -->
        <div class="bg-green-50 rounded-lg p-4">
          <div class="text-sm font-medium text-green-600">Total Rappels</div>
          <div class="mt-1 text-lg font-semibold text-green-700">
            {{ formatCurrency(employee?.totalDue) }}
          </div>
          <div class="mt-1 text-sm text-green-600">
            Mis à jour le {{ formatDate(employee?.lastUpdate) }}
          </div>
        </div>

        <!-- Statut -->
        <div class="bg-blue-50 rounded-lg p-4">
          <div class="text-sm font-medium text-blue-600">Statut</div>
          <div class="mt-1">
            <span 
              class="inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium"
              :class="employee?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
            >
              {{ employee?.isActive ? 'Actif' : 'Inactif' }}
            </span>
          </div>
          <div class="mt-1 text-sm text-blue-600">
            Service: {{ employee?.service }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import type { EmployeeInfo } from '@/services/employee.service'

interface Props {
  employee: EmployeeInfo | null
}

const props = defineProps<Props>()

const formatDate = (timestamp: number | undefined) => {
  if (!timestamp) return '-'
  return format(new Date(timestamp), 'dd/MM/yyyy', { locale: fr })
}

const formatCurrency = (amount: number | undefined) => {
  if (amount === undefined) return '-'
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF'
  }).format(amount)
}
</script> 