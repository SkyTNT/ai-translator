import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const DEFAULT_SYSTEM_PROMPT = `You are a professional real-time conversation translator assisting with bilingual dialogue.

There are two speakers:
- Speaker 1 (己方/Self): speaks {sourceLanguage}
- Speaker 2 (对方/Other): speaks {targetLanguage}

Translation rules:
- If the message is from Speaker 1, translate from {sourceLanguage} to {targetLanguage}
- If the message is from Speaker 2, translate from {targetLanguage} to {sourceLanguage}
- Use the conversation history as context for better accuracy (names, topics, tone)
- If the input is an image, describe and translate any visible text
- If the input is audio, translate the spoken content — do not output the original transcript
- Return ONLY the translation — no explanations, no notes, no prefixes`

export const useProfileStore = defineStore('profiles', () => {
  const profiles = ref(JSON.parse(localStorage.getItem('translator_profiles') || '[]'))
  const activeProfileId = ref(localStorage.getItem('translator_active_profile') || null)

  if (profiles.value.length === 0) {
    const def = {
      id: crypto.randomUUID(),
      name: 'Default',
      apiKey: '',
      model: 'gemini-3.1-flash-lite',
      endpoint: '',
      sourceLanguage: '中文',
      targetLanguage: 'English',
      contextSize: 12,
      systemPrompt: DEFAULT_SYSTEM_PROMPT,
    }
    profiles.value.push(def)
    activeProfileId.value = def.id
    persist()
  } else if (!activeProfileId.value) {
    activeProfileId.value = profiles.value[0].id
    persist()
  }

  const activeProfile = computed(() => profiles.value.find(p => p.id === activeProfileId.value))

  function persist() {
    localStorage.setItem('translator_profiles', JSON.stringify(profiles.value))
    localStorage.setItem('translator_active_profile', activeProfileId.value)
  }

  function addProfile(data) {
    const p = { id: crypto.randomUUID(), ...data }
    profiles.value.push(p)
    persist()
    return p
  }

  function updateProfile(id, updates) {
    const idx = profiles.value.findIndex(p => p.id === id)
    if (idx !== -1) {
      profiles.value[idx] = { ...profiles.value[idx], ...updates }
      persist()
    }
  }

  function deleteProfile(id) {
    if (profiles.value.length <= 1) return
    profiles.value = profiles.value.filter(p => p.id !== id)
    if (activeProfileId.value === id) {
      activeProfileId.value = profiles.value[0].id
    }
    persist()
  }

  function setActive(id) {
    activeProfileId.value = id
    persist()
  }

  return { profiles, activeProfileId, activeProfile, addProfile, updateProfile, deleteProfile, setActive }
})
