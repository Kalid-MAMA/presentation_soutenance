<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Rapports</h1>

    <div class="bg-white shadow rounded-lg p-6 mb-8">
      <h2 class="text-lg font-semibold mb-4">Générer un rapport</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Filtres -->
        <div class="space-y-4">
          <div class="form-group">
            <label class="form-label">Période</label>
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="text-xs text-gray-500">Du</label>
                <input type="date" v-model="filters.startDate" class="form-input" />
              </div>
              <div>
                <label class="text-xs text-gray-500">Au</label>
                <input type="date" v-model="filters.endDate" class="form-input" />
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">Matricule</label>
            <input type="text" v-model="filters.matricule" class="form-input" placeholder="Filtrer par matricule" />
          </div>
          
          <div class="form-group">
            <label class="form-label">Département</label>
            <select v-model="filters.department" class="form-input">
              <option value="">Tous les départements</option>
              <option v-for="dept in departments" :key="dept.id" :value="dept.id">{{ dept.name }}</option>
            </select>
          </div>
          
          <div class="form-group">
            <label class="form-label">Statut des paiements</label>
            <select v-model="filters.status" class="form-input">
              <option value="">Tous les statuts</option>
              <option value="paid">Payé</option>
              <option value="partially_paid">Partiellement payé</option>
              <option value="unpaid">Non payé</option>
            </select>
          </div>
        </div>
        
        <!-- Aperçu des données -->
        <div class="md:col-span-2">
          <div class="flex justify-between items-center mb-4">
            <h3 class="font-medium">Aperçu des données</h3>
            <div class="text-sm text-gray-500">{{ filteredDataCount }} enregistrements trouvés</div>
          </div>
          
          <div v-if="previewLoading" class="flex justify-center py-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
          </div>
          
          <div v-else-if="previewData.length > 0" class="overflow-x-auto border rounded-md">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matricule
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Département
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rappel
                  </th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="item in previewData" :key="item.id">
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ item.matricule }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ item.employeeName }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ item.department }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">{{ formatCurrency(item.recallAmount) }}</td>
                  <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <span :class="getStatusClass(item.status)" class="px-2 py-1 text-xs rounded-full">
                      {{ getStatusText(item.status) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <div v-else class="text-center py-8 text-gray-500 border rounded-md">
            Aucune donnée disponible avec les filtres actuels
          </div>
          
          <div class="mt-4 flex justify-end gap-2">
            <button @click="generateReport('excel')" class="btn btn-secondary" :disabled="isGenerating || previewData.length === 0">
              <span v-if="isGenerating && reportFormat === 'excel'">Génération...</span>
              <span v-else>Exporter Excel</span>
            </button>
            <button @click="generateReport('pdf')" class="btn btn-primary" :disabled="isGenerating || previewData.length === 0">
              <span v-if="isGenerating && reportFormat === 'pdf'">Génération...</span>
              <span v-else>Exporter PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Rapports récents -->
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-lg font-semibold mb-4">Rapports récents</h2>
      
      <div v-if="reportsLoading" class="flex justify-center py-8">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-900"></div>
      </div>
      
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Titre
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Filtres
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Créé par
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="report in recentReports" :key="report.id">
              <td class="px-4 py-3 whitespace-nowrap text-sm">{{ formatDate(report.createdAt) }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm font-medium">{{ report.title }}</td>
              <td class="px-4 py-3 text-sm">
                <div class="text-xs text-gray-500">
                  <div v-if="report.filters.startDate && report.filters.endDate">
                    Période: {{ formatDate(report.filters.startDate) }} - {{ formatDate(report.filters.endDate) }}
                  </div>
                  <div v-if="report.filters.matricule">
                    Matricule: {{ report.filters.matricule }}
                  </div>
                  <div v-if="report.filters.department">
                    Département: {{ getDepartmentName(report.filters.department) }}
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">{{ report.createdBy }}</td>
              <td class="px-4 py-3 whitespace-nowrap text-sm">
                <div class="flex gap-2">
                  <button @click="downloadReport(report.id, 'pdf')" class="text-blue-600 hover:text-blue-900">
                    PDF
                  </button>
                  <button @click="downloadReport(report.id, 'excel')" class="text-green-600 hover:text-green-900">
                    Excel
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="recentReports.length === 0">
              <td colspan="5" class="px-4 py-3 text-center text-sm text-gray-500">
                Aucun rapport récent
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { accountantService } from '@/services/accountant.service'
import { useToast } from '@/composables/useToast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const { showToast } = useToast()
const isLoading = ref(false)
const previewLoading = ref(false)
const reportsLoading = ref(false)
const isGenerating = ref(false)
const reportFormat = ref('')

// Données
const previewData = ref([])
const reportPreview = ref<any>(null)
const filteredDataCount = ref(0)
const recentReports = ref([])

// Départements
const departments = ref([
  { id: 1, name: 'Ressources Humaines' },
  { id: 2, name: 'Finance' },
  { id: 3, name: 'Marketing' },
  { id: 4, name: 'Technique' },
  { id: 5, name: 'Commercial' }
])

// Filtres
const filters = ref({
  startDate: format(new Date(new Date().setMonth(new Date().getMonth() - 1)), 'yyyy-MM-dd'),
  endDate: format(new Date(), 'yyyy-MM-dd'),
  matricule: '',
  department: '',
  status: ''
})

// Données fictives pour l'aperçu des rapports
const mockPreviewData = [
  { id: 1, matricule: 'EMP-001', employeeName: 'Jean Dupont', department: 'Finance', recallAmount: 75000, status: 'unpaid' },
  { id: 2, matricule: 'EMP-002', employeeName: 'Marie Martin', department: 'RH', recallAmount: 45000, status: 'paid' },
  { id: 3, matricule: 'EMP-003', employeeName: 'Paul Bernard', department: 'Technique', recallAmount: 60000, status: 'partially_paid' },
  { id: 4, matricule: 'EMP-004', employeeName: 'Sophie Petit', department: 'Marketing', recallAmount: 35000, status: 'unpaid' },
  { id: 5, matricule: 'EMP-005', employeeName: 'Thomas Leroy', department: 'Finance', recallAmount: 25000, status: 'paid' },
  { id: 6, matricule: 'EMP-006', employeeName: 'Julie Moreau', department: 'Direction', recallAmount: 90000, status: 'unpaid' },
  { id: 7, matricule: 'EMP-007', employeeName: 'Nicolas Dubois', department: 'Technique', recallAmount: 55000, status: 'partially_paid' },
  { id: 8, matricule: 'EMP-008', employeeName: 'Céline Laurent', department: 'RH', recallAmount: 40000, status: 'paid' }
]

// Données fictives pour les rapports récents
const mockRecentReports = [
  { 
    id: 1, 
    title: 'Rapport Trimestriel T1 2025', 
    createdAt: '2025-04-05T10:30:00Z', 
    createdBy: 'Comptable Principal',
    filters: { 
      startDate: '2025-01-01', 
      endDate: '2025-03-31', 
      department: 1 
    }
  },
  { 
    id: 2, 
    title: 'Rappels Impayés Juin 2025', 
    createdAt: '2025-06-10T14:45:00Z', 
    createdBy: 'Comptable Principal',
    filters: { 
      startDate: '2025-06-01', 
      endDate: '2025-06-30', 
      status: 'unpaid' 
    }
  },
  { 
    id: 3, 
    title: 'Rapport Département Technique', 
    createdAt: '2025-05-20T09:15:00Z', 
    createdBy: 'Comptable Principal',
    filters: { 
      department: 4 
    }
  },
  { 
    id: 4, 
    title: 'Analyse Semestrielle S1 2025', 
    createdAt: '2025-07-03T11:20:00Z', 
    createdBy: 'Comptable Principal',
    filters: { 
      startDate: '2025-01-01', 
      endDate: '2025-06-30' 
    }
  },
  { 
    id: 5, 
    title: 'Rapport des rappels par service', 
    createdAt: '2025-06-25T16:40:00Z', 
    createdBy: 'Directeur Financier',
    filters: { 
      startDate: '2025-01-01', 
      endDate: '2025-06-30',
      department: 2
    }
  }
]

// Fonction pour obtenir le nom du département à partir de son ID
const getDepartmentName = (departmentId: number) => {
  const department = departments.value.find(d => d.id === departmentId)
  return department ? department.name : 'Inconnu'
}

// Récupérer l'aperçu des données selon les filtres
const fetchPreviewData = async () => {
  try {
    previewLoading.value = true
    
    // En mode développement, utiliser les données fictives
    setTimeout(() => {
      // Filtrer les données fictives selon les filtres
      const filtered = mockPreviewData.filter(item => {
        let match = true
        
        if (filters.matricule && !item.matricule.includes(filters.matricule)) {
          match = false
        }
        
        if (filters.department && item.department !== getDepartmentName(parseInt(filters.department))) {
          match = false
        }
        
        if (filters.status && item.status !== filters.status) {
          match = false
        }
        
        return match
      })
      
      previewData.value = filtered
      filteredDataCount.value = filtered.length
      previewLoading.value = false
    }, 500)
    
    // En production, utiliser le service API
    // const data = await accountantService.getReportPreview({
    //   startDate: filters.startDate,
    //   endDate: filters.endDate,
    //   matricule: filters.matricule,
    //   department: filters.department,
    //   status: filters.status
    // })
    // reportPreview.value = data
    // previewLoading.value = false
  } catch (error) {
    console.error('Erreur lors de la récupération des données d\'aperçu:', error)
    previewLoading.value = false
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger les données d\'aperçu',
      type: 'error'
    })
  }
}

// Récupérer les rapports récents
const fetchRecentReports = async () => {
  try {
    reportsLoading.value = true
    
    // En mode développement, utiliser les données fictives
    setTimeout(() => {
      recentReports.value = mockRecentReports
      reportsLoading.value = false
    }, 500)
    
    // En production, utiliser le service API
    // const data = await accountantService.getRecentReports()
    // recentReports.value = data
    // reportsLoading.value = false
  } catch (error) {
    console.error('Erreur lors de la récupération des rapports récents:', error)
    reportsLoading.value = false
    showToast({
      title: 'Erreur',
      message: 'Impossible de charger les rapports récents',
      type: 'error'
    })
  }
}

// Générer un rapport
const generateReport = async (format) => {
  try {
    isGenerating.value = true
    reportFormat.value = format
    
    const reportTitle = `Rapport ${filters.value.startDate ? `du ${formatDate(filters.value.startDate)}` : ''} ${filters.value.endDate ? `au ${formatDate(filters.value.endDate)}` : ''} ${filters.value.matricule ? `- Matricule ${filters.value.matricule}` : ''}`
    
    // Préparer les données pour l'export
    const data = previewData.value.map(item => ({
      matricule: item.matricule,
      employeeName: item.employeeName,
      department: item.department,
      recallAmount: item.recallAmount,
      status: getStatusText(item.status)
    }))
    
    // Exporter selon le format
    if (format === 'excel') {
      import('@/utils/excel-export').then(module => {
        const columns = [
          { header: 'Matricule', dataKey: 'matricule', width: 15 },
          { header: 'Nom', dataKey: 'employeeName', width: 25 },
          { header: 'Département', dataKey: 'department', width: 20 },
          { header: 'Rappel', dataKey: 'recallAmount', width: 15, format: (value) => Number(value) },
          { header: 'Statut', dataKey: 'status', width: 15 }
        ]
        
        module.exportToExcel(columns, data, {
          filename: `rapport-${new Date().getTime()}.xlsx`,
          sheetName: 'Rapport'
        })
        
        showToast({
          title: 'Succès',
          message: 'Rapport exporté en Excel',
          type: 'success'
        })
      }).catch(error => {
        console.error('Erreur lors de l\'export Excel:', error)
        showToast({
          title: 'Erreur',
          message: 'Impossible d\'exporter le rapport en Excel',
          type: 'error'
        })
      })
    } else if (format === 'pdf') {
      // Utiliser un import dynamique pour éviter les problèmes de chargement
      import('@/utils/pdf-export').then(module => {
        const columns = [
          { header: 'Matricule', dataKey: 'matricule' },
          { header: 'Nom', dataKey: 'employeeName' },
          { header: 'Département', dataKey: 'department' },
          { header: 'Rappel', dataKey: 'recallAmount', format: (value) => new Intl.NumberFormat('fr-FR').format(value) },
          { header: 'Statut', dataKey: 'status' }
        ]
        
        // Utiliser la fonction exportToPDF du module
        module.exportToPDF(columns, data, {
          filename: `rapport-${new Date().getTime()}.pdf`,
          title: reportTitle,
          subtitle: `Généré le ${formatDate(new Date())}`,
          orientation: 'landscape'
        })
        
        showToast({
          title: 'Succès',
          message: 'Rapport exporté en PDF',
          type: 'success'
        })
      }).catch(error => {
        console.error('Erreur lors de l\'export PDF:', error)
        showToast({
          title: 'Erreur',
          message: 'Impossible d\'exporter le rapport en PDF',
          type: 'error'
        })
      })
    }
    
    // Rafraîchir la liste des rapports récents
    fetchRecentReports()
  } catch (error) {
    console.error('Erreur lors de la génération du rapport:', error)
    showToast({
      title: 'Erreur',
      message: `Impossible de générer le rapport en ${format === 'pdf' ? 'PDF' : 'Excel'}`,
      type: 'error'
    })
  } finally {
    isGenerating.value = false
  }
}

// Télécharger un rapport existant
const downloadReport = (reportId, format) => {
  try {
    // Pour le développement, simuler un téléchargement
    showToast({
      title: 'Information',
      message: `Téléchargement du rapport #${reportId} en ${format.toUpperCase()} (simulation)`,
      type: 'info'
    })
    
    // En production, utiliser le service API
    // const blob = await accountantService.downloadReport(reportId, format)
    // const url = window.URL.createObjectURL(blob)
    // const a = document.createElement('a')
    // a.href = url
    // a.download = `rapport-${reportId}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    // document.body.appendChild(a)
    // a.click()
    // window.URL.revokeObjectURL(url)
    // document.body.removeChild(a)
  } catch (error) {
    console.error('Erreur lors du téléchargement du rapport:', error)
    showToast({
      title: 'Erreur',
      message: 'Impossible de télécharger le rapport',
      type: 'error'
    })
  }
}

// Utilitaires
const formatDate = (dateString) => {
  return format(new Date(dateString), 'dd/MM/yyyy', { locale: fr })
}

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR').format(value) + ' FCFA'
}

const getStatusClass = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800'
    case 'partially_paid':
      return 'bg-yellow-100 text-yellow-800'
    case 'unpaid':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status) => {
  switch (status) {
    case 'paid':
      return 'Payé'
    case 'partially_paid':
      return 'Partiellement payé'
    case 'unpaid':
      return 'Non payé'
    default:
      return status
  }
}

// Surveiller les changements de filtres pour mettre à jour l'aperçu
watch(filters, () => {
  fetchPreviewData()
}, { deep: true })

onMounted(() => {
  fetchPreviewData()
  fetchRecentReports()
})
</script>

<style scoped>
.form-input {
  @apply mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.btn {
  @apply px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2;
}

.btn-primary {
  @apply bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300 focus:ring-gray-500;
}
</style> 
