<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createTask, taskStatuses, updateTask } from '../tasks/taskStore'
import {
  clearConversations,
  createConversation,
  getActiveConversationId,
  loadConversations,
  makeConversationTitle,
  setActiveConversationId,
  upsertConversation,
} from './chatStore'
import { renderMarkdown } from '../../utils/markdown'
import { streamDeepSeekChatCompletion } from '../../utils/deepseekApi'

const DEFAULT_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-v4-flash'
const CHAT_CACHE_KEY = 'chj-chat-deepseek-cache-v1'

const agents = [
  {
    id: 'market-analyst',
    name: '市场顾问',
    title: '选品与市场判断',
    avatar: '/assets/avatars/market-analyst.png',
    color: '#2563eb',
    softColor: '#eff6ff',
    rgb: '37 99 235',
    brief: '擅长拆市场、看趋势、找机会。',
    systemPrompt:
      '你是糖安罗盘的市场顾问，专注跨境电商、TikTok Shop、竞品分析和选品判断。回答要给出判断依据、风险点和下一步动作，避免泛泛而谈。',
  },
  {
    id: 'creative-director',
    name: '创意总监',
    title: '脚本与内容创意',
    avatar: '/assets/avatars/creative-director.png',
    color: '#ea580c',
    softColor: '#fff7ed',
    rgb: '234 88 12',
    brief: '擅长脚本、卖点表达和短视频结构。',
    systemPrompt:
      '你是糖安罗盘的创意总监，专注短视频内容、直播脚本、广告钩子和转化表达。回答要有可直接执行的创意结构、文案示例和镜头建议。',
  },
  {
    id: 'social-manager',
    name: '社媒管家',
    title: '账号与发布运营',
    avatar: '/assets/avatars/social-manager.png',
    color: '#059669',
    softColor: '#ecfdf5',
    rgb: '5 150 105',
    brief: '擅长内容排期、账号运营和达人协同。',
    systemPrompt:
      '你是糖安罗盘的社媒管家，专注社媒内容规划、发布节奏、评论互动和达人合作。回答要清晰列出执行步骤、节奏和检查点。',
  },
]

const quickPrompts = [
  {
    title: '我的商品该怎么卖？',
    text: '我有一个新商品，想在 TikTok Shop 美国市场卖。请帮我拆解目标人群、核心卖点、定价建议和前 7 天测试方案。',
    agentId: 'market-analyst',
  },
  {
    title: '什么商品现在好卖？',
    text: '请从跨境电商和 TikTok 内容趋势角度，帮我找 5 个适合近期测试的商品方向，并说明为什么值得测。',
    agentId: 'market-analyst',
  },
  {
    title: '帮我做个带货短视频',
    text: '请帮我写一个 30 秒 TikTok 带货短视频脚本，要求开头 3 秒强钩子，中间展示痛点和卖点，结尾有明确行动号召。',
    agentId: 'creative-director',
  },
  {
    title: '帮我找达人带货',
    text: '请给我一套达人筛选标准和私信邀约话术，用于 TikTok Shop 商品带货合作。',
    agentId: 'social-manager',
  },
  {
    title: '什么内容转化最好？',
    text: '请帮我分析 TikTok 带货内容里更容易转化的 5 种内容结构，并分别给出适合的商品类型。',
    agentId: 'creative-director',
  },
  {
    title: '规划本周内容',
    text: '请帮我规划一份本周 TikTok 内容日历，每天 2 条视频，包含主题、脚本方向、拍摄重点和复盘指标。',
    agentId: 'social-manager',
  },
]

const modelOptions = [
  { value: 'deepseek-v4-flash', label: '小思快速模式' },
  { value: 'deepseek-v4-pro', label: '小思深度模式' },
]

const messages = ref([])
const input = ref('')
const model = ref(DEFAULT_MODEL)
const selectedAgentId = ref('market-analyst')
const isExpertMode = ref(true)
const isLoading = ref(false)
const errorMessage = ref('')
const cacheStatus = ref('等待恢复缓存')
const lastSavedAt = ref('')
const searchQuery = ref('')
const textareaRef = ref(null)
const scrollPanelRef = ref(null)
const hasMounted = ref(false)
const activeRequest = ref(null)
const currentConversationId = ref('')
let cacheWritesSuspended = false

const activeAgent = computed(() => agents.find((agent) => agent.id === selectedAgentId.value) || agents[0])

const activeAgentStyle = computed(() => ({
  '--agent-color': activeAgent.value.color,
  '--agent-soft': activeAgent.value.softColor,
  '--agent-rgb': activeAgent.value.rgb,
}))

