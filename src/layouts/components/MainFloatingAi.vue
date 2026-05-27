<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import {
  DEEPSEEK_DEFAULT_MODEL,
  getFloatingAiSystemMessage,
  streamDeepSeekChatCompletion,
} from '../../utils/deepseekApi'
import { renderMarkdown } from '../../utils/markdown'

const props = defineProps({
  currentPath: {
    type: String,
    default: '/workspace',
  },
})

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const agent = {
  name: '小思',
  avatar: '/assets/avatars/creative-director.png',
}

const routeContext = computed(() => {
  const path = props.currentPath || ''

  if (path.startsWith('/discover')) {
    return {
      prompt: '要找什么机会？',
      actions: ['找热卖商品', '看市场趋势', '分析竞品'],
    }
  }

  if (path.startsWith('/create')) {
    return {
      prompt: '今天创作什么？',
      actions: ['写带货脚本', '生成标题', '规划拍摄镜头'],
    }
  }

  if (path.startsWith('/assets')) {
    return {
      prompt: '要整理什么素材？',
      actions: ['整理店铺素材', '检查商品内容', '生成素材清单'],
    }
  }

  if (path.startsWith('/social')) {
    return {
      prompt: '要安排什么内容？',
      actions: ['安排发布日历', '找达人话题', '复盘互动数据'],
    }
  }

  return {
    prompt: '今天在忙什么？',
    actions: ['查看今日机会', '分析当前市场', '整理本周任务'],
  }
})

const isOpen = ref(false)
const isMaximized = ref(false)
const isSending = ref(false)
const draft = ref('')
const errorMessage = ref('')
const messages = ref([
  {
    id: 'welcome',
    role: 'assistant',
    content: '我是小思。你可以直接问我选品、脚本、素材整理或运营排期。',
    status: 'done',
  },
])
const messagesEl = ref(null)
let abortController = null
let scrollFrame = 0

const promptText = computed(() => routeContext.value.prompt)
const quickActions = computed(() => routeContext.value.actions)
const canSubmit = computed(() => Boolean(draft.value.trim()) && !isSending.value)

const updateMessage = (id, patch) => {
  const index = messages.value.findIndex((message) => message.id === id)
  if (index < 0) return

  messages.value[index] = {
    ...messages.value[index],
    ...patch,
  }
  messages.value = [...messages.value]
}

const scrollToLatest = () => {
  if (scrollFrame) cancelAnimationFrame(scrollFrame)

  scrollFrame = requestAnimationFrame(() => {
    const target = messagesEl.value
    if (!target) return
    target.scrollTop = target.scrollHeight
    scrollFrame = 0
  })
}

const toggleDock = () => {
  if (isOpen.value) {
    isOpen.value = false
    isMaximized.value = false
    return
  }

  isOpen.value = true
  if (isOpen.value) nextTick(scrollToLatest)
}

const closePanel = () => {
  isOpen.value = false
  isMaximized.value = false
}

const toggleMaximize = () => {
  isMaximized.value = !isMaximized.value
  nextTick(scrollToLatest)
}

const buildRequestMessages = (input) => {
  const history = messages.value
    .filter((message) => ['user', 'assistant'].includes(message.role))
    .filter((message) => message.id !== 'welcome')
    .filter((message) => message.status !== 'error')
    .filter((message) => message.content.trim())
    .slice(-8)
    .map((message) => ({
      role: message.role,
      content: message.content,
    }))

  return [
    {
      role: 'system',
      content: getFloatingAiSystemMessage(props.currentPath),
    },
    ...history,
    {
      role: 'user',
      content: input,
    },
  ]
}

