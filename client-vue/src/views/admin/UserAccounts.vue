<template>
  <div class="space-y-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">Comptes Utilisateurs</h1>
        <p class="mt-2 text-sm text-gray-700">
          Gestion des comptes de connexion à la plateforme.
        </p>
      </div>
      <div class="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
        <button
          @click="handleCreate"
          type="button"
          class="block rounded-md bg-primary-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        >
          Créer un compte
        </button>
      </div>
    </div>

    <!-- Table -->
    <DataTable
      :columns="columns"
      :data="users"
      :total="total"
      :loading="loading"
      v-model:current-page="currentPage"
      v-model:items-per-page="itemsPerPage"
      v-model:sort-by="sortBy"
      v-model:sort-desc="sortDesc"
      @update:current-page="fetchUsers"
      @update:items-per-page="fetchUsers"
      @update:sort="fetchUsers"
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
            @click="handleResetPassword(row)"
            class="inline-flex items-center rounded-md bg-yellow-50 px-2 py-1 text-sm font-medium text-yellow-700 hover:bg-yellow-100"
          >
            <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            Réinitialiser
          </button>
          <button
            @click="handleDeleteClick(row)"
            class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
          >
            <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Supprimer
          </button>
        </div>
      </template>
      <template #empty>
        <div class="text-center py-4 text-gray-500">
          Aucun utilisateur trouvé
        </div>
      </template>
    </DataTable>

    <!-- Modal de création -->
    <Modal
      v-model="showCreateModal"
      title="Créer un compte utilisateur"
    >
      <form @submit.prevent="handleCreateSubmit" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="matricule" class="block text-sm font-medium text-gray-700">Matricule</label>
            <input
              type="text"
              id="matricule"
              v-model="createForm.matricule"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="lastName" class="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              id="lastName"
              v-model="createForm.lastName"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="firstName" class="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              id="firstName"
              v-model="createForm.firstName"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="phone" class="block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              type="tel"
              id="phone"
              v-model="createForm.phone"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              v-model="createForm.email"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="role" class="block text-sm font-medium text-gray-700">Rôle</label>
            <select
              id="role"
              v-model="createForm.role"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez un rôle</option>
              <option v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="grade" class="block text-sm font-medium text-gray-700">Grade</label>
            <select
              id="grade"
              v-model="createForm.grade"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez un grade</option>
              <option v-for="grade in grades" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
          </div>

          <div>
            <label for="function" class="block text-sm font-medium text-gray-700">Fonction</label>
            <select
              id="function"
              v-model="createForm.function"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez une fonction</option>
              <option v-for="func in functions" :key="func" :value="func">
                {{ func }}
              </option>
            </select>
          </div>

          <div>
            <label for="service" class="block text-sm font-medium text-gray-700">Service</label>
            <select
              id="service"
              v-model="createForm.service"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez un service</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>
        </div>

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="submit"
            class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
          >
            Créer
          </button>
          <button
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            @click="showCreateModal = false"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal de modification -->
    <Modal
      v-model="showEditModal"
      title="Modifier l'utilisateur"
    >
      <form @submit.prevent="handleEditSubmit" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label for="edit-matricule" class="block text-sm font-medium text-gray-700">Matricule</label>
            <input
              type="text"
              id="edit-matricule"
              v-model="editForm.matricule"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="edit-lastName" class="block text-sm font-medium text-gray-700">Nom</label>
            <input
              type="text"
              id="edit-lastName"
              v-model="editForm.lastName"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="edit-firstName" class="block text-sm font-medium text-gray-700">Prénom</label>
            <input
              type="text"
              id="edit-firstName"
              v-model="editForm.firstName"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="edit-phone" class="block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              type="tel"
              id="edit-phone"
              v-model="editForm.phone"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="edit-email" class="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              id="edit-email"
              v-model="editForm.email"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            />
          </div>

          <div>
            <label for="edit-role" class="block text-sm font-medium text-gray-700">Rôle</label>
            <select
              id="edit-role"
              v-model="editForm.role"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez un rôle</option>
              <option v-for="role in roles" :key="role.value" :value="role.value">
                {{ role.label }}
              </option>
            </select>
          </div>

          <div>
            <label for="edit-grade" class="block text-sm font-medium text-gray-700">Grade</label>
            <select
              id="edit-grade"
              v-model="editForm.grade"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez un grade</option>
              <option v-for="grade in grades" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
          </div>

          <div>
            <label for="edit-function" class="block text-sm font-medium text-gray-700">Fonction</label>
            <select
              id="edit-function"
              v-model="editForm.function"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez une fonction</option>
              <option v-for="func in functions" :key="func" :value="func">
                {{ func }}
              </option>
            </select>
          </div>

          <div>
            <label for="edit-service" class="block text-sm font-medium text-gray-700">Service</label>
            <select
              id="edit-service"
              v-model="editForm.service"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            >
              <option value="">Sélectionnez un service</option>
              <option v-for="service in services" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
          </div>
        </div>

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="submit"
            class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 sm:col-start-2"
          >
            Mettre à jour
          </button>
          <button
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
            @click="showEditModal = false"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal de mot de passe -->
    <Modal
      v-model="showPasswordModal"
      title="Mot de passe généré"
      @close="onPasswordModalClose"
    >
      <div class="p-4 bg-yellow-50 rounded-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              Mot de passe initial
            </h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>Veuillez transmettre ce mot de passe à l'utilisateur : <strong>{{ generatedPassword }}</strong></p>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-5">
        <button
          type="button"
          class="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
          @click="closePasswordModal"
        >
          Fermer
        </button>
      </div>
    </Modal>

    <!-- Dialog de confirmation -->
    <ConfirmDialog
      v-model="showConfirmDialog"
      title="Supprimer le compte"
      message="Êtes-vous sûr de vouloir supprimer ce compte utilisateur ? Cette action est irréversible."
      confirm-text="Supprimer"
      cancel-text="Annuler"
      type="danger"
      @confirm="handleDeleteConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import DataTable from '@/components/ui/data-table.vue'
