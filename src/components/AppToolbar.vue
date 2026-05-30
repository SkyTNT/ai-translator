<template>
  <v-app-bar elevation="1" color="surface">
    <v-app-bar-nav-icon @click="$emit('toggle-sidebar')" />

    <v-app-bar-title>
      <div class="d-flex align-center gap-2">
        <v-icon color="primary" class="mr-1">mdi-translate</v-icon>
        <span v-if="smAndUp || !activeSession" class="font-weight-bold">{{ t('app.title') }}</span>
        <v-chip
          v-if="activeSession"
          size="small"
          variant="tonal"
          color="primary"
          :class="smAndUp ? 'ml-2' : ''"
          style="max-width: 160px"
        >
          <span class="text-truncate">{{ activeSession.name }}</span>
        </v-chip>
      </div>
    </v-app-bar-title>

    <template #append>
      <div class="d-flex align-center mr-2 ga-1">
        <!-- Profile switcher (desktop only) -->
        <template v-if="smAndUp">
          <v-menu v-if="profileStore.profiles.length > 1">
            <template #activator="{ props }">
              <v-btn v-bind="props" variant="text" size="small" class="text-none">
                <v-icon start>mdi-account-circle</v-icon>
                {{ sessionProfile?.name }}
                <v-icon end>mdi-chevron-down</v-icon>
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
            {{ sessionProfile.name }}
          </v-chip>
        </template>

        <!-- API key warning -->
        <v-tooltip v-if="!sessionProfile?.apiKey" :text="t('toolbar.apiKeyMissing')" location="bottom">
          <template #activator="{ props }">
            <v-icon v-bind="props" color="warning" size="small">mdi-alert-circle</v-icon>
          </template>
        </v-tooltip>

        <!-- Desktop: individual buttons -->
        <template v-if="smAndUp">
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
          <v-btn icon="mdi-palette" variant="text" @click="$emit('open-appearance')" />
          <v-btn icon="mdi-cog" variant="text" @click="$emit('open-profiles')" />
        </template>

        <!-- Mobile: overflow menu -->
        <v-menu v-else v-model="mobileMenuOpen" :close-on-content-click="false" @update:model-value="v => { if (!v) menuPage = 'main' }">
          <template #activator="{ props }">
            <v-btn v-bind="props" icon variant="text">
              <v-icon>mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list density="compact" min-width="220">

            <!-- Main page -->
            <template v-if="menuPage === 'main'">
              <v-list-item
                v-if="profileStore.profiles.length > 1"
                prepend-icon="mdi-account-circle-outline"
                :title="sessionProfile?.name"
                append-icon="mdi-chevron-right"
                @click="menuPage = 'profiles'"
              />
              <v-list-item
                prepend-icon="mdi-translate"
                :title="currentLocaleName"
                append-icon="mdi-chevron-right"
                @click="menuPage = 'locale'"
              />
              <v-divider />
              <v-list-item prepend-icon="mdi-palette" :title="t('appearance.title')" @click="mobileMenuOpen = false; $emit('open-appearance')" />
              <v-list-item prepend-icon="mdi-cog" :title="t('profile.manage')" @click="mobileMenuOpen = false; $emit('open-profiles')" />
            </template>

            <!-- Profiles sub-page -->
            <template v-else-if="menuPage === 'profiles'">
              <v-list-item prepend-icon="mdi-arrow-left" @click="menuPage = 'main'">
                <v-list-item-title class="text-medium-emphasis">{{ t('profile.manage') }}</v-list-item-title>
              </v-list-item>
              <v-divider />
              <v-list-item
                v-for="p in profileStore.profiles"
                :key="p.id"
                :title="p.name"
                :active="p.id === activeSession?.profileId"
                color="primary"
                @click="selectProfile(p.id); mobileMenuOpen = false"
              >
                <template #prepend>
                  <v-icon :color="p.id === activeSession?.profileId ? 'primary' : ''">
                    mdi-account-circle-outline
                  </v-icon>
                </template>
              </v-list-item>
            </template>

            <!-- Locale sub-page -->
            <template v-else-if="menuPage === 'locale'">
              <v-list-item prepend-icon="mdi-arrow-left" @click="menuPage = 'main'">
                <v-list-item-title class="text-medium-emphasis">{{ t('toolbar.language') }}</v-list-item-title>
              </v-list-item>
              <v-divider />
              <v-list-item
                v-for="loc in LOCALES"
                :key="loc.value"
                :title="loc.label"
                :active="locale === loc.value"
                color="primary"
                @click="changeLocale(loc.value); mobileMenuOpen = false"
              >
                <template #prepend>
                  <v-icon :color="locale === loc.value ? 'primary' : ''">
                    {{ locale === loc.value ? 'mdi-check' : 'mdi-translate' }}
                  </v-icon>
                </template>
              </v-list-item>
            </template>

          </v-list>
        </v-menu>
      </div>
    </template>
  </v-app-bar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '../stores/profileStore'
import { useSessionStore } from '../stores/sessionStore'
import { setLocale, LOCALES } from '../i18n'

defineEmits(['toggle-sidebar', 'open-profiles', 'open-appearance'])

const { t, locale } = useI18n()
const { smAndUp } = useDisplay()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const mobileMenuOpen = ref(false)
const menuPage = ref('main')

const activeSession = computed(() => sessionStore.activeSession)
const sessionProfile = computed(() =>
  profileStore.profiles.find(p => p.id === activeSession.value?.profileId) || profileStore.activeProfile
)
const currentLocaleName = computed(() =>
  LOCALES.find(l => l.value === locale.value)?.label ?? locale.value
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
