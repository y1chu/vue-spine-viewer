import { createApp } from 'vue'
import App from './App.vue'

// Import global styles. These will be processed by PostCSS.
import './assets/main.css'
import './assets/global.css'

createApp(App).mount('#app')
