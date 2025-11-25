<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useForm } from 'vee-validate'
import * as yup from 'yup'
import { Employee } from '@/services/employee.service'
import { format } from 'date-fns'

const props = defineProps<{
  employee?: Employee
  initialValues?: any
  isEdit?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', values: any): void
  (e: 'cancel'): void
}>()

const schema = yup.object({
  matricule: yup.string().required('Le matricule est requis'),
  firstName: yup.string().required('Le prénom est requis'),
  lastName: yup.string().required('Le nom est requis'),
  email: yup.string().email('Email invalide').required('L\'email est requis'),
  grade: yup.string().required('Le grade est requis'),
  gradeIndex: yup.number().required('L\'indice est requis').min(0, 'L\'indice doit être positif'),
  service: yup.string().required('Le service est requis'),
  department: yup.string().required('Le département est requis'),
  entryDate: yup.string().required('La date d\'entrée est requise'),
  isActive: yup.boolean().default(true)
})

const defaultValues = {
  matricule: '',
  firstName: '',
  lastName: '',
  email: '',
  grade: '',
  gradeIndex: 0,
  service: '',
  department: '',
  entryDate: format(new Date(), 'yyyy-MM-dd'),
  isActive: true
}

const createInitialData = (sourceData: any) => {
  if (!sourceData) {
    return { ...defaultValues };
  }

  const formData = {
    matricule: sourceData.matricule || '',
    firstName: sourceData.firstName || '',
    lastName: sourceData.lastName || '',
    email: sourceData.email || '',
    grade: sourceData.grade || '',
    gradeIndex: sourceData.gradeIndex || 0,
    service: sourceData.service || '',
    department: sourceData.department || '',
    isActive: sourceData.isActive ?? true,
    entryDate: format(new Date(), 'yyyy-MM-dd')
  };

  if (sourceData.entryDate) {
    try {
      const timestamp = typeof sourceData.entryDate === 'number'
        ? sourceData.entryDate
        : new Date(sourceData.entryDate).getTime();
      
      if (!isNaN(timestamp)) {
        formData.entryDate = format(new Date(timestamp), 'yyyy-MM-dd');
      }
    } catch (error) {
      console.error('Erreur lors de la conversion de la date:', error);
    }
  }

  return formData;
}

const formState = ref(createInitialData(props.employee || props.initialValues));

const { handleSubmit, errors, values, setFieldValue } = useForm({
  validationSchema: schema,
  initialValues: formState.value
});

watch(formState, (newValues) => {
  Object.entries(newValues).forEach(([field, value]) => {
    setFieldValue(field, value);
  });
}, { deep: true });

watch(values, (newValues) => {
  formState.value = { ...newValues };
}, { deep: true });

watch(() => props.employee, (newEmployee) => {
  if (newEmployee) {
    const newValues = createInitialData(newEmployee);
    formState.value = newValues;
    Object.entries(newValues).forEach(([field, value]) => {
      setFieldValue(field, value);
    });
  }
}, { deep: true });

const onSubmit = handleSubmit((formValues) => {
  console.log('Formulaire - Valeurs initiales:', props.employee);
  console.log('Formulaire - Valeurs du formulaire:', values);
  console.log('Formulaire - Valeurs soumises:', formValues);
  
  const submissionData = {
    ...formValues,
    entryDate: new Date(formValues.entryDate).getTime(),
    gradeIndex: Number(formValues.gradeIndex)
  };
  
  console.log('Formulaire - Données formatées pour soumission:', submissionData);
  emit('submit', submissionData);
});

const cancel = () => {
  formState.value = createInitialData(null);
  emit('cancel')
}

const departments = [
  'IT',
  'Finance',
  'Commercial',
  'Operations',
  'Administration'
] as const

const services = {
  'IT': ['Développement', 'Design', 'Support'],
  'Finance': ['Comptabilité', 'Achats'],
  'Commercial': ['Marketing', 'Communication'],
  'Operations': ['Logistique', 'Qualité'],
  'Administration': ['Ressources Humaines']
} as const

const grades = [
  'A1',
  'A2',
  'A3',
  'B1',
  'B2',
  'B3'
] as const

const selectedDepartment = ref(props.employee?.department || '')
const availableServices = computed(() => 
  selectedDepartment.value ? services[selectedDepartment.value as keyof typeof services] : []
)

watch(selectedDepartment, (newDept) => {
  formState.value.department = newDept
  formState.value.service = ''
})

onMounted(() => {
  if (props.employee) {
    selectedDepartment.value = props.employee.department
  }
})
</script>

