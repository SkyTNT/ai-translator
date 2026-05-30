import { defineStore } from 'pinia'
import { ref } from 'vue'

export const DEFAULT_PROFILE = {
  name: 'Default',
  apiKey: '',
  model: 'gemini-3.1-flash-lite',
  endpoint: '',
  sourceLanguage: '中文',
  targetLanguage: 'English',
  contextSize: 12,
  systemPrompt: `You are a professional real-time conversation translator assisting with bilingual dialogue.

There are two speakers:
- Speaker 1 (Self): speaks {sourceLanguage}
- Speaker 2 (Other): speaks {targetLanguage}

Translation rules:
- If the message is from Speaker 1, translate from {sourceLanguage} to {targetLanguage}
- If the message is from Speaker 2, translate from {targetLanguage} to {sourceLanguage}
- Use the conversation history as context for better accuracy (names, topics, tone)
- If the input is an image, describe and translate any visible text
- If the input is audio, translate the spoken content — do not output the original transcript
- Return ONLY the translation — no explanations, no notes, no prefixes`,
  translateInstruction: `Translate the following {contentDesc} message from {role} from {fromLang} into {toLang}.
Output the complete {toLang} translation only.`,
  backTranslateInstruction: `Translate the following text from {fromLang} into {toLang}. Output the translation only:\n\n{text}`,
  contextMessageFormat: `{role}: {original}\nTranslation: {translation}`,
  contextHeader: `Conversation history for context:\n\n{context}\n\n---\n\n`,
  fishAudioEndpoint: '',
  fishAudioApiKey: '',
  fishAudioSelfReferenceId: '',
  fishAudioOtherReferenceId: '',
}

export const useProfileStore = defineStore('profiles', () => {
  const rawProfiles = JSON.parse(localStorage.getItem('translator_profiles') || '[]')
  const profiles = ref(rawProfiles.map(p => ({
    translateInstruction: DEFAULT_PROFILE.translateInstruction,
    backTranslateInstruction: DEFAULT_PROFILE.backTranslateInstruction,
    contextMessageFormat: DEFAULT_PROFILE.contextMessageFormat,
    contextHeader: DEFAULT_PROFILE.contextHeader,
    ...p,
  })))

  function allocId() {
    return profiles.value.length === 0 ? 1 : Math.max(...profiles.value.map(p => p.id)) + 1
  }

  if (profiles.value.length === 0) {
    profiles.value.push({ id: allocId(), ...DEFAULT_PROFILE })
    persist()
  }

  function persist() {
    localStorage.setItem('translator_profiles', JSON.stringify(profiles.value))
  }

  function addProfile(data) {
    const p = { id: allocId(), ...data }
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
    persist()
  }

  return { profiles, addProfile, updateProfile, deleteProfile }
})
