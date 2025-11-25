<template>
  <div class="space-y-6">
    <!-- Tableau de bord -->
    <EmployeeDashboard :employee="employee" />

    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-semibold text-gray-900">Mes réclamations</h1>
      <button
        @click="showCreateModal = true"
        class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Nouvelle réclamation
      </button>
    </div>

    <!-- Debug info -->
    <div v-if="complaints.length === 0" class="text-gray-500 mb-4">
      Aucune réclamation trouvée
    </div>
    <div v-else class="text-gray-500 mb-4">
      {{ complaints.length }} réclamation(s) trouvée(s)
    </div>

    <div class="bg-white shadow ring-1 ring-black ring-opacity-5 rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-300">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Date de soumission</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Période concernée</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Description</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Statut</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 bg-white">
          <tr v-for="complaint in complaints" :key="complaint.id" class="hover:bg-gray-50">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-6">
              {{ formatDate(complaint.createdAt) }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
              {{ complaint.type }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
              {{ formatDate(complaint.periodStart) }} - {{ formatDate(complaint.periodEnd) }}
            </td>
            <td class="px-3 py-4 text-sm text-gray-500 max-w-md truncate">
              {{ complaint.description }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <span
                class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                :class="getStatusBadge(complaint.status).class"
              >
                {{ getStatusBadge(complaint.status).text }}
              </span>
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm">
              <button
                v-if="complaint.attachments && complaint.attachments.length > 0"
                @click="openAttachmentsModal(complaint)"
                class="text-primary-600 hover:text-primary-900"
              >
                Voir les pièces jointes
              </button>
              <span v-else class="text-gray-500">Aucune pièce jointe</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal de création -->
    <Modal
      v-model="showCreateModal"
      title="Nouvelle réclamation"
    >
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div>
          <label for="type" class="block text-sm font-medium text-gray-700">Type de réclamation</label>
          <select
            id="type"
            v-model="form.type"
            class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
          >
            <option value="">Sélectionnez un type</option>
            <option v-for="type in complaintTypes" :key="type.value" :value="type.value">
              {{ type.label }}
            </option>
          </select>
        </div>

        <div>
          <label for="periodStart" class="block text-sm font-medium text-gray-700">Début de la période</label>
          <input
            type="date"
            id="periodStart"
            v-model="form.periodStart"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="periodEnd" class="block text-sm font-medium text-gray-700">Fin de la période</label>
          <input
            type="date"
            id="periodEnd"
            v-model="form.periodEnd"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div>
          <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            v-model="form.description"
            rows="4"
            class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          ></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Pièces justificatives</label>
          <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div class="space-y-1 text-center">
              <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="flex text-sm text-gray-600">
                <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                  <span>Télécharger un fichier</span>
                  <input
                    id="file-upload"
                    type="file"
                    multiple
                    class="sr-only"
                    @change="handleFileChange"
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </label>
              </div>
              <p class="text-xs text-gray-500">PDF, JPG, PNG jusqu'à 5MB</p>
            </div>
          </div>
          <!-- Liste des fichiers sélectionnés -->
          <div v-if="form.files.length > 0" class="mt-4 space-y-2">
            <div v-for="(file, index) in form.files" :key="index" class="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md">
              <span class="text-sm text-gray-900">{{ file.name }}</span>
              <button
                type="button"
                @click="removeFile(index)"
                class="text-red-600 hover:text-red-900"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <div class="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="submit"
            class="inline-flex justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:col-start-2"
          >
            Soumettre
          </button>
          <button
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:col-start-1"
            @click="showCreateModal = false"
          >
            Annuler
          </button>
        </div>
      </form>
    </Modal>

    <!-- Modal des pièces jointes -->
    <Modal
      v-model="showAttachmentsModal"
      title="Pièces jointes"
    >
      <div v-if="selectedComplaint" class="space-y-4">
        <p class="text-sm text-gray-500">
          Réclamation du {{ formatDate(selectedComplaint.createdAt) }}
        </p>

        <div v-if="selectedComplaint.attachments && selectedComplaint.attachments.length > 0" class="space-y-4">
          <div v-for="(attachment, index) in parseAttachments(selectedComplaint.attachments)" :key="index" class="p-4 bg-gray-50 rounded-lg">
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
            <!-- Nom du fichier et lien de téléchargement -->
            <div class="mt-2 flex items-center justify-between">
              <span class="text-sm text-gray-600">{{ getFileName(attachment) }}</span>
              <a 
                :href="`/${attachment}`" 
                download 
                class="text-primary-600 hover:text-primary-900 text-sm font-medium"
              >
                Télécharger
              </a>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useEmployeeStore } from '@/stores/employees'
import { useComplaintStore } from '@/stores/complaints'
import { useToast } from '@/composables/useToast'
import Modal from '@/components/ui/modal.vue'
import EmployeeDashboard from '@/components/layout/EmployeeDashboard.vue'
import { DocumentIcon } from '@heroicons/vue/24/outline'
import type { EmployeeInfo } from '@/services/employee.service'
import type { Complaint, CreateComplaintDTO } from '@/services/complaint.service'

const employeeStore = useEmployeeStore()
const complaintStore = useComplaintStore()
const toast = useToast()

const employee = ref<EmployeeInfo | null>(null)
const complaints = ref<Complaint[]>([])
const loading = ref(true)
const error = ref<string | null>(null)
const showCreateModal = ref(false)
const showAttachmentsModal = ref(false)
const selectedComplaint = ref<Complaint | null>(null)

const complaintTypes = [
  { value: 'salaire', label: 'Salaire' },
  { value: 'prime', label: 'Prime' },
  { value: 'congé', label: 'Congé' },
  { value: 'autre', label: 'Autre' }
]

const form = ref<{
  type: string
  description: string
  periodStart: string
  periodEnd: string
  files: File[]
}>({
  type: '',
  description: '',
  periodStart: '',
  periodEnd: '',
  files: []
})

const formatDate = (date: string | number | Date | null) => {
  if (!date) return 'N/A';
  
  // Si c'est un timestamp en millisecondes (nombre)
  if (typeof date === 'number') {
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  }
  
  // Si c'est une chaîne de caractères
  if (typeof date === 'string') {
    // Si c'est un timestamp en millisecondes (chaîne)
    if (/^\d+$/.test(date)) {
      return format(new Date(parseInt(date)), 'dd/MM/yyyy', { locale: fr });
    }
    // Sinon, on suppose que c'est une date ISO
    return format(new Date(date), 'dd/MM/yyyy', { locale: fr });
  }
  
  // Si c'est déjà un objet Date
  return format(date, 'dd/MM/yyyy', { locale: fr });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return { text: 'En attente', class: 'bg-yellow-100 text-yellow-800' }
    case 'in_progress':
      return { text: 'En cours', class: 'bg-blue-100 text-blue-800' }
    case 'resolved':
      return { text: 'Résolu', class: 'bg-green-100 text-green-800' }
    default:
      return { text: status, class: 'bg-gray-100 text-gray-800' }
  }
}

const handleFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  if (input.files) {
    form.value.files = [...form.value.files, ...Array.from(input.files)]
  }
}

