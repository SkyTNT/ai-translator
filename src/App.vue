<template>
  <v-app :theme="theme">
    <AppToolbar
      @toggle-sidebar="sidebarOpen = !sidebarOpen"
      @open-profiles="profileDialogOpen = true"
    />

    <SessionSidebar v-model="sidebarOpen" />

    <v-main>
      <template v-if="sessionStore.activeSession">
        <ChatArea />
      </template>
      <template v-else>
        <div class="d-flex flex-column align-center justify-center h-100 text-center pa-8">
          <v-icon size="80" color="primary" class="mb-4">mdi-translate</v-icon>
          <div class="text-h5 mb-2">{{ t('app.title') }}</div>
          <div class="text-body-1 text-medium-emphasis mb-6" style="white-space: pre-line;">
            {{ t('app.subtitle') }}
          </div>
          <v-btn color="primary" prepend-icon="mdi-plus" @click="newSession">
            {{ t('app.newSession') }}
          </v-btn>
          <v-btn
            v-if="!profileStore.activeProfile?.apiKey"
            variant="outlined"
            class="mt-3"
            prepend-icon="mdi-cog"
            @click="profileDialogOpen = true"
          >
            {{ t('app.configApiKey') }}
          </v-btn>
        </div>
      </template>
    </v-main>

    <v-footer v-if="sessionStore.activeSession" app elevation="3" class="pa-0">
      <MessageInput @send="handleSend" />
    </v-footer>

    <ProfileDialog v-model="profileDialogOpen" />
    <ImageViewer />
    <TranslationViewer />
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from './stores/profileStore'
import { useSessionStore } from './stores/sessionStore'
import { translateMessage } from './services/geminiService'
import AppToolbar from './components/AppToolbar.vue'
import SessionSidebar from './components/SessionSidebar.vue'
import ChatArea from './components/ChatArea.vue'
import MessageInput from './components/MessageInput.vue'
import ProfileDialog from './components/ProfileDialog.vue'
import ImageViewer from './components/ImageViewer.vue'
import TranslationViewer from './components/TranslationViewer.vue'

const { t } = useI18n()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const { mdAndUp } = useDisplay()
const sidebarOpen = ref(mdAndUp.value)
const profileDialogOpen = ref(false)
const theme = ref('light')

function newSession() {
  const name = `${t('session.defaultName')} ${sessionStore.sessions.length + 1}`
  sessionStore.createSession(profileStore.activeProfileId, name)
}

async function handleSend({ role, text, images, audio }) {
  const session = sessionStore.activeSession
  if (!session) return

  const profile = profileStore.profiles.find(p => p.id === session.profileId) || profileStore.activeProfile

  const msg = sessionStore.addMessage(session.id, {
    role,
    originalText: text || null,
    images: images || [],
    audio: audio || null,
    translation: null,
    isTranslating: true,
    error: null,
  })
  if (!msg) return

  try {
    if (!profile) throw new Error(t('error.profileNotFound'))
    const priorMessages = session.messages.filter(m => m.id !== msg.id && m.translation)
    const translation = await translateMessage({
      profile,
      messages: priorMessages,
      newMessage: { role, originalText: text, images, audio },
    })
    sessionStore.updateMessage(session.id, msg.id, { translation, isTranslating: false })
  } catch (err) {
    sessionStore.updateMessage(session.id, msg.id, {
      isTranslating: false,
      error: err.message || t('error.translationFailed'),
    })
  }
}
</script>

<style>
.v-main__wrap {
  display: flex;
  flex-direction: column;
}
</style>
