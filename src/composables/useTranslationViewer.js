import { reactive } from 'vue'

const viewer = reactive({
  open: false,
  translation: '',
  originalText: '',
  fontSize: 32,
})

export function useTranslationViewer() {
  return { viewer }
}

export function openTranslationViewer({ translation, originalText }) {
  viewer.translation = translation
  viewer.originalText = originalText || ''
  viewer.open = true
}