<template>
  <form @submit.prevent="onSubmit" class="space-y-6">
    <TransitionGroup
      name="scale-fade"
      tag="div"
      class="space-y-6"
    >
      <!-- Informations personnelles -->
      <div key="personal" class="card">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
          Informations personnelles
        </h3>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div class="form-group">
            <label for="matricule" class="form-label">Matricule</label>
            <input
              id="matricule"
              v-model="formState.matricule"
              type="text"
              class="form-input"
              :class="{ 'border-red-500': errors.matricule }"
              :disabled="isEdit"
            >
            <p v-if="errors.matricule" class="mt-1 text-sm text-red-600">
              {{ errors.matricule }}
            </p>
          </div>

          <div class="form-group">
            <label for="firstName" class="form-label">Prénom</label>
            <input
              id="firstName"
              v-model="formState.firstName"
              type="text"
              class="form-input"
              :class="{ 'border-red-500': errors.firstName }"
            >
            <p v-if="errors.firstName" class="mt-1 text-sm text-red-600">
              {{ errors.firstName }}
            </p>
          </div>

          <div class="form-group">
            <label for="lastName" class="form-label">Nom</label>
            <input
              id="lastName"
              v-model="formState.lastName"
              type="text"
              class="form-input"
              :class="{ 'border-red-500': errors.lastName }"
            >
            <p v-if="errors.lastName" class="mt-1 text-sm text-red-600">
              {{ errors.lastName }}
            </p>
          </div>

          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              v-model="formState.email"
              type="email"
              class="form-input"
              :class="{ 'border-red-500': errors.email }"
            >
            <p v-if="errors.email" class="mt-1 text-sm text-red-600">
              {{ errors.email }}
            </p>
          </div>
        </div>
      </div>

      <!-- Informations professionnelles -->
      <div key="professional" class="card">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-4">
          Informations professionnelles
        </h3>
        <div class="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
          <div class="form-group">
            <label for="grade" class="form-label">Grade</label>
            <select
              id="grade"
              v-model="formState.grade"
              class="form-select"
              :class="{ 'border-red-500': errors.grade }"
            >
              <option value="">Sélectionner un grade</option>
              <option v-for="grade in grades" :key="grade" :value="grade">
                {{ grade }}
              </option>
            </select>
            <p v-if="errors.grade" class="mt-1 text-sm text-red-600">
              {{ errors.grade }}
            </p>
          </div>

          <div class="form-group">
            <label for="gradeIndex" class="form-label">Indice</label>
            <input
              id="gradeIndex"
              v-model.number="formState.gradeIndex"
              type="number"
              min="0"
              class="form-input"
              :class="{ 'border-red-500': errors.gradeIndex }"
            >
            <p v-if="errors.gradeIndex" class="mt-1 text-sm text-red-600">
              {{ errors.gradeIndex }}
            </p>
          </div>

          <div class="form-group">
            <label for="department" class="form-label">Département</label>
            <select
              id="department"
              v-model="selectedDepartment"
              class="form-select"
              :class="{ 'border-red-500': errors.department }"
            >
              <option value="">Sélectionner un département</option>
              <option v-for="dept in departments" :key="dept" :value="dept">
                {{ dept }}
              </option>
            </select>
            <p v-if="errors.department" class="mt-1 text-sm text-red-600">
              {{ errors.department }}
            </p>
          </div>

          <div class="form-group">
            <label for="service" class="form-label">Service</label>
            <select
              id="service"
              v-model="formState.service"
              class="form-select"
              :class="{ 'border-red-500': errors.service }"
              :disabled="!selectedDepartment"
            >
              <option value="">Sélectionner un service</option>
              <option v-for="service in availableServices" :key="service" :value="service">
                {{ service }}
              </option>
            </select>
            <p v-if="errors.service" class="mt-1 text-sm text-red-600">
              {{ errors.service }}
            </p>
          </div>

          <div class="form-group">
            <label for="entryDate" class="form-label">Date d'entrée</label>
            <input
              id="entryDate"
              v-model="formState.entryDate"
              type="date"
              class="form-input"
              :class="{ 'border-red-500': errors.entryDate }"
            >
            <p v-if="errors.entryDate" class="mt-1 text-sm text-red-600">
              {{ errors.entryDate }}
            </p>
          </div>

          <div class="form-group">
            <label for="isActive" class="form-label flex items-center space-x-2">
            <input
              id="isActive"
                v-model="formState.isActive"
              type="checkbox"
                class="form-checkbox h-4 w-4 text-primary-600"
            >
              <span>Employé actif</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div key="actions" class="flex justify-end space-x-3">
        <button
          type="button"
          class="btn btn-secondary"
          @click="cancel"
        >
          Annuler
        </button>
        <button
          type="submit"
          class="btn btn-primary"
        >
          {{ props.isEdit ? 'Mettre à jour' : 'Créer' }}
        </button>
      </div>
    </TransitionGroup>
  </form>
</template> 