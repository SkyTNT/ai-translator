<template>
  <div class="message-input-area border-t pa-3 w-100" style="background: rgb(var(--v-theme-surface));">
    <!-- Attachments preview -->
    <div v-if="attachedImages.length || attachedAudio" class="d-flex flex-wrap align-center gap-2 mb-2">
      <!-- Image chips -->
      <v-card
        v-for="(img, i) in attachedImages"
        :key="i"
        width="68"
        height="68"
        rounded="lg"
        elevation="0"
        class="position-relative overflow-hidden flex-shrink-0"
        style="border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));"
      >
        <v-img :src="img.url" cover width="68" height="68" class="cursor-pointer" @click="openViewerFromSrc(img.url)" />
        <div class="position-absolute w-100 h-100 top-0 left-0 image-overlay d-flex align-start justify-end pa-1" style="pointer-events: none;">
          <v-btn
            icon="mdi-close"
            size="x-small"
            color="white"
            variant="flat"
            style="width: 18px; height: 18px; min-width: 0; border-radius: 50%; background: rgba(0,0,0,0.5); pointer-events: auto;"
            @click.stop="removeImage(i)"
          />
        </div>
      </v-card>

      <!-- Audio player chip -->
      <v-sheet
        v-if="attachedAudio"
        rounded="pill"
        color="primary-lighten-5"
        class="d-flex align-center gap-2 pl-1 pr-2 py-1"
        style="border: 1px solid rgba(var(--v-theme-primary), 0.3); min-width: 220px;"
      >
        <v-btn
          :icon="audioPlaying ? 'mdi-pause' : 'mdi-play'"
          color="primary"
          variant="tonal"
          size="x-small"
          density="comfortable"
          rounded="circle"
          style="position: relative; z-index: 1; flex-shrink: 0;"
          @click="toggleAudioPlay"
        />
        <v-slider
          v-model="audioCurrentTime"
          :max="audioDurationSecs || 1"
          density="compact"
          color="primary"
          track-color="primary-lighten-3"
          hide-details
          thumb-size="10"
          class="flex-grow-1 mx-1"
          style="min-width: 80px;"
          @update:model-value="seekAudio"
        />
        <span class="text-caption text-primary" style="white-space: nowrap;">
          {{ formatAudioTime(audioCurrentTime) }} / {{ formatAudioTime(audioDurationSecs) }}
        </span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="x-small"
          color="grey-darken-1"
          @click="removeAudio"
        />
        <audio
          ref="audioPreviewEl"
          :src="attachedAudio.url"
          style="display:none;"
          @timeupdate="audioCurrentTime = audioPreviewEl.currentTime"
          @ended="audioPlaying = false"
          @loadedmetadata="audioDurationSecs = audioPreviewEl.duration"
        />
      </v-sheet>
    </div>

    <!-- Role selector + action buttons row -->
    <div class="d-flex align-center gap-2 mb-2">
      <v-btn-toggle
        v-model="role"
        mandatory
        density="compact"
        divided
        rounded="pill"
        color="primary"
        variant="outlined"
        style="height: 32px;"
      >
        <v-btn value="self" size="small" class="text-none px-3">{{ t('chat.self') }}</v-btn>
        <v-btn value="other" size="small" class="text-none px-3">{{ t('chat.other') }}</v-btn>
      </v-btn-toggle>

      <v-spacer />

      <!-- Take photo -->
      <v-tooltip :text="t('input.takePhoto')" location="top">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-camera-outline"
            variant="text"
            size="small"
            color="grey-darken-1"
            @click="cameraInput.click()"
          />
        </template>
      </v-tooltip>

      <!-- Choose from gallery -->
      <v-tooltip :text="t('input.chooseGallery')" location="top">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-image-outline"
            variant="text"
            size="small"
            color="grey-darken-1"
            @click="imageInput.click()"
          />
        </template>
      </v-tooltip>

      <!-- Audio record -->
      <v-tooltip :text="isRecording ? t('input.stopRecording') : t('input.recordAudio')" location="top">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            :icon="isRecording ? 'mdi-stop-circle' : 'mdi-microphone-outline'"
            :color="isRecording ? 'error' : 'grey-darken-1'"
            variant="text"
            size="small"
            @click="toggleRecording"
          />
        </template>
      </v-tooltip>

      <!-- Audio upload -->
      <v-tooltip :text="t('input.uploadAudio')" location="top">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            icon="mdi-file-music-outline"
            color="grey-darken-1"
            variant="text"
            size="small"
            @click="audioInput.click()"
          />
        </template>
      </v-tooltip>

      <!-- Send button -->
      <v-btn
        :disabled="!canSend"
        color="primary"
        icon="mdi-send"
        size="small"
        @click="send"
      />
    </div>

    <!-- Text input full width -->
    <v-textarea
      v-model="inputText"
      :placeholder="role === 'self' ? t('input.placeholderSelf', { lang: sourceLang }) : t('input.placeholderOther', { lang: targetLang })"
      density="compact"
      variant="outlined"
      hide-details
      rows="1"
      auto-grow
      max-rows="6"
      @keydown.enter.exact.prevent="send"
      @keydown.enter.shift.exact="inputText += '\n'"
      @paste="handlePaste"
    />

    <!-- Recording indicator -->
    <div v-if="isRecording" class="d-flex align-center gap-2 mt-2">
      <div class="recording-dot" />
      <span class="text-caption text-error">{{ t('input.recording', { s: recordingSeconds }) }}</span>
      <v-btn size="x-small" variant="text" color="error" @click="toggleRecording">{{ t('input.stop') }}</v-btn>
    </div>

    <div class="text-caption text-medium-emphasis mt-1" style="line-height: 1.2;">
      {{ t('input.hint') }}
    </div>
  </div>

  <!-- Hidden file inputs -->
  <input
    ref="cameraInput"
    type="file"
    accept="image/*"
    capture="environment"
    style="display: none;"
    @change="handleImageFiles"
  />
  <input
    ref="imageInput"
    type="file"
    accept="image/*"
    multiple
    style="display: none;"
    @change="handleImageFiles"
  />
  <input
    ref="audioInput"
    type="file"
    accept="audio/*"
    style="display: none;"
    @change="handleAudioFile"
  />
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useProfileStore } from '../stores/profileStore'
import { fileToBase64 } from '../services/geminiService'
import { openViewerFromSrc } from '../composables/useViewer.js'

