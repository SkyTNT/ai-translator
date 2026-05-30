<template>
  <div
    class="message-bubble-wrapper d-flex mb-3"
    :class="isSelf ? 'justify-end' : 'justify-start'"

  >
    <!-- Avatar -->
    <v-avatar
      v-if="!isSelf"
      size="32"
      color="surface-variant"
      class="mr-2 mt-1 flex-shrink-0"
    >
      <v-icon size="18" color="on-surface-variant">mdi-account</v-icon>
    </v-avatar>

    <div style="max-width: 70%; min-width: 120px;">
      <!-- Role label -->
      <div
        class="text-caption text-medium-emphasis mb-1"
        :class="isSelf ? 'text-right' : 'text-left'"
      >
        {{ isSelf ? t('chat.self') : t('chat.other') }}
      </div>

      <!-- Bubble -->
      <v-card
        :color="isSelf ? 'primary' : 'surface-variant'"
        :class="['pa-3 rounded-xl', isSelf ? 'rounded-tr-sm' : 'rounded-tl-sm']"
        elevation="0"
      >
        <!-- Images -->
        <div v-if="message.images?.length" class="mb-2">
          <div class="d-flex flex-wrap gap-2">
            <v-card
              v-for="(img, i) in message.images"
              :key="i"
              rounded="lg"
              elevation="0"
              class="overflow-hidden cursor-pointer flex-shrink-0"
              style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));"
              @click="openViewerFromSrc(img.url)"
            >
              <v-img :src="img.url" cover :width="imgSize" :height="imgSize" />
            </v-card>
          </div>
        </div>

        <!-- Audio player -->
        <div v-if="message.audio" class="mb-2">
          <div
            class="d-flex align-center gap-2 px-2 py-1 rounded-pill"
            :style="audioTrackStyle"
          >
            <v-btn
              :icon="audioPlaying ? 'mdi-pause' : 'mdi-play'"
              :color="isSelf ? 'on-primary' : 'primary'"
              variant="text"
              size="small"
              density="comfortable"
              style="position: relative; z-index: 1; flex-shrink: 0;"
              @click="togglePlay"
            />
            <v-slider
              v-model="audioCurrentTime"
              :max="audioDuration || 1"
              density="compact"
              :color="isSelf ? 'on-primary' : 'primary'"
              :track-color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.35)' : 'primary-lighten-3'"
              hide-details
              thumb-size="10"
              class="flex-grow-1"
              style="min-width: 80px;"
              @update:model-value="seek"
            />
            <span
              class="text-caption"
              :class="isSelf ? 'text-on-primary' : 'text-primary'"
              style="white-space: nowrap; min-width: 68px; text-align: right;"
            >
              {{ fmtTime(audioCurrentTime) }} / {{ fmtTime(audioDuration) }}
            </span>
          </div>
          <audio
            ref="audioEl"
            :src="message.audio.url"
            style="display: none;"
            @timeupdate="audioCurrentTime = audioEl.currentTime"
            @ended="audioPlaying = false"
            @loadedmetadata="audioDuration = audioEl.duration"
          />
        </div>

        <!-- Separator between media and text -->
        <v-divider
          v-if="(message.images?.length || message.audio) && message.originalText"
          :color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.2)' : 'rgba(var(--v-theme-on-surface), 0.08)'"
          class="mb-2"
        />

        <!-- Original text -->
        <div
          v-if="message.originalText"
          :class="['text-body-2', isSelf ? 'text-on-primary' : 'text-on-surface-variant']"
          style="white-space: pre-wrap; word-break: break-word;"
        >
          {{ message.originalText }}
        </div>

        <!-- Divider -->
        <v-divider
          v-if="(message.originalText || message.images?.length || message.audio) && (message.translation || message.isTranslating)"
          :color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.3)' : 'rgba(var(--v-theme-on-surface), 0.1)'"
          class="my-2"
        />

        <!-- Translation -->
        <div v-if="message.isTranslating" class="d-flex align-center gap-1">
          <v-progress-circular size="14" width="2" indeterminate :color="isSelf ? 'on-primary' : 'primary'" />
          <span :class="['text-caption', isSelf ? 'text-on-primary opacity-70' : 'text-on-surface-variant opacity-70']">
            {{ t('chat.translating') }}
          </span>
        </div>
        <template v-else-if="message.translation">
          <v-textarea
            v-if="editingTranslation"
            ref="translationTextarea"
            v-model="editingText"
            variant="plain"
            density="compact"
            hide-details
            auto-grow
            rows="1"
            :color="isSelf ? 'on-primary' : 'primary'"
            :class="['text-body-2', isSelf ? 'text-on-primary opacity-80' : 'text-on-surface-variant opacity-80']"
            style="font-style: italic; padding: 0; margin: 0;"
            @keydown.ctrl.enter.prevent="confirmEditTranslation"
            @keydown.escape.prevent="cancelEditTranslation"
          />
          <div
            v-else
            :class="['text-body-2', isSelf ? 'text-on-primary opacity-80' : 'text-on-surface-variant opacity-80']"
            style="white-space: pre-wrap; word-break: break-word; font-style: italic;"
          >
            {{ message.translation }}
          </div>
          <div v-if="editingTranslation" class="d-flex justify-end gap-1 mt-1">
            <v-btn icon="mdi-close" size="x-small" variant="text" :color="isSelf ? 'on-primary' : 'on-surface-variant'" density="compact" @click="cancelEditTranslation" />
            <v-btn icon="mdi-check" size="x-small" variant="text" :color="isSelf ? 'on-primary' : 'primary'" density="compact" @click="confirmEditTranslation" />
          </div>
        </template>

        <!-- Back-translation -->
        <template v-if="message.backTranslation || message.isBackTranslating">
          <v-divider :color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.2)' : 'rgba(var(--v-theme-on-surface), 0.08)'" class="my-2" />
          <div class="d-flex align-center gap-1 mb-1">
            <v-icon size="12" :color="isSelf ? 'on-primary' : 'on-surface-variant'">mdi-rotate-left</v-icon>
            <span :class="['text-caption', isSelf ? 'text-on-primary opacity-60' : 'text-on-surface-variant opacity-60']">
              {{ t('chat.backTranslationLabel') }}
            </span>
            <v-btn
              v-if="message.backTranslation && !message.isBackTranslating"
              icon="mdi-close"
              size="x-small"
              variant="text"
              :color="isSelf ? 'on-primary' : 'on-surface-variant'"
              density="compact"
              style="margin-left: auto; opacity: 0.5; min-width: 20px; min-height: 20px;"
              @click="deleteBackTranslation"
            />
          </div>
          <div v-if="message.isBackTranslating" class="d-flex align-center gap-1">
            <v-progress-circular size="12" width="2" indeterminate :color="isSelf ? 'on-primary' : 'primary'" />
            <span :class="['text-caption', isSelf ? 'text-on-primary opacity-60' : 'text-on-surface-variant opacity-60']">
              {{ t('chat.backTranslating') }}
            </span>
          </div>
          <div
            v-else-if="message.backTranslation"
            :class="['text-body-2', isSelf ? 'text-on-primary opacity-60' : 'text-on-surface-variant opacity-50']"
            style="white-space: pre-wrap; word-break: break-word; font-style: italic;"
          >
            {{ message.backTranslation }}
          </div>
        </template>

        <!-- TTS player -->
        <template v-if="message.ttsAudio">
          <v-divider :color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.2)' : 'rgba(var(--v-theme-on-surface), 0.08)'" class="my-2" />
          <div class="d-flex align-center gap-1 mb-1">
            <v-icon size="12" :color="isSelf ? 'on-primary' : 'on-surface-variant'">mdi-volume-high</v-icon>
            <span :class="['text-caption', isSelf ? 'text-on-primary opacity-60' : 'text-on-surface-variant opacity-60']">
              {{ t('chat.ttsLabel') }}
            </span>
            <v-btn
              icon="mdi-close"
              size="x-small"
              variant="text"
              :color="isSelf ? 'on-primary' : 'on-surface-variant'"
              density="compact"
              style="margin-left: auto; opacity: 0.5; min-width: 20px; min-height: 20px;"
              @click="deleteTTSAudio"
            />
          </div>
          <div class="d-flex align-center gap-2 px-2 py-1 rounded-pill" :style="audioTrackStyle">
            <v-btn
              :icon="ttsPlaying ? 'mdi-pause' : 'mdi-play'"
              :color="isSelf ? 'on-primary' : 'primary'"
              variant="text"
              size="small"
              density="comfortable"
              style="position: relative; z-index: 1; flex-shrink: 0;"
              @click="toggleTTSPlay"
            />
            <v-slider
              v-model="ttsCurrentTime"
              :max="ttsDuration || 1"
              density="compact"
              :color="isSelf ? 'on-primary' : 'primary'"
              :track-color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.35)' : 'primary-lighten-3'"
              hide-details
              thumb-size="10"
              class="flex-grow-1"
              style="min-width: 80px;"
              @update:model-value="seekTTS"
            />
            <span
              class="text-caption"
              :class="isSelf ? 'text-on-primary' : 'text-primary'"
              style="white-space: nowrap; min-width: 68px; text-align: right;"
            >
              {{ fmtTime(ttsCurrentTime) }} / {{ fmtTime(ttsDuration) }}
            </span>
          </div>
          <audio
            ref="ttsEl"
            :src="message.ttsAudio"
            style="display: none;"
            @timeupdate="ttsCurrentTime = ttsEl.currentTime"
            @ended="ttsPlaying = false"
            @loadedmetadata="ttsDuration = ttsEl.duration"
          />
        </template>
      </v-card>

      <!-- Error chip -->
      <div
        v-if="message.error"
        class="d-flex align-center gap-1 mt-1"
        :class="isSelf ? 'justify-end' : 'justify-start'"
      >
        <div
          class="d-flex align-center gap-1 rounded-pill px-3 py-1"
          style="background: rgba(var(--v-theme-error), 0.12); max-width: 100%;"
        >
          <v-icon size="14" style="color: rgb(var(--v-theme-error));">mdi-alert-circle-outline</v-icon>
          <span class="text-caption" style="color: rgb(var(--v-theme-error)); word-break: break-word;">{{ message.error }}</span>
          <v-btn
            icon="mdi-refresh"
            size="x-small"
            variant="text"
            color="error"
            density="compact"
            style="min-width: 28px; min-height: 28px;"
            @click="$emit('retranslate')"
          />
        </div>
      </div>

      <!-- Timestamp + actions -->
      <div
        class="d-flex align-center mt-1 gap-1"
        :class="isSelf ? 'justify-end' : 'justify-start'"
      >
        <!-- Delete -->
        <v-btn icon variant="text" size="small" color="error" style="min-width: 40px; min-height: 40px;" @click="$emit('delete')">
          <v-icon size="16">mdi-trash-can-outline</v-icon>
        </v-btn>

        <template v-if="message.translation && !message.isTranslating">
          <!-- Fullscreen -->
          <v-tooltip :text="t('chat.fullscreen')" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" color="on-surface-variant" style="min-width: 40px; min-height: 40px;" @click="openFullscreen">
                <v-icon size="16">mdi-fullscreen</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <!-- Edit translation -->
          <v-tooltip :text="t('chat.editTranslation')" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" color="on-surface-variant" style="min-width: 40px; min-height: 40px;" @click="startEditTranslation">
                <v-icon size="16">mdi-pencil-outline</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <!-- Copy translation -->
          <v-tooltip :text="t('chat.copy')" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" color="on-surface-variant" style="min-width: 40px; min-height: 40px;" @click="copyTranslation">
                <v-icon size="16">mdi-content-copy</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <!-- Re-translate -->
          <v-tooltip :text="t('chat.retranslate')" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" color="on-surface-variant" style="min-width: 40px; min-height: 40px;" @click="$emit('retranslate')">
                <v-icon size="16">mdi-refresh</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <!-- Back-translate -->
          <v-tooltip :text="t('chat.backTranslate')" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" color="on-surface-variant" style="min-width: 40px; min-height: 40px;"
                :loading="message.isBackTranslating"
                @click="$emit('back-translate')"
              >
                <v-icon size="16">mdi-rotate-left</v-icon>
              </v-btn>
            </template>
          </v-tooltip>

          <!-- TTS -->
          <v-tooltip v-if="ttsAvailable" :text="t('chat.tts')" location="top">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon variant="text" size="small" color="on-surface-variant" style="min-width: 40px; min-height: 40px;"
                :loading="ttsLoading"
                @click="generateTTS"
              >
                <v-icon size="16">mdi-volume-high</v-icon>
              </v-btn>
            </template>
          </v-tooltip>
        </template>

        <span class="text-caption text-medium-emphasis">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>
    </div>

    <!-- Self avatar -->
    <v-avatar
      v-if="isSelf"
      size="32"
      color="primary"
      variant="tonal"
      class="ml-2 mt-1 flex-shrink-0"
    >
      <v-icon size="18" color="primary">mdi-account-circle</v-icon>
    </v-avatar>
  </div>

