import { GoogleGenerativeAI } from '@google/generative-ai'

function getModel(profile, { systemInstruction } = {}) {
  if (!profile.apiKey) throw new Error('error.apiKeyMissing')
  const genAI = new GoogleGenerativeAI(profile.apiKey)
  const requestOptions = profile.endpoint ? { baseUrl: profile.endpoint } : undefined
  return genAI.getGenerativeModel({
    model: profile.model || 'gemini-3.1-flash-lite',
    ...(systemInstruction && { systemInstruction }),
  }, requestOptions)
}

function buildSystemInstruction(profile) {
  const prompt = profile.systemPrompt || ''
  return prompt
    .replace(/\{sourceLanguage\}/g, profile.sourceLanguage || 'source language')
    .replace(/\{targetLanguage\}/g, profile.targetLanguage || 'target language')
}

function buildContextText(messages, contextSize, profile) {
  if (!messages || messages.length === 0) return ''
  const recent = messages.slice(-(contextSize ?? 12))
  const format = profile.contextMessageFormat || ''
  return recent.map(m => {
    const role = m.role === 'self' ? 'Speaker 1' : 'Speaker 2'
    const parts = []
    if (m.originalText) parts.push(m.originalText)
    if (m.images?.length) parts.push(`[${m.images.length} image${m.images.length > 1 ? 's' : ''}]`)
    if (m.audio) parts.push('[audio]')
    const original = parts.join(' + ') || '[media]'
    return format
      .replace(/\{role\}/g, role)
      .replace(/\{original\}/g, original)
      .replace(/\{translation\}/g, m.translation || '')
  }).join('\n\n')
}

export async function translateMessage({ profile, messages, newMessage }) {
  const model = getModel(profile, { systemInstruction: buildSystemInstruction(profile) })

  const parts = []
  const ctx = buildContextText(messages, profile.contextSize, profile)
  const isSelf = newMessage.role === 'self'
  const fromLang = isSelf ? profile.sourceLanguage : profile.targetLanguage
  const toLang = isSelf ? profile.targetLanguage : profile.sourceLanguage
  const role = isSelf ? 'Speaker 1' : 'Speaker 2'

  if (ctx) {
    const header = (profile.contextHeader || '').replace(/\{context\}/g, ctx)
    parts.push({ text: header })
  }

  const hasText = !!newMessage.originalText
  const hasImages = !!newMessage.images?.length
  const hasAudio = !!newMessage.audio

  const contentParts = []
  if (hasText) contentParts.push('text')
  if (hasImages) contentParts.push(`${newMessage.images.length} image${newMessage.images.length > 1 ? 's' : ''}`)
  if (hasAudio) contentParts.push('audio')
  const contentDesc = contentParts.join(' + ')

  const instruction = (profile.translateInstruction || '')
    .replace(/\{contentDesc\}/g, contentDesc)
    .replace(/\{role\}/g, role)
    .replace(/\{fromLang\}/g, fromLang)
    .replace(/\{toLang\}/g, toLang)
  parts.push({ text: instruction + '\n' })

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

  const result = await model.generateContent(parts)
  return result.response.text()
}

export async function backTranslateMessage({ profile, message }) {
  const isSelf = message.role === 'self'
  const fromLang = isSelf ? profile.targetLanguage : profile.sourceLanguage
  const toLang = isSelf ? profile.sourceLanguage : profile.targetLanguage

  const model = getModel(profile)
  const backInstruction = (profile.backTranslateInstruction || '')
    .replace(/\{fromLang\}/g, fromLang)
    .replace(/\{toLang\}/g, toLang)
    .replace(/\{text\}/g, message.translation)
  const result = await model.generateContent(backInstruction)
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

