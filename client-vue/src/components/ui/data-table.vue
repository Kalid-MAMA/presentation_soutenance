<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from '@heroicons/vue/20/solid'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (item: any) => any
  formatter?: (value: any) => string
}

interface Props {
  columns: Column[]
  data: any[]
  loading?: boolean
  sortable?: boolean
  searchable?: boolean
  pagination?: boolean | object
  itemsPerPage?: number
  total?: number
  currentPage?: number
  sortBy?: string
  sortDesc?: boolean
}

interface Emits {
  (e: 'page-change', value: number): void
  (e: 'sort-change', value: { key: string; desc: boolean }): void
  (e: 'update:currentPage', value: number): void
  (e: 'update:sortBy', value: string): void
  (e: 'update:sortDesc', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  sortable: true,
  searchable: true,
  pagination: true,
  itemsPerPage: 10,
  total: 0,
  currentPage: 1,
  sortBy: '',
  sortDesc: false
})

const emit = defineEmits<Emits>()

const searchQuery = ref('')
const internalCurrentPage = ref(props.currentPage)
const internalSortKey = ref(props.sortBy)
const internalSortDesc = ref(props.sortDesc)

// Surveiller les changements de props pour mettre à jour les états internes
watch(() => props.currentPage, (newPage) => {
  internalCurrentPage.value = newPage
})

watch(() => props.sortBy, (newSortBy) => {
  internalSortKey.value = newSortBy
})

watch(() => props.sortDesc, (newSortDesc) => {
  internalSortDesc.value = newSortDesc
})

const filteredData = computed(() => {
  let result = [...props.data]

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(query)
      )
    )
  }

  if (internalSortKey.value) {
    result.sort((a, b) => {
      const aVal = a[internalSortKey.value]
      const bVal = b[internalSortKey.value]
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return internalSortDesc.value === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }
      
      return internalSortDesc.value === 'asc'
        ? aVal - bVal
        : bVal - aVal
    })
  }

  return result
})

const paginatedData = computed(() => {
  if (!props.pagination) return filteredData.value

  const start = (internalCurrentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return filteredData.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(props.total / props.itemsPerPage)
})

const formatValue = (item: any, column: Column) => {
  if (column.key === 'actions') {
    return null // Les actions sont gérées via le slot
  }
  
  if (column.render) {
    return column.render(item)
  }
  
  const value = item[column.key]
  
  if (column.formatter && value !== undefined) {
    return column.formatter(value)
  }
  
  return value
}

const handleSort = (column: Column) => {
  if (!column.sortable) return

  const newSortDesc = internalSortKey.value === column.key ? !internalSortDesc.value : false
  internalSortKey.value = column.key
  internalSortDesc.value = newSortDesc

  emit('sort-change', {
    key: column.key,
    desc: newSortDesc
  })
}

const getSortIcon = (column: Column) => {
  if (!column.sortable) return null
  
  if (internalSortKey.value !== column.key) {
    return '↕'
  }
  return internalSortDesc.value ? '↑' : '↓'
}

const handlePageChange = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    internalCurrentPage.value = page
    emit('page-change', page)
  }
}
</script>

<template>
  <div>
    <!-- Barre de recherche -->
    <div v-if="searchable" class="mb-4">
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Rechercher..."
        class="form-input"
      >
    </div>

    <!-- Tableau -->
    <div class="table-container overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th
              v-for="column in columns"
              :key="column.key"
              :class="{ 'cursor-pointer': column.sortable && sortable }"
              @click="column.sortable && sortable ? handleSort(column) : null"
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              <div class="flex items-center space-x-1">
                <span>{{ column.label }}</span>
                <span v-if="column.sortable && sortable" class="text-gray-400">
                  <svg
                    v-if="internalSortKey === column.key && internalSortDesc === 'asc'"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
                  </svg>
                  <svg
                    v-else-if="internalSortKey === column.key && internalSortDesc === 'desc'"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                  <svg
                    v-else
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <template v-if="loading">
            <tr v-for="i in 5" :key="i">
              <td v-for="column in columns" :key="column.key" class="px-4 py-3">
                <div class="h-4 bg-gray-200 rounded animate-pulse"></div>
              </td>
            </tr>
          </template>
          <template v-else>
            <tr
              v-for="item in paginatedData"
              :key="item.id"
              class="hover:bg-gray-50 transition-colors"
            >
              <td
                v-for="column in columns"
                :key="column.key"
                class="px-4 py-3 whitespace-nowrap text-sm"
              >
                <template v-if="column.key === 'actions'">
                  <slot name="actions" :row="item"></slot>
                </template>
                <template v-else>
                  {{ formatValue(item, column) }}
                </template>
              </td>
            </tr>
            <tr v-if="paginatedData.length === 0">
              <td :colspan="columns.length" class="px-4 py-4 text-center text-sm text-gray-500">
                Aucune donnée disponible
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
    <div v-if="pagination && totalPages > 0" class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
      <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p class="text-sm text-gray-700">
            Affichage de <span class="font-medium">{{ ((internalCurrentPage - 1) * props.itemsPerPage) + 1 }}</span> à <span class="font-medium">{{ Math.min(internalCurrentPage * props.itemsPerPage, props.total) }}</span> sur <span class="font-medium">{{ props.total }}</span> résultats
          </p>
        </div>
        <div>
          <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              :disabled="internalCurrentPage === 1"
              @click="handlePageChange(1)"
            >
              <span class="sr-only">Première page</span>
              <ChevronDoubleLeftIcon class="h-5 w-5" />
            </button>
            <button
              class="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              :disabled="internalCurrentPage === 1"
              @click="handlePageChange(internalCurrentPage - 1)"
            >
              <span class="sr-only">Précédent</span>
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <span class="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
              {{ internalCurrentPage }} / {{ totalPages }}
            </span>
            <button
              class="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              :disabled="internalCurrentPage === totalPages"
              @click="handlePageChange(internalCurrentPage + 1)"
            >
              <span class="sr-only">Suivant</span>
              <ChevronRightIcon class="h-5 w-5" />
            </button>
            <button
              class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
              :disabled="internalCurrentPage === totalPages"
              @click="handlePageChange(totalPages)"
            >
              <span class="sr-only">Dernière page</span>
              <ChevronDoubleRightIcon class="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template> 