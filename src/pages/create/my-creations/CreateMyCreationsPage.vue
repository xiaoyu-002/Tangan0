<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { renderMarkdown } from '../../../utils/markdown'
import { extractAireiterVideoResult, queryAireiterTask } from '../aireiterApi'
import CreatePageShell from '../components/CreatePageShell.vue'
import {
  clearCreations,
  creationTypes,
  deleteCreation,
  getCreationTypeLabel,
  loadCreations,
  subscribeCreations,
  updateCreation,
} from '../creationStore'

const creations = ref([])
const activeType = ref('all')
const searchQuery = ref('')
const selectedId = ref('')
const copyStatus = ref('')
const videoQueryStatus = ref({})
let unsubscribeCreations = () => {}
let isMounted = false
const VIDEO_QUERY_COOLDOWN_MS = 30_000

const tabs = computed(() => [
  { value: 'all', label: '全部', count: creations.value.length },
  ...creationTypes.map((type) => ({
    ...type,
    count: creations.value.filter((item) => item.type === type.value).length,
  })),
])

const filteredCreations = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  return creations.value.filter((item) => {
    if (activeType.value !== 'all' && item.type !== activeType.value) return false
    if (!keyword) return true

    const haystack = [
      item.title,
      item.prompt,
      item.text,
      item.model,
      item.source,
      Object.values(item.params || {}).join(' '),
    ].join(' ').toLowerCase()

    return haystack.includes(keyword)
  })
})

const selectedCreation = computed(() => {
  if (!filteredCreations.value.length) return null
  return filteredCreations.value.find((item) => item.id === selectedId.value) || filteredCreations.value[0]
})

const stats = computed(() => ({
  script: creations.value.filter((item) => item.type === 'script').length,
  image: creations.value.filter((item) => item.type === 'image').length,
  video: creations.value.filter((item) => item.type === 'video').length,
}))

const selectedMarkdown = computed(() => renderMarkdown(selectedCreation.value?.content || selectedCreation.value?.text || ''))

const selectedVideoStatus = computed(() => {
  const selected = selectedCreation.value
  if (!selected || selected.type !== 'video') return ''
  const status = videoQueryStatus.value[selected.id] || selected.params?.providerStatus || selected.params?.rawStatus || ''
  if (status === 'stopped') return '本地轮询已停止，可刷新结果'
  if (status === 'submit_failed') return '提交可能失败，可刷新确认'
  if (status === 'query_failed') return selected.params?.error || '查询失败'
  return status
})

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const primaryAsset = (item, preferredType = '') => {
  if (!item?.assets?.length) return null
  if (preferredType) {
    const matched = item.assets.find((asset) => asset.type === preferredType)
    if (matched) return matched
  }
  return item.assets[0]
}

const previewText = (item, length = 120) => {
  const source = String(item?.text || item?.content || item?.prompt || '').replace(/\s+/g, ' ').trim()
  if (!source) return '暂无文本内容'
  return source.length > length ? `${source.slice(0, length)}...` : source
}

const typeClass = (type) => `type-${type || 'script'}`

const videoTaskId = (item) => String(item?.params?.taskId || '').trim()

const shouldQueryVideoTask = (item) => {
  if (!item || item.type !== 'video') return false
  if (!videoTaskId(item)) return false
  if (primaryAsset(item, 'video')) return false
  const lastQueriedAt = Number(item.params?.lastQueriedAt || 0)
  if (lastQueriedAt && Date.now() - lastQueriedAt < VIDEO_QUERY_COOLDOWN_MS) return false
  return !['completed', 'failed', 'submit_failed', 'query_failed'].includes(String(item.params?.providerStatus || '').toLowerCase())
}

const mergeVideoTaskResult = (item, task) => {
  const result = extractAireiterVideoResult(task)
  const status = task?.status || (result.assets.length ? 'completed' : 'processing')
  const statusText = status === 'completed' ? '生成完成' : `任务状态：${status}`
  const content = [
    item.prompt || item.text || item.content || '',
    '',
    `Aireiter 任务 ID：${videoTaskId(item)}`,
    statusText,
  ].filter(Boolean).join('\n')

  return updateCreation(item.id, {
    text: content,
    content,
    assets: result.assets.length ? result.assets : item.assets,
    params: {
      providerStatus: status,
      rawStatus: task?.status || status,
      lastQueriedAt: Date.now(),
      error: task?.error?.message || '',
    },
  })
}

