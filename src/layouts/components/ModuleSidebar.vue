<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import {
  CHAT_ACTIVE_CONVERSATION_KEY,
  CHAT_CONVERSATIONS_KEY,
  deleteConversation,
  getActiveConversationId,
  loadConversations,
} from '../../pages/chat/chatStore'
import { getActiveModule, getDiscoverGroups, moduleSidebars, normalizeLayoutPath } from '../sidebarData'

const props = defineProps({
  currentPath: {
    type: String,
    default: '/workspace',
  },
})

const effectivePath = computed(() => normalizeLayoutPath(props.currentPath))
const activeModule = computed(() => getActiveModule(effectivePath.value))
const secondaryConfig = computed(() => moduleSidebars[activeModule.value] || null)
const discoverSidebarGroups = computed(() => getDiscoverGroups(effectivePath.value))
const showPlatformMenu = ref(false)
const chatConversations = ref([])
const activeConversationId = ref('')
const chatSearchQuery = ref('')

const handleChatNewConversation = () => {
  window.dispatchEvent(new CustomEvent('chj-chat:new-conversation'))
}

const handleChatSearch = (event) => {
  chatSearchQuery.value = event.target.value
  window.dispatchEvent(new CustomEvent('chj-chat:search', { detail: chatSearchQuery.value }))
}

const refreshChatConversations = () => {
  chatConversations.value = loadConversations()
  activeConversationId.value = getActiveConversationId()
}

const openChatConversation = (conversationId) => {
  activeConversationId.value = conversationId
  window.dispatchEvent(new CustomEvent('chj-chat:open-conversation', { detail: conversationId }))
}

const deleteChatConversation = (conversationId) => {
  const nextConversation = chatConversations.value.find((conversation) => conversation.id !== conversationId)
  deleteConversation(conversationId)
  refreshChatConversations()

  if (conversationId === activeConversationId.value) {
    activeConversationId.value = nextConversation?.id || ''
    window.dispatchEvent(new CustomEvent('chj-chat:open-conversation', { detail: activeConversationId.value }))
  }
}

const handleChatConversationsUpdated = (event) => {
  chatConversations.value = Array.isArray(event.detail) ? event.detail : loadConversations()
  activeConversationId.value = getActiveConversationId()
}

const handleActiveConversationUpdated = (event) => {
  activeConversationId.value = String(event.detail || '')
}

const handleConversationStarted = (event) => {
  if (event.detail) {
    chatConversations.value = [event.detail, ...chatConversations.value.filter((item) => item.id !== event.detail.id)]
    activeConversationId.value = event.detail.id
  } else {
    refreshChatConversations()
  }
}

const handleStorage = (event) => {
  if ([CHAT_CONVERSATIONS_KEY, CHAT_ACTIVE_CONVERSATION_KEY].includes(event.key)) refreshChatConversations()
}

