import { createApp } from 'vue'
import App from './App.vue'

// Import global styles. These will be processed by PostCSS.
import './assets/main.css'
import './assets/global.css'

import { i18n } from './i18n.js'

createApp(App).use(i18n).mount('#app')
