<script setup>
import { useI18n } from 'vue-i18n'
import { useViewer } from '../composables/useViewer.js'

const { t } = useI18n()
const { viewer, viewerEl, onViewerMouseDown, onViewerMouseMove, onViewerMouseUp, onViewerDblClick, onViewerMounted } = useViewer()
</script>

<template>
  <v-dialog v-model="viewer.open" fullscreen :scrim="false" transition="fade-transition">
    <div
      :ref="el => { viewerEl = el; onViewerMounted(el) }"
      style="
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.92);
        overflow: hidden;
        position: relative;
        user-select: none;
      "
      :style="{ cursor: viewer.dragging ? 'grabbing' : 'grab' }"
      @mousedown="onViewerMouseDown"
      @mousemove="onViewerMouseMove"
      @mouseup="onViewerMouseUp"
      @mouseleave="onViewerMouseUp"
      @dblclick="onViewerDblClick"
    >
      <img
        :src="viewer.src"
        style="
          position: absolute;
          top: 50%; left: 50%;
          max-width: none; max-height: none;
          pointer-events: none;
          transform-origin: center center;
        "
        :style="{
          transform: `translate(calc(-50% + ${viewer.x}px), calc(-50% + ${viewer.y}px)) scale(${viewer.scale})`
        }"
        draggable="false"
      />

      <!-- Zoom level -->
      <div style="position: absolute; top: 14px; left: 16px; pointer-events: none;">
        <v-chip size="small" style="background: rgba(0,0,0,0.5); color: #fff; font-variant-numeric: tabular-nums;">
          {{ Math.round(viewer.scale / viewer.fitScale * 100) }}%
        </v-chip>
      </div>

      <!-- Hint -->
      <div style="position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%); pointer-events: none;">
        <v-chip size="small" style="opacity: 0.45; background: rgba(0,0,0,0.5); color: #fff;">
          {{ t('viewer.hint') }}
        </v-chip>
      </div>

      <!-- Close -->
      <v-btn
        icon="mdi-close"
        style="position: absolute; top: 12px; right: 12px;"
        color="white"
        variant="text"
        @click="viewer.open = false"
      />
    </div>
  </v-dialog>
</template>