const canSubmit = computed(() => input.value.trim().length > 0 && !isLoading.value)

const cacheSummary = computed(() => {
  if (!messages.value.length) return '暂无会话，输入后会自动缓存'
  return `${messages.value.length} 条消息已保存在设备`
})

const visibleMessages = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()
  if (!keyword) return messages.value

  return messages.value.filter((message) => {
    const agent = getAgent(message.agentId)
    return `${message.content} ${agent.name} ${message.role}`.toLowerCase().includes(keyword)
  })
})

const systemPrompt = computed(() => {
  const expertLine = isExpertMode.value
    ? '当前为专家模式：请先给结论，再给依据、步骤和可执行清单；如果信息不足，请明确说明假设。'
    : '当前为轻量模式：请用更短的篇幅直接回答，并突出最重要的下一步。'

  return `${activeAgent.value.systemPrompt}\n${expertLine}\n默认使用中文回答，必要时保留英文平台或产品术语。`
})

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const getAgent = (id) => agents.find((agent) => agent.id === id) || agents[0]

const makeTaskTitle = (content) => {
  const firstLine = String(content || '').trim().split('\n').find(Boolean) || '小思任务'
  return firstLine.length > 34 ? `${firstLine.slice(0, 34)}...` : firstLine
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const sanitizeMessages = (items) => {
  if (!Array.isArray(items)) return []

  return items
    .filter((item) => ['user', 'assistant'].includes(item?.role) && typeof item?.content === 'string')
    .slice(-80)
    .map((item) => ({
      id: item.id || createId(),
      role: item.role,
      content: item.content,
      agentId: item.agentId || selectedAgentId.value,
      createdAt: item.createdAt || Date.now(),
      status: ['done', 'error', 'loading', 'stopped'].includes(item.status) ? item.status : 'done',
      model: item.model || '',
      usage: item.usage || null,
    }))
}

const restoreLegacyCache = () => {
  try {
    const rawCache = window.localStorage.getItem(CHAT_CACHE_KEY)
    if (!rawCache) {
      cacheStatus.value = '本设备还没有缓存'
      return false
    }

    const cache = JSON.parse(rawCache)
    messages.value = sanitizeMessages(cache.messages)
    input.value = typeof cache.draft === 'string' ? cache.draft : ''
    selectedAgentId.value = agents.some((agent) => agent.id === cache.selectedAgentId) ? cache.selectedAgentId : 'market-analyst'
    model.value = cache.model || DEFAULT_MODEL
    isExpertMode.value = cache.isExpertMode !== false

    lastSavedAt.value = cache.updatedAt ? formatTime(cache.updatedAt) : ''
    cacheStatus.value = messages.value.length ? '已恢复上次会话' : '已恢复草稿设置'
    return true
  } catch (error) {
    cacheStatus.value = '缓存读取失败，已使用空会话'
    console.warn('Failed to restore chat cache', error)
    return false
  }
}

const applyConversation = (conversation) => {
  const agentId = agents.some((agent) => agent.id === conversation.agentId) ? conversation.agentId : 'market-analyst'

  currentConversationId.value = conversation.id
  messages.value = sanitizeMessages(conversation.messages)
  input.value = typeof conversation.draft === 'string' ? conversation.draft : ''
  selectedAgentId.value = agentId
  model.value = conversation.model || DEFAULT_MODEL
  isExpertMode.value = conversation.isExpertMode !== false
  lastSavedAt.value = conversation.updatedAt ? formatTime(conversation.updatedAt) : ''
  cacheStatus.value = messages.value.length ? '已恢复上次会话' : '已恢复草稿设置'
  setActiveConversationId(conversation.id)
}

const openConversation = (conversationId) => {
  if (!conversationId) {
    if (isLoading.value) stopGeneration()
    cacheWritesSuspended = true
    currentConversationId.value = ''
    messages.value = []
    input.value = ''
    errorMessage.value = ''
    searchQuery.value = ''
    cacheStatus.value = '暂无对话记录'
    lastSavedAt.value = ''
    setActiveConversationId('')
    nextTick(() => {
      cacheWritesSuspended = false
      textareaRef.value?.focus()
    })
    return
  }

  if (conversationId === currentConversationId.value) return

  const conversation = loadConversations().find((item) => item.id === conversationId)
  if (!conversation) return

  if (isLoading.value) stopGeneration()
  saveCache()
  cacheWritesSuspended = true
  errorMessage.value = ''
  searchQuery.value = ''
  applyConversation(conversation)

  nextTick(() => {
    cacheWritesSuspended = false
    scrollToBottom()
    textareaRef.value?.focus()
  })
}

const buildConversationPayload = (updatedAt = Date.now()) => {
  const agent = getAgent(selectedAgentId.value)

  return {
    id: currentConversationId.value || createId(),
    title: makeConversationTitle(messages.value, input.value),
    agentId: agent.id,
    agentName: agent.name,
    agentAvatar: agent.avatar,
    messages: sanitizeMessages(messages.value),
    draft: input.value,
    model: model.value || DEFAULT_MODEL,
    isExpertMode: isExpertMode.value,
    updatedAt,
  }
}

const restoreCache = () => {
  const conversations = loadConversations()
  const activeConversationId = getActiveConversationId()
  const conversation = conversations.find((item) => item.id === activeConversationId) || conversations[0]

  if (conversation) {
    applyConversation(conversation)
    return
  }

  const restoredLegacyCache = restoreLegacyCache()
  const hasUserMessage = messages.value.some((message) => message.role === 'user' && message.content.trim())
  if (!restoredLegacyCache || !hasUserMessage) return

  const migratedConversation = upsertConversation(buildConversationPayload(Date.now()))
  currentConversationId.value = migratedConversation.id
  setActiveConversationId(migratedConversation.id)
  cacheStatus.value = messages.value.length ? '已恢复并迁移上次会话' : '已恢复草稿设置'
}

const saveCache = () => {
  if (!hasMounted.value || cacheWritesSuspended) return

  const hasUserMessage = messages.value.some((message) => message.role === 'user' && message.content.trim())
  if (!hasUserMessage) {
    lastSavedAt.value = ''
    cacheStatus.value = '暂无会话，输入后会自动缓存'
    return
  }

  try {
    const updatedAt = Date.now()
    const conversation = upsertConversation(buildConversationPayload(updatedAt))
    currentConversationId.value = conversation.id
    setActiveConversationId(conversation.id)
    lastSavedAt.value = formatTime(updatedAt)
    cacheStatus.value = '已自动保存'
  } catch (error) {
    cacheStatus.value = '设备缓存写入失败'
    console.warn('Failed to save chat cache', error)
  }
}

const clearBrowserCache = () => {
  if (isLoading.value) stopGeneration()
  cacheWritesSuspended = true
  clearConversations()
  window.localStorage.removeItem(CHAT_CACHE_KEY)
  currentConversationId.value = ''
  messages.value = []
  input.value = ''
  errorMessage.value = ''
  searchQuery.value = ''
  cacheStatus.value = '设备缓存已清空'
  lastSavedAt.value = ''
  nextTick(() => {
    cacheWritesSuspended = false
    textareaRef.value?.focus()
  })
}

const startNewConversation = (agentId = selectedAgentId.value, draft = '') => {
  if (isLoading.value) stopGeneration()
  saveCache()
  cacheWritesSuspended = true
  const nextAgent = getAgent(agentId)
  const nextConversation = createConversation({
    agentId: nextAgent.id,
    agentName: nextAgent.name,
    agentAvatar: nextAgent.avatar,
    model: model.value || DEFAULT_MODEL,
    isExpertMode: isExpertMode.value,
  })
  currentConversationId.value = nextConversation.id
  setActiveConversationId(nextConversation.id)
  selectedAgentId.value = nextAgent.id
  messages.value = []
  input.value = draft
  errorMessage.value = ''
  searchQuery.value = ''
  cacheStatus.value = `已切换到${nextAgent.name}的新对话`
  nextTick(() => {
    cacheWritesSuspended = false
    textareaRef.value?.focus()
  })
}

const handleAgentChange = (agentId) => {
  if (agentId === selectedAgentId.value) return
  startNewConversation(agentId)
}

const scrollToBottom = () => {
  nextTick(() => {
    const panel = scrollPanelRef.value
    if (panel) panel.scrollTop = panel.scrollHeight
  })
}

const applyPrompt = (prompt) => {
  if (prompt.agentId !== selectedAgentId.value) {
    startNewConversation(prompt.agentId, prompt.text)
    return
  }

  input.value = prompt.text
  errorMessage.value = ''
  nextTick(() => textareaRef.value?.focus())
}

const buildApiMessages = (nextMessages) => {
  const history = nextMessages
    .filter((message) => ['user', 'assistant'].includes(message.role) && message.content.trim() && message.status !== 'error')
    .slice(-24)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  return [
    {
      role: 'system',
      content: systemPrompt.value,
    },
    ...history,
  ]
}

const normalizeRequestError = (error) => {
  if (error?.name === 'AbortError') return '已停止本次生成。'
  if (String(error?.message || '').includes('Failed to fetch')) {
    return '请求没有到达小思。请检查网络、DeepSeek API Key，或设备是否拦截了跨域请求。'
  }
  return error?.message || '生成失败，请稍后重试。'
}

const sendMessage = async () => {
  const content = input.value.trim()
  if (!content || isLoading.value) return

  const userMessage = {
    id: createId(),
    role: 'user',
    content,
    agentId: selectedAgentId.value,
    createdAt: Date.now(),
    status: 'done',
  }

  const assistantMessage = {
    id: createId(),
    role: 'assistant',
    content: '',
    agentId: selectedAgentId.value,
    createdAt: Date.now(),
    status: 'loading',
    model: model.value,
  }

  const taskRecord = createTask({
    id: assistantMessage.id,
    title: makeTaskTitle(content),
    prompt: content,
    agentId: selectedAgentId.value,
    agentName: activeAgent.value.name,
    agentAvatar: activeAgent.value.avatar,
    status: taskStatuses.running,
    progress: 35,
    source: 'chat',
    createdAt: userMessage.createdAt,
    updatedAt: Date.now(),
  })

  input.value = ''
  errorMessage.value = ''
  messages.value = [...messages.value, userMessage, assistantMessage]
  scrollToBottom()

  const controller = new AbortController()
  activeRequest.value = controller
  isLoading.value = true

  try {
    const apiMessages = buildApiMessages([...messages.value.filter((message) => message.id !== assistantMessage.id)])
    const streamedContent = await streamDeepSeekChatCompletion({
      messages: apiMessages,
      model: model.value || DEFAULT_MODEL,
      signal: controller.signal,
      temperature: isExpertMode.value ? 0.55 : 0.75,
      maxTokens: 1200,
      onDelta: (delta) => {
        if (!delta) return
        assistantMessage.content += delta
        messages.value = [...messages.value]
        scrollToBottom()
      },
    })
    const finalContent = assistantMessage.content.trim() || String(streamedContent || '').trim()
    if (!finalContent) throw new Error('小思返回为空，请稍后重试或检查模型名称。')

    assistantMessage.content = finalContent
    assistantMessage.model = model.value || DEFAULT_MODEL
    assistantMessage.usage = null
    assistantMessage.status = 'done'
    messages.value = [...messages.value]
    updateTask(taskRecord.id, {
      status: taskStatuses.completed,
      progress: 100,
      result: finalContent,
      completedAt: Date.now(),
    })
    cacheStatus.value = '小思已回复，缓存已更新'
  } catch (error) {
    const isAbort = error?.name === 'AbortError'
    const partialContent = assistantMessage.content.trim()
    const friendlyMessage = normalizeRequestError(error)
    assistantMessage.content = isAbort && partialContent ? `${partialContent}\n\n（已停止生成）` : friendlyMessage
    assistantMessage.status = isAbort ? 'stopped' : 'error'
    messages.value = [...messages.value]
    updateTask(taskRecord.id, {
      status: taskStatuses.failed,
      progress: 100,
      result: assistantMessage.content,
      failedAt: Date.now(),
    })
    errorMessage.value = isAbort ? '' : friendlyMessage
    cacheStatus.value = isAbort && partialContent ? '已停止生成，保留当前内容' : '生成失败，请检查配置'
  } finally {
    isLoading.value = false
    activeRequest.value = null
    scrollToBottom()
  }
}

const stopGeneration = () => {
  activeRequest.value?.abort()
}

const handleComposerKeydown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

const handleSidebarNewConversation = () => {
  startNewConversation()
}

const handleSidebarSearch = (event) => {
  searchQuery.value = String(event.detail || '')
}

const handleSidebarOpenConversation = (event) => {
  openConversation(String(event.detail || ''))
}

watch(
  [messages, input, model, selectedAgentId, isExpertMode],
  saveCache,
  { deep: true },
)

watch(messages, scrollToBottom, { deep: true })

onMounted(() => {
  restoreCache()
  hasMounted.value = true
  window.addEventListener('chj-chat:new-conversation', handleSidebarNewConversation)
  window.addEventListener('chj-chat:search', handleSidebarSearch)
  window.addEventListener('chj-chat:open-conversation', handleSidebarOpenConversation)
  scrollToBottom()
})

onBeforeUnmount(() => {
  if (isLoading.value) stopGeneration()
  window.removeEventListener('chj-chat:new-conversation', handleSidebarNewConversation)
  window.removeEventListener('chj-chat:search', handleSidebarSearch)
  window.removeEventListener('chj-chat:open-conversation', handleSidebarOpenConversation)
})
</script>

<template>
  <main class="chat-page" :style="activeAgentStyle">
    <header class="chat-topbar">
      <div>
        <p class="chat-eyebrow">小思</p>
        <h1>对话</h1>
      </div>
      <div class="chat-topbar__actions">
        <span class="cache-pill">{{ cacheStatus }}<template v-if="lastSavedAt"> · {{ lastSavedAt }}</template></span> 
      </div>
    </header>

    <div class="chat-workspace">
      <section class="chat-main-card">
        <div ref="scrollPanelRef" class="chat-scroll">
          <Transition name="chat-view" mode="out-in">
            <section v-if="!messages.length && !searchQuery" :key="`hero-${selectedAgentId}`" class="chat-hero">
              <div class="hero-avatar">
                <img :src="activeAgent.avatar" :alt="activeAgent.name" />
              </div>
              <p class="chat-eyebrow">你的社交电商团队</p>
              <h2>今天想让哪位小思帮你拆问题？</h2>
              <p class="hero-copy">
                选择一个任务开始，或直接输入需求。会话会自动写入设备缓存，刷新后还能接着聊。
              </p>

              <div class="prompt-grid">
                <button
                  v-for="prompt in quickPrompts"
                  :key="prompt.title"
                  type="button"
                  class="prompt-card"
                  @click="applyPrompt(prompt)"
                >
                  <span>{{ getAgent(prompt.agentId).name }}</span>
                  <strong>{{ prompt.title }}</strong>
                </button>
              </div>
            </section>

            <section v-else :key="`messages-${currentConversationId || selectedAgentId}`" class="message-list" aria-live="polite">
              <div v-if="searchQuery" class="search-result-bar">
                <span>正在搜索：{{ searchQuery }}</span>
                <span>{{ visibleMessages.length }} / {{ messages.length }} 条匹配</span>
              </div>

              <div v-if="searchQuery && !visibleMessages.length" class="empty-result">
                没有找到匹配消息。清空左侧搜索框后可继续查看完整会话。
              </div>

              <article
                v-for="message in visibleMessages"
                :key="message.id"
                class="message-row"
                :class="`message-row--${message.role}`"
              >
                <div class="message-avatar">
                  <img
                    v-if="message.role === 'assistant'"
                    :src="getAgent(message.agentId).avatar"
                    :alt="getAgent(message.agentId).name"
                  />
                  <span v-else>你</span>
                </div>
                <div class="message-bubble">
                  <div class="message-meta">
                    <strong>{{ message.role === 'assistant' ? getAgent(message.agentId).name : '你' }}</strong>
                    <span>{{ formatTime(message.createdAt) }}</span>
                  </div>
                  <div v-if="message.content" class="message-content markdown-body" v-html="renderMarkdown(message.content)"></div>
                  <div v-if="message.status === 'loading'" class="typing-indicator" aria-label="正在生成">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </article>
            </section>
          </Transition>
        </div>

        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>

        <form class="composer" @submit.prevent="sendMessage">
          <textarea
            ref="textareaRef"
            v-model="input"
            rows="3"
            placeholder="描述你的需求。Enter 发送，Shift + Enter 换行。"
            @keydown="handleComposerKeydown"
          ></textarea>
          <div class="composer-footer">
            <div class="composer-hint">
              <span>{{ activeAgent.name }}</span>
              <span>{{ isExpertMode ? '专家模式' : '轻量模式' }}</span>
              <span>{{ cacheSummary }}</span>
            </div>
            <div class="composer-actions">
              <button v-if="isLoading" type="button" class="secondary-button" @click="stopGeneration">停止</button>
              <button type="submit" class="send-button" :disabled="!canSubmit">
                {{ isLoading ? '生成中' : '发送' }}
              </button>
            </div>
          </div>
        </form>
      </section>

      <aside class="chat-settings-card" aria-label="聊天设置">
        <section>
          <p class="settings-label">选择助手</p>
          <div class="agent-list">
            <button
              v-for="agent in agents"
              :key="agent.id"
              type="button"
              class="agent-card"
              :class="{ 'agent-card--active': agent.id === selectedAgentId }"
              @click="handleAgentChange(agent.id)"
            >
              <img :src="agent.avatar" :alt="agent.name" />
              <span>
                <strong>{{ agent.name }}</strong>
                <small>{{ agent.brief }}</small>
              </span>
            </button>
          </div>
        </section>

        <section class="settings-section">
          <p class="settings-label">小思配置</p>
          <label class="field-label">
            模型
            <select v-model="model">
              <option v-for="option in modelOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <p class="settings-note">
            连接信息已改为代码配置，不在页面展示。
          </p>
        </section>

        <section class="settings-section">
          <p class="settings-label">回答方式</p>
          <button type="button" class="mode-toggle" :class="{ 'mode-toggle--active': isExpertMode }" @click="isExpertMode = !isExpertMode">
            <span>{{ isExpertMode ? '专家模式已开启' : '轻量模式已开启' }}</span>
            <small>{{ isExpertMode ? '更完整的依据、步骤和清单' : '更短、更直接' }}</small>
          </button>
        </section>

        <section class="settings-section">
          <p class="settings-label">设备缓存</p>
          <div class="cache-box">
            <strong>{{ cacheSummary }}</strong>
            <span v-if="lastSavedAt">上次保存 {{ lastSavedAt }}</span>
            <span v-else>输入内容后自动保存</span>
          </div>
          <button type="button" class="danger-button" @click="clearBrowserCache">清空设备缓存</button>
        </section>
      </aside>
    </div>
  </main>
</template>

<style scoped>
.chat-page {
  --page-bg: radial-gradient(circle at top left, rgb(var(--agent-rgb) / 0.14), transparent 34%),
    linear-gradient(135deg, #f8fafc 0%, #f5f3ff 44%, #fff7ed 100%);
  flex: 1;
  min-width: 0;
  min-height: 100dvh;
  margin-left: 288px;
  color: #111827;
  background: var(--page-bg);
}

.chat-topbar {
  position: sticky;
  top: var(--promo-banner-h, 0px);
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  min-height: var(--header-height, 56px);
  padding: 14px 28px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

.chat-topbar h1,
.chat-hero h2 {
  margin: 0;
  letter-spacing: -0.04em;
}

.chat-topbar h1 {
  font-size: 22px;
}

.chat-eyebrow {
  margin: 0 0 4px;
  color: var(--agent-color);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.chat-topbar__actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cache-pill {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 12px;
  margin-right: 60px;
  border: 1px solid rgb(var(--agent-rgb) / 0.18);
  border-radius: 999px;
  color: #475569;
  background: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  white-space: nowrap;
}

.chat-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 310px;
  gap: 18px;
  height: calc(100dvh - var(--header-height, 56px));
  padding: 20px;
}

.chat-main-card,
.chat-settings-card {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

.chat-main-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  scroll-behavior: smooth;
}

.chat-view-enter-active,
.chat-view-leave-active {
  transition:
    opacity 240ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 240ms ease;
}

.chat-view-enter-from {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(16px) scale(0.985);
}

.chat-view-leave-to {
  opacity: 0;
  filter: blur(2px);
  transform: translateY(-10px) scale(0.99);
}

.chat-view-enter-to,
.chat-view-leave-from {
  opacity: 1;
  filter: blur(0);
  transform: translateY(0) scale(1);
}

.chat-hero {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 42px;
  text-align: center;
}

.hero-avatar {
  display: grid;
  width: 72px;
  height: 72px;
  margin-bottom: 16px;
  place-items: center;
  border-radius: 24px;
  background: var(--agent-soft);
  box-shadow: inset 0 0 0 1px rgb(var(--agent-rgb) / 0.18);
}

.hero-avatar img {
  width: 58px;
  height: 58px;
  object-fit: contain;
}

.chat-hero h2 {
  max-width: 720px;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(30px, 5vw, 52px);
  font-style: italic;
  line-height: 1.05;
}

.hero-copy {
  max-width: 560px;
  margin: 14px auto 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.8;
}

.prompt-grid {
  display: grid;
  width: min(780px, 100%);
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 28px;
}

.prompt-card {
  min-height: 104px;
  padding: 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 20px;
  color: #172033;
  background: rgba(255, 255, 255, 0.74);
  text-align: left;
  cursor: pointer;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.prompt-card:hover {
  transform: translateY(-3px);
  border-color: rgb(var(--agent-rgb) / 0.32);
  box-shadow: 0 14px 34px rgb(var(--agent-rgb) / 0.1);
}

.prompt-card span {
  display: block;
  margin-bottom: 10px;
  color: var(--agent-color);
  font-size: 12px;
  font-weight: 700;
}

.prompt-card strong {
  display: block;
  font-size: 15px;
  line-height: 1.5;
}

.message-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 26px;
}

.search-result-bar,
.empty-result {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.75);
  color: #64748b;
  font-size: 13px;
}

.search-result-bar {
  padding: 12px 14px;
  border: 1px solid rgb(var(--agent-rgb) / 0.16);
}

.empty-result {
  justify-content: center;
  padding: 32px 18px;
}

.message-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-row--user {
  flex-direction: row-reverse;
}

.message-avatar {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  overflow: hidden;
  border-radius: 14px;
  background: #0f172a;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: top;
}

.message-bubble {
  max-width: min(720px, 76%);
  padding: 14px 16px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.88);
}

.message-row--user .message-bubble {
  border-color: rgb(var(--agent-rgb) / 0.24);
  color: #fff;
  background: linear-gradient(135deg, rgb(var(--agent-rgb) / 0.92), rgb(var(--agent-rgb) / 0.74));
}

.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
  color: #64748b;
  font-size: 12px;
}