const submitDraft = async (preset = '') => {
  const content = (preset || draft.value).trim()
  if (!content || isSending.value) return

  isOpen.value = true
  draft.value = ''
  errorMessage.value = ''
  const apiMessages = buildRequestMessages(content)

  const userMessage = {
    id: createId(),
    role: 'user',
    content,
    status: 'done',
  }

  const assistantMessage = {
    id: createId(),
    role: 'assistant',
    content: '',
    status: 'loading',
  }
  messages.value = [...messages.value, userMessage, assistantMessage]

  if (abortController) abortController.abort()
  abortController = new AbortController()
  isSending.value = true

  await nextTick()
  scrollToLatest()

  try {
    let streamedContent = ''
    await streamDeepSeekChatCompletion({
      messages: apiMessages,
      model: DEEPSEEK_DEFAULT_MODEL,
      signal: abortController.signal,
      onDelta: (delta) => {
        streamedContent += delta
        updateMessage(assistantMessage.id, { content: streamedContent })
        scrollToLatest()
      },
    })

    updateMessage(assistantMessage.id, {
      content: streamedContent.trim() || '我没有拿到有效返回，可以再试一次。',
      status: 'done',
    })
  } catch (error) {
    const partialContent = messages.value.find((message) => message.id === assistantMessage.id)?.content?.trim() || ''
    if (error?.name === 'AbortError') {
      updateMessage(assistantMessage.id, {
        status: 'stopped',
        content: partialContent ? `${partialContent}\n\n（已停止生成）` : '已停止生成。',
      })
    } else {
      updateMessage(assistantMessage.id, {
        status: 'error',
        content: '小思暂时没有返回。',
      })
      errorMessage.value = error instanceof Error
        ? error.message
        : '小思失败，请稍后重试。'
    }
  } finally {
    isSending.value = false
    abortController = null
    await nextTick()
    scrollToLatest()
  }
}

const pickAction = async (action) => {
  if (isSending.value) return
  isOpen.value = true
  draft.value = action
  await nextTick()
  submitDraft(action)
}

const stopGeneration = () => {
  if (!abortController) return
  abortController.abort()
}