</template>

<script setup>
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { openViewerFromSrc } from '../composables/useViewer.js'
import { openTranslationViewer } from '../composables/useTranslationViewer.js'
import { useProfileStore } from '../stores/profileStore.js'
import { useSessionStore } from '../stores/sessionStore.js'
import { textToSpeech, registerTTSStop, unregisterTTSStop } from '../services/fishAudioService.js'

const props = defineProps({
  message: { type: Object, required: true },
})
const emit = defineEmits(['delete', 'retranslate', 'back-translate'])


const { t, locale } = useI18n()
const profileStore = useProfileStore()
const sessionStore = useSessionStore()
const isSelf = computed(() => props.message.role === 'self')

// Image layout
const imgCount = computed(() => props.message.images?.length || 0)
const imgSize = computed(() => imgCount.value === 1 ? 200 : 120)
// Audio player
const audioEl = ref(null)
const audioPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDuration = ref(0)

const audioTrackStyle = computed(() => ({
  background: isSelf.value ? 'rgba(var(--v-theme-on-primary), 0.12)' : 'rgba(var(--v-theme-primary), 0.08)',
  border: isSelf.value
    ? '1px solid rgba(var(--v-theme-on-primary), 0.2)'
    : '1px solid rgba(var(--v-theme-primary), 0.2)',
}))

