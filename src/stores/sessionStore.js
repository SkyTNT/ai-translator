import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '../i18n/index.js'
import { idbSet, idbGet, idbDelete, idbDeleteByPrefix } from '../utils/idbStore.js'

export const useSessionStore = defineStore('sessions', () => {
  const sessions = ref(JSON.parse(localStorage.getItem('translator_sessions') || '[]'))
  const _storedSessionId = localStorage.getItem('translator_active_session')
  const activeSessionId = ref(_storedSessionId ? Number(_storedSessionId) : null)
  function allocSessionId() {
    return sessions.value.length === 0 ? 1 : Math.max(...sessions.value.map(s => s.id)) + 1
  }

  function allocMessageId(messages) {
    return messages.length === 0 ? 1 : Math.max(...messages.map(m => m.id)) + 1
  }

  if (activeSessionId.value && !sessions.value.find(s => s.id === activeSessionId.value)) {
    activeSessionId.value = sessions.value[0]?.id || null
  }

  const activeSession = computed(() => sessions.value.find(s => s.id === activeSessionId.value))

  // Strip binary data from images/audio before writing to localStorage (5MB limit)
  function persist() {
    const stripped = sessions.value.map(s => ({
      ...s,
      messages: s.messages.map(m => ({
        ...m,
        images: m.images?.map(img => ({ mimeType: img.mimeType })) || [],
        audio: m.audio ? { mimeType: m.audio.mimeType } : null,
      }))
    }))
    localStorage.setItem('translator_sessions', JSON.stringify(stripped))
    localStorage.setItem('translator_active_session', activeSessionId.value || '')
  }

  // After loading from localStorage, rehydrate image/audio binary data from IndexedDB
  async function hydrateMediaData() {
    for (const s of sessions.value) {
      for (const m of s.messages) {
        const needsHydration =
          (m.images?.length && m.images.some(img => !img.url)) ||
          (m.audio && !m.audio.url)
        if (!needsHydration) continue
        const media = await idbGet(`media_${s.id}_${m.id}`)
        if (!media) continue
        if (m.images?.length && media.images?.length) {
          m.images = media.images.map(img => ({
            ...img,
            url: `data:${img.mimeType};base64,${img.data}`,
          }))
        }
        if (m.audio && media.audio) {
          m.audio = { ...media.audio, url: `data:${media.audio.mimeType};base64,${media.audio.data}` }
        }
      }
    }
  }
  hydrateMediaData()

  function saveMessageMedia(sessionId, messageId, images, audio) {
    const hasImages = images?.some(img => img.data)
    const hasAudio = audio?.data
    if (!hasImages && !hasAudio) return
    idbSet(`media_${sessionId}_${messageId}`, {
      images: hasImages ? images.map(img => ({ data: img.data, mimeType: img.mimeType })) : [],
      audio: hasAudio ? { data: audio.data, mimeType: audio.mimeType } : null,
    })
  }

  function createSession(profileId, name) {
    const s = {
      id: allocSessionId(),
      name: name || `${i18n.global.t('session.defaultName')} ${sessions.value.length + 1}`,
      profileId,
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    sessions.value.unshift(s)
    activeSessionId.value = s.id
    persist()
    return s
  }

  function deleteSession(id) {
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[0]?.id || null
    }
    persist()
    idbDeleteByPrefix(`media_${id}_`)
  }

  function renameSession(id, name) {
    const s = sessions.value.find(s => s.id === id)
    if (s) { s.name = name; persist() }
  }

  function setActive(id) {
    activeSessionId.value = id
    localStorage.setItem('translator_active_session', id)
  }

  function addMessage(sessionId, msg) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (!s) return null
    const m = { id: allocMessageId(s.messages), ...msg, timestamp: new Date().toISOString() }
    s.messages.push(m)
    s.updatedAt = new Date().toISOString()
    persist()
    saveMessageMedia(sessionId, m.id, m.images, m.audio)
    return m
  }

  function deleteMessage(sessionId, messageId) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (!s) return
    s.messages = s.messages.filter(m => m.id !== messageId)
    persist()
    idbDelete(`media_${sessionId}_${messageId}`)
  }

  function updateMessage(sessionId, messageId, updates) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (!s) return
    const m = s.messages.find(m => m.id === messageId)
    if (m) { Object.assign(m, updates); persist() }
  }

  function clearMessages(sessionId) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (s) {
      s.messages = []
      persist()
      idbDeleteByPrefix(`media_${sessionId}_`)
    }
  }

  function updateSessionProfile(sessionId, profileId) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (s) { s.profileId = profileId; persist() }
  }

  return {
    sessions, activeSessionId, activeSession,
    createSession, deleteSession, renameSession, setActive,
    addMessage, updateMessage, deleteMessage, clearMessages, updateSessionProfile,
  }
})