.message-row--user .message-meta {
  color: rgba(255, 255, 255, 0.72);
}

.message-meta strong {
  color: #111827;
}

.message-row--user .message-meta strong {
  color: #fff;
}

.message-content {
  margin: 0;
  word-break: break-word;
  font-size: 14px;
  line-height: 1.8;
}

.markdown-body :deep(*) {
  box-sizing: border-box;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(pre),
.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-top: 0;
}

.markdown-body :deep(p),
.markdown-body :deep(ul),
.markdown-body :deep(ol),
.markdown-body :deep(blockquote),
.markdown-body :deep(pre) {
  margin-bottom: 12px;
}

.markdown-body :deep(p:last-child),
.markdown-body :deep(ul:last-child),
.markdown-body :deep(ol:last-child),
.markdown-body :deep(blockquote:last-child),
.markdown-body :deep(pre:last-child) {
  margin-bottom: 0;
}

.markdown-body :deep(h1),
.markdown-body :deep(h2),
.markdown-body :deep(h3),
.markdown-body :deep(h4) {
  margin-bottom: 8px;
  color: inherit;
  font-weight: 800;
  line-height: 1.35;
}

.markdown-body :deep(h1) {
  font-size: 1.36em;
}

.markdown-body :deep(h2) {
  font-size: 1.22em;
}

