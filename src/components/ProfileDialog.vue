<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :max-width="smAndUp ? 680 : undefined"
    :fullscreen="!smAndUp"
    scrollable
  >
    <v-card rounded="xl">
      <v-card-title class="d-flex align-center pa-4">
        <v-btn
          v-if="!smAndUp && editingProfile"
          icon="mdi-arrow-left"
          variant="text"
          size="small"
          class="mr-1"
          @click="editingProfile = null"
        />
        <v-icon v-else class="mr-2" color="primary">mdi-cog</v-icon>
        {{ t('profile.manage') }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0" :style="smAndUp ? 'min-height:500px' : ''">
        <v-row v-if="smAndUp" no-gutters class="h-100">
          <!-- Sidebar -->
          <v-col cols="4" style="border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));">
            <template v-if="smAndUp">
              <v-list density="compact" class="py-2">
                <v-list-item
                  v-for="p in profileStore.profiles"
                  :key="p.id"
                  :value="p.id"
                  :active="selectedId === p.id"
                  color="primary"
                  rounded="lg"
                  class="mx-1 mb-1"
                  @click="selectProfile(p.id)"
                >
                  <template #prepend>
                    <v-icon size="18">mdi-account-circle-outline</v-icon>
                  </template>
                  <v-list-item-title class="text-body-2">{{ p.name }}</v-list-item-title>
                  <v-list-item-subtitle v-if="p.id === sessionStore.activeSession?.profileId" class="text-caption text-primary">
                    {{ t('profile.current') }}
                  </v-list-item-subtitle>
                  <template #append>
                    <v-menu>
                      <template #activator="{ props: menuProps }">
                        <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="x-small" @click.stop />
                      </template>
                      <v-list density="compact" min-width="140">
                        <v-list-item prepend-icon="mdi-download-outline" :title="t('profile.export')" @click="exportProfile(p)" />
                        <v-list-item prepend-icon="mdi-content-copy" :title="t('profile.copy')" @click="duplicateProfile(p)" />
                        <v-list-item
                          v-if="profileStore.profiles.length > 1"
                          prepend-icon="mdi-trash-can-outline"
                          :title="t('profile.delete')"
                          class="text-error"
                          @click="confirmDelete(p.id)"
                        />
                      </v-list>
                    </v-menu>
                  </template>
                </v-list-item>
              </v-list>
              <div class="pa-2 d-flex flex-column gap-1">
                <v-btn block variant="outlined" size="small" prepend-icon="mdi-plus" @click="addNewProfile">
                  {{ t('profile.new') }}
                </v-btn>
                <v-btn block variant="outlined" size="small" prepend-icon="mdi-upload-outline" @click="triggerImport">
                  {{ t('profile.import') }}
                </v-btn>
              </div>
            </template>
          </v-col>

          <!-- Editor -->
          <v-col cols="8">
            <div v-if="editingProfile" class="pa-4">
              <template v-if="true"><!-- editor form -->
                <v-form @submit.prevent="saveProfile">
                  <v-text-field v-model="editingProfile.name" :label="t('profile.name')" variant="outlined" density="compact" prepend-inner-icon="mdi-tag-outline" class="mb-3" />
                  <v-text-field v-model="editingProfile.apiKey" :label="t('profile.apiKey')" variant="outlined" density="compact" :type="showApiKey ? 'text' : 'password'" prepend-inner-icon="mdi-key-outline" :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showApiKey = !showApiKey" class="mb-3" :hint="t('profile.apiKeyHint')" persistent-hint />
                  <v-text-field v-model="editingProfile.model" :label="t('profile.model')" variant="outlined" density="compact" prepend-inner-icon="mdi-robot-outline" :placeholder="t('profile.modelPlaceholder')" class="mb-3" />
                  <v-text-field v-model="editingProfile.endpoint" :label="t('profile.endpoint')" variant="outlined" density="compact" prepend-inner-icon="mdi-server-outline" :placeholder="t('profile.endpointPlaceholder')" :hint="t('profile.endpointHint')" persistent-hint clearable class="mb-3" />
                  <v-divider class="mb-3" />
                  <div class="text-caption text-medium-emphasis mb-3">{{ t('profile.fishAudioSection') }}</div>
                  <v-text-field v-model="editingProfile.fishAudioEndpoint" :label="t('profile.fishAudioEndpoint')" variant="outlined" density="compact" prepend-inner-icon="mdi-server-outline" :placeholder="t('profile.fishAudioEndpointPlaceholder')" :hint="t('profile.fishAudioEndpointHint')" persistent-hint clearable class="mb-3" />
                  <v-text-field v-model="editingProfile.fishAudioApiKey" :label="t('profile.fishAudioApiKey')" variant="outlined" density="compact" :type="showFishAudioKey ? 'text' : 'password'" prepend-inner-icon="mdi-account-voice" :append-inner-icon="showFishAudioKey ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showFishAudioKey = !showFishAudioKey" class="mb-3" :hint="t('profile.fishAudioApiKeyHint')" persistent-hint />
                  <v-text-field v-model="editingProfile.fishAudioSelfReferenceId" :label="t('profile.fishAudioSelfReferenceId')" variant="outlined" density="compact" prepend-inner-icon="mdi-microphone-outline" class="mb-3" :hint="t('profile.fishAudioSelfReferenceIdHint')" persistent-hint clearable />
                  <v-text-field v-model="editingProfile.fishAudioOtherReferenceId" :label="t('profile.fishAudioOtherReferenceId')" variant="outlined" density="compact" prepend-inner-icon="mdi-microphone-outline" class="mb-3" :hint="t('profile.fishAudioOtherReferenceIdHint')" persistent-hint clearable />
                  <v-divider class="mb-3" />
                  <v-row dense class="mb-3">
                    <v-col cols="6"><v-text-field v-model="editingProfile.sourceLanguage" :label="t('profile.sourceLang')" variant="outlined" density="compact" prepend-inner-icon="mdi-translate" :placeholder="t('profile.sourceLangPlaceholder')" /></v-col>
                    <v-col cols="6"><v-text-field v-model="editingProfile.targetLanguage" :label="t('profile.targetLang')" variant="outlined" density="compact" prepend-inner-icon="mdi-translate" :placeholder="t('profile.targetLangPlaceholder')" /></v-col>
                  </v-row>
                  <v-text-field v-model.number="editingProfile.contextSize" :label="t('profile.contextSize')" variant="outlined" density="compact" type="number" :min="1" :max="100" prepend-inner-icon="mdi-history" :hint="t('profile.contextSizeHint')" persistent-hint class="mb-3" />
                  <v-textarea v-model="editingProfile.systemPrompt" :label="t('profile.systemPrompt')" variant="outlined" density="compact" :hint="t('profile.systemPromptHint')" persistent-hint rows="6" class="mb-1" />
                  <div class="d-flex justify-end mb-3">
                    <v-btn size="x-small" variant="text" color="primary" @click="resetSystemPrompt">{{ t('profile.resetPrompt') }}</v-btn>
                  </div>
                  <v-textarea v-model="editingProfile.translateInstruction" :label="t('profile.translateInstruction')" variant="outlined" density="compact" :hint="t('profile.translateInstructionHint')" persistent-hint rows="3" class="mb-1" />
                  <div class="d-flex justify-end mb-3">
                    <v-btn size="x-small" variant="text" color="primary" @click="resetTranslateInstruction">{{ t('profile.resetPrompt') }}</v-btn>
                  </div>
                  <v-textarea v-model="editingProfile.backTranslateInstruction" :label="t('profile.backTranslateInstruction')" variant="outlined" density="compact" :hint="t('profile.backTranslateInstructionHint')" persistent-hint rows="3" class="mb-1" />
                  <div class="d-flex justify-end mb-3">
                    <v-btn size="x-small" variant="text" color="primary" @click="resetBackTranslateInstruction">{{ t('profile.resetPrompt') }}</v-btn>
                  </div>
                  <v-textarea v-model="editingProfile.contextMessageFormat" :label="t('profile.contextMessageFormat')" variant="outlined" density="compact" :hint="t('profile.contextMessageFormatHint')" persistent-hint rows="3" class="mb-1" />
                  <div class="d-flex justify-end mb-3">
                    <v-btn size="x-small" variant="text" color="primary" @click="resetContextMessageFormat">{{ t('profile.resetPrompt') }}</v-btn>
                  </div>
                  <v-textarea v-model="editingProfile.contextHeader" :label="t('profile.contextHeader')" variant="outlined" density="compact" :hint="t('profile.contextHeaderHint')" persistent-hint rows="3" class="mb-1" />
                  <div class="d-flex justify-end mb-3">
                    <v-btn size="x-small" variant="text" color="primary" @click="resetContextHeader">{{ t('profile.resetPrompt') }}</v-btn>
                  </div>
                  <v-divider class="mb-3" />
                  <div class="d-flex gap-2">
                    <v-btn color="primary" type="submit" :loading="saving" prepend-icon="mdi-content-save">{{ t('profile.save') }}</v-btn>
                    <v-btn v-if="selectedId !== sessionStore.activeSession?.profileId" variant="outlined" prepend-icon="mdi-check-circle-outline" @click="useThisProfile">{{ t('profile.use') }}</v-btn>
                    <v-btn v-else variant="tonal" color="success" prepend-icon="mdi-check-circle" disabled>{{ t('profile.inUse') }}</v-btn>
                  </div>
                </v-form>
              </template>
            </div>
            <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis">
              {{ t('profile.selectOrCreate') }}
            </div>
          </v-col>
        </v-row>

        <!-- Mobile -->
        <template v-else>
          <!-- Mobile editor -->
          <div v-if="editingProfile" class="pa-4">
            <v-form @submit.prevent="saveProfile">
              <v-text-field v-model="editingProfile.name" :label="t('profile.name')" variant="outlined" density="compact" prepend-inner-icon="mdi-tag-outline" class="mb-3" />
              <v-text-field v-model="editingProfile.apiKey" :label="t('profile.apiKey')" variant="outlined" density="compact" :type="showApiKey ? 'text' : 'password'" prepend-inner-icon="mdi-key-outline" :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showApiKey = !showApiKey" class="mb-3" :hint="t('profile.apiKeyHint')" persistent-hint />
              <v-text-field v-model="editingProfile.model" :label="t('profile.model')" variant="outlined" density="compact" prepend-inner-icon="mdi-robot-outline" :placeholder="t('profile.modelPlaceholder')" class="mb-3" />
              <v-text-field v-model="editingProfile.endpoint" :label="t('profile.endpoint')" variant="outlined" density="compact" prepend-inner-icon="mdi-server-outline" :placeholder="t('profile.endpointPlaceholder')" :hint="t('profile.endpointHint')" persistent-hint clearable class="mb-3" />
              <v-divider class="mb-3" />
              <div class="text-caption text-medium-emphasis mb-3">{{ t('profile.fishAudioSection') }}</div>
              <v-text-field v-model="editingProfile.fishAudioEndpoint" :label="t('profile.fishAudioEndpoint')" variant="outlined" density="compact" prepend-inner-icon="mdi-server-outline" :placeholder="t('profile.fishAudioEndpointPlaceholder')" :hint="t('profile.fishAudioEndpointHint')" persistent-hint clearable class="mb-3" />
              <v-text-field v-model="editingProfile.fishAudioApiKey" :label="t('profile.fishAudioApiKey')" variant="outlined" density="compact" :type="showFishAudioKey ? 'text' : 'password'" prepend-inner-icon="mdi-account-voice" :append-inner-icon="showFishAudioKey ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="showFishAudioKey = !showFishAudioKey" class="mb-3" :hint="t('profile.fishAudioApiKeyHint')" persistent-hint />
              <v-text-field v-model="editingProfile.fishAudioSelfReferenceId" :label="t('profile.fishAudioSelfReferenceId')" variant="outlined" density="compact" prepend-inner-icon="mdi-microphone-outline" class="mb-3" :hint="t('profile.fishAudioSelfReferenceIdHint')" persistent-hint clearable />
              <v-text-field v-model="editingProfile.fishAudioOtherReferenceId" :label="t('profile.fishAudioOtherReferenceId')" variant="outlined" density="compact" prepend-inner-icon="mdi-microphone-outline" class="mb-3" :hint="t('profile.fishAudioOtherReferenceIdHint')" persistent-hint clearable />
              <v-divider class="mb-3" />
              <v-row dense class="mb-3">
                <v-col cols="6"><v-text-field v-model="editingProfile.sourceLanguage" :label="t('profile.sourceLang')" variant="outlined" density="compact" prepend-inner-icon="mdi-translate" :placeholder="t('profile.sourceLangPlaceholder')" /></v-col>
                <v-col cols="6"><v-text-field v-model="editingProfile.targetLanguage" :label="t('profile.targetLang')" variant="outlined" density="compact" prepend-inner-icon="mdi-translate" :placeholder="t('profile.targetLangPlaceholder')" /></v-col>
              </v-row>
              <v-text-field v-model.number="editingProfile.contextSize" :label="t('profile.contextSize')" variant="outlined" density="compact" type="number" :min="1" :max="100" prepend-inner-icon="mdi-history" :hint="t('profile.contextSizeHint')" persistent-hint class="mb-3" />
              <v-textarea v-model="editingProfile.systemPrompt" :label="t('profile.systemPrompt')" variant="outlined" density="compact" :hint="t('profile.systemPromptHint')" persistent-hint rows="6" class="mb-1" />
              <div class="d-flex justify-end mb-3">
                <v-btn size="x-small" variant="text" color="primary" @click="resetSystemPrompt">{{ t('profile.resetPrompt') }}</v-btn>
              </div>
              <v-textarea v-model="editingProfile.translateInstruction" :label="t('profile.translateInstruction')" variant="outlined" density="compact" :hint="t('profile.translateInstructionHint')" persistent-hint rows="3" class="mb-1" />
              <div class="d-flex justify-end mb-3">
                <v-btn size="x-small" variant="text" color="primary" @click="resetTranslateInstruction">{{ t('profile.resetPrompt') }}</v-btn>
              </div>
              <v-textarea v-model="editingProfile.backTranslateInstruction" :label="t('profile.backTranslateInstruction')" variant="outlined" density="compact" :hint="t('profile.backTranslateInstructionHint')" persistent-hint rows="3" class="mb-1" />
              <div class="d-flex justify-end mb-3">
                <v-btn size="x-small" variant="text" color="primary" @click="resetBackTranslateInstruction">{{ t('profile.resetPrompt') }}</v-btn>
              </div>
              <v-textarea v-model="editingProfile.contextMessageFormat" :label="t('profile.contextMessageFormat')" variant="outlined" density="compact" :hint="t('profile.contextMessageFormatHint')" persistent-hint rows="3" class="mb-1" />
              <div class="d-flex justify-end mb-3">
                <v-btn size="x-small" variant="text" color="primary" @click="resetContextMessageFormat">{{ t('profile.resetPrompt') }}</v-btn>
              </div>
              <v-textarea v-model="editingProfile.contextHeader" :label="t('profile.contextHeader')" variant="outlined" density="compact" :hint="t('profile.contextHeaderHint')" persistent-hint rows="3" class="mb-1" />
              <div class="d-flex justify-end mb-3">
                <v-btn size="x-small" variant="text" color="primary" @click="resetContextHeader">{{ t('profile.resetPrompt') }}</v-btn>
              </div>
              <v-divider class="mb-3" />
              <div class="d-flex gap-2">
                <v-btn color="primary" type="submit" :loading="saving" prepend-icon="mdi-content-save">{{ t('profile.save') }}</v-btn>
                <v-btn v-if="selectedId !== sessionStore.activeSession?.profileId" variant="outlined" prepend-icon="mdi-check-circle-outline" @click="useThisProfile">{{ t('profile.use') }}</v-btn>
                <v-btn v-else variant="tonal" color="success" prepend-icon="mdi-check-circle" disabled>{{ t('profile.inUse') }}</v-btn>
              </div>
            </v-form>
          </div>

          <!-- Mobile list -->
          <template v-else>
            <v-list density="compact" class="py-2">
              <v-list-item
                v-for="p in profileStore.profiles"
                :key="p.id"
                :value="p.id"
                :active="selectedId === p.id"
                color="primary"
                rounded="lg"
                class="mx-1 mb-1"
                @click="selectProfile(p.id)"
              >
                <template #prepend>
                  <v-icon size="18">mdi-account-circle-outline</v-icon>
                </template>
                <v-list-item-title>{{ p.name }}</v-list-item-title>
                <v-list-item-subtitle v-if="p.id === sessionStore.activeSession?.profileId" class="text-caption text-primary">
                  {{ t('profile.current') }}
                </v-list-item-subtitle>
                <template #append>
                  <div class="d-flex align-center gap-1">
                    <v-icon size="18" color="grey">mdi-chevron-right</v-icon>
                    <v-menu>
                      <template #activator="{ props: menuProps }">
                        <v-btn v-bind="menuProps" icon="mdi-dots-vertical" variant="text" size="x-small" @click.stop />
                      </template>
                      <v-list density="compact" min-width="140">
                        <v-list-item prepend-icon="mdi-download-outline" :title="t('profile.export')" @click="exportProfile(p)" />
                        <v-list-item prepend-icon="mdi-content-copy" :title="t('profile.copy')" @click="duplicateProfile(p)" />
                        <v-list-item v-if="profileStore.profiles.length > 1" prepend-icon="mdi-trash-can-outline" :title="t('profile.delete')" class="text-error" @click="confirmDelete(p.id)" />
                      </v-list>
                    </v-menu>
                  </div>
                </template>
              </v-list-item>
            </v-list>
            <div class="pa-3 d-flex flex-column gap-2">
              <v-btn block variant="outlined" prepend-icon="mdi-plus" @click="addNewProfile">
                {{ t('profile.new') }}
              </v-btn>
              <v-btn block variant="outlined" prepend-icon="mdi-upload-outline" @click="triggerImport">
                {{ t('profile.import') }}
              </v-btn>
            </div>
          </template>
        </template>
      </v-card-text>
    </v-card>

    <input ref="fileInput" type="file" accept=".json,application/json" class="d-none" @change="onImportFile" />

    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card rounded="xl">
        <v-card-title>{{ t('profile.deleteTitle') }}</v-card-title>
        <v-card-text>{{ t('profile.deleteConfirm') }}</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">{{ t('profile.cancel') }}</v-btn>
          <v-btn color="error" variant="tonal" @click="deleteProfile">{{ t('profile.delete') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'
import { useI18n } from 'vue-i18n'
import { useProfileStore, DEFAULT_PROFILE } from '../stores/profileStore'
import { useSessionStore } from '../stores/sessionStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const { smAndUp } = useDisplay()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()

const selectedId = ref(sessionStore.activeSession?.profileId || profileStore.profiles[0]?.id)
const editingProfile = ref(null)
const showApiKey = ref(false)
const showFishAudioKey = ref(false)
const saving = ref(false)
const deleteDialog = ref(false)
const deleteTargetId = ref(null)
const fileInput = ref(null)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      selectedId.value = sessionStore.activeSession?.profileId || profileStore.profiles[0]?.id
      loadProfile(selectedId.value)
    }
  }
)