function togglePlay() {
  const el = audioEl.value
  if (!el) return
  if (audioPlaying.value) {
    el.pause()
    audioPlaying.value = false
  } else {
    el.play()
    audioPlaying.value = true
  }
}

function seek(val) {
  if (audioEl.value) audioEl.value.currentTime = val
}

function fmtTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' })
}

async function copyTranslation() {
  try {
    await navigator.clipboard.writeText(props.message.translation)
  } catch {}
}

// Translation editing
const editingTranslation = ref(false)
const editingText = ref('')
const translationTextarea = ref(null)

function startEditTranslation() {
  if (editingTranslation.value) {
    confirmEditTranslation()
    return
  }
  editingText.value = props.message.translation
  editingTranslation.value = true
  nextTick(() => translationTextarea.value?.focus())
}

function confirmEditTranslation() {
  if (editingText.value.trim()) {
    sessionStore.updateMessage(sessionStore.activeSessionId, props.message.id, { translation: editingText.value })
  }
  editingTranslation.value = false
}

function cancelEditTranslation() {
  editingTranslation.value = false
}

// TTS player
const ttsEl = ref(null)
const ttsPlaying = ref(false)
const ttsCurrentTime = ref(0)
const ttsDuration = ref(0)
const ttsProfile = computed(() => {
  const session = sessionStore.activeSession
  if (!session) return profileStore.activeProfile
  return profileStore.profiles.find(p => p.id === session.profileId) || profileStore.activeProfile
})
const ttsAvailable = computed(() => !!ttsProfile.value?.fishAudioApiKey)
const ttsLoading = ref(false)