import Modal from '@/components/ui/modal.vue'
import ConfirmDialog from '@/components/ui/confirm-dialog.vue'
import { useToast } from '@/composables/useToast'
import { useUserStore } from '@/stores/users'
import { useDashboardStore } from '@/stores/dashboard'

const toast = useToast()
const userStore = useUserStore()
const dashboardStore = useDashboardStore()
const { users, total, loading } = storeToRefs(userStore)

// État de la table
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortBy = ref('lastName')
const sortDesc = ref(false)
const searchQuery = ref('')

// État des modals
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showPasswordModal = ref(false)
const showConfirmDialog = ref(false)

// État des données
const editingUser = ref<any>(null)
const userToDelete = ref<any>(null)
const generatedPassword = ref('')

// Données du formulaire
const createForm = ref({
  matricule: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  role: '',
  grade: '',
  function: '',
  service: ''
})

const editForm = ref({
  matricule: '',
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  role: '',
  grade: '',
  function: '',
  service: ''
})

// Données de référence
const roles = [
  { value: 'employee', label: 'Employé' },
  { value: 'accountant', label: 'Comptable' },
  { value: 'admin', label: 'Administrateur' }
]

const grades = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'B3'
]

const functions = [
  'Directeur',
  'Chef de service',
  'Agent',
  'Technicien',
  'Assistant'
]

const services = [
  'Ressources Humaines',
  'Comptabilité',
  'Informatique',
  'Commercial',
  'Production'
]

// Colonnes de la table
const columns = [
  { 
    key: 'matricule', 
    label: 'Matricule', 
    sortable: true 
  },
  { 
    key: 'fullName', 
    label: 'Nom',
    sortable: true,
    render: (user: any) => `${user.lastName} ${user.firstName}`
  },
  { 
    key: 'role', 
    label: 'Rôle',
    sortable: true,
    render: (user: any) => roles.find(r => r.value === user.role)?.label || user.role
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (user: any) => ({
      type: 'actions',
      actions: [
        {
          label: 'Modifier le rôle',
          icon: 'edit',
          onClick: () => handleEdit(user)
        },
        {
          label: 'Réinitialiser le mot de passe',
          icon: 'key',
          onClick: () => handleResetPassword(user)
        },
        {
          label: 'Supprimer',
          icon: 'trash',
          onClick: () => handleDeleteClick(user)
        }
      ]
    })
  }
]

// Méthodes
const fetchUsers = async () => {
  try {
    await userStore.fetchUsers({
      page: currentPage.value,
      limit: itemsPerPage.value,
      sortBy: sortBy.value,
      sortDesc: sortDesc.value,
      search: searchQuery.value
    })
  } catch (error) {
    toast.error({
      title: 'Erreur',
      message: 'Impossible de charger les utilisateurs'
    })
  }
}

const handleSearch = () => {
  currentPage.value = 1
  fetchUsers()
}

const resetCreateForm = () => {
  createForm.value = {
    matricule: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: '',
    grade: '',
    function: '',
    service: ''
  }
  // Ne pas réinitialiser le mot de passe généré ici
  // generatedPassword.value = ''
}

