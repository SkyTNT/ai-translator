import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const STORAGE_KEY = 'translator_settings'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') } catch { return {} }
}

export const PRESET_COLORS = [
  '#1976D2',
  '#1565C0',
  '#0288D1',
  '#00796B',
  '#388E3C',
  '#7B1FA2',
  '#AD1457',
  '#D32F2F',
  '#E64A19',
  '#F57C00',
  '#546E7A',
  '#424242',
]

export const useSettingsStore = defineStore('settings', () => {
  const saved = load()
  const theme = ref(saved.theme || 'system')
  const primaryColor = ref(saved.primaryColor || '#1976D2')

  const systemDark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    systemDark.value = e.matches
  })

  const effectiveTheme = computed(() => {
    if (theme.value === 'system') return systemDark.value ? 'dark' : 'light'
    return theme.value
  })

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme: theme.value, primaryColor: primaryColor.value }))
  }

  function setTheme(val) { theme.value = val; persist() }
  function setPrimaryColor(val) { primaryColor.value = val; persist() }

  return { theme, primaryColor, effectiveTheme, setTheme, setPrimaryColor }
})
