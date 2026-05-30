import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import i18n from './i18n'
import App from './App.vue'

const vuetify = createVuetify({
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          'surface-container': '#ECF0F4',
          'surface-container-low': '#F5F7F9',
        },
      },
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#757575',
          'surface-container': '#1E2227',
          'surface-container-low': '#161A1E',
        },
      },
    },
  },
})

createApp(App).use(createPinia()).use(vuetify).use(i18n).mount('#app')
