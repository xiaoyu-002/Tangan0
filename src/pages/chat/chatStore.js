export const CHAT_CONVERSATIONS_KEY = 'chj-chat-conversations-v1'
export const CHAT_ACTIVE_CONVERSATION_KEY = 'chj-chat-active-conversation-v1'

const MAX_CONVERSATIONS = 80
const MAX_MESSAGES_PER_CONVERSATION = 120

const defaultAgent = {
  id: 'market-analyst',
  name: '小思',
  avatar: '/assets/avatars/market-analyst.png',
}

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export const makeConversationTitle = (messages = [], draft = '') => {
  const firstUserMessage = Array.isArray(messages)
    ? messages.find((message) => message?.role === 'user' && String(message?.content || '').trim())
    : null
  const source = String(firstUserMessage?.content || draft || '新的对话').trim()
  const firstLine = source.split('\n').find(Boolean) || '新的对话'
  return firstLine.length > 28 ? `${firstLine.slice(0, 28)}...` : firstLine
}

const normalizeMessage = (message) => {
  const role = ['user', 'assistant'].includes(message?.role) ? message.role : ''
  if (!role || typeof message?.content !== 'string') return null

  const status = ['done', 'error', 'loading', 'stopped'].includes(message.status) ? message.status : 'done'

  return {
    id: message.id || createId(),
    role,
    content: message.content,
    agentId: String(message.agentId || defaultAgent.id),
    createdAt: Number.isFinite(message.createdAt) ? message.createdAt : Date.now(),
    status,
    model: String(message.model || ''),
    usage: message.usage || null,
  }
}

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return []
  return messages.map(normalizeMessage).filter(Boolean).slice(-MAX_MESSAGES_PER_CONVERSATION)
}

const hasUserMessage = (conversation) => {
  return Array.isArray(conversation?.messages)
    && conversation.messages.some((message) => message?.role === 'user' && String(message?.content || '').trim())
}

export const normalizeConversation = (conversation = {}) => {
  const now = Date.now()
  const messages = normalizeMessages(conversation.messages)
  const draft = typeof conversation.draft === 'string' ? conversation.draft : ''
  const createdAt = Number.isFinite(conversation.createdAt) ? conversation.createdAt : now
  const updatedAt = Number.isFinite(conversation.updatedAt) ? conversation.updatedAt : createdAt

  return {
    id: conversation.id || createId(),
    title: String(conversation.title || makeConversationTitle(messages, draft)).trim() || '新的对话',
    agentId: String(conversation.agentId || defaultAgent.id),
    agentName: String(conversation.agentName || defaultAgent.name),
    agentAvatar: String(conversation.agentAvatar || defaultAgent.avatar),
    messages,
    draft,
    model: String(conversation.model || 'deepseek-v4-flash'),
    isExpertMode: conversation.isExpertMode !== false,
    createdAt,
    updatedAt,
  }
}

export const createConversation = (conversation = {}) => normalizeConversation({
  ...conversation,
  id: conversation.id || createId(),
  createdAt: conversation.createdAt || Date.now(),
  updatedAt: conversation.updatedAt || Date.now(),
})

export const loadConversations = () => {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(CHAT_CONVERSATIONS_KEY)
    const conversations = raw ? JSON.parse(raw) : []
    return Array.isArray(conversations)
      ? conversations.map(normalizeConversation).filter(hasUserMessage).sort((left, right) => right.updatedAt - left.updatedAt)
      : []
  } catch (error) {
    console.warn('Failed to load chat conversations', error)
    return []
  }
}

export const saveConversations = (conversations) => {
  if (!isBrowser()) return []

  const normalizedConversations = Array.isArray(conversations)
    ? conversations
      .map(normalizeConversation)
      .filter(hasUserMessage)
      .sort((left, right) => right.updatedAt - left.updatedAt)
      .slice(0, MAX_CONVERSATIONS)
    : []

  window.localStorage.setItem(CHAT_CONVERSATIONS_KEY, JSON.stringify(normalizedConversations))
  window.dispatchEvent(new CustomEvent('chj-chat:conversations-updated', { detail: normalizedConversations }))
  return normalizedConversations
}

export const upsertConversation = (conversation) => {
  const conversations = loadConversations()
  const existing = conversations.find((item) => item.id === conversation.id)
  const normalizedConversation = normalizeConversation({
    ...existing,
    ...conversation,
    createdAt: existing?.createdAt || conversation.createdAt || Date.now(),
    updatedAt: conversation.updatedAt || Date.now(),
  })

  saveConversations([
    normalizedConversation,
    ...conversations.filter((item) => item.id !== normalizedConversation.id),
  ])

  return normalizedConversation
}

export const deleteConversation = (id) => {
  saveConversations(loadConversations().filter((conversation) => conversation.id !== id))
}

export const clearConversations = () => {
  saveConversations([])
  if (isBrowser()) window.localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY)
}

export const getActiveConversationId = () => {
  if (!isBrowser()) return ''
  return window.localStorage.getItem(CHAT_ACTIVE_CONVERSATION_KEY) || ''
}

export const setActiveConversationId = (id) => {
  if (!isBrowser()) return
  if (id) {
    window.localStorage.setItem(CHAT_ACTIVE_CONVERSATION_KEY, id)
  } else {
    window.localStorage.removeItem(CHAT_ACTIVE_CONVERSATION_KEY)
  }
  window.dispatchEvent(new CustomEvent('chj-chat:active-conversation-updated', { detail: id || '' }))
}
