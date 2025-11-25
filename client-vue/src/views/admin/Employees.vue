<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from '@/components/ui/data-table.vue'
import Modal from '@/components/ui/modal.vue'
import ConfirmDialog from '@/components/ui/confirm-dialog.vue'
import EmployeeForm from '@/components/forms/EmployeeForm.vue'
import { exportEmployeeList } from '@/utils/pdf-export'
import { exportEmployeeListExcel } from '@/utils/excel-export'
import { useEmployeeStore } from '@/stores/employees'
import { useToast } from '@/composables/useToast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useRouter } from 'vue-router'

const employeeStore = useEmployeeStore()
const { employees, total, loading, error, departments } = storeToRefs(employeeStore)
const toast = useToast()
const router = useRouter()

// Debug logs
console.log('Store initial state:', {
  employees: employees.value,
  total: total.value,
  loading: loading.value,
  error: error.value
})

const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref('lastName')
const sortDesc = ref(false)
const searchQuery = ref('')
const selectedDepartment = ref('')

// Modal state
const showModal = ref(false)
const showDetailsModal = ref(false)
const editingEmployee = ref<any>(null)
const selectedEmployee = ref<any>(null)
const employeeFiles = ref<any[]>([])
const modalTitle = ref('')

// Confirm dialog state
const showConfirmDialog = ref(false)
const employeeToDelete = ref<any>(null)

interface SortChangeEvent {
  key: string;
  desc: boolean;
}

const columns = [
  { key: 'matricule', label: 'Matricule', sortable: true },
  { 
    key: 'fullName', 
    label: 'Nom complet', 
    sortable: true,
    render: (employee: any) => `${employee.lastName} ${employee.firstName}`
  },
  { key: 'department', label: 'Département', sortable: true },
  { key: 'grade', label: 'Grade', sortable: true },
  { key: 'service', label: 'Service', sortable: true },
  { 
    key: 'entryDate', 
    label: 'Date d\'entrée', 
    sortable: true,
    render: (employee: any) => {
      console.log('Date à afficher:', employee.entryDate)
      return employee.entryDate 
        ? format(new Date(Number(employee.entryDate)), 'dd/MM/yyyy', { locale: fr })
        : '-'
    }
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (employee: any) => ({
      type: 'actions',
      actions: [
        {
          label: 'Modifier',
          icon: 'edit',
          onClick: () => handleEdit(employee)
        },
        {
          label: 'Voir détail',
          icon: 'eye',
          onClick: () => handleViewDetails(employee)
        }
      ]
    })
  }
]

const fetchEmployees = async () => {
  const params = {
    page: currentPage.value,
    limit: itemsPerPage.value,
    sortBy: sortBy.value,
    sortDesc: sortDesc.value,
    search: searchQuery.value.trim(),
    department: selectedDepartment.value
  };
  
  console.log('Vue: Fetching employees with params:', params);
  
  try {
    await employeeStore.fetchEmployees(params);
    
    console.log('Vue: Fetch result:', {
      employees: employees.value,
      total: total.value,
      error: error.value
    });
  } catch (e) {
    console.error('Vue: Fetch error:', e);
    toast.error({
      title: 'Erreur',
      message: 'Impossible de charger les employés'
    });
  }
}

const handleExportPDF = () => {
  try {
    exportEmployeeList(employees.value)
    toast.success('PDF exporté avec succès')
  } catch (e) {
    toast.error({
      title: 'Erreur d\'export',
      message: 'Impossible d\'exporter le PDF'
    })
  }
}

const handleExportExcel = () => {
  try {
    exportEmployeeListExcel(employees.value)
    toast.success('Fichier Excel exporté avec succès')
  } catch (e) {
    toast.error({
      title: 'Erreur d\'export',
      message: 'Impossible d\'exporter le fichier Excel'
    })
  }
}

const handleSearch = () => {
  if (searchQuery.value.trim().length >= 2 || searchQuery.value.trim().length === 0) {
    currentPage.value = 1; // Réinitialiser la page lors d'une recherche
    fetchEmployees();
  }
}