const refreshVideoTask = async (item, { force = false } = {}) => {
  if (!item || item.type !== 'video') return
  const taskId = videoTaskId(item)
  if (!taskId) return
  if (!force && !shouldQueryVideoTask(item)) return
  if (videoQueryStatus.value[item.id] === '查询中') return

  videoQueryStatus.value = { ...videoQueryStatus.value, [item.id]: '查询中' }

  try {
    const task = await queryAireiterTask({ outTaskId: taskId })
    const updated = mergeVideoTaskResult(item, task)
    if (updated) {
      creations.value = loadCreations()
      selectedId.value = updated.id
    }
    videoQueryStatus.value = {
      ...videoQueryStatus.value,
      [item.id]: task?.status === 'completed' ? '已完成' : `已查询：${task?.status || 'processing'}`,
    }
  } catch (error) {
    updateCreation(item.id, {
      params: {
        providerStatus: 'query_failed',
        lastQueriedAt: Date.now(),
        error: error?.message || '查询失败',
      },
    })
    creations.value = loadCreations()
    videoQueryStatus.value = {
      ...videoQueryStatus.value,
      [item.id]: error?.message || '查询失败',
    }
  }
}

const refreshPendingVideoTasks = () => {
  creations.value
    .filter(shouldQueryVideoTask)
    .slice(0, 8)
    .forEach((item) => refreshVideoTask(item))
}

const selectCreation = (id) => {
  selectedId.value = id
}

const removeCreation = (id) => {
  creations.value = deleteCreation(id)
  if (selectedId.value === id) selectedId.value = ''
}

const removeAll = () => {
  if (!creations.value.length) return
  if (!window.confirm('确定清空本地保存的所有创作吗？')) return
  creations.value = clearCreations()
  selectedId.value = ''
}

const copySelected = async () => {
  const selected = selectedCreation.value
  if (!selected) return
  const content = selected.content || selected.text || selected.prompt || ''
  if (!content.trim()) return

  try {
    await navigator.clipboard.writeText(content)
    copyStatus.value = '已复制'
  } catch {
    copyStatus.value = '复制失败'
  }

  window.setTimeout(() => {
    copyStatus.value = ''
  }, 1600)
}

watch(filteredCreations, (items) => {
  if (!items.length) {
    selectedId.value = ''
    return
  }

  if (!items.some((item) => item.id === selectedId.value)) {
    selectedId.value = items[0].id
  }
})

watch(selectedCreation, (item) => {
  if (!isMounted) return
  refreshVideoTask(item)
})

onMounted(() => {
  isMounted = true
  creations.value = loadCreations()
  selectedId.value = creations.value[0]?.id || ''
  unsubscribeCreations = subscribeCreations((items) => {
    creations.value = items
  })
  refreshPendingVideoTasks()
})

onBeforeUnmount(() => {
  isMounted = false
  unsubscribeCreations()
})
</script>

