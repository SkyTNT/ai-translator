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
          self: '#1976D2',
          other: '#616161',
        },
      },
      dark: {
        colors: {
          primary: '#2196F3',
          secondary: '#757575',
        },
      },
    },
  },
})

createApp(App).use(createPinia()).use(vuetify).use(i18n).mount('#app')
