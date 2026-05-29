# AI Translator

Context-aware conversational translation powered by Google Gemini API, with multimodal input support for text, images, and audio.

## Features

- **Context-aware translation** — each translation request carries the most recent N messages as context, keeping terminology and tone consistent throughout the conversation
- **Multimodal input** — text, image upload (including paste), microphone recording, and audio file upload
- **Dual-role conversation** — toggle between Self (source language) and Other (target language) to simulate a real bilingual exchange
- **Back-translation** — verify any translation by back-translating it into the original language
- **Profile management** — create multiple profiles, each with its own API key, model, language pair, context size, and custom system prompt
- **Per-session profile binding** — each session is bound to a specific profile; switching sessions automatically reflects the correct profile in the toolbar, and changing the profile in the toolbar updates only the current session
- **Session management** — multiple concurrent sessions with rename, search, clear, and delete support
- **Content search** — session search matches both session names and message content, with highlighted excerpts shown inline
- **Client-side persistence** — all sessions and profiles stored in localStorage; no backend required

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
| i18n | vue-i18n (Chinese / English) |
| Build | Vite |
| Package manager | pnpm |

## Project Structure

```
src/
├── components/
│   ├── AppToolbar.vue      # Top toolbar
│   ├── SessionSidebar.vue  # Left session drawer
│   ├── ChatArea.vue        # Message list
│   ├── MessageBubble.vue   # Single message (original + translation + back-translation)
│   ├── MessageInput.vue    # Input bar (text / image / audio)
│   ├── ProfileDialog.vue   # Profile management dialog
│   └── ImageViewer.vue     # Full-screen image viewer
├── stores/
│   ├── profileStore.js     # Profile state (Pinia)
│   └── sessionStore.js     # Session & message state (Pinia)
├── services/
│   └── geminiService.js    # Gemini API wrapper
├── composables/
│   └── useViewer.js        # Image viewer composable
└── i18n/
    ├── index.js
    └── locales/
        ├── zh.js
        └── en.js
```

## System Prompt Variables

Use these placeholders in a profile's system prompt — they are substituted automatically at translation time:

| Variable | Description |
|----------|-------------|
| `{sourceLanguage}` | Self language (e.g. `Chinese`) |
| `{targetLanguage}` | Other language (e.g. `English`) |

## Build & Deploy

```bash
pnpm build
```

Output is written to `dist/`. Deploy to any static host (Nginx, GitHub Pages, Cloudflare Pages, etc.). The API key is stored only in the user's browser — it never touches a server.

## License

Apache 2.0
