<script setup lang="ts">
import { onMounted, ref, onUnmounted, computed } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import ToastContainer from './components/ui/toast-container.vue'
import AppFooter from '@/components/AppFooter.vue'
import { setToastContainer } from './composables/useToast'
import { wsService } from '@/services/websocket.service'

const toastContainer = ref()
const route = useRoute()

// Utiliser le chemin de la route comme clé pour forcer le rechargement des composants
const routeKey = computed(() => route.fullPath)

// Vérifier si la page actuelle est la page de connexion
const isLoginPage = computed(() => route.path === '/login')

onMounted(() => {
  if (toastContainer.value) {
    setToastContainer(toastContainer.value)
  }
  wsService.connect()
})

onUnmounted(() => {
  wsService.disconnect()
})
</script>

<template>
  <div class="min-h-screen w-full bg-gray-50 flex flex-col">
    <!-- Contenu principal -->
    <div class="flex-grow">
      <RouterView :key="routeKey" />
    </div>
    
    <!-- Footer sur toutes les pages -->
    <AppFooter class="z-50 relative" />
    
    <!-- Container pour les notifications toast -->
    <ToastContainer ref="toastContainer" />
  </div>
</template>
