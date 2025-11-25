<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Paramètres des Taux</h1>

    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-lg font-semibold">Configuration des taux CNSS/IPTS par grade</h2>
        <div class="flex gap-2">
          <button @click="addNewRate" class="btn btn-sm btn-primary">
            Ajouter un grade
          </button>
          <button @click="resetRates" class="btn btn-sm btn-secondary">
            Réinitialiser
          </button>
        </div>
      </div>

      <div class="mb-4 p-4 bg-blue-50 rounded-md text-sm">
        <p>Ces taux sont utilisés automatiquement lors de la création des dossiers de solde pour calculer les déductions CNSS et IPTS en fonction du grade de l'employé.</p>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Grade
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CNSS (%)
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                IPTS (%)
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(rate, index) in rates" :key="index" :class="rate.isEditing ? 'bg-gray-50' : ''">
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="rate.isEditing">
                  <input type="text" v-model="rate.grade" class="form-input-sm" />
                </div>
                <div v-else class="text-sm text-gray-900">
                  {{ rate.grade }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="rate.isEditing">
                  <input type="number" v-model="rate.cnssRate" step="0.01" min="0" max="100" class="form-input-sm" />
                </div>
                <div v-else class="text-sm text-gray-900">
                  {{ rate.cnssRate }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div v-if="rate.isEditing">
                  <input type="number" v-model="rate.iptsRate" step="0.01" min="0" max="100" class="form-input-sm" />
                </div>
                <div v-else class="text-sm text-gray-900">
                  {{ rate.iptsRate }}%
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div v-if="rate.isEditing" class="flex gap-2">
                  <button @click="saveRate(index)" class="text-green-600 hover:text-green-900">
                    Sauvegarder
                  </button>
                  <button @click="cancelEdit(index)" class="text-gray-600 hover:text-gray-900">
                    Annuler
                  </button>
                </div>
                <div v-else class="flex gap-2">
                  <button @click="editRate(index)" class="text-blue-600 hover:text-blue-900">
                    Modifier
                  </button>
                  <button @click="deleteRate(index)" class="text-red-600 hover:text-red-900">
                    Supprimer
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="rates.length === 0">
              <td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">
                Aucun taux configuré
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="mt-4 flex justify-end">
        <button @click="saveAllRates" class="btn btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Sauvegarde en cours...' : 'Sauvegarder tous les changements' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { accountantService } from '@/services/accountant.service'
import { useToast } from '@/composables/useToast'

interface Rate {
  id?: number
  grade: string
  cnssRate: number
  iptsRate: number
  isEditing?: boolean
  isNew?: boolean
}

const { showToast } = useToast()
const isLoading = ref(false)
const rates = ref<Rate[]>([])
const originalRates = ref<Rate[]>([])

// Données fictives pour les taux
const mockRates = {
  cnss: [
    { grade: 'A', rate: 3.5, description: 'Direction générale' },
    { grade: 'B', rate: 3.2, description: 'Cadres supérieurs' },
    { grade: 'C', rate: 2.8, description: 'Cadres moyens' },
    { grade: 'D', rate: 2.5, description: 'Agents de maîtrise' },
    { grade: 'E', rate: 2.2, description: 'Employés qualifiés' },
    { grade: 'F', rate: 2.0, description: 'Employés' }
  ],
  ipts: [
    { grade: 'A', rate: 15.0, description: 'Direction générale' },
    { grade: 'B', rate: 12.0, description: 'Cadres supérieurs' },
    { grade: 'C', rate: 10.0, description: 'Cadres moyens' },
    { grade: 'D', rate: 8.0, description: 'Agents de maîtrise' },
    { grade: 'E', rate: 5.0, description: 'Employés qualifiés' },
    { grade: 'F', rate: 3.0, description: 'Employés' }
  ]
}

// Récupération des taux
const fetchRates = async () => {
  try {
    loading.value = true
    
    // En mode développement, utiliser les données fictives
    setTimeout(() => {
      cnssRates.value = mockRates.cnss
      iptsRates.value = mockRates.ipts
      loading.value = false
    }, 500)
    
    // En production, utiliser le service API
    // const data = await accountantService.getRates()
    // cnssRates.value = data.cnss
    // iptsRates.value = data.ipts
    // loading.value = false
  } catch (error) {
    console.error('Erreur lors de la récupération des taux:', error)
    loading.value = false
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger les taux CNSS et IPTS',
      type: 'error'
    })
  }
}

