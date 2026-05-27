import { backendUrl } from '../../utils/backendApi'

export const IMAGE_API_URL = backendUrl('/api/generation/images')
export const KKAI_RESPONSES_API_URL = backendUrl('/api/generation/responses')
export const KKAI_DEFAULT_IMAGE_MODEL = 'gpt-image-2'
export const KKAI_DEFAULT_VIDEO_MODEL = ''

const HTTP_URL_RE = /^https?:\/\//i
const DATA_URL_RE = /^data:(image|video)\//i
const URL_RE = /(https?:\/\/[^\s"'<>\\)]+|data:(?:image|video)\/[a-z0-9.+-]+;base64,[a-z0-9+/=]+)/gi
const JSON_CONTENT_RE = /\bapplication\/json\b/i
const EVENT_STREAM_RE = /\btext\/event-stream\b/i

const trimString = (value) => String(value || '').trim()

const readErrorBody = async (response) => {
  const fallback = `${response.status} ${response.statusText}`.trim()

  try {
    const body = await response.json()
    return body?.error?.message || body?.detail || body?.message || body?.msg || JSON.stringify(body)
  } catch {
    try {
      return (await response.text()) || fallback
    } catch {
      return fallback
    }
  }
}

const readStreamText = async (response) => {
  if (!response.body) return response.text()

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let text = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    text += decoder.decode(value, { stream: true })
  }

  return text + decoder.decode()
}

const parseEventStream = (streamText) => {
  const output = []
  const textParts = []

  streamText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())
    .filter((data) => data && data !== '[DONE]')
    .forEach((data) => {
      try {
        const event = JSON.parse(data)
        output.push(event)

        const delta =
          event?.delta ||
          event?.text ||
          event?.output_text ||
          event?.choices?.[0]?.delta?.content ||
          event?.choices?.[0]?.message?.content

        if (typeof delta === 'string') textParts.push(delta)
      } catch {
        textParts.push(data)
      }
    })

  return {
    object: 'kkai.frontend.stream',
    output,
    output_text: textParts.join(''),
  }
}

const readKkaiResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (JSON_CONTENT_RE.test(contentType)) return response.json()

  const text = await readStreamText(response)
  if (EVENT_STREAM_RE.test(contentType) || text.includes('data:')) return parseEventStream(text)

  try {
    return JSON.parse(text)
  } catch {
    return {
      object: 'kkai.frontend.text',
      output_text: text,
    }
  }
}

export const createKkaiImageGeneration = async ({
  model = KKAI_DEFAULT_IMAGE_MODEL,
  prompt,
  size = '1024x1024',
  n = 1,
  quality,
}) => {
  const modelName = trimString(model)
  const imagePrompt = trimString(prompt)

  if (!modelName) throw new Error('请填写图片模型名')
  if (!imagePrompt) throw new Error('请填写图片生成提示词')

  const payload = {
    model: modelName,
    prompt: imagePrompt,
    n,
  }

  if (size) payload.size = size
  if (quality) payload.quality = quality

  const response = await fetch(IMAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await readErrorBody(response)
    throw new Error(`图片生成失败：${message}`)
  }

  return readKkaiResponse(response)
}

export const createKkaiGeneration = async ({
  model,
  input,
  instructions,
  temperature,
  maxOutputTokens,
  stream = true,
}) => {
  const modelName = trimString(model)

  if (!modelName) throw new Error('请填写 KKAI 模型名')
  if (!trimString(input)) throw new Error('请填写生成提示词')

  const payload = {
    model: modelName,
    input,
    stream,
  }

  if (instructions) payload.instructions = instructions
  if (Number.isFinite(temperature)) payload.temperature = temperature
  if (Number.isFinite(maxOutputTokens)) payload.max_output_tokens = maxOutputTokens

  const response = await fetch(KKAI_RESPONSES_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await readErrorBody(response)
    throw new Error(`KKAI 请求失败：${message}`)
  }

  return readKkaiResponse(response)
}

const classifyUrl = (url) => {
  const cleanUrl = trimString(url).split('?')[0].toLowerCase()
  if (/^data:image\//i.test(url) || /\.(png|jpe?g|webp|gif|avif)$/i.test(cleanUrl)) return 'image'
  if (/^data:video\//i.test(url) || /\.(mp4|webm|mov|m4v|avi)$/i.test(cleanUrl)) return 'video'
  return 'file'
}

const addAsset = (assets, value) => {
  const url = trimString(value)
  if (!url || (!HTTP_URL_RE.test(url) && !DATA_URL_RE.test(url))) return
  if (assets.some((asset) => asset.url === url)) return
  assets.push({ type: classifyUrl(url), url })
}

const collectText = (value, textParts) => {
  if (!value) return

  if (typeof value === 'string') {
    textParts.push(value)
    return
  }

  if (typeof value !== 'object') return

  if (typeof value.value === 'string') textParts.push(value.value)
  if (typeof value.text === 'string') textParts.push(value.text)
  if (typeof value.content === 'string') textParts.push(value.content)
}

const walkResponse = (value, assets, textParts, seen = new WeakSet()) => {
  if (value == null) return

  if (typeof value === 'string') {
    const matches = value.match(URL_RE) || []
    matches.forEach((url) => addAsset(assets, url))
    return
  }

  if (typeof value !== 'object') return
  if (seen.has(value)) return
  seen.add(value)

  if (Array.isArray(value)) {
    value.forEach((item) => walkResponse(item, assets, textParts, seen))
    return
  }

  collectText(value, textParts)

  ;[
    value.url,
    value.image_url,
    value.video_url,
    value.file_url,
    value.asset_url,
    value.output_url,
    value.b64_json ? `data:image/png;base64,${value.b64_json}` : '',
  ].forEach((url) => addAsset(assets, url))

  Object.values(value).forEach((item) => walkResponse(item, assets, textParts, seen))
}

export const extractKkaiAssets = (raw) => {
  const assets = []
  const textParts = []

  if (typeof raw?.output_text === 'string') textParts.push(raw.output_text)
  walkResponse(raw?.output ?? raw, assets, textParts)

  const text = [...new Set(textParts.map(trimString).filter(Boolean))]
    .join('\n\n')
    .replace(URL_RE, '')
    .trim()

  return {
    assets,
    raw,
    text,
  }
}
