<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const matricule = ref('')
const password = ref('')
const error = ref('')

const handleSubmit = async () => {
  try {
    error.value = ''
    const role = await auth.login({ matricule: matricule.value, password: password.value })
    
    // Redirection en fonction du rôle
    switch (role) {
      case 'admin':
        router.push('/admin')
        break
      case 'accountant':
        router.push('/accountant')
        break
      case 'employee':
        router.push('/employee/profile')
        break
      default:
        error.value = 'Rôle non reconnu'
    }
  } catch (e) {
    error.value = 'Matricule ou mot de passe invalide'
  }
}
</script>

<template>
  <div class="login-container flex items-center justify-center">
    <div class="w-full max-w-md mx-auto bg-white rounded-lg shadow-xl overflow-hidden">
      <!-- En-tête avec logo et titres -->
      <div class="bg-gradient-to-r from-blue-900 to-blue-700 p-3 text-white">
        <div class="flex items-center justify-center">
          <img src="@/assets/image.png" alt="Mairie de Cotonou" class="h-14 w-auto" />
          <div class="ml-3 flex flex-col">
            <h1 class="text-lg font-bold text-white">Mairie de Cotonou</h1>
            <p class="text-xs text-blue-100 text-center">République du Bénin</p>
          </div>
        </div>
        <h2 class="mt-1 text-center text-base font-bold text-white">Gestion des soldes d'avancement</h2>
      </div>

      <!-- Formulaire de connexion -->
      <div class="p-4 bg-white">
        <h3 class="text-center text-base font-medium text-gray-900 mb-3">Connexion</h3>

        <form class="space-y-2" @submit.prevent="handleSubmit">
          <div>
            <label for="matricule" class="block text-sm font-medium text-gray-700">Matricule</label>
            <input
              id="matricule"
              name="matricule"
              type="text"
              required
              v-model="matricule"
              class="appearance-none block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Entrez votre matricule"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
            <input
              id="password"
              name="password"
              type="password"
              autocomplete="current-password"
              required
              v-model="password"
              class="appearance-none block w-full px-3 py-1.5 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Entrez votre mot de passe"
            />
          </div>

          <div v-if="error" class="text-xs text-red-600">
            {{ error }}
          </div>

          <div class="mt-2">
            <button
              type="submit"
              class="w-full flex justify-center py-1.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Se connecter
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

/* Réduire la taille du footer dans le contexte de la page de connexion */
:deep(footer) {
  display: none;
}
</style> 