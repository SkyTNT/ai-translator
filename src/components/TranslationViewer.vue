<template>
  <v-dialog v-model="viewer.open" fullscreen :scrim="false" transition="fade-transition">
    <div
      style="width: 100%; height: 100%; background: rgba(0,0,0,0.93); display: flex; flex-direction: column; position: relative; overflow: hidden;"
      @keydown.esc="viewer.open = false"
      tabindex="0"
    >
      <!-- Close -->
      <v-btn
        icon="mdi-close"
        color="white"
        variant="text"
        style="position: absolute; top: 12px; right: 12px; z-index: 2;"
        @click="viewer.open = false"
      />

      <!-- Top: font size controls -->
      <div
        style="position: absolute; top: 14px; left: 50%; transform: translateX(-50%); z-index: 2; display: flex; align-items: center; gap: 6px;"
      >
        <v-btn
          icon="mdi-minus"
          size="small"
          variant="text"
          color="white"
          density="comfortable"
          :disabled="viewer.fontSize <= MIN_FONT"
          @click="viewer.fontSize = Math.max(MIN_FONT, viewer.fontSize - 4)"
        />
        <span style="color: rgba(255,255,255,0.7); font-size: 13px; min-width: 44px; text-align: center; font-variant-numeric: tabular-nums;">
          {{ viewer.fontSize }}px
        </span>
        <v-btn
          icon="mdi-plus"
          size="small"
          variant="text"
          color="white"
          density="comfortable"
          :disabled="viewer.fontSize >= MAX_FONT"
          @click="viewer.fontSize = Math.min(MAX_FONT, viewer.fontSize + 4)"
        />
      </div>

      <!-- Scrollable content -->
      <div
        style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; align-items: center; padding: 72px 48px 80px;"
      >
        <div style="max-width: 960px; width: 100%; text-align: center; margin: auto 0;">
          <!-- Original text -->
          <div
            v-if="showOriginal && viewer.originalText"
            style="color: rgba(255,255,255,0.4); margin-bottom: 28px; white-space: pre-wrap; word-break: break-word; line-height: 1.6;"
            :style="{ fontSize: `${Math.max(14, Math.round(viewer.fontSize * 0.55))}px` }"
          >
            {{ viewer.originalText }}
          </div>

          <!-- Translation -->
          <div
            style="color: #fff; white-space: pre-wrap; word-break: break-word; line-height: 1.65;"
            :style="{ fontSize: `${viewer.fontSize}px` }"
          >
            {{ viewer.translation }}
          </div>
        </div>
      </div>

      <!-- Bottom controls -->
      <div
        style="position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); display: flex; align-items: center; gap: 10px; z-index: 2;"
      >
        <!-- Slider -->
        <div style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.08); border-radius: 20px; padding: 4px 14px;">
          <v-icon size="14" color="rgba(255,255,255,0.5)">mdi-format-size</v-icon>
          <v-slider
            v-model="viewer.fontSize"
            :min="MIN_FONT"
            :max="MAX_FONT"
            :step="2"
            density="compact"
            color="white"
            track-color="rgba(255,255,255,0.2)"
            hide-details
            thumb-size="12"
            style="width: 140px;"
          />
        </div>

        <!-- Show original toggle -->
        <v-chip
          v-if="viewer.originalText"
          size="small"
          :color="showOriginal ? 'white' : undefined"
          :variant="showOriginal ? 'flat' : 'outlined'"
          style="cursor: pointer;"
          :style="showOriginal ? 'color:#000;' : 'color:rgba(255,255,255,0.6); border-color:rgba(255,255,255,0.3);'"
          @click="showOriginal = !showOriginal"
        >
          {{ t('chat.showOriginal') }}
        </v-chip>
      </div>
    </div>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTranslationViewer } from '../composables/useTranslationViewer.js'

const { t } = useI18n()
const { viewer } = useTranslationViewer()
const showOriginal = ref(false)

const MIN_FONT = 14
const MAX_FONT = 96
</script>
