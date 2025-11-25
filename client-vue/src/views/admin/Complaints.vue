<template>
  <div class="space-y-8">
    <div class="sm:flex sm:items-center">
      <div class="sm:flex-auto">
        <h1 class="text-2xl font-semibold text-gray-900">Réclamations</h1>
        <p class="mt-2 text-sm text-gray-700">
          Liste des réclamations soumises par les employés.
        </p>
      </div>
    </div>

    <!-- Filtres -->
    <div class="flex space-x-4">
      <div class="flex-1 relative">
        <label for="search" class="sr-only">Rechercher</label>
        <input
          type="search"
          id="search"
          v-model="searchQuery"
          @keyup.enter="handleSearch"
          placeholder="Rechercher par matricule ou nom..."
          class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
        />
        <button 
          @click="handleSearch" 
          class="absolute inset-y-0 right-0 flex items-center px-3 bg-primary-600 text-white rounded-r-md hover:bg-primary-700"
          title="Rechercher"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>
      <div class="w-48">
        <select
          v-model="statusFilter"
          @change="handleStatusChange"
          class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
        >
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="resolved">Résolu</option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Matricule</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nom</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="complaint in complaintStore.complaints" :key="complaint.id" class="hover:bg-gray-50">
            <td class="py-4 pl-4 pr-3 text-sm sm:pl-6">
              <div class="font-medium text-gray-900">{{ complaint.employee?.matricule || 'N/A' }}</div>
            </td>
            <td class="px-3 py-4 text-sm text-gray-500">
              <div class="font-medium text-gray-900">
                {{ complaint.employee?.firstName || '' }} {{ complaint.employee?.lastName || '' }}
              </div>
            </td>
            <td class="px-3 py-4 text-sm text-gray-500 max-w-md">
              <div class="truncate">{{ complaint.description }}</div>
            </td>
            <td class="px-3 py-4 text-sm text-gray-500">
              <div>{{ formatDate(complaint.createdAt) }}</div>
            </td>
            <td class="px-3 py-4 text-sm">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="getStatusBadgeClass(complaint.status)"
              >
                {{ getStatusText(complaint.status) }}
              </span>
            </td>
            <td class="px-3 py-4 text-sm">
              <div class="flex items-center space-x-3">
                <button
                  v-if="complaint.status !== 'resolved'"
                  @click="handleResolveClick(complaint)"
                  class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-sm font-medium text-green-700 hover:bg-green-100"
                >
                  Marquer comme résolue
                </button>
                <button
                  @click="handleViewDetails(complaint)"
                  class="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-sm font-medium text-blue-700 hover:bg-blue-100"
                >
                  Voir détail
                </button>
                <button
                  v-if="complaint.attachments && complaint.attachments.length > 0"
                  @click="openAttachmentsModal(complaint)"
                  class="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700 hover:bg-purple-100"
                >
                  Voir les pièces jointes
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="complaintStore.complaints.length === 0">
            <td colspan="6" class="py-4 text-center text-sm text-gray-500">
              Aucune réclamation trouvée
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div class="flex flex-1 justify-between sm:hidden">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Précédent
        </button>
        <button
          @click="nextPage"
          :disabled="currentPage >= totalPages"
          class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Suivant
        </button>
      </div>
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Affichage de <span class="font-medium">{{ startIndex + 1 }}</span> à{" "}
            <span class="font-medium">{{ endIndex }}</span> sur{" "}
            <span class="font-medium">{{ complaintStore.total }}</span> résultats
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              @click="previousPage"
              :disabled="currentPage === 1"
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span class="sr-only">Précédent</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
              </svg>
            </button>
            <button
              @click="nextPage"
              :disabled="currentPage >= totalPages"
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
            >
              <span class="sr-only">Suivant</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>

    <!-- Modal des pièces jointes -->
    <Modal
      v-model="showAttachmentsModal"
      title="Pièces jointes"
    >
      <div v-if="selectedComplaint" class="space-y-4">
        <p class="text-sm text-gray-500">
          Réclamation de {{ selectedComplaint.employee?.firstName || '' }} {{ selectedComplaint.employee?.lastName || '' }}
          du {{ formatDate(selectedComplaint.createdAt) }}
        </p>

        <div v-if="selectedComplaint.attachments && selectedComplaint.attachments.length > 0" class="space-y-4">
          <div v-for="(attachment, index) in selectedComplaint.attachments" :key="index" class="p-4 bg-gray-50 rounded-lg">
            <!-- Image preview -->
            <img 
              v-if="isImageFile(attachment)"
              :src="`/${attachment}`"
              :alt="`Pièce jointe ${index + 1}`"
              class="w-full h-auto rounded-lg shadow-sm mb-2"
            />
            <!-- PDF preview -->
            <iframe
              v-else-if="isPdfFile(attachment)"
              :src="`/${attachment}`"
              class="w-full h-[500px] rounded-lg shadow-sm mb-2"
            ></iframe>
            <!-- Fallback pour autres types de fichiers -->
            <div v-else class="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
              <DocumentIcon class="h-12 w-12 text-gray-400" />
              <span class="ml-2 text-sm text-gray-900">{{ getFileName(attachment) }}</span>
            </div>
            <!-- Nom du fichier et type -->
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ getFileName(attachment) }}</span>
              <span class="text-xs text-gray-500">{{ getFileType(attachment) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-4">
          Aucune pièce jointe disponible
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            @click="showAttachmentsModal = false"
          >
            Fermer
          </button>
        </div>
      </template>
    </Modal>

    <!-- Dialog de confirmation -->
    <ConfirmDialog
      v-model="showConfirmDialog"
      title="Résoudre la réclamation"
      message="Êtes-vous sûr de vouloir marquer cette réclamation comme résolue ?"
      :confirm-text="'Résoudre'"
      :cancel-text="'Annuler'"
      @confirm="handleResolveConfirm"
    />

    <!-- Modal for details -->
    <Modal
      v-model="showDetailsModal"
      title="Détails de la réclamation"
      size="lg"
    >
      <div v-if="selectedComplaint" class="space-y-4">
        <p class="text-sm text-gray-500">
          Réclamation de {{ selectedComplaint.employee?.firstName || '' }} {{ selectedComplaint.employee?.lastName || '' }}
          du {{ formatDate(selectedComplaint.createdAt) }}
        </p>

        <!-- Description complète -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Description complète</h3>
          <p class="text-sm text-gray-900 whitespace-pre-line">{{ selectedComplaint.description }}</p>
        </div>

        <!-- Période concernée -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <h3 class="text-sm font-medium text-gray-700 mb-2">Période concernée</h3>
          <p class="text-sm text-gray-900">
            Du {{ formatDate(selectedComplaint.periodStart) }} au {{ formatDate(selectedComplaint.periodEnd) }}
          </p>
        </div>

        <!-- Pièces jointes -->
        <div v-if="selectedComplaint.attachments && selectedComplaint.attachments.length > 0" class="space-y-4">
          <h3 class="text-sm font-medium text-gray-700">Pièces jointes</h3>
          <div v-for="(attachment, index) in selectedComplaint.attachments" :key="index" class="p-4 bg-gray-50 rounded-lg">
            <!-- Image preview -->
            <img 
              v-if="isImageFile(attachment)"
              :src="`/${attachment}`"
              :alt="`Pièce jointe ${index + 1}`"
              class="w-full h-auto rounded-lg shadow-sm mb-2"
            />
            <!-- PDF preview -->
            <iframe
              v-else-if="isPdfFile(attachment)"
              :src="`/${attachment}`"
              class="w-full h-[500px] rounded-lg shadow-sm mb-2"
            ></iframe>
            <!-- Fallback pour autres types de fichiers -->
            <div v-else class="flex items-center justify-center p-4 bg-gray-100 rounded-lg">
              <DocumentIcon class="h-12 w-12 text-gray-400" />
              <span class="ml-2 text-sm text-gray-900">{{ getFileName(attachment) }}</span>
            </div>
            <!-- Nom du fichier et type -->
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ getFileName(attachment) }}</span>
              <span class="text-xs text-gray-500">{{ getFileType(attachment) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-gray-500 py-4">
          Aucune pièce jointe disponible
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <button
            type="button"
            class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
            @click="showDetailsModal = false"
          >
            Fermer
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import Modal from '@/components/ui/modal.vue'
import ConfirmDialog from '@/components/ui/confirm-dialog.vue'
import { useComplaintStore } from '@/stores/complaints'
import { useToast } from '@/composables/useToast'
import { DocumentIcon } from '@heroicons/vue/24/outline'
import type { Complaint } from '@/types'
import { complaintService } from '@/services/complaint.service'

const complaintStore = useComplaintStore()
const toast = useToast()

const currentPage = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const statusFilter = ref<'pending' | 'resolved' | ''>('')
const showConfirmDialog = ref(false)
const showAttachmentsModal = ref(false)
const showDetailsModal = ref(false)
const selectedComplaint = ref<Complaint | null>(null)
const loading = ref(false)

// Computed properties for pagination
const totalPages = computed(() => Math.ceil(complaintStore.total / itemsPerPage.value))
const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value)
const endIndex = computed(() => Math.min(startIndex.value + itemsPerPage.value, complaintStore.total))

// Utility functions
const formatDate = (date: number | string | Date) => {
  return format(new Date(date), 'dd/MM/yyyy', { locale: fr })
}

const getComplaintType = (type: string) => {
  const types: Record<string, string> = {
    'salary': 'Salaire',
    'grade': 'Grade',
    'bonus': 'Prime',
    'leave': 'Congé',
    'other': 'Autre'
  }
  return types[type] || type
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'pending':
      return 'En attente'
    case 'resolved':
      return 'Résolue'
    default:
      return status
  }
}