const removeFile = (index: number) => {
  form.value.files.splice(index, 1)
}

const openAttachmentsModal = (complaint: Complaint) => {
  selectedComplaint.value = complaint
  showAttachmentsModal.value = true
}

const isImageFile = (filename: string) => {
  return /\.(jpg|jpeg|png|gif)$/i.test(filename);
};

const isPdfFile = (filename: string) => {
  return /\.pdf$/i.test(filename);
};

const getFileName = (path: string) => {
  return path.split('/').pop() || path;
};

const parseAttachments = (attachments: string | null): string[] => {
  if (!attachments) return [];
  try {
    const parsed = JSON.parse(attachments);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erreur lors du parsing des pièces jointes:', e);
    return [];
  }
};

const handleSubmit = async () => {
  try {
    // Validation des champs requis
    if (!form.value.type || !form.value.description || !form.value.periodStart || !form.value.periodEnd) {
      toast.error({
        title: 'Erreur',
        message: 'Veuillez remplir tous les champs obligatoires'
      })
      return
    }

    // Validation des dates
    const startDate = new Date(form.value.periodStart)
    const endDate = new Date(form.value.periodEnd)

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      toast.error({
        title: 'Erreur',
        message: 'Les dates saisies sont invalides'
      })
      return
    }

    if (endDate < startDate) {
      toast.error({
        title: 'Erreur',
        message: 'La date de fin doit être postérieure à la date de début'
      })
      return
    }

    const complaint: CreateComplaintDTO = {
      type: form.value.type,
      description: form.value.description,
      periodStart: startDate.getTime(),
      periodEnd: endDate.getTime(),
      attachments: form.value.files
    }

    await complaintStore.createComplaint(complaint)
    showCreateModal.value = false
    form.value = {
      type: '',
      description: '',
      periodStart: '',
      periodEnd: '',
      files: []
    }
  } catch (err) {
    console.error('Erreur lors de la création de la réclamation:', err)
    toast.error({
      title: 'Erreur',
      message: err instanceof Error ? err.message : 'Une erreur est survenue lors de la création de la réclamation'
    })
  }
}

onMounted(async () => {
  try {
    loading.value = true
    error.value = null
    
    // Charger les informations de l'employé
    const response = await employeeStore.fetchCurrentEmployee()
    employee.value = response.employee
    
    // Charger les réclamations
    await complaintStore.fetchMyComplaints()
    complaints.value = complaintStore.complaints
  } catch (err) {
    console.error('Erreur lors du chargement des données:', err)
    error.value = err instanceof Error ? err.message : 'Impossible de charger les données'
  } finally {
    loading.value = false
  }
})
</script> 