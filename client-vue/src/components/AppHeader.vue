<template>
  <header class="bg-blue-900 text-white shadow-md fixed top-0 left-0 right-0 z-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <!-- Logo et titre à gauche -->
        <div class="flex items-center">
          <img src="@/assets/image.png" alt="Mairie de Cotonou" class="h-12 w-auto mr-3" />
          <div class="flex flex-col">
            <h1 class="text-lg font-semibold text-white">Mairie de Cotonou</h1>
            <span class="text-sm text-gray-200">
              <span v-if="userRole === 'admin'">Espace administrateur</span>
              <span v-else-if="userRole === 'accountant'">Espace comptable</span>
              <span v-else-if="userRole === 'employee'">Espace employé</span>
            </span>
          </div>
        </div>

        <!-- Informations utilisateur et bouton déconnexion à droite -->
        <div class="flex items-center">
          <div class="mr-4 text-right">
            <div v-if="userRole === 'admin'" class="text-sm font-medium text-white">Administrateur système</div>
            <div v-else-if="userRole === 'accountant'" class="text-sm font-medium text-white">Comptable principal</div>
            <div v-else-if="userRole === 'employee'" class="text-sm font-medium text-white">{{ userName }}</div>
            <div v-if="userRole === 'employee'" class="text-xs text-gray-200">{{ userMatricule }}</div>
          </div>
          <button
            @click="logout"
            class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const userRole = computed(() => auth.userRole)
const userName = computed(() => auth.fullName)
const userMatricule = computed(() => auth.user?.matricule || '')

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
/* Styles spécifiques au header si nécessaire */
</style> 