const getStatusBadgeClass = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800'
    case 'resolved':
      return 'bg-green-100 text-green-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

// File handling functions
const isImageFile = (filename: string) => {
  return /\.(jpg|jpeg|png|gif)$/i.test(filename)
}

const isPdfFile = (filename: string) => {
  return /\.pdf$/i.test(filename)
}

const getFileName = (path: string) => {
  return path.split('/').pop() || path
}

const getFileType = (filename: string) => {
  if (isImageFile(filename)) return 'Image'
  if (isPdfFile(filename)) return 'PDF'
  return 'Document'
}

// Event handlers
const handleSearch = async () => {
  console.log('Recherche déclenchée avec:', searchQuery.value);
  
  // Mettre à jour l'état de chargement
  loading.value = true;
  
  try {
    // Utiliser le service de réclamation directement
    const response = await complaintService.getAll({
      page: 1,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      status: statusFilter.value
    });
    
    // Mettre à jour le store avec les résultats
    complaintStore.$patch({
      complaints: response.items || [],
      total: response.total || 0
    });
    
    // Réinitialiser la pagination
    currentPage.value = 1;
    
    console.log('Résultats de recherche:', response);
  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    toast.error({
      title: 'Erreur',
      message: 'La recherche a échoué'
    });
  } finally {
    loading.value = false;
  }
};

