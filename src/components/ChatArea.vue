<template>
  <div class="d-flex flex-column h-100">
    <div ref="messagesEl" class="flex-grow-1 overflow-y-auto pa-4" style="scroll-behavior: smooth;">
      <template v-if="session.messages.length">
        <MessageBubble
          v-for="msg in session.messages"
          :key="msg.id"
          :message="msg"
          @delete="sessionStore.deleteMessage(session.id, msg.id)"
          @retranslate="handleRetranslate(msg)"
          @back-translate="handleBackTranslate(msg)"
        />
        <div ref="bottomEl" />
      </template>
      <template v-else>
        <div class="d-flex flex-column align-center justify-center h-100 text-center text-medium-emphasis">
          <v-icon size="48" class="mb-3">mdi-chat-outline</v-icon>
          <div class="text-body-1">{{ t('chat.startPrompt') }}</div>
          <div class="text-caption mt-1">
            {{ t('chat.selfLang', { lang: profile?.sourceLanguage }) }}
            ↔
            {{ t('chat.otherLang', { lang: profile?.targetLanguage }) }}
          </div>
        </div>
      </template>
    </div>

    <MessageInput @send="handleSend" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../stores/sessionStore'
import { useProfileStore } from '../stores/profileStore'
import { translateMessage, backTranslateMessage } from '../services/geminiService'
import MessageBubble from './MessageBubble.vue'
import MessageInput from './MessageInput.vue'

const { t } = useI18n()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()

const messagesEl = ref(null)
const bottomEl = ref(null)

const session = computed(() => sessionStore.activeSession)
const profile = computed(() => {
  if (!session.value) return null
  return profileStore.profiles.find(p => p.id === session.value.profileId) || profileStore.activeProfile
})

watch(
  () => session.value?.messages?.length,
  () => nextTick(() => bottomEl.value?.scrollIntoView({ behavior: 'smooth' }))
)

watch(
  () => sessionStore.activeSessionId,
  () => nextTick(() => bottomEl.value?.scrollIntoView())
)

async function handleRetranslate(msg) {
  if (!session.value) return
  sessionStore.updateMessage(session.value.id, msg.id, {
    translation: null,
    isTranslating: true,
    error: null,
    backTranslation: null,
    isBackTranslating: false,
  })
  try {
    const currentProfile = profile.value
    if (!currentProfile) throw new Error(t('error.profileNotFound'))
    const priorMessages = session.value.messages.filter(m => m.id !== msg.id && m.translation)
    const translation = await translateMessage({
      profile: currentProfile,
      messages: priorMessages,
      newMessage: { role: msg.role, originalText: msg.originalText, images: msg.images, audio: msg.audio },
    })
    sessionStore.updateMessage(session.value.id, msg.id, { translation, isTranslating: false })
  } catch (err) {
    sessionStore.updateMessage(session.value.id, msg.id, {
      isTranslating: false,
      error: err.message || t('error.translationFailed'),
    })
  }
}

async function handleBackTranslate(msg) {
  if (!session.value || !msg.translation) return
  sessionStore.updateMessage(session.value.id, msg.id, {
    isBackTranslating: true,
    backTranslation: null,
  })
  try {
    const currentProfile = profile.value
    if (!currentProfile) throw new Error(t('error.profileNotFound'))
    const backTranslation = await backTranslateMessage({ profile: currentProfile, message: msg })
    sessionStore.updateMessage(session.value.id, msg.id, { backTranslation, isBackTranslating: false })
  } catch (err) {
    sessionStore.updateMessage(session.value.id, msg.id, { isBackTranslating: false })
  }
}

async function handleSend({ role, text, images, audio }) {
  if (!session.value) return

  const msg = sessionStore.addMessage(session.value.id, {
    role,
    originalText: text || null,
    images: images || [],
    audio: audio || null,
    translation: null,
    isTranslating: true,
    error: null,
  })
  if (!msg) return

  await nextTick()
  bottomEl.value?.scrollIntoView({ behavior: 'smooth' })

  try {
    const currentProfile = profile.value
    if (!currentProfile) throw new Error(t('error.profileNotFound'))

    const priorMessages = session.value.messages.filter(m => m.id !== msg.id && m.translation)
    const translation = await translateMessage({
      profile: currentProfile,
      messages: priorMessages,
      newMessage: { role, originalText: text, images, audio },
    })

    sessionStore.updateMessage(session.value.id, msg.id, { translation, isTranslating: false })
  } catch (err) {
    sessionStore.updateMessage(session.value.id, msg.id, {
      isTranslating: false,
      error: err.message || t('error.translationFailed'),
    })
  }
}
</script>