function stopTTS() {
  if (ttsEl.value) {
    ttsEl.value.pause()
    ttsPlaying.value = false
  }
  unregisterTTSStop(stopTTS)
}

function toggleTTSPlay() {
  if (!ttsEl.value) return
  if (ttsPlaying.value) {
    ttsEl.value.pause()
    ttsPlaying.value = false
    unregisterTTSStop(stopTTS)
  } else {
    registerTTSStop(stopTTS)
    ttsEl.value.play()
    ttsPlaying.value = true
  }
}

function seekTTS(val) {
  if (ttsEl.value) ttsEl.value.currentTime = val
}

async function generateTTS() {
  const profile = ttsProfile.value
  if (!profile?.fishAudioApiKey) return

  ttsLoading.value = true
  if (ttsEl.value) {
    ttsEl.value.pause()
    ttsPlaying.value = false
  }

  try {
    const dataUrl = await textToSpeech({
      text: props.message.translation,
      apiKey: profile.fishAudioApiKey,
      referenceId: isSelf.value ? profile.fishAudioSelfReferenceId : profile.fishAudioOtherReferenceId,
      endpoint: profile.fishAudioEndpoint,
    })

    sessionStore.updateMessage(sessionStore.activeSessionId, props.message.id, { ttsAudio: dataUrl })
    ttsCurrentTime.value = 0
    ttsDuration.value = 0

    await nextTick()
    if (ttsEl.value) {
      registerTTSStop(stopTTS)
      ttsEl.value.play()
      ttsPlaying.value = true
    }
  } catch (err) {
    console.error('TTS error:', err)
  } finally {
    ttsLoading.value = false
  }
}

onUnmounted(() => stopTTS())

function deleteBackTranslation() {
  sessionStore.updateMessage(sessionStore.activeSessionId, props.message.id, { backTranslation: null })
}

function deleteTTSAudio() {
  stopTTS()
  ttsCurrentTime.value = 0
  ttsDuration.value = 0
  sessionStore.updateMessage(sessionStore.activeSessionId, props.message.id, { ttsAudio: null })
}

function openFullscreen() {
  openTranslationViewer({
    translation: props.message.translation,
    originalText: props.message.originalText,
  })
}
</script>