.markdown-body :deep(h3) {
  font-size: 1.1em;
}

.markdown-body :deep(h4) {
  font-size: 1em;
}

.markdown-body :deep(ul),
.markdown-body :deep(ol) {
  padding-left: 1.2em;
}

.markdown-body :deep(li + li) {
  margin-top: 4px;
}

.markdown-body :deep(blockquote) {
  padding: 8px 12px;
  border-left: 3px solid rgb(var(--agent-rgb) / 0.42);
  border-radius: 0 12px 12px 0;
  background: rgb(var(--agent-rgb) / 0.06);
  color: #475569;
}

.markdown-body :deep(code) {
  padding: 0.15em 0.38em;
  border-radius: 7px;
  background: rgba(15, 23, 42, 0.08);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.92em;
}

.markdown-body :deep(pre) {
  overflow-x: auto;
  padding: 12px;
  border-radius: 14px;
  background: #0f172a;
  color: #e2e8f0;
  line-height: 1.65;
}

.markdown-body :deep(pre code) {
  padding: 0;
  background: transparent;
  color: inherit;
}

.markdown-body :deep(a) {
  color: var(--agent-color);
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 3px;
}

.message-row--user .markdown-body :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.58);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.86);
}

.message-row--user .markdown-body :deep(code) {
  background: rgba(255, 255, 255, 0.18);
}

