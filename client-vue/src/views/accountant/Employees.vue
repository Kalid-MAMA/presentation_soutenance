<template>
  <div class="p-6">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Employés & Dossiers de Solde</h1>
      <div class="flex gap-2">
        <button @click="exportToExcel" class="btn btn-secondary flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exporter Excel
        </button>
        <button @click="exportToPDF" class="btn btn-secondary flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Exporter PDF
        </button>
      </div>
    </div>

    <!-- Tableau des employés -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <div class="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <div class="flex items-center gap-4">
          <div class="relative">
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Rechercher un employé..." 
              class="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
            />
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select 
            v-model="departmentFilter" 
            class="border border-gray-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Tous les services</option>
            <option value="Informatique">Informatique</option>
            <option value="Marketing">Marketing</option>
            <option value="Finance">Finance</option>
            <option value="Ressources Humaines">Ressources Humaines</option>
            <option value="Commercial">Commercial</option>
          </select>
        </div>
      </div>
      
      <data-table
        :columns="columns"
        :data="employees"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
      >
        <template #actions="{ row }">
          <div class="flex gap-2">
            <button @click="openCreateFileModal(row)" class="btn btn-sm btn-primary flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Créer Dossier
            </button>
            <button @click="viewEmployeeDetails(row)" class="btn btn-sm btn-secondary flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Détails
            </button>
          </div>
        </template>
      </data-table>
    </div>

    <!-- Modal de création de dossier -->
    <modal v-model="showCreateFileModal" title="Créer un dossier de solde">
      <form @submit.prevent="submitFileForm" class="space-y-4">
        <div v-if="selectedEmployee" class="mb-4 p-3 bg-gray-50 rounded-md">
          <p class="font-medium">{{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}</p>
          <p class="text-sm text-gray-600">Matricule: {{ selectedEmployee.matricule }}</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Période concernée</label>
            <input type="month" v-model="fileForm.period" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Salaire de base</label>
            <input type="number" v-model="fileForm.baseSalary" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Indemnité</label>
            <input type="number" v-model="fileForm.allowance" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Montant liquidé</label>
            <input type="number" v-model="fileForm.liquidatedAmount" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observations</label>
          <textarea v-model="fileForm.observations" class="form-input" rows="3"></textarea>
        </div>

        <div class="bg-gray-50 p-4 rounded-md">
          <h4 class="font-medium mb-2">Montants calculés automatiquement</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">CNSS ({{ fileForm.cnssRate }}%)</p>
              <p class="font-medium">{{ formatCurrency(calculatedCNSS) }} FCFA</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">IPTS ({{ fileForm.iptsRate }}%)</p>
              <p class="font-medium">{{ formatCurrency(calculatedIPTS) }} FCFA</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Salaire net</p>
              <p class="font-medium">{{ formatCurrency(calculatedNetSalary) }} FCFA</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Rappel dû</p>
              <p class="font-medium">{{ formatCurrency(calculatedRecall) }} FCFA</p>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Statut du dossier</label>
          <select v-model="fileForm.status" class="form-input">
            <option value="paid">Payé</option>
            <option value="partially_paid">Partiellement payé</option>
            <option value="unpaid">Non payé</option>
          </select>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" @click="showCreateFileModal = false" class="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </modal>

    <!-- Modal de détails d'employé -->
    <modal v-model="showEmployeeDetails" title="Détails de l'employé" size="2xl">
      <div v-if="selectedEmployee" class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Informations personnelles -->
        <div class="md:col-span-1 bg-gray-50 p-4 rounded-md">
          <h3 class="text-lg font-semibold mb-4">Informations personnelles</h3>
          <div class="space-y-3">
            <div>
              <p class="text-sm text-gray-500">Nom complet</p>
              <p class="font-medium">{{ selectedEmployee.firstName }} {{ selectedEmployee.lastName }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Matricule</p>
              <p class="font-medium">{{ selectedEmployee.matricule }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Grade</p>
              <p class="font-medium">{{ selectedEmployee.grade }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Indice</p>
              <p class="font-medium">{{ selectedEmployee.index }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Service</p>
              <p class="font-medium">{{ selectedEmployee.department }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date d'entrée</p>
              <p class="font-medium">{{ formatDate(selectedEmployee.startDate) }}</p>
            </div>
          </div>
        </div>

        <!-- Historique des dossiers -->
        <div class="md:col-span-2">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Historique des dossiers</h3>
            <div class="flex items-center gap-2">
              <select v-model="filesFilter.period" class="form-input-sm">
                <option value="">Toutes les périodes</option>
                <option v-for="period in availablePeriods" :key="period" :value="period">
                  {{ period }}
                </option>
              </select>
              <select v-model="filesFilter.status" class="form-input-sm">
                <option value="">Tous les statuts</option>
                <option value="paid">Payé</option>
                <option value="partially_paid">Partiellement payé</option>
                <option value="unpaid">Non payé</option>
              </select>
            </div>
          </div>

          <div class="bg-primary-50 p-4 rounded-md mb-4">
            <p class="font-medium">Total Rappel Non Réglé: 
              <span class="text-lg font-bold">{{ formatCurrency(totalUnpaidRecalls) }} FCFA</span>
            </p>
          </div>

          <div class="overflow-x-auto border border-gray-200 rounded-md">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Période
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Salaire
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Net
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rappel
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="file in filteredFiles" :key="file.id">
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ file.period }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ formatCurrency(file.baseSalary) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ formatCurrency(file.netSalary) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ formatCurrency(file.recallAmount) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <span :class="getStatusClass(file.status)" class="px-2 py-1 text-xs rounded-full">
                      {{ getStatusText(file.status) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ formatDate(file.createdAt) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <div class="flex space-x-2">
                      <button 
                        @click="handleEditFile(file)"
                        class="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded-md text-xs"
                      >
                        Modifier
                      </button>
                      <button 
                        @click="handleDeleteFileClick(file)"
                        class="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 px-2 py-1 rounded-md text-xs"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="filteredFiles.length === 0">
                  <td colspan="7" class="px-4 py-3 text-center text-sm text-gray-500">
                    Aucun dossier trouvé
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </modal>

    <!-- Modal de modification de dossier -->
    <modal v-model="showEditFileModal" title="Modifier un dossier" size="lg">
      <form @submit.prevent="submitEditForm" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-group">
            <label class="form-label">Période</label>
            <input type="month" v-model="fileForm.period" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Salaire de base</label>
            <input type="number" v-model="fileForm.baseSalary" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Indemnités</label>
            <input type="number" v-model="fileForm.allowance" class="form-input" required />
          </div>
          
          <div class="form-group">
            <label class="form-label">Montant liquidé</label>
            <input type="number" v-model="fileForm.liquidatedAmount" class="form-input" required />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Observations</label>
          <textarea v-model="fileForm.observations" class="form-input" rows="3"></textarea>
        </div>

        <div class="bg-gray-50 p-4 rounded-md">
          <h4 class="font-medium mb-2">Montants calculés automatiquement</h4>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">CNSS ({{ fileForm.cnssRate }}%)</p>
              <p class="font-medium">{{ formatCurrency(calculatedCNSS) }} FCFA</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">IPTS ({{ fileForm.iptsRate }}%)</p>
              <p class="font-medium">{{ formatCurrency(calculatedIPTS) }} FCFA</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Salaire net</p>
              <p class="font-medium">{{ formatCurrency(calculatedNetSalary) }} FCFA</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Rappel dû</p>
              <p class="font-medium">{{ formatCurrency(calculatedRecall) }} FCFA</p>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Statut du dossier</label>
          <select v-model="fileForm.status" class="form-input">
            <option value="paid">Payé</option>
            <option value="partially_paid">Partiellement payé</option>
            <option value="unpaid">Non payé</option>
          </select>
        </div>

        <div class="flex justify-end gap-2">
          <button type="button" @click="showEditFileModal = false" class="btn btn-secondary">
            Annuler
          </button>
          <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
            {{ isSubmitting ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
        </div>
      </form>
    </modal>

    <!-- Confirmation de suppression -->
    <confirm-dialog
      v-model="showDeleteConfirm"
      title="Supprimer le dossier"
      message="Êtes-vous sûr de vouloir supprimer ce dossier ? Cette action est irréversible."
      confirm-text="Supprimer"
      cancel-text="Annuler"
      type="danger"
      @confirm="confirmDeleteFile"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import DataTable from '@/components/ui/data-table.vue'
import Modal from '@/components/ui/modal.vue'
import ConfirmDialog from '@/components/ui/confirm-dialog.vue'
import { exportToExcel } from '@/utils/excel-export'
import { exportToPDF } from '@/utils/pdf-export'
import { accountantService } from '@/services/accountant.service'
import { useToast } from '@/composables/useToast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { employeeService } from '@/services/employee.service'

const { showToast } = useToast()
const loading = ref(true)
const isSubmitting = ref(false)
const employees = ref([])
const selectedEmployee = ref(null)
const employeeFiles = ref([])
const searchQuery = ref('')
const departmentFilter = ref('')

// Modals
const showCreateFileModal = ref(false)
const showEmployeeDetails = ref(false)
const showEditFileModal = ref(false)
const showDeleteConfirm = ref(false)
const fileToEdit = ref(null)
const fileToDelete = ref(null)

// Pagination
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
})

// Filtres
const filesFilter = ref({
  period: '',
  status: ''
})

// Form
const fileForm = ref({
  period: '',
  baseSalary: 0,
  allowance: 0,
  liquidatedAmount: 0,
  observations: '',
  cnssRate: 0,
  iptsRate: 0,
  status: 'unpaid'
})

// Colonnes du tableau
const columns = ref([
  { key: 'matricule', label: 'Matricule' },
  { key: 'fullName', label: 'Nom complet' },
  { key: 'department', label: 'Service' },
  { key: 'grade', label: 'Grade' },
  { key: 'index', label: 'Indice' },
  { key: 'currentSalary', label: 'Salaire actuel', formatter: (value) => formatCurrency(value) },
  { key: 'totalRecalls', label: 'Rappels dus', formatter: (value) => formatCurrency(value) },
  { key: 'actions', label: 'Actions' }
])

// Calculs automatiques
const calculatedCNSS = computed(() => {
  return (fileForm.value.baseSalary * fileForm.value.cnssRate) / 100
})

const calculatedIPTS = computed(() => {
  return (fileForm.value.baseSalary * fileForm.value.iptsRate) / 100
})

const calculatedNetSalary = computed(() => {
  return fileForm.value.baseSalary - calculatedCNSS.value - calculatedIPTS.value + fileForm.value.allowance
})

const calculatedRecall = computed(() => {
  return calculatedNetSalary.value - fileForm.value.liquidatedAmount
})

// Filtrage des dossiers
const filteredFiles = computed(() => {
  let files = [...employeeFiles.value]
  
  if (filesFilter.value.period) {
    files = files.filter(file => file.period === filesFilter.value.period)
  }
  
  if (filesFilter.value.status) {
    files = files.filter(file => file.status === filesFilter.value.status)
  }
  
  return files
})

// Périodes disponibles pour le filtre
const availablePeriods = computed(() => {
  const periods = new Set()
  employeeFiles.value.forEach(file => periods.add(file.period))
  return Array.from(periods)
})

// Total des rappels non réglés
const totalUnpaidRecalls = computed(() => {
  return employeeFiles.value
    .filter(file => file.status === 'unpaid' || file.status === 'partially_paid')
    .reduce((total, file) => total + file.recallAmount, 0)
})

// Fonctions
const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchEmployees()
}

const fetchEmployees = async () => {
  try {
    loading.value = true
    
    // Appel au service avec les paramètres de recherche et filtres
    const response = await accountantService.getEmployees({
      search: searchQuery.value,
      department: departmentFilter.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    })
    
    employees.value = response.data
    pagination.value.total = response.total
  } catch (error) {
    console.error('Erreur lors du chargement des employés:', error)
    loading.value = false
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger la liste des employés',
      type: 'error'
    })
  } finally {
    loading.value = false
  }
}

const openCreateFileModal = (employee) => {
  selectedEmployee.value = employee
  
  // Récupérer les taux CNSS et IPTS en fonction du grade de l'employé
  accountantService.getRates()
    .then(rates => {
      const cnssRate = rates.cnss.find(r => r.grade === employee.grade)?.rate || 3.6
      const iptsRate = rates.ipts.find(r => r.grade === employee.grade)?.rate || 12.0
      
      fileForm.value.cnssRate = cnssRate
      fileForm.value.iptsRate = iptsRate
    })
    .catch(() => {
      fileForm.value.cnssRate = 3.6 // Taux par défaut
      fileForm.value.iptsRate = 12 // Taux par défaut
    })
  
  // Réinitialiser le formulaire
  fileForm.value.period = format(new Date(), 'yyyy-MM')
  fileForm.value.baseSalary = employee.currentSalary || 0
  fileForm.value.allowance = 0
  fileForm.value.liquidatedAmount = 0
  fileForm.value.observations = ''
  fileForm.value.status = 'unpaid'
  
  showCreateFileModal.value = true
}

const submitFileForm = async () => {
  if (!selectedEmployee.value) return
  
  try {
    isSubmitting.value = true
    
    await accountantService.createSalaryFile({
      employeeId: selectedEmployee.value.id,
      period: fileForm.value.period,
      baseSalary: fileForm.value.baseSalary,
      allowance: fileForm.value.allowance,
      liquidatedAmount: fileForm.value.liquidatedAmount,
      cnss: calculatedCNSS.value,
      ipts: calculatedIPTS.value,
      netSalary: calculatedNetSalary.value,
      recallAmount: calculatedRecall.value,
      observations: fileForm.value.observations,
      status: fileForm.value.status
    })
    
    showToast('Dossier créé avec succès', 'success')
    showCreateFileModal.value = false
    
    // Si on est dans la vue détaillée, rafraîchir les dossiers
    if (showEmployeeDetails.value) {
      fetchEmployeeFiles(selectedEmployee.value.id)
    }
    
    // Rafraîchir la liste des employés pour mettre à jour les totaux
    fetchEmployees()
  } catch (error) {
    showToast('Erreur lors de la création du dossier', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const viewEmployeeDetails = async (employee) => {
  selectedEmployee.value = employee
  showEmployeeDetails.value = true
  
  try {
    loading.value = true
    employeeFiles.value = await accountantService.getEmployeeFiles(employee.id)
  } catch (error) {
    showToast('Erreur lors de la récupération des dossiers', 'error')
  } finally {
    loading.value = false
  }
}

const fetchEmployeeFiles = async (employeeId) => {
  try {
    loading.value = true
    employeeFiles.value = await accountantService.getEmployeeFiles(employeeId)
  } catch (error) {
    showToast('Erreur lors de la récupération des dossiers', 'error')
  } finally {
    loading.value = false
  }
}

const formatCurrency = (value: number) => {
  if (!value && value !== 0) return '-'
  return new Intl.NumberFormat('fr-FR').format(value)
}

const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return format(new Date(dateString), 'dd MMM yyyy', { locale: fr })
}

const getStatusText = (status: string) => {
  const statusMap = {
    paid: 'Payé',
    partially_paid: 'Partiellement payé',
    unpaid: 'Non payé',
    pending: 'En attente',
    validated: 'Validé',
    rejected: 'Rejeté'
  }
  return statusMap[status] || status
}

const getStatusClass = (status: string) => {
  const classMap = {
    paid: 'bg-green-100 text-green-800',
    partially_paid: 'bg-yellow-100 text-yellow-800',
    unpaid: 'bg-red-100 text-red-800',
    pending: 'bg-blue-100 text-blue-800',
    validated: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800'
  }
  return classMap[status] || 'bg-gray-100 text-gray-800'
}

// Exporter les données
const exportToExcel = () => {
  try {
    const data = employees.value.map(emp => ({
      matricule: emp.matricule,
      lastName: emp.lastName,
      firstName: emp.firstName,
      email: emp.email || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@example.com`,
      department: emp.department,
      service: emp.position,
      grade: emp.grade,
      gradeIndex: emp.index,
      entryDate: emp.joinDate,
      isActive: emp.status === 'Actif'
    }))
    
    import('@/utils/excel-export').then(module => {
      module.exportEmployeeListExcel(data)
      showToast({
        title: 'Succès',
        message: 'Liste des employés exportée en Excel',
        type: 'success'
      })
    }).catch(error => {
      console.error('Erreur lors du chargement du module d\'export Excel:', error)
      showToast({
        title: 'Erreur',
        message: 'Impossible d\'exporter les données en Excel',
        type: 'error'
      })
    })
  } catch (error) {
    console.error('Erreur lors de l\'export Excel:', error)
    showToast({
      title: 'Erreur',
      message: 'Impossible d\'exporter les données en Excel',
      type: 'error'
    })
  }
}

const exportToPDF = () => {
  try {
    const data = employees.value.map(emp => ({
      matricule: emp.matricule,
      lastName: emp.lastName,
      firstName: emp.firstName,
      fullName: emp.fullName,
      email: emp.email || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@example.com`,
      department: emp.department,
      service: emp.position,
      grade: emp.grade,
      gradeIndex: emp.index,
      entryDate: emp.joinDate,
      isActive: emp.status === 'Actif'
    }))
    
    // Utiliser un import dynamique pour éviter les problèmes de chargement
    import('@/utils/pdf-export').then(module => {
      // Utiliser la fonction exportEmployeeList du module
      module.exportEmployeeList(data)
      showToast({
        title: 'Succès',
        message: 'Liste des employés exportée en PDF',
        type: 'success'
      })
    }).catch(error => {
      console.error('Erreur lors du chargement du module d\'export PDF:', error)
      showToast({
        title: 'Erreur',
        message: 'Impossible d\'exporter les données en PDF',
        type: 'error'
      })
    })
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error)
    showToast({
      title: 'Erreur',
      message: 'Impossible d\'exporter les données en PDF',
      type: 'error'
    })
  }
}

// Add new functions for edit and delete file
const handleEditFile = (file: any) => {
  fileToEdit.value = { ...file }
  
  // Récupérer les taux CNSS et IPTS en fonction du grade
  accountantService.getRates()
    .then(rates => {
      const employeeGrade = selectedEmployee.value.grade
      const cnssRate = rates.cnss.find(r => r.grade === employeeGrade)?.rate || 3.6
      const iptsRate = rates.ipts.find(r => r.grade === employeeGrade)?.rate || 12.0
      
      fileForm.value = {
        period: file.period,
        baseSalary: file.baseSalary,
        allowance: file.allowance,
        liquidatedAmount: file.liquidatedAmount,
        observations: file.observations,
        cnssRate: cnssRate,
        iptsRate: iptsRate,
        status: file.status
      }
      
      showEditFileModal.value = true
    })
    .catch(() => {
      fileForm.value.cnssRate = 3.6 // Taux par défaut
      fileForm.value.iptsRate = 12 // Taux par défaut
      showEditFileModal.value = true
    })
}

const handleDeleteFileClick = (file: any) => {
  fileToDelete.value = file
  showDeleteConfirm.value = true
}

const submitEditForm = async () => {
  if (!fileToEdit.value) return
  
  try {
    isSubmitting.value = true
    
    await accountantService.updateSalaryFile(fileToEdit.value.id, {
      employeeId: selectedEmployee.value.id,
      period: fileForm.value.period,
      baseSalary: fileForm.value.baseSalary,
      allowance: fileForm.value.allowance,
      liquidatedAmount: fileForm.value.liquidatedAmount,
      cnss: calculatedCNSS.value,
      ipts: calculatedIPTS.value,
      netSalary: calculatedNetSalary.value,
      recallAmount: calculatedRecall.value,
      observations: fileForm.value.observations,
      status: fileForm.value.status
    })
    
    showToast('Dossier modifié avec succès', 'success')
    showEditFileModal.value = false
    
    // Rafraîchir les dossiers
    fetchEmployeeFiles(selectedEmployee.value.id)
  } catch (error) {
    showToast('Erreur lors de la modification du dossier', 'error')
  } finally {
    isSubmitting.value = false
  }
}

const confirmDeleteFile = async () => {
  if (!fileToDelete.value) return
  
  try {
    loading.value = true
    
    await accountantService.deleteSalaryFile(fileToDelete.value.id)
    
    showToast('Dossier supprimé avec succès', 'success')
    
    // Rafraîchir les dossiers
    fetchEmployeeFiles(selectedEmployee.value.id)
  } catch (error) {
    showToast('Erreur lors de la suppression du dossier', 'error')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchEmployees()
})
</script>

<style scoped>

.form-input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
}

.form-input-sm {
  @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.btn {
  @apply px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-sm {
  @apply px-3 py-1 text-xs;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}
</style> 

