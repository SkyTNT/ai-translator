<template>
  <v-navigation-drawer :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" width="260">
    <v-list-item :title="t('session.list')" nav class="py-3">
      <template #append>
        <v-btn icon="mdi-plus" variant="text" size="small" @click="createNew" />
      </template>
    </v-list-item>

    <v-divider />

    <div class="px-2 py-1">
      <v-text-field
        v-model="search"
        density="compact"
        variant="outlined"
        :placeholder="t('session.search')"
        prepend-inner-icon="mdi-magnify"
        hide-details
        clearable
        class="my-1"
      />
    </div>

    <v-list density="compact" nav class="px-2">
      <v-list-item
        v-for="session in filteredSessions"
        :key="session.id"
        :value="session.id"
        :active="session.id === sessionStore.activeSessionId"
        color="primary"
        rounded="lg"
        class="mb-1"
        @click="selectSession(session.id)"
      >
        <template #prepend>
          <v-icon size="18">mdi-message-text-outline</v-icon>
        </template>

        <v-list-item-title class="text-body-2">
          <template v-if="renamingId === session.id">
            <v-text-field
              v-model="renameText"
              density="compact"
              variant="plain"
              autofocus
              hide-details
              class="text-body-2"
              @blur="commitRename(session.id)"
              @keydown.enter="commitRename(session.id)"
              @keydown.esc="renamingId = null"
              @click.stop
            />
          </template>
          <template v-else>
            {{ session.name }}
          </template>
        </v-list-item-title>

        <v-list-item-subtitle class="text-caption">
          {{ formatDate(session.updatedAt) }} · {{ t('session.messageCount', { n: session.messages.length }) }}
        </v-list-item-subtitle>
        <div
          v-if="session.snippet"
          class="text-caption text-medium-emphasis mt-1 snippet"
          v-html="highlightSnippet(session.snippet)"
        />

        <template #append>
          <v-menu>
            <template #activator="{ props }">
              <v-btn
                v-bind="props"
                icon="mdi-dots-vertical"
                variant="text"
                size="x-small"
                @click.stop
              />
            </template>
            <v-list density="compact" min-width="140">
              <v-list-item prepend-icon="mdi-pencil" :title="t('session.rename')" @click="startRename(session)" />
              <v-list-item prepend-icon="mdi-delete-outline" :title="t('session.clearMessages')" @click="clearMessages(session.id)" />
              <v-divider />
              <v-list-item prepend-icon="mdi-trash-can-outline" :title="t('session.delete')" class="text-error" @click="deleteSession(session.id)" />
            </v-list>
          </v-menu>
        </template>
      </v-list-item>

      <v-list-item v-if="filteredSessions.length === 0" class="text-center text-medium-emphasis">
        <v-list-item-title class="text-body-2">{{ t('session.empty') }}</v-list-item-title>
      </v-list-item>
    </v-list>

  </v-navigation-drawer>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSessionStore } from '../stores/sessionStore'
import { useProfileStore } from '../stores/profileStore'

defineProps({ modelValue: Boolean })
defineEmits(['update:modelValue'])

const { t } = useI18n()
const sessionStore = useSessionStore()
const profileStore = useProfileStore()

const search = ref('')
const renamingId = ref(null)
const renameText = ref('')

const filteredSessions = computed(() => {
  if (!search.value) return sessionStore.sessions
  const q = search.value.toLowerCase()
  return sessionStore.sessions
    .filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.messages.some(m =>
        m.originalText?.toLowerCase().includes(q) ||
        m.translation?.toLowerCase().includes(q)
      )
    )
    .map(s => {
      const matchedMsg = s.messages.find(m =>
        m.originalText?.toLowerCase().includes(q) ||
        m.translation?.toLowerCase().includes(q)
      )
      if (!matchedMsg) return s
      const text = matchedMsg.originalText?.toLowerCase().includes(q)
        ? matchedMsg.originalText
        : matchedMsg.translation
      const idx = text.toLowerCase().indexOf(q)
      const start = Math.max(0, idx - 15)
      const end = Math.min(text.length, idx + q.length + 40)
      const snippet = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '')
      return { ...s, snippet }
    })
})

function highlightSnippet(text) {
  if (!search.value || !text) return text
  const escaped = text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const escapedQ = search.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return escaped.replace(new RegExp(`(${escapedQ})`, 'gi'), '<mark>$1</mark>')
}

function createNew() {
  const name = `${t('session.defaultName')} ${sessionStore.sessions.length + 1}`
  sessionStore.createSession(profileStore.activeProfileId, name)
}

function selectSession(id) {
  sessionStore.setActive(id)
}

function startRename(session) {
  renamingId.value = session.id
  renameText.value = session.name
}

function commitRename(id) {
  if (renameText.value.trim()) sessionStore.renameSession(id, renameText.value.trim())
  renamingId.value = null
}

function deleteSession(id) {
  sessionStore.deleteSession(id)
}

function clearMessages(id) {
  sessionStore.clearMessages(id)
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<style scoped>
.snippet {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}
.snippet :deep(mark) {
  background: rgb(var(--v-theme-primary), 0.2);
  color: rgb(var(--v-theme-primary));
  border-radius: 2px;
  padding: 0 1px;
  font-weight: 600;
}
</style>
