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

    <ProfileDialog v-model="profileDialogOpen" />
    <ImageViewer />
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from './stores/profileStore'
import { useSessionStore } from './stores/sessionStore'
import AppToolbar from './components/AppToolbar.vue'
import SessionSidebar from './components/SessionSidebar.vue'
import ChatArea from './components/ChatArea.vue'
import ProfileDialog from './components/ProfileDialog.vue'
import ImageViewer from './components/ImageViewer.vue'

const { t } = useI18n()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const sidebarOpen = ref(true)
const profileDialogOpen = ref(false)
const theme = ref('light')

function newSession() {
  const name = `${t('session.defaultName')} ${sessionStore.sessions.length + 1}`
  sessionStore.createSession(profileStore.activeProfileId, name)
}
</script>
