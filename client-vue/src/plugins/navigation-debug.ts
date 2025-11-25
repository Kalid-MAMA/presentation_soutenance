import { App } from 'vue'
import { Router } from 'vue-router'

export default {
  install(app: App, options: { router: Router }) {
    const { router } = options
    
    // Intercepter les changements de route
    router.beforeEach((to, from, next) => {
      console.log(`[Navigation Debug] Route change: ${from.path} -> ${to.path}`)
      console.log(`[Navigation Debug] Route meta:`, to.meta)
      next()
    })
    
    // Intercepter les erreurs de navigation
    router.onError((error) => {
      console.error(`[Navigation Debug] Navigation error:`, error)
    })
    
    // Ajouter un hook global pour les erreurs de rendu
    app.config.errorHandler = (err, instance, info) => {
      console.error(`[Vue Error] ${info}:`, err)
    }
    
    // Ajouter une méthode globale pour forcer le rechargement d'une route
    app.config.globalProperties.$reloadRoute = () => {
      const currentPath = router.currentRoute.value.fullPath
      router.replace('/__refresh__')
      setTimeout(() => {
        router.replace(currentPath)
      }, 10)
    }
    
    // Ajouter une route spéciale pour le rechargement
    router.addRoute({
      path: '/__refresh__',
      name: 'refresh',
      component: {
        render() {
          return null
        }
      }
    })
  }
} 