const handleKeydown = (event) => {
  const isShortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'
  if (isShortcut) {
    event.preventDefault()
    toggleDock()
  }

  if (event.key === 'Escape' && isOpen.value) {
    event.preventDefault()
    if (isSending.value) stopGeneration()
    else if (isMaximized.value) isMaximized.value = false
    else closePanel()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleKeydown)
  if (abortController) abortController.abort()
  if (scrollFrame) cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <div class="main-floating-ai" :class="{ 'is-open': isOpen, 'is-maximized': isMaximized }">
    <Transition name="floating-ai-panel">
      <section v-if="isOpen" class="floating-ai-panel" aria-label="AI 助手">
        <header class="floating-ai-header">
          <img class="floating-ai-avatar" :src="agent.avatar" :alt="agent.name">
          <div class="floating-ai-title">
            <strong>{{ agent.name }}</strong>
            <span>Siyan-agent-v5</span>
          </div>
          <button
            v-if="isSending"
            type="button"
            class="floating-ai-stop"
            @click="stopGeneration"
          >
            停止
          </button>
          <button
            type="button"
            class="floating-ai-icon-button"
            :aria-label="isMaximized ? '还原 AI 助手' : '最大化 AI 助手'"
            :title="isMaximized ? '还原' : '最大化'"
            @click="toggleMaximize"
          >
            <AppIcon :name="isMaximized ? 'panelRestore' : 'panelExpand'" :size="20" :stroke-width="2.2" />
          </button>
          <button type="button" class="floating-ai-icon-button" aria-label="最小化 AI 助手" @click="closePanel">
            <AppIcon name="chevronDown" :size="20" :stroke-width="2.2" />
          </button>
        </header>

        <div ref="messagesEl" class="floating-ai-messages" aria-live="polite">
          <article
            v-for="message in messages"
            :key="message.id"
            class="floating-ai-message"
            :class="[`is-${message.role}`, `is-${message.status}`]"
          >
            <img
              v-if="message.role === 'assistant'"
              class="floating-ai-message-avatar"
              :src="agent.avatar"
              :alt="agent.name"
            >
            <div class="floating-ai-bubble">
              <div
                v-if="message.content"
                class="floating-ai-content markdown-body"
                v-html="renderMarkdown(message.content)"
              ></div>
              <span v-if="message.status === 'loading'" class="floating-ai-typing" aria-label="生成中">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
          </article>
        </div>

        <div class="floating-ai-actions" aria-label="快捷问题">
          <button
            v-for="action in quickActions"
            :key="action"
            type="button"
            :disabled="isSending"
            @click.stop="pickAction(action)"
          >
            {{ action }}
          </button>
        </div>

        <p v-if="errorMessage" class="floating-ai-error">
          {{ errorMessage }}
        </p>

        <form class="floating-ai-composer" @submit.prevent="submitDraft()">
          <textarea
            v-model="draft"
            rows="2"
            :placeholder="promptText"
            :disabled="isSending"
            @keydown.enter.exact.prevent="submitDraft()"
          ></textarea>
          <button type="submit" :disabled="!canSubmit" aria-label="发送">
            <AppIcon name="send" :size="18" :stroke-width="2.2" />
          </button>
        </form>
      </section>
    </Transition>

    <button
      type="button"
      class="floating-ai-pill"
      :aria-expanded="String(isOpen)"
      aria-label="打开 AI 助手"
      @click="toggleDock"
    >
      <img class="floating-ai-pill-avatar" :src="agent.avatar" :alt="agent.name">
      <span>{{ isSending ? '小思正在生成...' : promptText }}</span>
      <kbd>⌘K</kbd>
      <span class="floating-ai-pill-icon" aria-hidden="true">
        <AppIcon :name="isOpen ? 'chevronDown' : 'chevronUp'" :size="18" :stroke-width="2.2" />
      </span>
    </button>
  </div>
</template>

<style scoped>
.main-floating-ai {
  position: fixed;
  top: var(--promo-banner-h, 0px);
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 120;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  padding: 0 16px calc(env(safe-area-inset-bottom) + 14px);
  pointer-events: none;
  transition:
    top 260ms cubic-bezier(0.16, 1, 0.3, 1),
    right 260ms cubic-bezier(0.16, 1, 0.3, 1),
    bottom 260ms cubic-bezier(0.16, 1, 0.3, 1),
    left 260ms cubic-bezier(0.16, 1, 0.3, 1),
    padding 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.main-floating-ai.is-maximized {
  top: calc(var(--promo-banner-h, 0px) + 18px);
  right: 18px;
  bottom: 18px;
  left: calc(68px + 18px);
  align-items: stretch;
  justify-content: flex-end;
  padding: 0;
}

.floating-ai-panel,
.floating-ai-pill {
  width: min(100%, 720px);
  pointer-events: auto;
}

.floating-ai-panel {
  display: flex;
  height: min(68dvh, 560px);
  min-height: 430px;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(203, 213, 225, 0.82);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 24px 80px rgba(76, 83, 245, 0.18), 0 10px 28px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
  transform-origin: bottom center;
  transition:
    width 280ms cubic-bezier(0.16, 1, 0.3, 1),
    height 280ms cubic-bezier(0.16, 1, 0.3, 1),
    min-height 280ms cubic-bezier(0.16, 1, 0.3, 1),
    border-radius 280ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 280ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.main-floating-ai.is-maximized .floating-ai-panel {
  width: 100%;
  height: 100%;
  min-height: 0;
  border-radius: 22px;
  box-shadow: 0 28px 96px rgba(76, 83, 245, 0.22), 0 14px 40px rgba(15, 23, 42, 0.12);
}

.main-floating-ai.is-maximized .floating-ai-pill {
  opacity: 0;
  transform: translateY(8px) scale(0.96);
  pointer-events: none;
}

.floating-ai-header {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border-bottom: 1px solid rgba(226, 232, 240, 0.76);
}

.floating-ai-avatar,
.floating-ai-pill-avatar,
.floating-ai-message-avatar {
  display: block;
  object-fit: cover;
  object-position: top;
  border-radius: 999px;
}

.floating-ai-avatar {
  width: 40px;
  height: 40px;
  box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.16);
}

.floating-ai-title {
  min-width: 0;
  flex: 1;
}

.floating-ai-title strong,
.floating-ai-title span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floating-ai-title strong {
  color: #111827;
  font-size: 14px;
  font-weight: 800;
}

.floating-ai-title span {
  margin-top: 2px;
  color: #6b7280;
  font-size: 12px;
}

.floating-ai-stop,
.floating-ai-icon-button {
  border: 0;
  cursor: pointer;
  transition: background 160ms ease, color 160ms ease;
}

.floating-ai-stop {
  height: 30px;
  border-radius: 999px;
  padding: 0 10px;
  color: #4f46e5;
  background: #eef2ff;
  font-size: 12px;
  font-weight: 800;
}

.floating-ai-stop:hover {
  background: #e0e7ff;
}

.floating-ai-icon-button {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 999px;
  color: #64748b;
  background: #f1f5f9;
}

.floating-ai-icon-button:hover {
  color: #4f46e5;
  background: #eef2ff;
}

.floating-ai-messages {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 14px;
  scroll-behavior: smooth;
}

.floating-ai-message {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.floating-ai-message + .floating-ai-message {
  margin-top: 10px;
}

.floating-ai-message.is-user {
  justify-content: flex-end;
}

.floating-ai-message-avatar {
  width: 26px;
  height: 26px;
  flex: 0 0 auto;
}

.floating-ai-bubble {
  max-width: min(84%, 560px);
  border-radius: 16px;
  padding: 10px 12px;
  color: #334155;
  background: #f8fafc;
  box-shadow: inset 0 0 0 1px rgba(226, 232, 240, 0.9);
}

.floating-ai-message.is-user .floating-ai-bubble {
  color: #fff;
  background: linear-gradient(135deg, #4c53f5, #bf4fff);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.18);
}

.floating-ai-message.is-error .floating-ai-bubble {
  color: #991b1b;
  background: #fef2f2;
  box-shadow: inset 0 0 0 1px rgba(254, 202, 202, 0.9);
}

.floating-ai-content {
  min-width: 0;
  word-break: break-word;
  font-size: 13px;
  line-height: 1.62;
}

.floating-ai-content :deep(p),
.floating-ai-content :deep(ul),
.floating-ai-content :deep(ol),
.floating-ai-content :deep(blockquote),
.floating-ai-content :deep(pre),
.floating-ai-content :deep(.markdown-table-wrap) {
  margin-bottom: 10px;
}

.floating-ai-content :deep(p:last-child),
.floating-ai-content :deep(ul:last-child),
.floating-ai-content :deep(ol:last-child),
.floating-ai-content :deep(blockquote:last-child),
.floating-ai-content :deep(pre:last-child),
.floating-ai-content :deep(.markdown-table-wrap:last-child) {
  margin-bottom: 0;
}

.floating-ai-message.is-user .floating-ai-content :deep(a) {
  color: #fff;
}

.floating-ai-message.is-user .floating-ai-content :deep(code) {
  background: rgba(255, 255, 255, 0.18);
}

.floating-ai-message.is-user .floating-ai-content :deep(blockquote) {
  border-left-color: rgba(255, 255, 255, 0.62);
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.88);
}

.floating-ai-typing {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.floating-ai-typing i {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #8b5cf6;
  animation: floating-ai-dot 820ms ease-in-out infinite;
}

.floating-ai-typing i:nth-child(2) {
  animation-delay: 120ms;
}

.floating-ai-typing i:nth-child(3) {
  animation-delay: 240ms;
}

.floating-ai-actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 8px;
  padding: 0 14px 12px;
}

.floating-ai-actions button {
  border: 1px solid rgba(139, 92, 246, 0.16);
  border-radius: 999px;
  padding: 7px 11px;
  color: #4b5563;
  background: rgba(248, 250, 252, 0.9);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.floating-ai-actions button:hover:not(:disabled) {
  border-color: rgba(79, 70, 229, 0.32);
  color: #4f46e5;
  background: #eef2ff;
}

.floating-ai-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.floating-ai-error {
  margin: 0 14px 10px;
  padding: 8px 10px;
  border-radius: 12px;
  color: #991b1b;
  background: #fef2f2;
  font-size: 12px;
  line-height: 1.5;
}

.floating-ai-composer {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 1fr auto;
  gap: 10px;
  padding: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.86);
  background: rgba(248, 250, 252, 0.72);
}

.floating-ai-composer textarea {
  min-height: 44px;
  max-height: 96px;
  resize: vertical;
  border: 0;
  outline: 0;
  border-radius: 12px;
  padding: 10px 11px;
  color: #111827;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(203, 213, 225, 0.78);
  font: inherit;
  font-size: 13px;
  line-height: 1.45;
}

.floating-ai-composer textarea:focus {
  box-shadow: inset 0 0 0 2px rgba(99, 102, 241, 0.42);
}

.floating-ai-composer textarea:disabled {
  cursor: progress;
  opacity: 0.72;
}

.floating-ai-composer button {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  align-self: end;
  border: 0;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #4c53f5, #bf4fff);
  box-shadow: 0 10px 22px rgba(79, 70, 229, 0.28);
  cursor: pointer;
  transition: opacity 160ms ease, transform 160ms ease;
}

.floating-ai-composer button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.floating-ai-composer button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}

.floating-ai-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  max-width: 260px;
  border: 2px solid rgba(139, 92, 246, 0.26);
  border-radius: 999px;
  padding: 6px 7px 6px 6px;
  color: #4b5563;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 16px 40px rgba(79, 70, 229, 0.14);
  backdrop-filter: blur(14px);
  cursor: text;
  transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.floating-ai-pill:hover,
.main-floating-ai.is-open .floating-ai-pill {
  border-color: rgba(79, 70, 229, 0.42);
  box-shadow: 0 18px 48px rgba(79, 70, 229, 0.2);
}

.floating-ai-pill-avatar {
  width: 32px;
  height: 32px;
  flex: 0 0 auto;
}

.floating-ai-pill span:not(.floating-ai-pill-icon) {
  min-width: 0;
  overflow: hidden;
  color: #4b5563;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.floating-ai-pill kbd {
  display: inline-flex;
  align-items: center;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 2px 6px;
  color: #94a3b8;
  background: #f8fafc;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
}

.floating-ai-pill-icon {
  display: inline-grid;
  width: 30px;
  height: 30px;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 999px;
  color: #fff;
  background: linear-gradient(135deg, #4c53f5, #bf4fff);
  box-shadow: 0 8px 18px rgba(79, 70, 229, 0.26);
}

.floating-ai-panel-enter-active,
.floating-ai-panel-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.floating-ai-panel-enter-from,
.floating-ai-panel-leave-to {
  opacity: 0;
  transform: translateY(14px) scale(0.98);
}

@keyframes floating-ai-dot {
  0%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (min-width: 768px) {
  .main-floating-ai {
    left: 68px;
  }

  .main-floating-ai.is-maximized {
    left: calc(68px + 18px);
  }
}

@media (max-width: 767px) {
  .main-floating-ai.is-maximized {
    top: calc(var(--promo-banner-h, 0px) + 18px);
    right: 18px;
    bottom: 18px;
    left: 18px;
  }
}

@media (max-width: 640px) {
  .main-floating-ai {
    bottom: 0;
    padding: 0 10px calc(env(safe-area-inset-bottom) + 10px);
  }

  .main-floating-ai.is-maximized {
    top: calc(var(--promo-banner-h, 0px) + 10px);
    right: 10px;
    bottom: calc(env(safe-area-inset-bottom) + 10px);
    left: 10px;
    padding: 0;
  }

  .floating-ai-panel {
    height: min(74dvh, 540px);
    min-height: 360px;
    border-radius: 16px;
  }

  .main-floating-ai.is-maximized .floating-ai-panel {
    height: 100%;
    min-height: 0;
  }

  .floating-ai-bubble {
    max-width: 86%;
  }

  .floating-ai-pill {
    max-width: 360px;
  }

  .floating-ai-pill kbd {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-ai-panel-enter-active,
  .floating-ai-panel-leave-active,
  .floating-ai-pill,
  .floating-ai-panel,
  .main-floating-ai,
  .floating-ai-composer button,
  .floating-ai-actions button,
  .floating-ai-icon-button,
  .floating-ai-stop {
    transition-duration: 1ms;
  }

  .floating-ai-typing i {
    animation-duration: 1ms;
  }
}
</style>