const formatConversationTime = (timestamp) => {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const filteredChatConversations = computed(() => {
  const keyword = chatSearchQuery.value.trim().toLowerCase()
  if (!keyword) return chatConversations.value

  return chatConversations.value.filter((conversation) => {
    const messageText = conversation.messages
      ?.slice(0, 6)
      .map((message) => message.content)
      .join(' ')
    return `${conversation.title} ${conversation.agentName} ${conversation.draft} ${messageText}`.toLowerCase().includes(keyword)
  })
})

onMounted(() => {
  refreshChatConversations()
  window.addEventListener('chj-chat:conversations-updated', handleChatConversationsUpdated)
  window.addEventListener('chj-chat:active-conversation-updated', handleActiveConversationUpdated)
  window.addEventListener('chj-chat:conversation-started', handleConversationStarted)
  window.addEventListener('storage', handleStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('chj-chat:conversations-updated', handleChatConversationsUpdated)
  window.removeEventListener('chj-chat:active-conversation-updated', handleActiveConversationUpdated)
  window.removeEventListener('chj-chat:conversation-started', handleConversationStarted)
  window.removeEventListener('storage', handleStorage)
})

const discoverPlatformOptions = [
  { id: 'tiktok', label: 'TikTok', meta: '美国', shortLabel: 'TT', path: '/discover/overview/pulse' },
  { id: 'shopify', label: '独立站', meta: 'Shopify', shortLabel: 'S', path: '/discover/shopify/products' },
]

const currentDiscoverPlatform = computed(() => {
  return effectivePath.value.startsWith('/discover/shopify') ? discoverPlatformOptions[1] : discoverPlatformOptions[0]
})

const isActivePlatform = (option) => {
  if (option.id === 'shopify') return effectivePath.value.startsWith('/discover/shopify')
  return !effectivePath.value.startsWith('/discover/shopify')
}

const isActivePath = (item) => {
  const paths = item.activePaths || [item.path]
  return paths.includes(effectivePath.value)
}

const isDiscoverGroupOpen = (group) => {
  if (group.path) return isActivePath(group)
  return group.openPrefixes?.some((prefix) => effectivePath.value.startsWith(prefix)) || false
}

const secondaryLinkClass = (item) => (isActivePath(item) ? 'module-sidebar-link is-active' : 'module-sidebar-link')
const accordionTriggerClass = 'module-sidebar-accordion-trigger'
const accordionLinkClass = (item) => (isActivePath(item) ? 'module-sidebar-link module-sidebar-child-link is-active' : 'module-sidebar-link module-sidebar-child-link')
const platformOptionClass = (option) => (isActivePlatform(option) ? 'module-sidebar-platform-option is-active' : 'module-sidebar-platform-option')
const conversationClass = (conversation) => (conversation.id === activeConversationId.value ? 'module-sidebar-chat-item is-active' : 'module-sidebar-chat-item')
</script>

<template>
  <div v-if="activeModule === 'discover'" class="module-sidebar-shell">
    <aside data-sidebar-expanded="true" class="module-sidebar-panel">
      <nav class="module-sidebar-nav">
        <div class="module-sidebar-platform-control">
          <div class="module-sidebar-platform-menu">
            <button
              type="button"
              role="combobox"
              :aria-expanded="String(showPlatformMenu)"
              data-state="closed"
              data-slot="select-trigger"
              data-size="default"
              class="module-sidebar-platform-trigger"
              @click.stop="showPlatformMenu = !showPlatformMenu"
            >
              <span class="module-sidebar-platform-value">
                <span class="module-sidebar-platform-badge">{{ currentDiscoverPlatform.shortLabel }}</span>
                <span class="module-sidebar-platform-label">{{ currentDiscoverPlatform.label }}</span>
                <span class="module-sidebar-platform-meta">{{ currentDiscoverPlatform.meta }}</span>
              </span>
              <AppIcon name="chevronDown" class="module-sidebar-small-icon" :stroke-width="2" />
            </button>
            <div v-if="showPlatformMenu" class="module-sidebar-platform-popover">
              <a
                v-for="option in discoverPlatformOptions"
                :key="option.id"
                :href="'#' + option.path"
                :class="platformOptionClass(option)"
                @click="showPlatformMenu = false"
              >
                <span class="module-sidebar-platform-badge">{{ option.shortLabel }}</span>
                <span class="module-sidebar-platform-label">{{ option.label }}</span>
                <span class="module-sidebar-platform-meta is-trailing">{{ option.meta }}</span>
              </a>
            </div>
          </div>
        </div>

        <div class="module-sidebar-scroll">
          <div class="module-sidebar-content">
            <section class="module-sidebar-section">
              <div class="module-sidebar-section-heading">
                <span class="module-sidebar-section-title">浏览</span>
              </div>
              <div class="module-sidebar-group-list">
                <div v-for="group in discoverSidebarGroups" :key="group.id" class="module-sidebar-group">
                  <div data-slot="accordion" data-orientation="vertical">
                    <div :data-state="isDiscoverGroupOpen(group) ? 'open' : 'closed'" data-orientation="vertical" data-slot="accordion-item" class="module-sidebar-accordion-item">
                      <h3 v-if="group.path && !group.items.length" data-orientation="vertical" :data-state="isDiscoverGroupOpen(group) ? 'open' : 'closed'" class="module-sidebar-heading-row">
                        <a
                          :href="'#' + group.path"
                          :data-state="isDiscoverGroupOpen(group) ? 'open' : 'closed'"
                          :class="accordionTriggerClass"
                        >
                          <span class="module-sidebar-trigger-content">
                            <span class="module-sidebar-muted-icon">
                              <AppIcon :name="group.icon" class="module-sidebar-icon" :stroke-width="1.2" />
                            </span>
                            <span class="module-sidebar-label">{{ group.label }}</span>
                          </span>
                        </a>
                      </h3>
                      <h3 v-else data-orientation="vertical" :data-state="isDiscoverGroupOpen(group) ? 'open' : 'closed'" class="module-sidebar-heading-row">
                        <button
                          type="button"
                          :aria-controls="group.id + '-panel'"
                          :aria-expanded="String(isDiscoverGroupOpen(group))"
                          :data-state="isDiscoverGroupOpen(group) ? 'open' : 'closed'"
                          data-orientation="vertical"
                          :id="group.id + '-trigger'"
                          data-slot="accordion-trigger"
                          :class="accordionTriggerClass"
                          data-radix-collection-item=""
                        >
                          <span class="module-sidebar-trigger-content">
                            <span class="module-sidebar-muted-icon">
                              <AppIcon :name="group.icon" class="module-sidebar-icon" :stroke-width="1.2" />
                            </span>
                            <span class="module-sidebar-label">{{ group.label }}</span>
                          </span>
                          <AppIcon name="chevronDown" class="module-sidebar-chevron" :stroke-width="2" />
                        </button>
                      </h3>
                      <div
                        v-if="group.items.length"
                        :data-state="isDiscoverGroupOpen(group) ? 'open' : 'closed'"
                        :id="group.id + '-panel'"
                        :hidden="!isDiscoverGroupOpen(group)"
                        role="region"
                        :aria-labelledby="group.id + '-trigger'"
                        data-orientation="vertical"
                        data-slot="accordion-content"
                        class="module-sidebar-accordion-content"
                        style="--radix-accordion-content-height: var(--radix-collapsible-content-height); --radix-accordion-content-width: var(--radix-collapsible-content-width)"
                      >
                        <div class="module-sidebar-child-list">
                          <a v-for="item in group.items" :key="item.path" :class="accordionLinkClass(item)" :href="'#' + item.path">
                            <span class="module-sidebar-child-label">{{ item.label }}</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section class="module-sidebar-section">
              <div class="module-sidebar-section-heading">
                <span class="module-sidebar-section-title">我的</span>
              </div>
              <div class="module-sidebar-group-list">
                <a :class="secondaryLinkClass({ path: '/discover/watchlist' })" href="#/discover/watchlist">
                  <span class="module-sidebar-label">我的收藏</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </nav>
      <div class="module-sidebar-toggle-wrap">
        <button class="module-sidebar-toggle" aria-label="收起面板" data-ph-capture-attribute-button-name="nav:sidebar_toggle">
          <AppIcon name="chevronLeft" class="module-sidebar-toggle-icon" :stroke-width="2" />
        </button>
      </div>
    </aside>
  </div>

  <div v-else-if="secondaryConfig" class="module-sidebar-shell">
    <aside data-sidebar-expanded="true" class="module-sidebar-panel">
      <nav class="module-sidebar-nav">
        <div class="module-sidebar-scroll">
          <div class="module-sidebar-content">
            <section v-for="section in secondaryConfig" :key="section.title || section.items[0].id" class="module-sidebar-section">
              <div v-if="section.title" class="module-sidebar-section-heading">
                <span class="module-sidebar-section-title">{{ section.title }}</span>
              </div>
              <div class="module-sidebar-group-list">
                <a
                  v-for="item in section.items"
                  :key="item.id"
                  data-ph-capture-attribute-button-name="nav:subnav_clicked"
                  :data-ph-capture-attribute-subnav-id="item.id"
                  :class="secondaryLinkClass(item)"
                  :href="'#' + item.path"
                >
                  <AppIcon :name="item.icon" class="module-sidebar-icon" :stroke-width="1.8" />
                  <span class="module-sidebar-label is-fill">{{ item.label }}</span>
                  <span v-if="item.badge" class="module-sidebar-badge">{{ item.badge }}</span>
                </a>
              </div>
            </section>
          </div>
        </div>
      </nav>
      <div class="module-sidebar-toggle-wrap">
        <button class="module-sidebar-toggle" aria-label="收起面板" data-ph-capture-attribute-button-name="nav:sidebar_toggle">
          <AppIcon name="chevronLeft" class="module-sidebar-toggle-icon" :stroke-width="2" />
        </button>
      </div>
    </aside>
  </div>

  <div v-else-if="activeModule === 'chat'" class="module-sidebar-shell">
    <aside class="module-sidebar-panel module-sidebar-chat-panel">
      <div class="module-sidebar-chat-scroll">
        <div class="module-sidebar-chat-root">
          <div class="module-sidebar-chat-main">
            <div class="module-sidebar-chat-tools">
              <button type="button" title="新对话" class="module-sidebar-chat-new" @click="handleChatNewConversation">
                <AppIcon name="plus" class="module-sidebar-icon" :stroke-width="2" />
                <span class="module-sidebar-chat-new-text">新对话</span>
              </button>
              <div class="module-sidebar-chat-search">
                <span class="module-sidebar-chat-search-icon">
                  <AppIcon name="search" class="module-sidebar-search-icon" :stroke-width="2" />
                </span>
                <input placeholder="搜索本地消息..." autocomplete="off" class="module-sidebar-chat-search-input" @input="handleChatSearch" />
              </div>
            </div>

            <div class="module-sidebar-chat-list">
              <div class="module-sidebar-chat-list-inner">
                <div class="module-sidebar-section-title">对话记录</div>
                <div v-if="filteredChatConversations.length" class="module-sidebar-chat-items">
                  <div v-for="conversation in filteredChatConversations" :key="conversation.id" :class="conversationClass(conversation)">
                    <button type="button" class="module-sidebar-chat-open" @click="openChatConversation(conversation.id)">
                      <img :src="conversation.agentAvatar" :alt="conversation.agentName" class="module-sidebar-chat-avatar" />
                      <span class="module-sidebar-chat-text">
                        <span class="module-sidebar-chat-title">{{ conversation.title }}</span>
                        <span class="module-sidebar-chat-meta">
                          <span class="module-sidebar-chat-agent">{{ conversation.agentName }}</span>
                          <span class="module-sidebar-chat-separator">·</span>
                          <span class="module-sidebar-chat-time">{{ formatConversationTime(conversation.updatedAt) }}</span>
                        </span>
                      </span>
                    </button>
                    <button type="button" title="删除对话" aria-label="删除对话" class="module-sidebar-chat-delete" @click.stop="deleteChatConversation(conversation.id)">
                      <AppIcon name="trash" class="module-sidebar-delete-icon" :stroke-width="1.9" />
                    </button>
                  </div>
                </div>
                <div v-else class="module-sidebar-empty-state">
                  <p class="module-sidebar-empty-title">暂无对话记录</p>
                  <p class="module-sidebar-empty-text">发送消息或切换助手后会自动出现在这里。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  </div>
</template>

<style scoped>
.module-sidebar-shell {
  display: none;
}

.module-sidebar-panel {
  position: relative;
  height: 100%;
  overflow: hidden;
  border-right: 1px solid rgba(214, 211, 209, 0.3);
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(24px);
  transition: width 200ms ease-out;
}

.module-sidebar-panel[data-sidebar-expanded="true"] {
  width: 176px;
}

.module-sidebar-panel[data-sidebar-expanded="false"] {
  width: 56px;
}

.module-sidebar-nav {
  display: flex;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
}

.module-sidebar-platform-control {
  flex: 0 0 auto;
  padding: 12px 12px 0;
}

.module-sidebar-platform-menu {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.module-sidebar-platform-trigger {
  display: flex;
  width: 100%;
  height: 36px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border: 1px solid rgba(214, 211, 209, 0.78);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.7);
  padding: 0 12px;
  color: #44403c;
  font-size: 14px;
  cursor: pointer;
  outline: none;
  transition: background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
}

.module-sidebar-platform-trigger:hover,
.module-sidebar-platform-trigger:focus-visible {
  background: #fff;
  border-color: rgba(120, 113, 108, 0.38);
  box-shadow: 0 0 0 3px rgba(76, 83, 245, 0.12);
}

.module-sidebar-platform-value,
.module-sidebar-platform-option {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.module-sidebar-platform-badge {
  display: inline-flex;
  min-width: 20px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  background: rgba(76, 83, 245, 0.1);
  padding: 0 4px;
  color: #4c53f5;
  font-size: 10px;
  font-weight: 700;
}

.module-sidebar-platform-label,
.module-sidebar-label,
.module-sidebar-child-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-sidebar-platform-label {
  font-weight: 600;
}

.module-sidebar-platform-meta {
  flex: 0 0 auto;
  color: #a8a29e;
  font-size: 12px;
}

.module-sidebar-platform-meta.is-trailing {
  margin-left: auto;
}

.module-sidebar-small-icon,
.module-sidebar-chevron,
.module-sidebar-toggle-icon {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
}

.module-sidebar-small-icon {
  opacity: 0.5;
}

.module-sidebar-platform-popover {
  position: absolute;
  left: 0;
  right: 0;
  top: 40px;
  z-index: 50;
  border: 1px solid #e7e5e4;
  border-radius: 8px;
  background: #fff;
  padding: 4px;
  box-shadow: 0 14px 36px rgba(15, 23, 42, 0.14);
}

.module-sidebar-platform-option {
  border-radius: 6px;
  padding: 8px 10px;
  color: #57534e;
  font-size: 14px;
  text-decoration: none;
  transition: background 160ms ease, color 160ms ease;
}

.module-sidebar-platform-option:hover {
  background: rgba(76, 83, 245, 0.05);
}

.module-sidebar-platform-option.is-active {
  color: #4c53f5;
  background: rgba(76, 83, 245, 0.1);
  font-weight: 600;
}

.module-sidebar-scroll,
.module-sidebar-chat-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.module-sidebar-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 8px 16px;
}

.module-sidebar-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.module-sidebar-section-heading {
  padding: 4px 8px 0;
}

.module-sidebar-section-title {
  color: #9ca3af;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  white-space: nowrap;
}

.module-sidebar-group-list,
.module-sidebar-child-list {
  display: flex;
  flex-direction: column;
}

.module-sidebar-group-list {
  gap: 4px;
}

.module-sidebar-child-list {
  gap: 2px;
  padding-top: 4px;
}

.module-sidebar-group,
.module-sidebar-accordion-item {
  display: flex;
  flex-direction: column;
}

.module-sidebar-heading-row {
  display: flex;
  margin: 0;
}

.module-sidebar-link,
.module-sidebar-accordion-trigger {
  position: relative;
  display: inline-flex;
  width: 100%;
  height: 36px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #57534e;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  padding: 0 12px;
  text-align: left;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 220ms ease, color 220ms ease, opacity 220ms ease, transform 240ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease;
}

.module-sidebar-link:hover,
.module-sidebar-accordion-trigger:hover {
  color: #57534e;
  background: rgba(76, 83, 245, 0.05);
  transform: translateX(2px);
}

.module-sidebar-link:focus-visible,
.module-sidebar-accordion-trigger:focus-visible {
  box-shadow: 0 0 0 3px rgba(76, 83, 245, 0.18);
}

.module-sidebar-link::before {
  content: "";
  position: absolute;
  left: 8px;
  top: 50%;
  width: 3px;
  height: 14px;
  border-radius: 999px;
  background: #4c53f5;
  opacity: 0;
  transform: translate(-5px, -50%) scaleY(0.5);
  transition: opacity 220ms ease, transform 240ms cubic-bezier(0.16, 1, 0.3, 1);
}

.module-sidebar-link.is-active {
  color: #4c53f5;
  background: rgba(76, 83, 245, 0.1);
  font-weight: 600;
  transform: translateX(4px);
  box-shadow: 0 8px 20px rgba(76, 83, 245, 0.08);
}

.module-sidebar-link.is-active::before {
  opacity: 1;
  transform: translate(0, -50%) scaleY(1);
}

.module-sidebar-child-link {
  height: 32px;
  border-radius: 6px;
  padding-left: 36px;
  padding-right: 8px;
  font-weight: 400;
}

.module-sidebar-trigger-content {
  display: flex;
  min-width: 0;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
}

.module-sidebar-muted-icon {
  color: #78716c;
}

.module-sidebar-icon { 
  height: 16px;
  flex: 0 0 auto;
}

.module-sidebar-label.is-fill {
  flex: 1 1 auto;
}

.module-sidebar-chevron {
  color: #6b7280;
  transform: translateY(2px);
  transition: transform 200ms ease;
}

.module-sidebar-accordion-trigger[data-state="open"] .module-sidebar-chevron {
  transform: translateY(2px) rotate(180deg);
}

.module-sidebar-accordion-content {
  overflow: hidden;
  font-size: 14px;
}

.module-sidebar-badge {
  flex: 0 0 auto;
  margin-left: auto;
  border-radius: 999px;
  background: #f97316;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 1px 6px;
  text-transform: uppercase;
}

.module-sidebar-toggle-wrap {
  position: absolute;
  right: -20px;
  top: 50%;
  transform: translateY(-50%);
}

.module-sidebar-toggle {
  display: inline-flex;
  height: 48px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 0 6px 6px 0;
  background: rgba(223, 223, 255, 0.51);
  color: #4c53f5;
  cursor: pointer;
  padding: 0 2px;
  transition: background 160ms ease, color 160ms ease;
}

.module-sidebar-toggle:hover {
  background: rgba(223, 223, 255, 0.72);
}

.module-sidebar-chat-panel {
  width: 220px;
}

.module-sidebar-chat-scroll {
  padding-top: 12px;
}

.module-sidebar-chat-root,
.module-sidebar-chat-main,
.module-sidebar-chat-list {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.module-sidebar-chat-main {
  padding: 0 8px 8px;
}

.module-sidebar-chat-tools {
  flex: 0 0 auto;
}

.module-sidebar-chat-new {
  display: flex;
  width: 100%;
  min-height: 36px;
  align-items: center;
  gap: 10px;
  overflow: hidden;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #44403c;
  cursor: pointer;
  padding: 8px 12px;
  transition: background 160ms ease;
}

.module-sidebar-chat-new:hover {
  background: rgba(76, 83, 245, 0.05);
}

.module-sidebar-chat-new-text {
  min-width: 0;
  flex: 1 1 auto;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
}

.module-sidebar-chat-search {
  position: relative;
  padding: 4px 2px;
}

.module-sidebar-chat-search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  color: #a8a29e;
  pointer-events: none;
  transform: translateY(-50%);
}

.module-sidebar-search-icon,
.module-sidebar-delete-icon {
  width: 14px;
  height: 14px;
}

.module-sidebar-chat-search-input {
  width: 100%;
  height: 32px;
  border: 1px solid rgba(214, 211, 209, 0.6);
  border-radius: 8px;
  background: #fff;
  color: #44403c;
  font-size: 14px;
  outline: none;
  padding: 0 28px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.module-sidebar-chat-search-input::placeholder {
  color: #a8a29e;
}

.module-sidebar-chat-search-input:hover,
.module-sidebar-chat-search-input:focus {
  border-color: #d6d3d1;
}

.module-sidebar-chat-search-input:focus {
  box-shadow: 0 0 0 3px rgba(120, 113, 108, 0.16);
}

.module-sidebar-chat-list-inner {
  padding: 12px 8px 0;
}

.module-sidebar-chat-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
}

.module-sidebar-chat-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  border: 1px solid rgba(214, 211, 209, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.6);
  color: #44403c;
  padding: 8px 10px;
  text-align: left;
  transition: background 160ms ease, border-color 160ms ease, color 160ms ease;
}

.module-sidebar-chat-item:hover {
  background: #fff;
  border-color: #d6d3d1;
}

.module-sidebar-chat-item.is-active {
  color: #1c1917;
  background: rgba(76, 83, 245, 0.1);
  border-color: rgba(76, 83, 245, 0.2);
}

.module-sidebar-chat-open {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
  text-align: left;
}

.module-sidebar-chat-avatar {
  width: 24px;
  height: 24px;
  flex: 0 0 auto;
  border-radius: 8px;
  object-fit: cover;
  object-position: top;
}

.module-sidebar-chat-text {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.module-sidebar-chat-title,
.module-sidebar-chat-agent {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.module-sidebar-chat-title {
  font-size: 13px;
  font-weight: 700;
}

.module-sidebar-chat-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  color: #78716c;
  font-size: 11px;
}

.module-sidebar-chat-separator,
.module-sidebar-chat-time {
  flex: 0 0 auto;
}

.module-sidebar-chat-delete {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  place-items: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #a8a29e;
  cursor: pointer;
  opacity: 0;
  transition: opacity 160ms ease, background 160ms ease, color 160ms ease;
}

.module-sidebar-chat-item:hover .module-sidebar-chat-delete,
.module-sidebar-chat-delete:focus {
  opacity: 1;
}

.module-sidebar-chat-delete:hover {
  color: #dc2626;
  background: #fef2f2;
}

.module-sidebar-empty-state {
  margin-top: 8px;
  border: 1px solid rgba(214, 211, 209, 0.7);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.7);
  padding: 12px;
  text-align: center;
}

.module-sidebar-empty-title,
.module-sidebar-empty-text {
  margin: 0;
}

.module-sidebar-empty-title {
  color: #292524;
  font-size: 13px;
  font-weight: 700;
}

.module-sidebar-empty-text {
  margin-top: 4px;
  color: #78716c;
  font-size: 12px;
  line-height: 1.5;
}

@media (min-width: 768px) {
  .module-sidebar-shell {
    position: fixed;
    left: 68px;
    top: var(--promo-banner-h, 0px);
    z-index: 40;
    display: flex;
    height: calc(100dvh - var(--promo-banner-h, 0px));
  }
}
</style>
