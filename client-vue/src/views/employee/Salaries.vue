<template>
  <div class="space-y-6">
    <!-- Tableau de bord -->
    <EmployeeDashboard :employee="employee" />

    <!-- En-tête avec filtre et bouton d'export -->
    <div class="sm:flex sm:items-center sm:justify-between">
      <div>
        <h3 class="text-lg font-medium leading-6 text-gray-900">Historique des Soldes d'Avancement</h3>
        <p class="mt-2 text-sm text-gray-700">
          Consultez vos soldes d'avancement et rappels par période.
        </p>
      </div>
      <div class="mt-4 sm:mt-0 sm:flex sm:items-center space-x-4">
        <!-- Filtre par année avec affichage direct -->
        <div class="relative">
          <select
            v-model="selectedYear"
            class="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            @change="handleYearChange"
          >
            <option value="">Toutes les années</option>
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <div class="mt-1 text-xs text-gray-500">
            Année sélectionnée: {{ selectedYear || 'Toutes' }}
          </div>
        </div>

        <!-- Bouton d'export -->
        <button
          @click="handleExportPDF"
          :disabled="isExporting"
          type="button"
          class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg v-if="!isExporting" class="-ml-0.5 mr-1.5 h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          <svg v-else class="animate-spin -ml-0.5 mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isExporting ? 'Export en cours...' : 'Exporter PDF' }}
        </button>
      </div>
    </div>

    <!-- Tableau des soldes -->
    <div class="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
      <table class="min-w-full divide-y divide-gray-300">
        <thead>
          <tr>
            <th scope="col" class="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Période</th>
            <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Durée (jours)</th>
            <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Salaire de base</th>
            <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Indemnité</th>
            <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">CNSS</th>
            <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">IPTS</th>
            <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Net</th>
            <th scope="col" class="px-3 py-3.5 text-right text-sm font-semibold text-gray-900">Rappels dus</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          <tr v-for="salary in filteredSalaries" :key="salary.id" class="hover:bg-gray-50">
            <td class="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
              {{ formatPeriod(salary.startDate, salary.endDate) }}
            </td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{{ salary.duration }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">{{ formatCurrency(salary.baseSalary) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">{{ formatCurrency(salary.allowance) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">{{ formatCurrency(salary.cnss) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-right text-gray-900">{{ formatCurrency(salary.ipts) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-gray-900">{{ formatCurrency(salary.net) }}</td>
            <td class="whitespace-nowrap px-3 py-4 text-sm text-right font-medium text-green-600">{{ formatCurrency(salary.dueAmount) }}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t border-gray-900/5 bg-gray-50">
            <th
              scope="row"
              colspan="7"
              class="hidden pl-4 pr-3 pt-4 text-right text-sm font-semibold text-gray-900 sm:table-cell sm:pl-6"
          >
              Total Rappel
            </th>
            <td class="pl-3 pr-4 pt-4 text-right text-sm font-semibold text-green-600 sm:pr-6">
              {{ formatCurrency(totalDue) }}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import EmployeeDashboard from '@/components/layout/EmployeeDashboard.vue'
import { useEmployeeStore } from '@/stores/employees'
import { useToast } from '@/composables/useToast'
import { employeeService, type EmployeeInfo } from '@/services/employee.service'
import { exportSalaryReport } from '@/utils/pdf-export'
import type { Salary } from '@/types'

const employeeStore = useEmployeeStore()
const toast = useToast()

const employee = ref<EmployeeInfo | null>(null)
const salaries = ref<Salary[]>([])
const selectedYear = ref('')
const isExporting = ref(false)

// Fonction pour convertir les dates
const convertDateToTimestamp = (date: string | number): number => {
  // Si c'est déjà un nombre, le retourner directement
  if (typeof date === 'number') {
    return date;
  }
  
  // Si c'est une chaîne qui représente un nombre, la convertir en nombre
  if (typeof date === 'string' && /^\d+$/.test(date)) {
    return parseInt(date, 10);
  }
  
  // Sinon, essayer de parser comme une date
  try {
    const timestamp = new Date(date).getTime();
    return isNaN(timestamp) ? Date.now() : timestamp;
  } catch (e) {
    return Date.now();
  }
};

// Années disponibles (hardcodées pour le moment)
const availableYears = computed(() => {
  // Années hardcodées pour garantir l'affichage
  const hardcodedYears = ["2023", "2024", "2025"];
  
  // Extraire les années des périodes des salaires
  const extractedYears = new Set<string>();
  
  if (salaries.value && salaries.value.length > 0) {
    salaries.value.forEach(salary => {
      // Essayer d'extraire l'année de la période
      if (salary.period && typeof salary.period === 'string' && salary.period.includes('-')) {
        const year = salary.period.split('-')[0];
        if (year && /^\d{4}$/.test(year)) {
          extractedYears.add(year);
          console.log(`Année extraite de la période '${salary.period}': ${year}`);
        }
      }
      // Si pas de période, essayer avec la date de début
      else if (salary.startDate) {
        try {
          let year: string | null = null;
          
          if (typeof salary.startDate === 'string') {
            if (salary.startDate.includes('-')) {
              // Format "2025-06-15"
              year = salary.startDate.split('-')[0];
            } else {
              // Timestamp en string
              const date = new Date(Number(salary.startDate));
              if (!isNaN(date.getTime())) {
                year = date.getFullYear().toString();
              }
            }
          } else if (typeof salary.startDate === 'number') {
            // Timestamp en nombre
            const date = new Date(salary.startDate);
            if (!isNaN(date.getTime())) {
              year = date.getFullYear().toString();
            }
          }
          
          if (year && /^\d{4}$/.test(year)) {
            extractedYears.add(year);
            console.log(`Année extraite de la date de début: ${year}`);
          }
        } catch (e) {
          console.error("Erreur lors de l'extraction de l'année:", e);
        }
      }
    });
  }
  
  console.log("Années extraites:", Array.from(extractedYears));
  
  // Si on a trouvé des années, les utiliser, sinon utiliser les années hardcodées
  return extractedYears.size > 0 
    ? Array.from(extractedYears).sort((a, b) => b.localeCompare(a))
    : hardcodedYears;
});

// Filtrer les salaires par année
const filteredSalaries = computed(() => {
  // Si aucune année n'est sélectionnée, retourner tous les salaires
  if (!selectedYear.value) return salaries.value;
  
  console.log('Filtrage pour l\'année:', selectedYear.value, 'type:', typeof selectedYear.value);
  
  // Normaliser l'année sélectionnée (enlever les espaces et convertir en string)
  const yearToFilter = String(selectedYear.value).trim();
  console.log('Année à filtrer (normalisée):', yearToFilter);
  
  const filtered = salaries.value.filter(salary => {
    // Essayer d'abord avec le champ période
    if (salary.period && typeof salary.period === 'string') {
      // Format peut être "YYYY-MM" ou "MMM YYYY"
      let salaryYear = '';
      
      if (salary.period.includes('-')) {
        // Format "YYYY-MM"
        const periodParts = salary.period.split('-');
        if (periodParts.length >= 1) {
          salaryYear = periodParts[0].trim();
        }
      } else {
        // Format "MMM YYYY" (ex: "mai 2025")
        const periodParts = salary.period.trim().split(' ');
        if (periodParts.length >= 2) {
          salaryYear = periodParts[periodParts.length - 1].trim();
        }
      }
      
      const match = salaryYear === yearToFilter;
      
      console.log(`Vérification période - ID: ${salary.id}, période: ${salary.period}, année extraite: ${salaryYear}, égalité avec ${yearToFilter}: ${match}`);
      
      if (match) {
        console.log(`Salaire correspondant trouvé via période - ID: ${salary.id}, Période: ${salary.period}`);
        return true;
      }
    }
    
    // Si pas de période ou pas de correspondance, essayer avec la date de début
    try {
      let year: string | null = null;
      
      if (typeof salary.startDate === 'string') {
        if (salary.startDate.includes('-')) {
          // Format "2025-06-15"
          year = salary.startDate.split('-')[0].trim();
        } else {
          // Timestamp en string
          const date = new Date(Number(salary.startDate));
          if (!isNaN(date.getTime())) {
            year = date.getFullYear().toString().trim();
          }
        }
      } else if (typeof salary.startDate === 'number') {
        // Timestamp en nombre
        const date = new Date(salary.startDate);
        if (!isNaN(date.getTime())) {
          year = date.getFullYear().toString().trim();
        }
      }
      
      if (year) {
        const match = year === yearToFilter;
        
        console.log(`Vérification date - ID: ${salary.id}, année extraite: ${year}, égalité avec ${yearToFilter}: ${match}`);
        
        if (match) {
          console.log(`Salaire correspondant trouvé via date - ID: ${salary.id}, Année: ${year}`);
          return true;
        }
      }
      
      return false;
    } catch (e) {
      console.error('Erreur lors du filtrage d\'un salaire:', e);
      return false;
    }
  });
  
  console.log(`${filtered.length} salaires trouvés pour l'année ${yearToFilter}`);
  return filtered;
});

// Calculer le total des rappels dus
const totalDue = computed(() => {
  return filteredSalaries.value.reduce((sum, salary) => sum + (salary.dueAmount || 0), 0)
})

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatPeriod = (startDate: string | number, endDate: string | number) => {
  const formatTimestamp = (timestamp: string | number | null): string => {
    if (!timestamp) return '-';
    
    try {
      // Convertir en nombre
      let timeInMs = typeof timestamp === 'number' ? timestamp : Number(timestamp);
      
      // Si le timestamp est en microsecondes (plus de 13 chiffres), convertir en millisecondes
      if (timeInMs > 999999999999) {
        timeInMs = Math.floor(timeInMs / 1000);
      }
      
      const dateObj = new Date(timeInMs);
      
      // Vérification si la date est valide
      if (isNaN(dateObj.getTime())) {
        console.error('Date invalide après conversion:', { timestamp, timeInMs, dateObj });
        return '-';
      }

      return format(dateObj, 'dd/MM/yyyy', { locale: fr });
  } catch (error) {
      console.error('Erreur de formatage de date:', { timestamp, error });
      return '-';
    }
  };

  const startFormatted = formatTimestamp(startDate);
  const endFormatted = formatTimestamp(endDate);
  
  if (startFormatted === '-' || endFormatted === '-') {
    console.warn('Problème de formatage des dates:', { startDate, endDate });
    return 'Période invalide';
  }
  
  return `${startFormatted} - ${endFormatted}`;
}

const handleExportPDF = async () => {
  try {
    if (!employee.value) {
      toast.error({
        title: 'Erreur',
        message: 'Données de l\'employé non disponibles'
      });
      return;
    }

    isExporting.value = true;
    
    // Préparer les données pour l'export
    const employeeInfo = {
      fullName: `${employee.value.lastName} ${employee.value.firstName}`,
      matricule: employee.value.matricule,
      grade: employee.value.grade,
      service: employee.value.service,
      department: employee.value.department
    } as const;

    const salaryData = filteredSalaries.value.map(salary => ({
      period: formatPeriod(salary.startDate, salary.endDate),
      duration: salary.duration,
      baseSalary: salary.baseSalary,
      allowance: salary.allowance,
      cnss: salary.cnss,
      ipts: salary.ipts,
      net: salary.net,
      dueAmount: salary.dueAmount
    }));

    const totalDue = filteredSalaries.value.reduce((sum, salary) => sum + (salary.dueAmount || 0), 0);
    
    // Utiliser la fonction d'export
    await exportSalaryReport({
      employee: employeeInfo,
      salaries: salaryData,
      totalDue: totalDue
    });
    
    toast.success({
      title: 'Succès',
      message: 'Le PDF a été généré avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'export PDF:', error);
    toast.error({
      title: 'Erreur',
      message: 'Impossible de générer le PDF. Veuillez réessayer plus tard.'
    });
  } finally {
    isExporting.value = false;
  }
}

const debugYears = () => {
  console.log('Années disponibles:', availableYears.value);
}

// Gérer le changement d'année
const handleYearChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const value = target.value.trim(); // Supprimer les espaces
  
  console.log('Année sélectionnée changée:', value);
  console.log('Type de l\'année sélectionnée:', typeof value);
  
  // Si la valeur est vide, afficher tous les salaires
  if (!value) {
    selectedYear.value = '';
    return;
  }
  
  // Convertir la valeur en nombre pour le débogage
  const yearNumber = parseInt(value, 10);
  
  if (isNaN(yearNumber)) {
    console.error('Année invalide sélectionnée:', value);
    return;
  }
  
  console.log('Année convertie en nombre:', yearNumber);
  selectedYear.value = value; // Stocker la valeur comme string
  
  // Afficher des informations sur les salaires filtrés
  setTimeout(() => {
    const filtered = filteredSalaries.value;
    console.log(`${filtered.length} salaires trouvés pour l'année ${value}`);
    
    if (filtered.length === 0) {
      console.log('Aucun salaire trouvé pour cette année. Vérification des données:');
      console.log('Année recherchée:', value, 'type:', typeof value);
      
      salaries.value.forEach(salary => {
        // Vérifier les périodes
        if (salary.period) {
          const periodYear = salary.period.split('-')[0].trim();
          console.log(`Salaire ID ${salary.id} - période: ${salary.period}, année extraite: ${periodYear}, type: ${typeof periodYear}, égalité: ${periodYear === value}, égalité stricte: ${periodYear === value}`);
        }
        
        // Vérifier les dates de début
        try {
          let extractedYear = null;
          
          if (typeof salary.startDate === 'string') {
            if (salary.startDate.includes('-')) {
              extractedYear = salary.startDate.split('-')[0].trim();
            } else {
              extractedYear = new Date(Number(salary.startDate)).getFullYear().toString().trim();
            }
          } else if (typeof salary.startDate === 'number') {
            extractedYear = new Date(salary.startDate).getFullYear().toString().trim();
          }
          
          if (extractedYear) {
            console.log(`Salaire ID ${salary.id} - startDate: ${salary.startDate}, année extraite: ${extractedYear}, type: ${typeof extractedYear}, égalité: ${extractedYear === value}, égalité stricte: ${extractedYear === value}`);
          }
        } catch (e) {
          console.error(`Erreur lors de l'analyse de la date de début du salaire ${salary.id}:`, e);
        }
      });
    }
  }, 100);
};

onMounted(async () => {
  try {
    // Charger les données de l'employé
    const data = await employeeStore.fetchCurrentEmployee();
    employee.value = data.employee;
    
    // Charger les salaires depuis l'API
    const salaryData = await employeeStore.fetchSalaries();
    console.log('Salaires chargés:', salaryData.length);
    
    // Vérifier si les données contiennent déjà le champ période
    const hasPeriodField = salaryData.some(s => s.period);
    console.log('Les données contiennent déjà le champ période:', hasPeriodField);
    
    // Normaliser les salaires pour garantir la cohérence
    const normalizedSalaries = salaryData.map(salary => {
      // Créer une copie du salaire pour éviter de modifier l'objet original
      const normalizedSalary = { ...salary };
      
      // Analyser la période si elle existe déjà
      if (normalizedSalary.period && typeof normalizedSalary.period === 'string') {
        // Déterminer le format de la période
        if (normalizedSalary.period.includes('-')) {
          // Format "YYYY-MM" - déjà correct
          console.log(`Période au format YYYY-MM: ${normalizedSalary.period}`);
        } else {
          // Format "MMM YYYY" (ex: "mai 2025")
          const periodParts = normalizedSalary.period.trim().split(' ');
          if (periodParts.length >= 2) {
            // Ne pas modifier le format, il sera géré par le filtrage
            console.log(`Période au format MMM YYYY: ${normalizedSalary.period}`);
          }
        }
      }
      // Sinon, essayer de générer une période à partir des dates
      else {
        try {
          let period = '';
          
          if (typeof salary.startDate === 'string') {
            if (salary.startDate.includes('-')) {
              // Format "2025-06-15" -> "YYYY-MM"
              const parts = salary.startDate.split('-');
              if (parts.length >= 2) {
                period = `${parts[0].trim()}-${parts[1].trim()}`;
              }
            } else {
              // Timestamp en string
              const date = new Date(Number(salary.startDate));
              if (!isNaN(date.getTime())) {
                // Utiliser le format français pour la période
                const month = date.toLocaleDateString('fr-FR', { month: 'short' });
                const year = date.getFullYear();
                period = `${month} ${year}`;
              }
            }
          } else if (typeof salary.startDate === 'number') {
            // Timestamp en nombre
            const date = new Date(salary.startDate);
            if (!isNaN(date.getTime())) {
              // Utiliser le format français pour la période
              const month = date.toLocaleDateString('fr-FR', { month: 'short' });
              const year = date.getFullYear();
              period = `${month} ${year}`;
            }
          }
          
          if (period) {
            console.log(`Salaire ${salary.id} - période générée: ${period}`);
            normalizedSalary.period = period;
          }
        } catch (e) {
          console.error(`Erreur lors de la normalisation du salaire ${salary.id}:`, e);
        }
      }
      
      return normalizedSalary;
    });
    
    // Assigner les données normalisées
    salaries.value = normalizedSalaries;
    
    // Afficher les données normalisées pour débogage
    console.log('Salaires normalisés:');
    normalizedSalaries.forEach(s => {
      console.log(`ID: ${s.id}, Période: ${s.period || 'non définie'}, StartDate: ${s.startDate}`);
    });
    
    // Définir l'année par défaut (année la plus récente)
    if (normalizedSalaries.length > 0) {
      const years = new Set<string>();
      
      // Collecter toutes les années disponibles
      normalizedSalaries.forEach(salary => {
        // D'abord essayer avec la période
        if (salary.period && typeof salary.period === 'string') {
          let year = '';
          
          if (salary.period.includes('-')) {
            // Format "YYYY-MM"
            year = salary.period.split('-')[0].trim();
          } else {
            // Format "MMM YYYY" (ex: "mai 2025")
            const periodParts = salary.period.trim().split(' ');
            if (periodParts.length >= 2) {
              year = periodParts[periodParts.length - 1].trim();
            }
          }
          
          if (year && /^\d{4}$/.test(year)) {
            years.add(year);
          }
        }
        // Sinon essayer avec la date de début
        else if (salary.startDate) {
          try {
            let year: string | null = null;
            
            if (typeof salary.startDate === 'string') {
              if (salary.startDate.includes('-')) {
                year = salary.startDate.split('-')[0].trim();
              } else {
                const date = new Date(Number(salary.startDate));
                if (!isNaN(date.getTime())) {
                  year = date.getFullYear().toString().trim();
                }
              }
            } else if (typeof salary.startDate === 'number') {
              const date = new Date(salary.startDate);
              if (!isNaN(date.getTime())) {
                year = date.getFullYear().toString().trim();
              }
            }
            
            if (year && /^\d{4}$/.test(year)) {
              years.add(year);
            }
          } catch (e) {
            console.error('Erreur lors de l\'extraction d\'année:', e);
          }
        }
      });
      
      if (years.size > 0) {
        const sortedYears = Array.from(years).sort((a, b) => b.localeCompare(a));
        selectedYear.value = sortedYears[0];
        console.log('Année par défaut définie:', selectedYear.value);
      } else {
        // Si aucune année n'a été extraite, utiliser l'année en cours
        selectedYear.value = new Date().getFullYear().toString();
        console.log('Année par défaut définie (année courante):', selectedYear.value);
      }
    }
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    toast.error({
      title: 'Erreur',
      message: 'Impossible de charger les données'
    });
  }
});
</script> 