function loadProfile(id) {
  const p = profileStore.profiles.find(p => p.id === id)
  if (p) {
    editingProfile.value = { ...p }
    selectedId.value = id
  }
}

function selectProfile(id) {
  selectedId.value = id
  loadProfile(id)
}

function duplicateProfile(p) {
  const { id, ...rest } = p
  const copy = profileStore.addProfile({ ...rest, name: t('profile.copyName', { name: p.name }) })
  loadProfile(copy.id)
}

function addNewProfile() {
  const p = profileStore.addProfile({
    ...DEFAULT_PROFILE,
    name: `Profile ${profileStore.profiles.length + 1}`,
  })
  loadProfile(p.id)
}

function saveProfile() {
  saving.value = true
  try {
    profileStore.updateProfile(selectedId.value, { ...editingProfile.value })
  } finally {
    saving.value = false
  }
}

function useThisProfile() {
  saveProfile()
  if (sessionStore.activeSession) {
    sessionStore.updateSessionProfile(sessionStore.activeSession.id, selectedId.value)
  }
}

function confirmDelete(id) {
  deleteTargetId.value = id
  deleteDialog.value = true
}

function deleteProfile() {
  if (deleteTargetId.value) {
    profileStore.deleteProfile(deleteTargetId.value)
    if (selectedId.value === deleteTargetId.value) {
      editingProfile.value = null
      loadProfile(sessionStore.activeSession?.profileId || profileStore.profiles[0]?.id)
    }
  }
  deleteDialog.value = false
}

