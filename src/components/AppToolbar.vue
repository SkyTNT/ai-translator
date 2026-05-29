<template>
  <v-app-bar elevation="1" color="surface">
    <v-app-bar-nav-icon @click="$emit('toggle-sidebar')" />

    <v-app-bar-title>
      <div class="d-flex align-center gap-2">
        <v-icon color="primary" class="mr-1">mdi-translate</v-icon>
        <span class="font-weight-bold">{{ t('app.title') }}</span>
        <v-chip
          v-if="activeSession"
          size="small"
          variant="tonal"
          color="primary"
          class="ml-2"
        >
          {{ activeSession.name }}
        </v-chip>
      </div>
    </v-app-bar-title>

    <template #append>
      <div class="d-flex align-center mr-2 ga-1">
        <!-- Profile switcher -->
        <v-menu v-if="profileStore.profiles.length > 1">
          <template #activator="{ props }">
            <v-btn v-bind="props" variant="text" size="small" class="text-none" :icon="!smAndUp">
              <v-icon :start="smAndUp">mdi-account-circle</v-icon>
              <template v-if="smAndUp">
                {{ sessionProfile?.name }}
                <v-icon end>mdi-chevron-down</v-icon>
              </template>
            </v-btn>
          </template>
          <v-list density="compact" min-width="180">
            <v-list-item
              v-for="p in profileStore.profiles"
              :key="p.id"
              :title="p.name"
              :value="p.id"
              :active="p.id === activeSession?.profileId"
              color="primary"
              @click="selectProfile(p.id)"
            >
              <template #prepend>
                <v-icon :color="p.id === activeSession?.profileId ? 'primary' : ''">
                  mdi-account-circle-outline
                </v-icon>
              </template>
            </v-list-item>
          </v-list>
        </v-menu>

        <v-chip
          v-else-if="sessionProfile"
          variant="tonal"
          size="small"
          color="primary"
          prepend-icon="mdi-account-circle-outline"
        >
          <span v-if="smAndUp">{{ sessionProfile.name }}</span>
        </v-chip>

        <!-- API key warning -->
        <v-tooltip v-if="!sessionProfile?.apiKey" :text="t('toolbar.apiKeyMissing')" location="bottom">
          <template #activator="{ props }">
            <v-icon v-bind="props" color="warning" size="small">mdi-alert-circle</v-icon>
          </template>
        </v-tooltip>

        <!-- Locale switcher -->
        <v-menu>
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text" size="small">
              <v-icon size="18">mdi-translate</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="120">
            <v-list-item
              v-for="loc in LOCALES"
              :key="loc.value"
              :title="loc.label"
              :active="locale === loc.value"
              color="primary"
              @click="changeLocale(loc.value)"
            />
          </v-list>
        </v-menu>

        <!-- Gear icon for profile management -->
        <v-btn icon="mdi-cog" variant="text" @click="$emit('open-profiles')" />
      </div>
    </template>
  </v-app-bar>
</template>

<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '../stores/profileStore'
import { useSessionStore } from '../stores/sessionStore'
import { setLocale, LOCALES } from '../i18n'

defineEmits(['toggle-sidebar', 'open-profiles'])

const { t, locale } = useI18n()
const { smAndUp } = useDisplay()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const activeSession = computed(() => sessionStore.activeSession)
const sessionProfile = computed(() =>
  profileStore.profiles.find(p => p.id === activeSession.value?.profileId) || profileStore.activeProfile
)

function selectProfile(profileId) {
  if (activeSession.value) {
    sessionStore.updateSessionProfile(activeSession.value.id, profileId)
  } else {
    profileStore.setActive(profileId)
  }
}

function changeLocale(val) {
  setLocale(val)
}
</script>
