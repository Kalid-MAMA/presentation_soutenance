<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: boolean
  title: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}>()

// Log quand le modal est affiché ou fermé
watch(() => props.modelValue, (newVal) => {
  console.log(`Modal "${props.title}" is now ${newVal ? 'visible' : 'hidden'}`);
}, { immediate: true });

const close = () => {
  console.log(`Closing modal "${props.title}"`);
  emit('update:modelValue', false)
  emit('close')
}

const modalSizes = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-3xl'
}
</script>

<template>
  <Teleport to="body">
  <Transition name="modal">
    <div v-if="modelValue" class="modal-container">
      <div class="modal-backdrop" @click="close" />
      
        <div class="fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          class="modal-content"
          :class="[size ? modalSizes[size] : modalSizes.md]"
        >
          <div class="absolute right-0 top-0 hidden pr-4 pt-4 sm:block">
            <button
              type="button"
              class="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
              @click="close"
            >
              <span class="sr-only">Fermer</span>
              <svg
                class="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div class="sm:flex sm:items-start">
            <div class="mt-3 text-center sm:mt-0 sm:text-left w-full">
              <h3 class="text-lg font-medium leading-6 text-gray-900">
                {{ title }}
              </h3>
              <div class="mt-4">
                <slot />
              </div>
            </div>
          </div>

          <div v-if="$slots.footer" class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <slot name="footer" />
              </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
  </Teleport>
</template> 