<template>
  <CreatePageShell
    title="我的创作"
    description="这里暂时展示浏览器本地保存的脚本、图片和视频生成结果。"
  >
    <section class="library-shell">
      <div class="library-toolbar">
        <div class="tabs" role="tablist" aria-label="创作类型">
          <button
            v-for="tab in tabs"
            :key="tab.value"
            type="button"
            role="tab"
            :aria-selected="activeType === tab.value"
            :class="{ active: activeType === tab.value }"
            @click="activeType = tab.value"
          >
            <span>{{ tab.label }}</span>
            <strong>{{ tab.count }}</strong>
          </button>
        </div>

        <div class="toolbar-actions">
          <label class="search-box">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m21 21-4.34-4.34"></path>
              <circle cx="11" cy="11" r="8"></circle>
            </svg>
            <input v-model="searchQuery" type="search" placeholder="搜索标题、提示词或参数">
          </label>
          <button class="ghost-button" type="button" :disabled="!creations.length" @click="removeAll">清空</button>
        </div>
      </div>

      <div class="summary-strip">
        <div>
          <span>脚本</span>
          <strong>{{ stats.script }}</strong>
        </div>
        <div>
          <span>图片</span>
          <strong>{{ stats.image }}</strong>
        </div>
        <div>
          <span>视频</span>
          <strong>{{ stats.video }}</strong>
        </div>
      </div>

      <div v-if="filteredCreations.length" class="library-grid">
        <section class="creation-list" aria-label="创作列表">
          <article
            v-for="item in filteredCreations"
            :key="item.id"
            class="creation-card"
            :class="{ selected: selectedCreation?.id === item.id }"
            tabindex="0"
            @click="selectCreation(item.id)"
            @keyup.enter="selectCreation(item.id)"
          >
            <div class="thumb" :class="typeClass(item.type)">
              <img
                v-if="item.type === 'image' && primaryAsset(item, 'image')"
                :src="primaryAsset(item, 'image').url"
                alt="创作图片"
              >
              <video
                v-else-if="item.type === 'video' && primaryAsset(item, 'video')"
                :src="primaryAsset(item, 'video').url"
                muted
                playsinline
                preload="metadata"
              ></video>
              <img
                v-else-if="primaryAsset(item, 'image')"
                :src="primaryAsset(item, 'image').url"
                alt="创作封面"
              >
              <div v-else class="script-thumb">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>

            <div class="card-body">
              <div class="card-meta">
                <span :class="['type-pill', typeClass(item.type)]">{{ getCreationTypeLabel(item.type) }}</span>
                <time>{{ formatTime(item.createdAt) }}</time>
              </div>
              <h2>{{ item.title }}</h2>
              <p>{{ previewText(item, 88) }}</p>
            </div>
          </article>
        </section>

        <aside v-if="selectedCreation" class="detail-panel" aria-label="创作详情">
          <div class="detail-header">
            <div>
              <span :class="['type-pill', typeClass(selectedCreation.type)]">
                {{ getCreationTypeLabel(selectedCreation.type) }}
              </span>
              <h2>{{ selectedCreation.title }}</h2>
              <p>{{ formatTime(selectedCreation.createdAt) }} · {{ selectedCreation.model || '本地缓存' }}</p>
            </div>
            <div class="detail-actions">
              <button
                v-if="selectedCreation.type === 'video' && selectedCreation.params?.taskId"
                class="ghost-button"
                type="button"
                @click="refreshVideoTask(selectedCreation, { force: true })"
              >
                {{ selectedVideoStatus === '查询中' ? '查询中' : '刷新结果' }}
              </button>
              <button class="ghost-button" type="button" @click="copySelected">{{ copyStatus || '复制文本' }}</button>
              <button class="danger-button" type="button" @click="removeCreation(selectedCreation.id)">删除</button>
            </div>
          </div>

          <div v-if="selectedCreation.type === 'video' && selectedCreation.params?.taskId" class="video-task-panel">
            <span>Aireiter 任务 ID</span>
            <strong>{{ selectedCreation.params.taskId }}</strong>
            <small>{{ selectedVideoStatus || '等待查询' }}</small>
          </div>

          <div v-if="selectedCreation.assets.length" class="asset-preview">
            <template v-for="asset in selectedCreation.assets" :key="asset.url">
              <a
                v-if="asset.type === 'image'"
                class="asset-link image-link"
                :href="asset.url"
                target="_blank"
                rel="noreferrer"
              >
                <img :src="asset.url" alt="创作图片">
              </a>
              <video
                v-else-if="asset.type === 'video'"
                class="asset-video"
                :src="asset.url"
                controls
                playsinline
              ></video>
              <a v-else class="file-link" :href="asset.url" target="_blank" rel="noreferrer">打开资源</a>
            </template>
          </div>

          <div v-if="selectedCreation.content || selectedCreation.text" class="detail-content markdown-body" v-html="selectedMarkdown"></div>

          <details class="prompt-details" open>
            <summary>提示词和参数</summary>
            <p>{{ selectedCreation.prompt || '暂无提示词' }}</p>
            <dl v-if="Object.keys(selectedCreation.params || {}).length">
              <template v-for="(value, key) in selectedCreation.params" :key="key">
                <dt>{{ key }}</dt>
                <dd>{{ value }}</dd>
              </template>
            </dl>
          </details>
        </aside>
      </div>

      <div v-else class="empty-library">
        <div class="empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path>
            <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path>
            <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path>
          </svg>
        </div>
        <h2>还没有本地创作</h2>
        <p>生成脚本、图片或视频后，会自动出现在这里。</p>
        <div class="empty-actions">
          <a href="#/create/script-generator">写脚本</a>
          <a href="#/create/image">生成图片</a>
          <a href="#/create/video">生成视频</a>
        </div>
      </div>
    </section>
  </CreatePageShell>