function resetSystemPrompt() {
  if (editingProfile.value) {
    editingProfile.value.systemPrompt = DEFAULT_PROFILE.systemPrompt
  }
}

function resetTranslateInstruction() {
  if (editingProfile.value) {
    editingProfile.value.translateInstruction = DEFAULT_PROFILE.translateInstruction
  }
}

function resetBackTranslateInstruction() {
  if (editingProfile.value) {
    editingProfile.value.backTranslateInstruction = DEFAULT_PROFILE.backTranslateInstruction
  }
}

function resetContextMessageFormat() {
  if (editingProfile.value) {
    editingProfile.value.contextMessageFormat = DEFAULT_PROFILE.contextMessageFormat
  }
}

function resetContextHeader() {
  if (editingProfile.value) {
    editingProfile.value.contextHeader = DEFAULT_PROFILE.contextHeader
  }
}

function exportProfile(p) {
  const { id, ...data } = p
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${p.name}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function triggerImport() {
  fileInput.value?.click()
}

function onImportFile(event) {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      let data = JSON.parse(e.target.result)
      if (!Array.isArray(data)) data = [data]
      let lastProfile = null
      for (const item of data) {
        if (typeof item !== 'object' || item === null) continue
        const { id: _id, ...rest } = item
        lastProfile = profileStore.addProfile({ ...DEFAULT_PROFILE, ...rest })
      }
      if (lastProfile) loadProfile(lastProfile.id)
    } catch {
      // ignore invalid file
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

function close() {
  emit('update:modelValue', false)
}
</script>