const handleDepartmentChange = () => {
  currentPage.value = 1; // Réinitialiser la page lors d'un changement de département
  fetchEmployees();
}

const handleAddNew = () => {
  editingEmployee.value = null
  modalTitle.value = 'Ajouter un employé'
  showModal.value = true
}

const handleEdit = (employee: any) => {
  console.log('Édition de l\'employé:', employee);
  // Créer une copie des données pour le formulaire
  const formData = {
    id: employee.id,
    matricule: employee.matricule,
    firstName: employee.firstName,
    lastName: employee.lastName,
    email: employee.email,
    grade: employee.grade,
    gradeIndex: employee.gradeIndex,
    service: employee.service,
    department: employee.department,
    entryDate: employee.entryDate,
    isActive: employee.isActive ?? true
  };
  
  editingEmployee.value = { ...formData };
  modalTitle.value = 'Modifier un employé';
  showModal.value = true;
}

const handleViewDetails = async (employee: any) => {
  console.log('Voir détails de l\'employé:', employee);
  selectedEmployee.value = employee;
  showDetailsModal.value = true;
  
  try {
    // Récupérer les dossiers de l'employé si nécessaire
    const files = await employeeStore.fetchEmployeeFiles(employee.id);
    employeeFiles.value = files || [];
  } catch (error) {
    console.error('Erreur lors de la récupération des dossiers:', error);
    employeeFiles.value = [];
    toast.error({
      title: 'Erreur',
      message: 'Impossible de charger les dossiers de l\'employé'
    });
  }
}

const handleDeleteClick = (employee: any) => {
  employeeToDelete.value = employee
  showConfirmDialog.value = true
}

const handleDeleteConfirm = async () => {
  if (!employeeToDelete.value) return

  try {
    console.log('Tentative de suppression de l\'employé:', employeeToDelete.value)
    await employeeStore.deleteEmployee(employeeToDelete.value.id)
    toast.success({
      title: 'Succès',
      message: 'Employé supprimé avec succès'
    })
    await fetchEmployees() // Rafraîchir la liste après la suppression
  } catch (e) {
    console.error('Erreur lors de la suppression:', e)
    toast.error({
      title: 'Erreur',
      message: 'Impossible de supprimer l\'employé'
    })
  } finally {
    showConfirmDialog.value = false
    employeeToDelete.value = null
  }
}

const handleSubmit = async (values: any) => {
  try {
    console.log('Vue: Début de la soumission du formulaire avec les valeurs:', values);
    if (editingEmployee.value?.id) {
      // Si on modifie un employé existant
      const updateData = {
        ...values,  // Utiliser toutes les valeurs du formulaire
        id: editingEmployee.value.id  // Garder l'ID de l'employé
      };
      
      console.log('Vue: Envoi des données de mise à jour:', updateData);
      await employeeStore.updateEmployee(editingEmployee.value.id, updateData);
      console.log('Vue: Mise à jour réussie');
      
      showModal.value = false;
      editingEmployee.value = null;
      
      // Forcer le rafraîchissement immédiat avec les paramètres actuels
      await fetchEmployees();
      
      toast.success({
        title: 'Succès',
        message: 'Employé mis à jour avec succès'
      });
    } else {
      // Si on crée un nouvel employé
      console.log('Vue: Création d\'un nouvel employé');
      await employeeStore.createEmployee(values);
      
      showModal.value = false;
      editingEmployee.value = null;
      
      // Forcer le rafraîchissement immédiat avec les paramètres actuels
      await fetchEmployees();
      
      toast.success({
        title: 'Succès',
        message: 'Employé créé avec succès'
      });
    }
  } catch (e) {
    console.error('Vue: Erreur lors de la sauvegarde:', e);
    toast.error({
      title: 'Erreur',
      message: 'Impossible de sauvegarder l\'employé'
    });
  }
}