</template>

<style scoped>
.library-shell {
  display: grid;
  gap: 16px;
}

.library-toolbar,
.summary-strip,
.detail-panel,
.empty-library {
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.06);
}

.library-toolbar {
  position: sticky;
  top: var(--header-height, 56px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  animation: panel-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.tabs,
.toolbar-actions,
.detail-actions,
.empty-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.tabs {
  padding: 4px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #f8fafc;
}

.tabs button {
  height: 34px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #667085;
  padding: 0 11px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.tabs button strong {
  min-width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #eaecf0;
  color: #475467;
  font-size: 11px;
}

.tabs button.active {
  background: #fff;
  color: #155eef;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.1);
}

.tabs button.active strong {
  background: #eff8ff;
  color: #175cd3;
}

.search-box {
  width: min(320px, 42vw);
  height: 38px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  padding: 0 11px;
  color: #667085;
}

.search-box svg,
.empty-icon svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.search-box input {
  min-width: 0;
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  color: #101828;
  font: inherit;
  font-size: 13px;
}

.ghost-button,
.danger-button {
  height: 38px;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #344054;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.ghost-button:hover,
.danger-button:hover,
.empty-actions a:hover {
  transform: translateY(-1px);
}

.ghost-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  transform: none;
}

.danger-button {
  border-color: #fecaca;
  background: #fff5f5;
  color: #b42318;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
  animation: panel-in 360ms cubic-bezier(0.16, 1, 0.3, 1) 60ms both;
}

.summary-strip div {
  display: grid;
  gap: 3px;
  padding: 14px 16px;
  border-right: 1px solid #eaecf0;
}

.summary-strip div:last-child {
  border-right: 0;
}

.summary-strip span {
  color: #667085;
  font-size: 12px;
  font-weight: 800;
}

.summary-strip strong {
  color: #101828;
  font-size: 22px;
  line-height: 1.1;
}

.library-grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(420px, 1.05fr);
  gap: 18px;
  align-items: start;
}

.creation-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 12px;
}

.creation-card {
  overflow: hidden;
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  outline: none;
  box-shadow: 0 8px 20px rgba(16, 24, 40, 0.045);
  animation: card-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;
}

.creation-card:hover,
.creation-card:focus-visible,
.creation-card.selected {
  transform: translateY(-2px);
  border-color: #84caff;
  box-shadow: 0 14px 28px rgba(16, 24, 40, 0.08);
}

.thumb {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f8fafc;
}

.thumb img,
.thumb video {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.script-thumb {
  height: 100%;
  display: grid;
  align-content: center;
  gap: 11px;
  padding: 18px;
  background: #f8fafc;
}

.script-thumb span {
  height: 10px;
  border-radius: 999px;
  background: #dbeafe;
}

.script-thumb span:nth-child(2) {
  width: 72%;
  background: #d1fae5;
}

.script-thumb span:nth-child(3) {
  width: 52%;
  background: #fed7aa;
}

.card-body {
  display: grid;
  gap: 7px;
  padding: 12px;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.type-pill {
  display: inline-flex;
  align-items: center;
  min-height: 23px;
  padding: 0 8px;
  border-radius: 8px;
  background: #f2f4f7;
  color: #475467;
  font-size: 12px;
  font-weight: 900;
}

.type-pill.type-script {
  background: #eff8ff;
  color: #175cd3;
}

.type-pill.type-image {
  background: #fff7ed;
  color: #c2410c;
}

.type-pill.type-video {
  background: #ecfdf3;
  color: #047857;
}

.card-meta time,
.detail-header p {
  color: #98a2b3;
  font-size: 12px;
}

.creation-card h2 {
  margin: 0;
  color: #101828;
  font-size: 14px;
  line-height: 1.35;
}

.creation-card p {
  min-height: 42px;
  margin: 0;
  color: #667085;
  font-size: 12px;
  line-height: 1.45;
}

.detail-panel {
  position: sticky;
  top: calc(var(--header-height, 56px) + 76px);
  max-height: calc(100dvh - 156px);
  overflow: auto;
  padding: 16px;
  animation: panel-in 360ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.detail-header h2 {
  margin: 8px 0 5px;
  color: #101828;
  font-size: 20px;
  line-height: 1.25;
}

.detail-header p {
  margin: 0;
}

.asset-preview {
  display: grid;
  gap: 12px;
  margin-bottom: 14px;
}

.video-task-panel {
  display: grid;
  gap: 5px;
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  background: #ecfdf3;
}

.video-task-panel span {
  color: #047857;
  font-size: 12px;
  font-weight: 900;
}

.video-task-panel strong {
  overflow-wrap: anywhere;
  color: #064e3b;
  font-size: 13px;
}

.video-task-panel small {
  color: #047857;
  font-size: 12px;
  font-weight: 700;
}

.asset-link,
.asset-video,
.file-link {
  overflow: hidden;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #f8fafc;
}

.asset-link img,
.asset-video {
  width: 100%;
  max-height: 520px;
  display: block;
  object-fit: contain;
}

.file-link {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 84px;
  color: #155eef;
  font-weight: 800;
  text-decoration: none;
}

.detail-content {
  padding: 14px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fcfcfd;
  color: #1d2939;
  font-size: 14px;
}

.prompt-details {
  margin-top: 14px;
  color: #475467;
  font-size: 13px;
}

.prompt-details summary {
  cursor: pointer;
  color: #344054;
  font-weight: 900;
}

.prompt-details p {
  margin: 10px 0 12px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.prompt-details dl {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 8px 10px;
  margin: 0;
}

.prompt-details dt {
  color: #667085;
  font-weight: 800;
}

.prompt-details dd {
  margin: 0;
  color: #101828;
}

.empty-library {
  min-height: 420px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 10px;
  padding: 30px;
  text-align: center;
  animation: panel-in 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.empty-icon {
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eff8ff;
  color: #175cd3;
}

.empty-icon svg {
  width: 28px;
  height: 28px;
}

.empty-library h2 {
  margin: 6px 0 0;
  color: #101828;
  font-size: 20px;
}

.empty-library p {
  margin: 0;
  color: #667085;
  font-size: 14px;
}

.empty-actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 12px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 160ms ease, background 160ms ease;
}

.empty-actions a:nth-child(2) {
  background: #c2410c;
}

.empty-actions a:nth-child(3) {
  background: #047857;
}

@keyframes panel-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: scale(0.98) translateY(10px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@media (max-width: 1120px) {
  .library-grid {
    grid-template-columns: 1fr;
  }

  .detail-panel {
    position: static;
    max-height: none;
  }
}

@media (max-width: 760px) {
  .library-toolbar,
  .detail-header {
    align-items: stretch;
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }

  .toolbar-actions,
  .detail-actions {
    width: 100%;
  }

  .toolbar-actions .ghost-button,
  .detail-actions .ghost-button,
  .detail-actions .danger-button {
    flex: 1;
  }

  .summary-strip {
    grid-template-columns: 1fr;
  }

  .summary-strip div {
    border-right: 0;
    border-bottom: 1px solid #eaecf0;
  }

  .summary-strip div:last-child {
    border-bottom: 0;
  }
}
</style>