.message-row--user .markdown-body :deep(pre) {
  background: rgba(15, 23, 42, 0.7);
}

.message-row--user .markdown-body :deep(a) {
  color: #fff;
}

.typing-indicator {
  display: flex;
  gap: 5px;
  align-items: center;
  min-height: 24px;
}

.typing-indicator span {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: var(--agent-color);
  animation: typing-bounce 1s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 140ms;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 280ms;
}

.error-banner {
  margin: 0 18px 12px;
  padding: 12px 14px;
  border: 1px solid rgba(248, 113, 113, 0.28);
  border-radius: 16px;
  color: #991b1b;
  background: rgba(254, 242, 242, 0.9);
  font-size: 13px;
}

.composer {
  margin: 0 18px 18px;
  padding: 12px;
  border: 1px solid rgb(var(--agent-rgb) / 0.2);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 14px 34px rgba(15, 23, 42, 0.08);
}

.composer textarea {
  width: 100%;
  max-height: 180px;
  min-height: 76px;
  resize: vertical;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
  font: inherit;
  line-height: 1.7;
}

.composer-footer,
.composer-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.composer-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  color: #64748b;
  font-size: 12px;
}

.composer-hint span {
  padding: 4px 8px;
  border-radius: 999px;
  background: #f8fafc;
}

