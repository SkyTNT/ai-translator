<template>
  <v-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    max-width="340"
    scrollable
  >
    <v-card>
      <v-card-title class="d-flex align-center pa-4">
        <v-icon class="mr-2" color="primary">mdi-palette</v-icon>
        {{ t('appearance.title') }}
        <v-spacer />
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text class="pt-4 pb-2">
        <!-- Theme -->
        <div class="text-subtitle-2 mb-2">{{ t('appearance.theme') }}</div>
        <v-btn-toggle
          :model-value="settingsStore.theme"
          @update:model-value="settingsStore.setTheme($event)"
          mandatory
          variant="outlined"
          color="primary"
          density="comfortable"
          class="mb-5"
          rounded="lg"
        >
          <v-btn value="light" prepend-icon="mdi-white-balance-sunny">
            {{ t('appearance.themeLight') }}
          </v-btn>
          <v-btn value="dark" prepend-icon="mdi-weather-night">
            {{ t('appearance.themeDark') }}
          </v-btn>
          <v-btn value="system" prepend-icon="mdi-theme-light-dark">
            {{ t('appearance.themeSystem') }}
          </v-btn>
        </v-btn-toggle>

        <!-- Primary color -->
        <div class="text-subtitle-2 mb-3">{{ t('appearance.primaryColor') }}</div>
        <v-color-picker
          :model-value="pickerColor"
          @update:model-value="onColorChange"
          mode="hex"
          show-swatches
          :swatches="COLOR_SWATCHES"
          width="100%"
          elevation="0"
          rounded="lg"
        />
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingsStore } from '../stores/settingsStore'

defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])

const { t } = useI18n()
const settingsStore = useSettingsStore()

const COLOR_SWATCHES = [
  ['#1976D2', '#1565C0', '#0288D1', '#00796B'],
  ['#388E3C', '#7B1FA2', '#AD1457', '#D32F2F'],
  ['#E64A19', '#F57C00', '#546E7A', '#424242'],
]

const pickerColor = ref(settingsStore.primaryColor)

watch(() => settingsStore.primaryColor, val => {
  pickerColor.value = val
})

function onColorChange(val) {
  if (!val) return
  // v-color-picker emits the full hex string (#RRGGBB or #RRGGBBAA)
  const hex = val.slice(0, 7).toUpperCase()
  pickerColor.value = hex
  settingsStore.setPrimaryColor(hex)
}
</script>