const addNewRate = () => {
  rates.value.push({
    grade: '',
    cnssRate: 3.6, // Valeur par défaut
    iptsRate: 12, // Valeur par défaut
    isEditing: true,
    isNew: true
  })
}

const editRate = (index: number) => {
  rates.value[index].isEditing = true
}

const cancelEdit = (index: number) => {
  if (rates.value[index].isNew) {
    rates.value.splice(index, 1)
  } else {
    // Restaurer les valeurs originales
    const original = originalRates.value.find(r => r.id === rates.value[index].id)
    if (original) {
      rates.value[index] = { ...original, isEditing: false }
    } else {
      rates.value[index].isEditing = false
    }
  }
}

const saveRate = async (index: number) => {
  const rate = rates.value[index]
  
  if (!rate.grade || rate.cnssRate < 0 || rate.iptsRate < 0) {
    showToast('Veuillez remplir correctement tous les champs', 'error')
    return
  }
  
  try {
    isLoading.value = true
    
    if (rate.isNew) {
      const newRate = await accountantService.createRate({
        grade: rate.grade,
        cnssRate: rate.cnssRate,
        iptsRate: rate.iptsRate
      })
      rates.value[index] = {
        ...newRate,
        isEditing: false,
        isNew: false
      }
    } else {
      const updatedRate = await accountantService.updateRate(rate.id!, {
        grade: rate.grade,
        cnssRate: rate.cnssRate,
        iptsRate: rate.iptsRate
      })
      rates.value[index] = {
        ...updatedRate,
        isEditing: false
      }
    }
    
    // Mettre à jour la copie originale
    originalRates.value = JSON.parse(JSON.stringify(rates.value))
    showToast('Taux enregistré avec succès', 'success')
  } catch (error) {
    showToast('Erreur lors de l\'enregistrement du taux', 'error')
  } finally {
    isLoading.value = false
  }
}

const deleteRate = async (index: number) => {
  const rate = rates.value[index]
  
  if (!confirm(`Êtes-vous sûr de vouloir supprimer le taux pour le grade ${rate.grade} ?`)) {
    return
  }
  
  try {
    isLoading.value = true
    
    if (!rate.isNew && rate.id) {
      await accountantService.deleteRate(rate.id)
    }
    
    rates.value.splice(index, 1)
    showToast('Taux supprimé avec succès', 'success')
  } catch (error) {
    showToast('Erreur lors de la suppression du taux', 'error')
  } finally {
    isLoading.value = false
  }
}

const saveAllRates = async () => {
  try {
    isLoading.value = true
    
    // Vérifier si tous les taux sont valides
    const invalidRate = rates.value.find(r => !r.grade || r.cnssRate < 0 || r.iptsRate < 0)
    if (invalidRate) {
      showToast('Certains taux sont invalides. Veuillez vérifier vos données.', 'error')
      return
    }
    
    // Enregistrer tous les taux modifiés
    await accountantService.saveAllRates(rates.value.filter(r => !r.isEditing))
    
    // Rafraîchir les données
    await fetchRates()
    showToast('Tous les taux ont été enregistrés avec succès', 'success')
  } catch (error) {
    showToast('Erreur lors de l\'enregistrement des taux', 'error')
  } finally {
    isLoading.value = false
  }
}

const resetRates = async () => {
  if (!confirm('Êtes-vous sûr de vouloir réinitialiser tous les taux ? Cette action ne peut pas être annulée.')) {
    return
  }
  
  try {
    isLoading.value = true
    await accountantService.resetRates()
    await fetchRates()
    showToast('Taux réinitialisés avec succès', 'success')
  } catch (error) {
    showToast('Erreur lors de la réinitialisation des taux', 'error')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchRates()
})
</script>

<style scoped>
.form-input-sm {
  @apply block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm;
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

