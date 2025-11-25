import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import NavigationDebug from './plugins/navigation-debug'
import './style.css'
import './assets/animations.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(NavigationDebug, { router })

app.mount('#app')