.ghost-button,
.secondary-button,
.send-button,
.danger-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.ghost-button,
.secondary-button {
  padding: 0 14px;
  color: #334155;
  background: rgba(255, 255, 255, 0.8);
}

.send-button {
  padding: 0 18px;
  color: #fff;
  background: var(--agent-color);
  box-shadow: 0 10px 24px rgb(var(--agent-rgb) / 0.22);
}

.send-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
  box-shadow: none;
}

.ghost-button:hover,
.secondary-button:hover,
.send-button:not(:disabled):hover,
.danger-button:hover {
  transform: translateY(-1px);
}

.chat-settings-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  overflow-y: auto;
}

.settings-label {
  margin: 0 0 10px;
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.settings-section {
  padding-top: 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.18);
}

.agent-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.agent-card {
  display: flex;
  gap: 10px;
  width: 100%;
  align-items: center;
  padding: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.66);
  text-align: left;
  cursor: pointer;
}

.agent-card--active {
  border-color: rgb(var(--agent-rgb) / 0.32);
  background: var(--agent-soft);
  box-shadow: inset 0 0 0 1px rgb(var(--agent-rgb) / 0.1);
}

.agent-card img {
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border-radius: 16px;
  object-fit: cover;
  object-position: top;
}

.agent-card strong,
.agent-card small {
  display: block;
}

