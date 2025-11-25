<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterView, useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppHeader from '@/components/AppHeader.vue'
import {
  Bars3Icon,
  XMarkIcon,
  UserIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'

const navigation = [
  { name: 'Profil', to: { name: 'employee-profile' }, icon: UserIcon },
  { name: 'Salaires', to: { name: 'employee-salaries' }, icon: CurrencyDollarIcon },
  { name: 'Réclamations', to: { name: 'employee-complaints' }, icon: ExclamationTriangleIcon },
]

const sidebarOpen = ref(false)
const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const routeKey = computed(() => route.fullPath)

const currentRouteName = computed(() => route.name)

const logout = async () => {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-100 pt-16">
    <!-- Header personnalisé -->
    <AppHeader />
    
    <!-- Mobile sidebar -->
    <div v-show="sidebarOpen" class="relative z-40 lg:hidden">
      <div class="fixed inset-0 bg-gray-900/80"></div>
      <div class="fixed inset-0 flex pt-16">
        <div class="relative flex w-full max-w-xs flex-1">
          <div class="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              class="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              @click="sidebarOpen = false"
            >
              <XMarkIcon class="h-6 w-6 text-white" />
            </button>
          </div>
          <!-- Sidebar component -->
          <div class="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
            <div class="flex h-16 shrink-0 items-center">
              <img class="h-8 w-auto" src="@/assets/logo.svg" alt="Kalid" />
            </div>
            <nav class="flex flex-1 flex-col">
              <div class="text-sm font-medium text-gray-500 mb-4">
                {{ auth.fullName }}
              </div>
              <ul role="list" class="flex flex-1 flex-col gap-y-7">
                <li>
                  <ul role="list" class="-mx-2 space-y-1">
                    <li v-for="item in navigation" :key="item.name">
                      <router-link
                        :to="item.to"
                        :class="[
                          currentRouteName === item.to.name
                            ? 'bg-gray-50 text-primary-600'
                            : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        ]"
                      >
                        <component
                          :is="item.icon"
                          :class="[
                            currentRouteName === item.to.name ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                            'h-6 w-6 shrink-0'
                          ]"
                        />
                        {{ item.name }}
                      </router-link>
                    </li>
                  </ul>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <!-- Static sidebar for desktop -->
    <div class="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:pt-16">
      <div class="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
        <div class="flex h-16 shrink-0 items-center">
          <img class="h-8 w-auto" src="@/assets/logo.svg" alt="Kalid" />
        </div>
        <nav class="flex flex-1 flex-col">
          <div class="text-sm font-medium text-gray-500 mb-4">
            {{ auth.fullName }}
          </div>
          <ul role="list" class="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" class="-mx-2 space-y-1">
                <li v-for="item in navigation" :key="item.name">
                  <router-link
                    :to="item.to"
                    :class="[
                      currentRouteName === item.to.name
                        ? 'bg-gray-50 text-primary-600'
                        : 'text-gray-700 hover:text-primary-600 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    ]"
                  >
                    <component
                      :is="item.icon"
                      :class="[
                        currentRouteName === item.to.name ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-600',
                        'h-6 w-6 shrink-0'
                      ]"
                    />
                    {{ item.name }}
                  </router-link>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </div>

    <div class="lg:pl-72">
      <div class="sticky top-16 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button
          type="button"
          class="-m-2.5 p-2.5 text-gray-700 lg:hidden"
          @click="sidebarOpen = true"
        >
          <Bars3Icon class="h-6 w-6" />
        </button>
      </div>

      <main class="py-10">
        <div class="px-4 sm:px-6 lg:px-8">
          <RouterView :key="routeKey" />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style> 