const handlePageChange = async (page: number) => {
  currentPage.value = page;
  await fetchEmployees();
}

const handleSortChange = async (event: SortChangeEvent) => {
  sortBy.value = event.key;
  sortDesc.value = event.desc;
  currentPage.value = 1; // Réinitialiser la page lors d'un changement de tri
  await fetchEmployees();
}

// Ajouter un watcher pour détecter les changements dans la liste des employés
watch(() => employees.value, (newEmployees) => {
  console.log('Vue: La liste des employés a changé:', newEmployees);
}, { deep: true });

// Fonctions utilitaires pour le modal de détails
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

onMounted(async () => {
  console.log('Component mounted')
  await employeeStore.fetchDepartments()
  await fetchEmployees()
  console.log('Initial fetch completed')
})
</script>

<template>
  <div>
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">Employés</h1>
        <p class="mt-2 text-sm text-gray-700">Liste de tous les employés de l'entreprise avec leurs informations.</p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-2">
        <button
          @click="handleExportPDF"
          type="button"
          class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Exporter PDF
        </button>
        <button
          @click="handleExportExcel"
          type="button"
          class="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
        >
          Exporter Excel
        </button>
        <button
          @click="handleAddNew"
          type="button"
          class="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Ajouter un employé
        </button>
      </div>
    </div>

    <!-- Filtres -->
    <div class="mt-4 flex flex-wrap gap-4">
     
      <div class="w-full sm:w-auto">
        <select
          v-model="selectedDepartment"
          class="form-select w-full"
          @change="handleDepartmentChange"
        >
          <option value="">Tous les départements</option>
          <option v-for="dept in departments" :key="dept" :value="dept">
            {{ dept }}
          </option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-4">
      <DataTable
        :columns="columns"
        :data="employees"
        :total="total"
        :loading="loading"
        v-model:current-page="currentPage"
        v-model:items-per-page="itemsPerPage"
        v-model:sort-by="sortBy"
        v-model:sort-desc="sortDesc"
        @update:current-page="fetchEmployees"
        @update:items-per-page="fetchEmployees"
        @update:sort="fetchEmployees"
      >
        <template #actions="{ row }">
          <div class="flex space-x-2">
            <button
              @click="handleEdit(row)"
              class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
            >
              <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Modifier
            </button>
            <button
              @click="handleViewDetails(row)"
              class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-100"
            >
              <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir détail
            </button>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Modal -->
    <Modal
      v-model="showModal"
      :title="modalTitle"
    >
      <EmployeeForm
        :employee="editingEmployee"
        :is-edit="!!editingEmployee"
        @submit="handleSubmit"
        @cancel="() => showModal = false"
      />
    </Modal>

    <!-- Confirm Dialog -->
    <ConfirmDialog
      v-model="showConfirmDialog"
      title="Confirmer la suppression"
      message="Êtes-vous sûr de vouloir supprimer cet employé ?"
      @confirm="handleDeleteConfirm"
    />

    <!-- Details Modal -->
    <Modal
      v-model="showDetailsModal"
      title="Détails de l'employé"
      size="2xl"
    >
      <div v-if="selectedEmployee" class="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[80vh] overflow-auto p-2">
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
              <p class="font-medium">{{ selectedEmployee.gradeIndex }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Service</p>
              <p class="font-medium">{{ selectedEmployee.department }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-500">Date d'entrée</p>
              <p class="font-medium">{{ formatDate(selectedEmployee.entryDate) }}</p>
            </div>
          </div>
        </div>

        <!-- Historique des dossiers -->
        <div class="md:col-span-2">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Historique des dossiers</h3>
          </div>

          <div class="overflow-hidden border border-gray-200 rounded-md">
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
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="file in employeeFiles" :key="file.id">
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
                </tr>
                <tr v-if="employeeFiles.length === 0">
                  <td colspan="6" class="px-4 py-3 text-center text-sm text-gray-500">
                    Aucun dossier trouvé
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Modal>
  </div>
</template> 