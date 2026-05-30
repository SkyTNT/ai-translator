let _stopCallback = null

export function registerTTSStop(cb) {
  if (_stopCallback && _stopCallback !== cb) _stopCallback()
  _stopCallback = cb
}

export function unregisterTTSStop(cb) {
  if (_stopCallback === cb) _stopCallback = null
}

export async function textToSpeech({ text, apiKey, referenceId, endpoint }) {
  const body = { text, format: 'mp3' }
  if (referenceId) body.reference_id = referenceId

  const base = (endpoint || 'https://api.fish.audio').replace(/\/$/, '')
  const res = await fetch(`${base}/v1/tts`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'model': 's2-pro',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(msg || `HTTP ${res.status}`)
  }

  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
