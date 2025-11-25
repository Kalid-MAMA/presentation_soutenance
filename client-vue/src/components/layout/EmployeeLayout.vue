<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { employeeService } from '@/services/employee.service'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const auth = useAuthStore()

const employeeInfo = ref({
  matricule: '',
  entryDate: null as Date | null,
  grade: '',
  gradeIndex: 0,
  totalRecalls: 0,
  lastUpdate: null as Date | null
})

const fetchEmployeeInfo = async () => {
  try {
    const data = await employeeService.getEmployeeInfo()
    employeeInfo.value = {
      ...data,
      entryDate: new Date(data.entryDate),
      lastUpdate: data.lastUpdate ? new Date(data.lastUpdate) : null
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des informations:', error)
  }
}

onMounted(() => {
  fetchEmployeeInfo()
})
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Bandeau récapitulatif -->
    <div class="bg-white shadow">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Matricule et date d'entrée -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-500">Matricule</div>
            <div class="mt-1 text-lg font-semibold text-gray-900">{{ employeeInfo.matricule }}</div>
            <div class="mt-1 text-sm text-gray-500">
              Entrée le {{ employeeInfo.entryDate ? format(employeeInfo.entryDate, 'dd MMMM yyyy', { locale: fr }) : '-' }}
            </div>
          </div>

          <!-- Grade et indice -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-500">Grade actuel</div>
            <div class="mt-1 text-lg font-semibold text-gray-900">{{ employeeInfo.grade }}</div>
            <div class="mt-1 text-sm text-gray-500">
              Indice {{ employeeInfo.gradeIndex }}
            </div>
          </div>

          <!-- Total des rappels -->
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm font-medium text-gray-500">Total des rappels dus</div>
            <div class="mt-1 text-lg font-semibold text-green-600">
              {{ new Intl.NumberFormat('fr-FR').format(employeeInfo.totalRecalls) }} FCFA
            </div>
            <div class="mt-1 text-sm text-gray-500">
              Mis à jour le {{ employeeInfo.lastUpdate ? format(employeeInfo.lastUpdate, 'dd/MM/yyyy', { locale: fr }) : '-' }}
            </div>
          </div>

          <!-- Menu -->
          <div class="bg-gray-50 rounded-lg p-4">
            <nav class="space-y-2">
              <router-link
                to="/employee/profile"
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md"
                :class="[$route.path === '/employee/profile' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100']"
              >
                Mon Profil
              </router-link>
              <router-link
                to="/employee/salaries"
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md"
                :class="[$route.path === '/employee/salaries' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100']"
              >
                Mes Soldes
              </router-link>
              <router-link
                to="/employee/complaints"
                class="flex items-center px-3 py-2 text-sm font-medium rounded-md"
                :class="[$route.path === '/employee/complaints' ? 'bg-primary-100 text-primary-700' : 'text-gray-700 hover:bg-gray-100']"
              >
                Réclamations
              </router-link>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <main class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <RouterView />
    </main>
  </div>
</template> 