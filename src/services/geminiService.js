import { GoogleGenerativeAI } from '@google/generative-ai'


function buildSystemInstruction(profile) {
  const prompt = profile.systemPrompt || ''
  return prompt
    .replace(/\{sourceLanguage\}/g, profile.sourceLanguage || 'source language')
    .replace(/\{targetLanguage\}/g, profile.targetLanguage || 'target language')
}

function buildContextText(messages, contextSize) {
  if (!messages || messages.length === 0) return ''
  const recent = messages.slice(-(contextSize ?? 12))
  return recent.map(m => {
    const role = m.role === 'self' ? 'Speaker 1' : 'Speaker 2'
    const parts = []
    if (m.originalText) parts.push(m.originalText)
    if (m.images?.length) parts.push(`[${m.images.length} image${m.images.length > 1 ? 's' : ''}]`)
    if (m.audio) parts.push('[audio]')
    const orig = parts.join(' + ') || '[media]'
    return `${role}: ${orig}\nTranslation: ${m.translation || ''}`
  }).join('\n\n')
}

export async function translateMessage({ profile, messages, newMessage }) {
  if (!profile.apiKey) throw new Error('请先在Profile中设置API Key')

  const genAI = new GoogleGenerativeAI(profile.apiKey)
  const model = genAI.getGenerativeModel({
    model: profile.model || 'gemini-3.1-flash-lite',
    systemInstruction: buildSystemInstruction(profile),
  })

  const parts = []
  const ctx = buildContextText(messages, profile.contextSize)
  const isSelf = newMessage.role === 'self'
  const fromLang = isSelf ? profile.sourceLanguage : profile.targetLanguage
  const toLang = isSelf ? profile.targetLanguage : profile.sourceLanguage
  const speakerLabel = isSelf ? `Speaker 1 (${fromLang})` : `Speaker 2 (${fromLang})`

  if (ctx) {
    parts.push({ text: `Conversation history for context:\n\n${ctx}\n\n---\n\n` })
  }

  const hasText = !!newMessage.originalText
  const hasImages = !!newMessage.images?.length
  const hasAudio = !!newMessage.audio

  // Build content type description for the instruction
  const contentParts = []
  if (hasText) contentParts.push('text')
  if (hasImages) contentParts.push(`${newMessage.images.length} image${newMessage.images.length > 1 ? 's' : ''}`)
  if (hasAudio) contentParts.push('audio')
  const contentDesc = contentParts.join(' + ')

  parts.push({ text: `Translate the following ${contentDesc} message from ${speakerLabel} from ${fromLang} into ${toLang}.\n` })

  if (hasImages) {
    for (const img of newMessage.images) {
      parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } })
    }
  }

  if (hasAudio) {
    parts.push({ inlineData: { mimeType: newMessage.audio.mimeType, data: newMessage.audio.data } })
  }
  if (hasText) {
    parts.push({ text: `Text: ${newMessage.originalText}\n` })
  }

  parts.push({ text: `Output the complete ${toLang} translation only.\n` })

  const result = await model.generateContent(parts)
  return result.response.text()
}

export async function backTranslateMessage({ profile, message }) {
  if (!profile.apiKey) throw new Error('请先在Profile中设置API Key')

  const isSelf = message.role === 'self'
  const fromLang = isSelf ? profile.targetLanguage : profile.sourceLanguage
  const toLang = isSelf ? profile.sourceLanguage : profile.targetLanguage

  const genAI = new GoogleGenerativeAI(profile.apiKey)
  const model = genAI.getGenerativeModel({ model: profile.model || 'gemini-3.1-flash-lite' })

  const result = await model.generateContent(
    `Translate the following text from ${fromLang} into ${toLang}. Output the translation only:\n\n${message.translation}`
  )
  return result.response.text()
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve({ data: base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

