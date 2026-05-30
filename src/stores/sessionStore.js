import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import i18n from '../i18n/index.js'

export const useSessionStore = defineStore('sessions', () => {
  const sessions = ref(JSON.parse(localStorage.getItem('translator_sessions') || '[]'))
  const activeSessionId = ref(localStorage.getItem('translator_active_session') || null)
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

  function persist() {
    localStorage.setItem('translator_sessions', JSON.stringify(sessions.value))
    localStorage.setItem('translator_active_session', activeSessionId.value || '')
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
    return m
  }

  function deleteMessage(sessionId, messageId) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (!s) return
    s.messages = s.messages.filter(m => m.id !== messageId)
    persist()
  }

  function updateMessage(sessionId, messageId, updates) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (!s) return
    const m = s.messages.find(m => m.id === messageId)
    if (m) { Object.assign(m, updates); persist() }
  }

  function clearMessages(sessionId) {
    const s = sessions.value.find(s => s.id === sessionId)
    if (s) { s.messages = []; persist() }
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
