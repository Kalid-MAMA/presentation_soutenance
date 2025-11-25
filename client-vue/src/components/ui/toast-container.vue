<script setup lang="ts">
import { ref } from 'vue'
import Toast from './toast.vue'

interface ToastItem {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  show: boolean
}

const toasts = ref<ToastItem[]>([])

const addToast = (toast: Omit<ToastItem, 'id' | 'show'>) => {
  const id = Math.random().toString(36).substring(2, 9)
  toasts.value.push({
    ...toast,
    id,
    show: true
  })
}

const removeToast = (id: string) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value[index].show = false
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== id)
    }, 300)
  }
}

defineExpose({
  addToast
})
</script>

<template>
  <div
    aria-live="assertive"
    class="pointer-events-none fixed inset-0 flex items-end px-4 py-6 sm:items-start sm:p-6 z-50"
  >
    <div class="flex w-full flex-col items-center space-y-4 sm:items-end">
      <Toast
        v-for="toast in toasts"
        :key="toast.id"
        v-bind="toast"
        @close="removeToast"
      />
    </div>
  </div>
</template> 