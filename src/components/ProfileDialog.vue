<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="680" scrollable>
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2" color="primary">mdi-cog</v-icon>
        {{ t('profile.manage') }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="close" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-0" style="min-height: 500px;">
        <v-row no-gutters class="h-100">
          <!-- Profile list sidebar -->
          <v-col cols="4" style="border-right: 1px solid rgba(0,0,0,0.12);">
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
                <v-list-item-subtitle v-if="p.id === profileStore.activeProfileId" class="text-caption text-primary">
                  {{ t('profile.current') }}
                </v-list-item-subtitle>
                <template #append>
                  <v-menu>
                    <template #activator="{ props: menuProps }">
                      <v-btn
                        v-bind="menuProps"
                        icon="mdi-dots-vertical"
                        variant="text"
                        size="x-small"
                        @click.stop
                      />
                    </template>
                    <v-list density="compact" min-width="140">
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

            <div class="pa-2">
              <v-btn
                block
                variant="outlined"
                size="small"
                prepend-icon="mdi-plus"
                @click="addNewProfile"
              >
                {{ t('profile.new') }}
              </v-btn>
            </div>
          </v-col>

          <!-- Profile editor -->
          <v-col cols="8">
            <div v-if="editingProfile" class="pa-4">
              <v-form @submit.prevent="saveProfile">
                <v-text-field
                  v-model="editingProfile.name"
                  :label="t('profile.name')"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-tag-outline"
                  class="mb-3"
                />

                <v-text-field
                  v-model="editingProfile.apiKey"
                  :label="t('profile.apiKey')"
                  variant="outlined"
                  density="compact"
                  :type="showApiKey ? 'text' : 'password'"
                  prepend-inner-icon="mdi-key-outline"
                  :append-inner-icon="showApiKey ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append-inner="showApiKey = !showApiKey"
                  class="mb-3"
                  :hint="t('profile.apiKeyHint')"
                  persistent-hint
                />

                <v-text-field
                  v-model="editingProfile.model"
                  :label="t('profile.model')"
                  variant="outlined"
                  density="compact"
                  prepend-inner-icon="mdi-robot-outline"
                  :placeholder="t('profile.modelPlaceholder')"
                  class="mb-3"
                />

                <v-row dense class="mb-3">
                  <v-col cols="6">
                    <v-text-field
                      v-model="editingProfile.sourceLanguage"
                      :label="t('profile.sourceLang')"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-translate"
                      :placeholder="t('profile.sourceLangPlaceholder')"
                      class="mb-0"
                    />
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model="editingProfile.targetLanguage"
                      :label="t('profile.targetLang')"
                      variant="outlined"
                      density="compact"
                      prepend-inner-icon="mdi-translate"
                      :placeholder="t('profile.targetLangPlaceholder')"
                      class="mb-0"
                    />
                  </v-col>
                </v-row>

                <v-text-field
                  v-model.number="editingProfile.contextSize"
                  :label="t('profile.contextSize')"
                  variant="outlined"
                  density="compact"
                  type="number"
                  :min="1"
                  :max="100"
                  prepend-inner-icon="mdi-history"
                  :hint="t('profile.contextSizeHint')"
                  persistent-hint
                  class="mb-3"
                />

                <v-textarea
                  v-model="editingProfile.systemPrompt"
                  :label="t('profile.systemPrompt')"
                  variant="outlined"
                  density="compact"
                  :hint="t('profile.systemPromptHint')"
                  persistent-hint
                  rows="6"
                  class="mb-1"
                  placeholder="自定义翻译指令..."
                />
                <div class="d-flex justify-end mb-3">
                  <v-btn
                    size="x-small"
                    variant="text"
                    color="primary"
                    @click="resetSystemPrompt"
                  >
                    {{ t('profile.resetPrompt') }}
                  </v-btn>
                </div>

                <v-divider class="mb-3" />

                <div class="d-flex gap-2">
                  <v-btn
                    color="primary"
                    type="submit"
                    :loading="saving"
                    prepend-icon="mdi-content-save"
                  >
                    {{ t('profile.save') }}
                  </v-btn>
                  <v-btn
                    v-if="selectedId !== profileStore.activeProfileId"
                    variant="outlined"
                    prepend-icon="mdi-check-circle-outline"
                    @click="useThisProfile"
                  >
                    {{ t('profile.use') }}
                  </v-btn>
                  <v-btn
                    v-else
                    variant="tonal"
                    color="success"
                    prepend-icon="mdi-check-circle"
                    disabled
                  >
                    {{ t('profile.inUse') }}
                  </v-btn>
                </div>
              </v-form>
            </div>
            <div v-else class="d-flex align-center justify-center h-100 text-medium-emphasis">
              {{ t('profile.selectOrCreate') }}
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Delete confirm -->
    <v-dialog v-model="deleteDialog" max-width="360">
      <v-card>
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
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfileStore, DEFAULT_SYSTEM_PROMPT } from '../stores/profileStore'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()
const profileStore = useProfileStore()

const selectedId = ref(profileStore.activeProfileId)
const editingProfile = ref(null)
const showApiKey = ref(false)
const saving = ref(false)
const deleteDialog = ref(false)
const deleteTargetId = ref(null)

watch(
  () => props.modelValue,
  (v) => {
    if (v) {
      selectedId.value = profileStore.activeProfileId
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
    name: `Profile ${profileStore.profiles.length + 1}`,
    apiKey: '',
    model: 'gemini-3.1-flash-lite',
    sourceLanguage: '中文',
    targetLanguage: 'English',
    contextSize: 12,
    systemPrompt: profileStore.DEFAULT_SYSTEM_PROMPT,
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
  profileStore.setActive(selectedId.value)
}

function confirmDelete(id) {
  deleteTargetId.value = id
  deleteDialog.value = true
}

function deleteProfile() {
  if (deleteTargetId.value) {
    profileStore.deleteProfile(deleteTargetId.value)
    if (selectedId.value === deleteTargetId.value) {
      loadProfile(profileStore.activeProfileId)
    }
  }
  deleteDialog.value = false
}

function resetSystemPrompt() {
  if (editingProfile.value) {
    editingProfile.value.systemPrompt = DEFAULT_SYSTEM_PROMPT
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>
