import { ref, type Ref } from 'vue'

interface ToastOptions {
  title: string
  message?: string
  duration?: number
  type?: 'success' | 'error' | 'warning' | 'info'
}

interface ToastApi {
  showToast: (options: ToastOptions) => void
  success: (options: string | Omit<ToastOptions, 'type'>) => void
  error: (options: string | Omit<ToastOptions, 'type'>) => void
  warning: (options: string | Omit<ToastOptions, 'type'>) => void
  info: (options: string | Omit<ToastOptions, 'type'>) => void
}

let toastContainer: Ref<{ addToast: (options: ToastOptions) => void } | null> = ref(null)

export function setToastContainer(container: { addToast: (options: ToastOptions) => void }) {
  toastContainer.value = container
}

function showToast(options: ToastOptions) {
  if (!toastContainer.value) {
    console.warn('Toast container not found. Make sure to add ToastContainer component to your app.')
    return
  }

  toastContainer.value.addToast(options)
}

function createToast(type: ToastOptions['type']) {
  return (options: string | Omit<ToastOptions, 'type'>) => {
    if (!toastContainer.value) {
      console.warn('Toast container not found. Make sure to add ToastContainer component to your app.')
      return
    }

    const toastOptions: ToastOptions = typeof options === 'string'
      ? { title: options, type }
      : { ...options, type }

    toastContainer.value.addToast(toastOptions)
  }
}

export function useToast(): ToastApi {
  return {
    showToast,
    success: createToast('success'),
    error: createToast('error'),
    warning: createToast('warning'),
    info: createToast('info')
  }
} 