const emit = defineEmits(['send'])
const { t } = useI18n()
const profileStore = useProfileStore()

const role = ref('self')
const inputText = ref('')
const attachedImages = ref([])
const attachedAudio = ref(null)
const isRecording = ref(false)
const recordingSeconds = ref(0)
const imageInput = ref(null)
const cameraInput = ref(null)
const audioInput = ref(null)
const audioPreviewEl = ref(null)
const audioPlaying = ref(false)
const audioCurrentTime = ref(0)
const audioDurationSecs = ref(0)

let mediaRecorder = null
let recordingInterval = null
let audioChunks = []

const sourceLang = computed(() => profileStore.activeProfile?.sourceLanguage || '源语言')
const targetLang = computed(() => profileStore.activeProfile?.targetLanguage || '目标语言')

const canSend = computed(() =>
  inputText.value.trim() || attachedImages.value.length > 0 || attachedAudio.value
)

async function handleImageFiles(e) {
  const files = Array.from(e.target.files || [])
  for (const file of files) {
    const { data, mimeType } = await fileToBase64(file)
    attachedImages.value.push({ data, mimeType, url: `data:${mimeType};base64,${data}` })
  }
  e.target.value = ''
}

async function handlePaste(e) {
  const items = Array.from(e.clipboardData?.items || [])
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      const { data, mimeType } = await fileToBase64(file)
      attachedImages.value.push({ data, mimeType, url: `data:${mimeType};base64,${data}` })
    }
  }
}

function removeImage(i) {
  attachedImages.value.splice(i, 1)
}

async function handleAudioFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    const dataUrl = reader.result
    attachedAudio.value = { data: dataUrl.split(',')[1], mimeType: file.type, url: dataUrl }
    audioPlaying.value = false
    audioCurrentTime.value = 0
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function removeAudio() {
  if (audioPreviewEl.value) {
    audioPreviewEl.value.pause()
    audioPlaying.value = false
  }
  attachedAudio.value = null
  audioCurrentTime.value = 0
  audioDurationSecs.value = 0
}

function toggleAudioPlay() {
  const el = audioPreviewEl.value
  if (!el) return
  if (audioPlaying.value) {
    el.pause()
    audioPlaying.value = false
  } else {
    el.play()
    audioPlaying.value = true
  }
}

function seekAudio(val) {
  if (audioPreviewEl.value) audioPreviewEl.value.currentTime = val
}

function formatAudioTime(secs) {
  if (!secs || isNaN(secs)) return '0:00'
  const m = Math.floor(secs / 60)
  const s = Math.floor(secs % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}

async function toggleRecording() {
  if (isRecording.value) {
    stopRecording()
  } else {
    await startRecording()
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    audioChunks = []
    mediaRecorder = new MediaRecorder(stream)
    mediaRecorder.ondataavailable = e => audioChunks.push(e.data)
    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunks, { type: 'audio/webm' })
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        attachedAudio.value = { data: dataUrl.split(',')[1], mimeType: 'audio/webm', url: dataUrl }
        audioPlaying.value = false
        audioCurrentTime.value = 0
      }
      reader.readAsDataURL(blob)
      stream.getTracks().forEach(t => t.stop())
    }
    mediaRecorder.start()
    isRecording.value = true
    recordingSeconds.value = 0
    recordingInterval = setInterval(() => recordingSeconds.value++, 1000)
  } catch (err) {
    console.error('Recording error:', err)
  }
}

function stopRecording() {
  if (mediaRecorder && isRecording.value) {
    mediaRecorder.stop()
    isRecording.value = false
    clearInterval(recordingInterval)
  }
}

function send() {
  if (!canSend.value) return

  emit('send', {
    role: role.value,
    text: inputText.value.trim() || null,
    images: attachedImages.value.length ? [...attachedImages.value] : [],
    audio: attachedAudio.value || null,
  })

  inputText.value = ''
  attachedImages.value = []
  attachedAudio.value = null
  audioDurationSecs.value = 0
}
</script>

<style scoped>
.recording-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f44336;
  animation: pulse 1s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}
.image-overlay {
  opacity: 1;
}
</style>
