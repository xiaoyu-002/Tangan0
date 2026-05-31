import { backendUrl } from './backendApi'

export const DEEPSEEK_DEFAULT_MODEL = import.meta.env?.VITE_DEEPSEEK_MODEL || 'deepseek-v4-flash'

const JSON_CONTENT_RE = /\bapplication\/json\b/i
const EVENT_STREAM_RE = /\btext\/event-stream\b/i

const trimString = (value) => String(value || '').trim()

const readErrorMessage = async (response) => {
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

const readPlainText = async (response) => {
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

const extractMessageContent = (data) => {
  const choice = data?.choices?.[0]
  return trimString(
    choice?.message?.content
    || choice?.delta?.content
    || data?.output_text
    || data?.text,
  )
}

const consumeEventStream = async (response, onDelta) => {
  const reader = response.body?.getReader()
  if (!reader) {
    const data = await response.json()
    return extractMessageContent(data)
  }

  const decoder = new TextDecoder()
  let buffer = ''
  let output = ''

  const flushEvent = (eventText) => {
    eventText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trim())
      .filter(Boolean)
      .forEach((payload) => {
        if (payload === '[DONE]') return

        try {
          const data = JSON.parse(payload)
          const delta = data?.choices?.[0]?.delta?.content || ''
          if (!delta) return

          output += delta
          onDelta?.(delta)
        } catch {
          output += payload
          onDelta?.(payload)
        }
      })
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() || ''
    events.forEach(flushEvent)
  }

  buffer += decoder.decode()
  if (trimString(buffer)) flushEvent(buffer)
  return output
}

export const getFloatingAiSystemMessage = (currentPath = '') => {
  const path = trimString(currentPath)
  const area = path.startsWith('/discover')
    ? '选品与市场机会'
    : path.startsWith('/create')
      ? '内容创作与脚本生成'
      : path.startsWith('/assets')
        ? '商品、店铺和素材管理'
        : path.startsWith('/social')
          ? '社媒运营与发布排期'
          : '跨境电商工作台'

  return [
    '你是糖安罗盘的 AI 助手小思。',
    `当前用户所在页面：${area}。`,
    '请用简洁、可执行的中文回答，优先给出下一步行动。',
    '如果用户的问题和页面业务相关，请结合跨境电商、TikTok Shop、选品、内容和运营语境。',
    '不要编造具体平台数据；缺少信息时先说明假设，再给出建议。',
  ].join('\n')
}

export const streamDeepSeekChatCompletion = async ({
  messages,
  model = DEEPSEEK_DEFAULT_MODEL,
  signal,
  onDelta,
  temperature = 0.7,
  maxTokens = 1200,
}) => {
  const normalizedMessages = Array.isArray(messages)
    ? messages
      .filter((message) => ['system', 'user', 'assistant'].includes(message?.role))
      .map((message) => ({
        role: message.role,
        content: trimString(message.content),
      }))
      .filter((message) => message.content)
    : []

  if (normalizedMessages.length === 0) {
    throw new Error('请输入要发送给小思的内容')
  }

  const response = await fetch(backendUrl('/api/chat/completions'), {
    method: 'POST',
    signal,
    headers: {
      Accept: 'text/event-stream, application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: normalizedMessages,
      thinking: { type: 'disabled' },
      temperature,
      max_tokens: maxTokens,
      stream: true,
    }),
  })

  if (!response.ok) {
    const message = await readErrorMessage(response)
    throw new Error(message || 'DeepSeek 请求失败')
  }

  const contentType = response.headers.get('content-type') || ''
  if (EVENT_STREAM_RE.test(contentType)) {
    return consumeEventStream(response, onDelta)
  }

  if (JSON_CONTENT_RE.test(contentType)) {
    const data = await response.json()
    const text = extractMessageContent(data)
    if (text) onDelta?.(text)
    return text
  }

  const text = await readPlainText(response)
  if (text) onDelta?.(text)
  return text
}