.agent-card strong {
  color: #111827;
  font-size: 14px;
}

.agent-card small {
  margin-top: 3px;
  color: #64748b;
  font-size: 12px;
  line-height: 1.4;
}

.field-label {
  display: grid;
  gap: 7px;
  margin-bottom: 12px;
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.field-label input,
.field-label select {
  width: 100%;
  height: 40px;
  border: 1px solid rgba(148, 163, 184, 0.32);
  border-radius: 13px;
  outline: none;
  padding: 0 12px;
  background: rgba(255, 255, 255, 0.78);
  color: #111827;
}

.field-label input:focus,
.field-label select:focus {
  border-color: rgb(var(--agent-rgb) / 0.5);
  box-shadow: 0 0 0 3px rgb(var(--agent-rgb) / 0.08);
}

.check-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
}

.settings-note {
  margin: 10px 0 0;
  color: #b45309;
  font-size: 12px;
  line-height: 1.6;
}

.mode-toggle {
  width: 100%;
  padding: 13px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.72);
  color: #334155;
  text-align: left;
  cursor: pointer;
}

.mode-toggle--active {
  border-color: rgb(var(--agent-rgb) / 0.28);
  background: var(--agent-soft);
}

.mode-toggle span,
.mode-toggle small {
  display: block;
}

