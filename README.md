# AI Translator

Context-aware conversational translation powered by Google Gemini API, with multimodal input support for text, images, and audio.

## Features

- **Context-aware translation** — each translation request carries the most recent N messages as context, keeping terminology and tone consistent throughout the conversation
- **Multimodal input** — text, image upload (including paste), microphone recording, and audio file upload
- **Dual-role conversation** — toggle between Self (source language) and Other (target language) to simulate a real bilingual exchange
- **Back-translation** — verify any translation by back-translating it into the original language
- **Inline translation editing** — click the pencil icon on any translation to edit it directly in the chat
- **Fullscreen translation viewer** — open any translation in a fullscreen overlay with adjustable font size
- **Text-to-speech (Fish Audio)** — synthesize translations using Fish Audio TTS; per-role voice reference IDs configurable in the profile
- **Profile management** — create multiple profiles, each with its own API key, model, language pair, context size, and fully configurable prompt templates
- **Profile JSON export / import** — back up or share profiles as JSON files
- **Per-session profile binding** — each session is bound to a specific profile; switching sessions automatically reflects the correct profile in the toolbar, and changing the profile in the toolbar updates only the current session
- **Session management** — multiple concurrent sessions with rename, search, clear, and delete support
- **Content search** — session search matches both session names and message content, with highlighted excerpts shown inline
- **Appearance settings** — light / dark / system theme and custom primary color
- **Client-side persistence** — all sessions, profiles, and settings stored in localStorage; no backend required

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm / yarn)
- A [Google AI Studio](https://aistudio.google.com/) API key

### Install & Run

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173` in your browser.

### First-time Setup

1. Click the gear icon in the top-right toolbar to open **Profile Manager**
2. Enter your Gemini API key, choose a model, and set your Self and Other languages
3. Save the profile
4. Create a new session — it will be bound to the currently active profile
5. Select a role (Self / Other), type a message, and press Enter
6. Switch the session's profile at any time via the profile selector in the toolbar

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vue 3 + Composition API |
| UI | Vuetify 3 + Material Design Icons |
| State | Pinia |
| AI | Google Gemini (`@google/generative-ai`) |
| TTS | Fish Audio REST API |
| i18n | vue-i18n (Chinese / English) |
| Build | Vite |
| Package manager | pnpm |

## Project Structure

```
src/
├── components/
│   ├── AppToolbar.vue          # Top toolbar
│   ├── SessionSidebar.vue      # Left session drawer
│   ├── ChatArea.vue            # Message list
│   ├── MessageBubble.vue       # Single message (original + translation + back-translation)
│   ├── MessageInput.vue        # Input bar (text / image / audio)
│   ├── ProfileDialog.vue       # Profile management dialog
│   ├── AppearanceDialog.vue    # Theme and color settings dialog
│   ├── TranslationViewer.vue   # Fullscreen translation overlay
│   └── ImageViewer.vue         # Full-screen image viewer
├── stores/
│   ├── profileStore.js         # Profile state (Pinia)
│   ├── sessionStore.js         # Session & message state (Pinia)
│   └── settingsStore.js        # Appearance settings (Pinia)
├── services/
│   ├── geminiService.js        # Gemini API wrapper
│   └── fishAudioService.js     # Fish Audio TTS wrapper
├── composables/
│   ├── useViewer.js            # Image viewer composable
│   └── useTranslationViewer.js # Translation viewer composable
└── i18n/
    ├── index.js
    └── locales/
        ├── zh.js
        └── en.js
```

## Prompt Template Variables

All prompt templates in a profile are fully configurable. The following placeholders are substituted automatically at runtime:

### System Prompt (`systemPrompt`)

| Variable | Description |
|----------|-------------|
| `{sourceLanguage}` | Self language (e.g. `Chinese`) |
| `{targetLanguage}` | Other language (e.g. `English`) |

### Translate Instruction (`translateInstruction`)

| Variable | Description |
|----------|-------------|
| `{contentDesc}` | Content type descriptor (e.g. `text`, `image`, `audio`) |
| `{role}` | Speaker role (`Self` or `Other`) |
| `{fromLang}` | Source language for this message |
| `{toLang}` | Target language for this message |

### Back-translate Instruction (`backTranslateInstruction`)

| Variable | Description |
|----------|-------------|
| `{fromLang}` | Language of the translation to verify |
| `{toLang}` | Language to back-translate into |
| `{text}` | The translation text to back-translate |

### Context Message Format (`contextMessageFormat`)

| Variable | Description |
|----------|-------------|
| `{role}` | Speaker role |
| `{original}` | Original message text |
| `{translation}` | Translated message text |

### Context Header (`contextHeader`)

| Variable | Description |
|----------|-------------|
| `{context}` | Rendered conversation history block |

## Build & Deploy

```bash
pnpm build
```

Output is written to `dist/`. Deploy to any static host (Nginx, GitHub Pages, Cloudflare Pages, etc.). The API key is stored only in the user's browser — it never touches a server.

## License

Apache 2.0
