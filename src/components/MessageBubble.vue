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
          :class="['text-body-2', isSelf ? 'text-on-primary' : 'text-high-emphasis']"
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
          <span :class="['text-caption', isSelf ? 'text-on-primary opacity-70' : 'text-medium-emphasis']">
            {{ t('chat.translating') }}
          </span>
        </div>
        <div
          v-else-if="message.translation"
          :class="['text-body-2', isSelf ? 'text-on-primary opacity-80' : 'text-medium-emphasis']"
          style="white-space: pre-wrap; word-break: break-word; font-style: italic;"
        >
          {{ message.translation }}
        </div>

        <!-- Back-translation -->
        <template v-if="message.backTranslation || message.isBackTranslating">
          <v-divider :color="isSelf ? 'rgba(var(--v-theme-on-primary), 0.2)' : 'rgba(var(--v-theme-on-surface), 0.08)'" class="my-2" />
          <div class="d-flex align-center gap-1 mb-1">
            <v-icon size="12" :color="isSelf ? 'on-primary' : 'on-surface-variant'">mdi-rotate-left</v-icon>
            <span :class="['text-caption', isSelf ? 'text-on-primary opacity-60' : 'text-disabled']">
              {{ t('chat.backTranslationLabel') }}
            </span>
          </div>
          <div v-if="message.isBackTranslating" class="d-flex align-center gap-1">
            <v-progress-circular size="12" width="2" indeterminate :color="isSelf ? 'on-primary' : 'primary'" />
            <span :class="['text-caption', isSelf ? 'text-on-primary opacity-60' : 'text-medium-emphasis']">
              {{ t('chat.backTranslating') }}
            </span>
          </div>
          <div
            v-else-if="message.backTranslation"
            :class="['text-body-2', isSelf ? 'text-on-primary opacity-60' : 'text-disabled']"
            style="white-space: pre-wrap; word-break: break-word; font-style: italic;"
          >
            {{ message.backTranslation }}
          </div>
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
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { openViewerFromSrc } from '../composables/useViewer.js'
import { openTranslationViewer } from '../composables/useTranslationViewer.js'

const props = defineProps({
  message: { type: Object, required: true },
})
const emit = defineEmits(['delete', 'retranslate', 'back-translate'])


const { t, locale } = useI18n()
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

function openFullscreen() {
  openTranslationViewer({
    translation: props.message.translation,
    originalText: props.message.originalText,
  })
}
</script>