const handleStatusChange = async () => {
  console.log('Changement de statut:', statusFilter.value);
  await handleSearch(); // Réutiliser la même fonction pour cohérence
}

const handleResolveClick = (complaint: Complaint) => {
  selectedComplaint.value = complaint
  showConfirmDialog.value = true
}

const handleResolveConfirm = async () => {
  if (!selectedComplaint.value) return

  try {
    await complaintStore.resolveComplaint(selectedComplaint.value.id)
    showConfirmDialog.value = false
    selectedComplaint.value = null
    await complaintStore.fetchComplaints({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      status: statusFilter.value
    })
  } catch (error) {
    console.error('Error resolving complaint:', error)
  }
}

const openAttachmentsModal = (complaint: any) => {
  selectedComplaint.value = complaint
  showAttachmentsModal.value = true
}

const handleViewDetails = (complaint: Complaint) => {
  selectedComplaint.value = complaint
  showDetailsModal.value = true
}

const previousPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--
    await complaintStore.fetchComplaints({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      status: statusFilter.value
    })
  }
}

const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    await complaintStore.fetchComplaints({
      page: currentPage.value,
      limit: itemsPerPage.value,
      search: searchQuery.value,
      status: statusFilter.value
    })
  }
}

onMounted(async () => {
  await complaintStore.fetchComplaints({
    page: currentPage.value,
    limit: itemsPerPage.value
  })
})
</script> 