.mode-toggle span {
  font-weight: 800;
}

.mode-toggle small {
  margin-top: 4px;
  color: #64748b;
}

.cache-box {
  display: grid;
  gap: 4px;
  padding: 13px;
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.86);
}

.cache-box strong {
  color: #0f172a;
  font-size: 13px;
}

.cache-box span {
  color: #64748b;
  font-size: 12px;
}

.danger-button {
  width: 100%;
  margin-top: 10px;
  color: #991b1b;
  background: #fee2e2;
}

@keyframes typing-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-view-enter-active,
  .chat-view-leave-active {
    transition: opacity 120ms ease;
  }

  .chat-view-enter-from,
  .chat-view-leave-to {
    filter: none;
    transform: none;
  }
}

@media (max-width: 1180px) {
  .chat-workspace {
    grid-template-columns: minmax(0, 1fr);
    height: auto;
    min-height: calc(100dvh - var(--header-height, 56px));
  }

  .chat-settings-card {
    order: -1;
  }

  .chat-main-card {
    min-height: 620px;
  }
}

@media (max-width: 768px) {
  .chat-page {
    margin-left: 0;
  }

  .chat-topbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 12px 16px;
  }

  .chat-topbar__actions {
    width: 100%;
    justify-content: space-between;
  }

  .chat-workspace {
    padding: 12px;
  }

  .chat-hero {
    padding: 28px 16px;
  }

  .prompt-grid {
    grid-template-columns: 1fr;
  }

  .message-list {
    padding: 16px;
  }

  .message-bubble {
    max-width: calc(100% - 50px);
  }

  .composer-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .composer-actions {
    justify-content: flex-end;
  }
}
</style>