const resetEditForm = () => {
  editForm.value = {
    matricule: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    role: '',
    grade: '',
    function: '',
    service: ''
  }
  editingUser.value = null
}

const handleCreate = () => {
  resetCreateForm()
  showCreateModal.value = true
}

const handleEdit = (user: any) => {
  editingUser.value = user
  editForm.value = {
    matricule: user.matricule || '',
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    email: user.email || '',
    role: user.role || '',
    grade: user.grade || '',
    function: user.function || '',
    service: user.service || ''
  }
  showEditModal.value = true
}

const handleCreateSubmit = async () => {
  try {
    console.log('Creating user with data:', createForm.value);
    
    // Afficher un indicateur de chargement
    loading.value = true;
    
    // Appeler l'API pour créer l'utilisateur
    const response = await userStore.createUser(createForm.value);
    console.log('Create user response in component:', response);
    
    // Vérifier si la réponse contient un mot de passe
    if (response && response.password) {
      console.log('Password found in response:', response.password);
      
      // Stocker le mot de passe généré
      generatedPassword.value = response.password;
      console.log('Password stored in generatedPassword:', generatedPassword.value);
      
      // Fermer le modal de création et ouvrir le modal de mot de passe
      showCreateModal.value = false;
      showPasswordModal.value = true;
      console.log('Password modal should be visible:', showPasswordModal.value);
      
      // Rafraîchir la liste des utilisateurs
      await fetchUsers();
      
      // Réinitialiser le formulaire (sans effacer le mot de passe généré)
      resetCreateForm();
      
      // Afficher un message de succès
      toast.success({
        title: 'Succès',
        message: 'Compte utilisateur créé avec succès'
      });
    } else {
      // Si le mot de passe n'est pas dans la réponse, afficher un message d'erreur
      console.error('No password returned from API');
      toast.error({
        title: 'Erreur',
        message: 'Aucun mot de passe n\'a été généré pour le nouvel utilisateur'
      });
    }
  } catch (error: any) {
    // Gérer les erreurs
    console.error('Create user error:', error);
    toast.error({
      title: 'Erreur',
      message: error.message || 'Impossible de créer le compte utilisateur'
    });
  } finally {
    // Désactiver l'indicateur de chargement
    loading.value = false;
  }
}

const handleEditSubmit = async () => {
  if (!editingUser.value) return

  try {
    console.log('Updating user:', editingUser.value.id, 'with data:', editForm.value)
    await userStore.updateUser(editingUser.value.id, editForm.value)
    await fetchUsers() // Refresh the list
    
    // Mettre à jour le dashboard si disponible
    if (dashboardStore) {
      await dashboardStore.fetchDashboardData()
    }
    
    showEditModal.value = false
    resetEditForm()
    toast.success({
      title: 'Succès',
      message: 'Utilisateur mis à jour avec succès'
    })
  } catch (error) {
    console.error('Update user error:', error)
    toast.error({
      title: 'Erreur',
      message: 'Impossible de mettre à jour l\'utilisateur'
    })
  }
}

const handleDeleteClick = (user: any) => {
  userToDelete.value = user
  showConfirmDialog.value = true
}

const handleDeleteConfirm = async () => {
  if (!userToDelete.value) return

  try {
    await userStore.deleteUser(userToDelete.value.id)
    toast.success({
      title: 'Succès',
      message: 'Compte utilisateur supprimé avec succès'
    })
  } catch (error) {
    toast.error({
      title: 'Erreur',
      message: 'Impossible de supprimer le compte utilisateur'
    })
  } finally {
    showConfirmDialog.value = false
    userToDelete.value = null
  }

}

const handleResetPassword = async (user: any) => {
  try {
    console.log('Resetting password for user:', user)
    const response = await userStore.resetPassword(user.id)
    console.log('Reset password response:', response)
    if (response.newPassword) {
      generatedPassword.value = response.newPassword
      showPasswordModal.value = true
      toast.success({
        title: 'Succès',
        message: 'Mot de passe réinitialisé avec succès'
      })
    }
  } catch (error) {
    console.error('Reset password error:', error)
    toast.error({
      title: 'Erreur',
      message: 'Impossible de réinitialiser le mot de passe'
    })
  }
}

const closePasswordModal = () => {
  // Fermer le modal après un court délai pour s'assurer que l'utilisateur a le temps de voir le mot de passe
  setTimeout(() => {
    showPasswordModal.value = false;
  }, 100);
}

const onPasswordModalClose = () => {
  // Ne pas réinitialiser le mot de passe à la fermeture du modal
  console.log('Password modal closed, password value preserved:', generatedPassword.value);
}

onMounted(fetchUsers)
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 