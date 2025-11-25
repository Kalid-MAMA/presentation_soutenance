<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/vue/24/outline'

interface Props {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  show: boolean
}

const props = withDefaults(defineProps<Props>(), {
  duration: 5000,
  message: '',
  type: 'info'
})

const emit = defineEmits<{
  (e: 'close', id: string): void
}>()

let timeout: NodeJS.Timeout

onMounted(() => {
  if (props.duration > 0) {
    timeout = setTimeout(() => {
      emit('close', props.id)
    }, props.duration)
  }
})

onUnmounted(() => {
  if (timeout) {
    clearTimeout(timeout)
  }
})

const icon = computed(() => {
  switch (props.type) {
    case 'success':
      return CheckCircleIcon
    case 'error':
      return XCircleIcon
    case 'warning':
      return ExclamationCircleIcon
    default:
      return InformationCircleIcon
  }
})

const colorClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'bg-green-50 text-green-800'
    case 'error':
      return 'bg-red-50 text-red-800'
    case 'warning':
      return 'bg-yellow-50 text-yellow-800'
    default:
      return 'bg-blue-50 text-blue-800'
  }
})

const iconColorClasses = computed(() => {
  switch (props.type) {
    case 'success':
      return 'text-green-400'
    case 'error':
      return 'text-red-400'
    case 'warning':
      return 'text-yellow-400'
    default:
      return 'text-blue-400'
  }
})
</script>

<template>
  <Transition name="notification">
    <div
      class="notification"
      :class="{
        'notification-success': type === 'success',
        'notification-error': type === 'error',
        'notification-warning': type === 'warning',
        'notification-info': type === 'info'
      }"
    >
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <component :is="icon" class="h-6 w-6" :class="iconColorClasses" aria-hidden="true" />
        </div>
        <div class="ml-3 w-0 flex-1 pt-0.5">
          <p class="text-sm font-medium">{{ title }}</p>
          <p v-if="message" class="mt-1 text-sm opacity-90">{{ message }}</p>
        </div>
        <div class="ml-4 flex flex-shrink-0">
          <button
            type="button"
            class="inline-flex rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
            @click="emit('close', id)"
          >
            <span class="sr-only">Fermer</span>
            <svg
              class="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fill-rule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template> 