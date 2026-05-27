<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { deleteTask, loadTasks, saveTasks, statusLabels, statusTones, taskStatuses, TASK_STORE_KEY, updateTask } from './taskStore'
import { renderMarkdown } from '../../utils/markdown'

const tasks = ref([])
const activeStatus = ref('all')
const searchQuery = ref('')
const selectedTaskId = ref('')

const agents = {
  'market-analyst': {
    name: '市场顾问',
    avatar: '/assets/avatars/market-analyst.png',
  },
  'creative-director': {
    name: '创意总监',
    avatar: '/assets/avatars/creative-director.png',
  },
  'social-manager': {
    name: '社媒管家',
    avatar: '/assets/avatars/social-manager.png',
  },
}

const filters = computed(() => [
  { key: 'all', label: statusLabels.all, count: tasks.value.length },
  { key: taskStatuses.running, label: statusLabels.running, count: countByStatus(taskStatuses.running) },
  { key: taskStatuses.completed, label: statusLabels.completed, count: countByStatus(taskStatuses.completed) },
  { key: taskStatuses.failed, label: statusLabels.failed, count: countByStatus(taskStatuses.failed) },
])

const activeFilterIndex = computed(() => {
  const index = filters.value.findIndex((filter) => filter.key === activeStatus.value)
  return Math.max(index, 0)
})

const taskTabsStyle = computed(() => ({
  '--active-tab-index': activeFilterIndex.value,
  '--task-tab-count': filters.value.length,
}))

const filteredTasks = computed(() => {
  const keyword = searchQuery.value.trim().toLowerCase()

  return tasks.value.filter((task) => {
    const matchesStatus = activeStatus.value === 'all' || task.status === activeStatus.value
    const matchesSearch = !keyword || `${task.title} ${task.prompt} ${task.result} ${task.agentName}`.toLowerCase().includes(keyword)
    return matchesStatus && matchesSearch
  })
})

const selectedTask = computed(() => {
  return filteredTasks.value.find((task) => task.id === selectedTaskId.value) || filteredTasks.value[0] || null
})

const completedCount = computed(() => countByStatus(taskStatuses.completed))
const runningCount = computed(() => countByStatus(taskStatuses.running))
const failedCount = computed(() => countByStatus(taskStatuses.failed))

const countByStatus = (status) => tasks.value.filter((task) => task.status === status).length

const getAgent = (task) => {
  return agents[task.agentId] || {
    name: task.agentName || '小思',
    avatar: task.agentAvatar || agents['market-analyst'].avatar,
  }
}

const refreshTasks = () => {
  tasks.value = loadTasks()
}

const handleTasksUpdated = (event) => {
  tasks.value = Array.isArray(event.detail) ? event.detail : loadTasks()
}

const handleStorage = (event) => {
  if (event.key === TASK_STORE_KEY) refreshTasks()
}

const formatTime = (timestamp) => {
  if (!timestamp) return '刚刚'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const statusText = (status) => statusLabels[status] || statusLabels.running

const toneClass = (status) => `task-status--${statusTones[status] || 'amber'}`

const completeTask = (task) => {
  updateTask(task.id, {
    status: taskStatuses.completed,
    progress: 100,
    completedAt: Date.now(),
  })
  refreshTasks()
}

const removeTask = (task) => {
  deleteTask(task.id)
  refreshTasks()
}

const clearFinishedTasks = () => {
  saveTasks(tasks.value.filter((task) => task.status === taskStatuses.running))
  refreshTasks()
}

watch(filteredTasks, () => {
  if (!selectedTask.value) {
    selectedTaskId.value = filteredTasks.value[0]?.id || ''
    return
  }

  const stillVisible = filteredTasks.value.some((task) => task.id === selectedTask.value?.id)
  if (!stillVisible) selectedTaskId.value = filteredTasks.value[0]?.id || ''
})

onMounted(() => {
  refreshTasks()
  selectedTaskId.value = tasks.value[0]?.id || ''
  window.addEventListener('chj-tasks:updated', handleTasksUpdated)
  window.addEventListener('storage', handleStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('chj-tasks:updated', handleTasksUpdated)
  window.removeEventListener('storage', handleStorage)
})
</script>

<template>
  <main class="tasks-page">
    <header class="tasks-topbar">
      <div>
        <p class="tasks-eyebrow">Task Center</p>
        <h1>任务</h1>
      </div>
      <a class="chat-link" href="#/chat">回到小思</a>
    </header>

    <section class="tasks-shell">
      <aside class="task-list-panel">
        <div class="task-search">
          <AppIcon name="search" :size="15" :stroke-width="2" />
          <input v-model="searchQuery" placeholder="搜索任务..." autocomplete="off" />
        </div>

        <div class="task-tabs" :style="taskTabsStyle">
          <span class="task-tab-indicator" aria-hidden="true"></span>
          <button
            v-for="filter in filters"
            :key="filter.key"
            type="button"
            :class="{ 'task-tab--active': activeStatus === filter.key }"
            :aria-pressed="String(activeStatus === filter.key)"
            @click="activeStatus = filter.key"
          >
            {{ filter.label }}
            <span class="task-tab-count">{{ filter.count }}</span>
          </button>
        </div>

        <TransitionGroup
          :key="`${activeStatus}-${searchQuery}`"
          name="task-list-switch"
          tag="div"
          class="task-list"
        >
          <button
            v-for="task in filteredTasks"
            :key="task.id"
            type="button"
            class="task-list-item"
            :class="{ 'task-list-item--active': selectedTask?.id === task.id }"
            @click="selectedTaskId = task.id"
          >
            <img :src="getAgent(task).avatar" :alt="getAgent(task).name" />
            <span class="task-list-copy">
              <strong>{{ task.title }}</strong>
              <small>{{ task.agentName || getAgent(task).name }} · {{ formatTime(task.createdAt) }}</small>
            </span>
            <span class="task-dot" :class="toneClass(task.status)"></span>
          </button>

          <div v-if="!filteredTasks.length" key="empty" class="empty-list">
            <p>暂无匹配任务</p>
            <span>去小思对话后，这里会自动出现任务记录。</span>
          </div>
        </TransitionGroup>
      </aside>

      <section class="task-detail-panel">
        <Transition name="task-detail-switch" mode="out-in">
          <div v-if="selectedTask" :key="selectedTask.id" class="task-detail-content">
            <div class="task-summary-grid">
              <article>
                <span>全部任务</span>
                <strong>{{ tasks.length }}</strong>
              </article>
              <article>
                <span>进行中</span>
                <strong>{{ runningCount }}</strong>
              </article>
              <article>
                <span>已完成</span>
                <strong>{{ completedCount }}</strong>
              </article>
              <article>
                <span>失败</span>
                <strong>{{ failedCount }}</strong>
              </article>
            </div>

            <article class="task-detail-card">
              <div class="task-detail-head">
                <div class="task-agent">
                  <img :src="getAgent(selectedTask).avatar" :alt="getAgent(selectedTask).name" />
                  <span>
                    <small>{{ selectedTask.agentName || getAgent(selectedTask).name }}</small>
                    <strong>{{ selectedTask.title }}</strong>
                  </span>
                </div>
                <span class="task-status" :class="toneClass(selectedTask.status)">{{ statusText(selectedTask.status) }}</span>
              </div>

              <div class="task-progress">
                <span :style="{ width: `${selectedTask.progress}%` }"></span>
              </div>

              <dl class="task-meta">
                <div>
                  <dt>来源</dt>
                  <dd>{{ selectedTask.source === 'chat' ? '小思对话' : selectedTask.source }}</dd>
                </div>
                <div>
                  <dt>创建时间</dt>
                  <dd>{{ formatTime(selectedTask.createdAt) }}</dd>
                </div>
                <div>
                  <dt>更新时间</dt>
                  <dd>{{ formatTime(selectedTask.updatedAt) }}</dd>
                </div>
              </dl>

              <section class="task-block">
                <h2>任务输入</h2>
                <div class="task-markdown markdown-body" v-html="renderMarkdown(selectedTask.prompt || '暂无输入内容')"></div>
              </section>

              <section class="task-block">
                <h2>任务结果</h2>
                <div
                  class="task-markdown markdown-body"
                  v-html="renderMarkdown(selectedTask.result || (selectedTask.status === taskStatuses.running ? '小思正在处理，完成后会自动同步到这里。' : '暂无结果'))"
                ></div>
              </section>

              <div class="task-actions">
                <button v-if="selectedTask.status !== taskStatuses.completed" type="button" class="complete-button" @click="completeTask(selectedTask)">
                  标记完成
                </button>
                <button type="button" class="delete-button" @click="removeTask(selectedTask)">删除任务</button>
                <a class="outline-button" href="#/chat">继续对话</a>
              </div>
            </article>
          </div>

          <div v-else key="empty" class="empty-detail">
            <div class="agent-stack">
              <img src="/assets/avatars/market-analyst.png" alt="市场顾问" />
              <img src="/assets/avatars/creative-director.png" alt="创意总监" />
              <img src="/assets/avatars/social-manager.png" alt="社媒管家" />
            </div>
            <h2>还没有任务</h2>
            <p>在小思页面发起一次对话，任务会自动同步到这里用于展示。</p>
            <a class="chat-link chat-link--large" href="#/chat">去找小思</a>
          </div>
        </Transition>

        <button v-if="tasks.length" type="button" class="clear-finished" @click="clearFinishedTasks">
          清理已结束任务
        </button>
      </section>
    </section>
  </main>
</template>

<style scoped>
.tasks-page {
  flex: 1;
  min-width: 0;
  min-height: 100dvh;
  margin-left: 68px;
  color: #111827;
  background:
    radial-gradient(circle at 18% 4%, rgba(79, 70, 229, 0.12), transparent 34%),
    linear-gradient(135deg, #f8fafc 0%, #f6f5fc 54%, #ecfeff 100%);
}

.tasks-topbar {
  position: sticky;
  top: var(--promo-banner-h, 0px);
  z-index: 20;
  display: flex;
  min-height: var(--header-height, 56px);
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 28px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(255, 255, 255, 0.74);
  backdrop-filter: blur(18px);
}

.tasks-eyebrow {
  margin: 0 0 4px;
  color: #4f46e5;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.tasks-topbar h1 {
  margin: 0;
  font-size: 22px;
  letter-spacing: -0.04em;
}

.chat-link,
.outline-button {
  display: inline-flex;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  padding: 0 14px;
  border: 1px solid rgba(79, 70, 229, 0.18);
  border-radius: 999px;
  color: #4f46e5;
  background: rgba(255, 255, 255, 0.76);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.tasks-shell {
  display: grid;
  grid-template-columns: minmax(320px, 420px) minmax(0, 1fr);
  gap: 18px;
  height: calc(100dvh - var(--header-height, 56px));
  padding: 20px;
}

.task-list-panel,
.task-detail-panel {
  overflow: hidden;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

.task-list-panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.task-search {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px;
  padding: 0 12px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.82);
}

.task-search svg {
  width: 15px;
  height: 15px;
  color: #94a3b8;
}

.task-search input {
  width: 100%;
  height: 40px;
  border: 0;
  outline: none;
  background: transparent;
  color: #0f172a;
}

.task-tabs {
  position: relative;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px;
  padding: 0 16px 12px;
}

.task-tab-indicator {
  position: absolute;
  top: 0;
  left: 16px;
  width: calc((100% - 32px - (var(--task-tab-count, 4) - 1) * 6px) / var(--task-tab-count, 4));
  height: 38px;
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(238, 242, 255, 0.92)),
    rgba(79, 70, 229, 0.1);
  box-shadow:
    0 10px 24px rgba(79, 70, 229, 0.12),
    inset 0 0 0 1px rgba(79, 70, 229, 0.14);
  transform: translateX(calc(var(--active-tab-index, 0) * (100% + 6px)));
  transition:
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1),
    width 220ms ease,
    box-shadow 220ms ease;
  pointer-events: none;
}

.task-tabs button {
  position: relative;
  z-index: 1;
  min-height: 38px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transform: translateY(0);
  transition:
    color 180ms ease,
    transform 180ms ease,
    background 180ms ease;
}

.task-tabs button:hover {
  color: #4338ca;
  background: rgba(255, 255, 255, 0.48);
  transform: translateY(-1px);
}

.task-tab-count {
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  margin-left: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.07);
  font-size: 11px;
  transition:
    color 180ms ease,
    background 180ms ease,
    transform 180ms ease;
}

.task-tabs .task-tab--active {
  color: #4f46e5;
}

.task-tabs .task-tab--active .task-tab-count {
  color: #fff;
  background: #4f46e5;
  transform: scale(1.04);
}

.task-list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 0 10px 14px;
}

.task-list-switch-enter-active,
.task-list-switch-leave-active {
  transition:
    opacity 220ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 220ms ease;
}

.task-list-switch-move {
  transition: transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.task-list-switch-enter-from {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(10px) scale(0.98);
}

.task-list-switch-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(-8px) scale(0.985);
}

.task-list-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 11px;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;
}

.task-list-item:hover,
.task-list-item--active {
  border-color: rgba(79, 70, 229, 0.18);
  background: rgba(255, 255, 255, 0.78);
}

.task-list-item:hover {
  transform: translateY(-1px);
}

.task-list-item--active {
  box-shadow: 0 12px 28px rgba(79, 70, 229, 0.1);
}

.task-list-item img,
.task-agent img,
.agent-stack img {
  object-fit: cover;
  object-position: top;
}

.task-list-item img {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 15px;
}

.task-list-copy {
  min-width: 0;
  flex: 1;
}

.task-list-copy strong,
.task-list-copy small {
  display: block;
}

.task-list-copy strong {
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-list-copy small {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.task-dot {
  width: 10px;
  height: 10px;
  flex: 0 0 10px;
  border-radius: 999px;
}

.task-detail-panel {
  position: relative;
  min-width: 0;
  overflow-y: auto;
  padding: 18px;
}

.task-detail-content {
  min-width: 0;
}

.task-detail-switch-enter-active,
.task-detail-switch-leave-active {
  transition:
    opacity 220ms ease,
    filter 220ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.task-detail-switch-enter-from {
  opacity: 0;
  filter: blur(6px);
  transform: translateX(14px) translateY(6px) scale(0.992);
}

.task-detail-switch-leave-to {
  opacity: 0;
  filter: blur(5px);
  transform: translateX(-10px) translateY(-4px) scale(0.996);
}

.task-detail-switch-enter-active .task-summary-grid article,
.task-detail-switch-enter-active .task-detail-card {
  animation: task-detail-rise 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.task-detail-switch-enter-active .task-summary-grid article:nth-child(2) {
  animation-delay: 35ms;
}

.task-detail-switch-enter-active .task-summary-grid article:nth-child(3) {
  animation-delay: 70ms;
}

.task-detail-switch-enter-active .task-summary-grid article:nth-child(4) {
  animation-delay: 105ms;
}

.task-detail-switch-enter-active .task-detail-card {
  animation-delay: 95ms;
}

.task-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.task-summary-grid article {
  padding: 15px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.74);
}

.task-summary-grid span {
  display: block;
  color: #64748b;
  font-size: 12px;
}

.task-summary-grid strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 28px;
  letter-spacing: -0.05em;
}

.task-detail-card {
  padding: 20px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.78);
}

.task-detail-head,
.task-agent,
.task-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-detail-head {
  justify-content: space-between;
  margin-bottom: 16px;
}

.task-agent {
  min-width: 0;
}

.task-agent img {
  width: 52px;
  height: 52px;
  flex: 0 0 52px;
  border-radius: 18px;
}

.task-agent small,
.task-agent strong {
  display: block;
}

.task-agent small {
  color: #64748b;
  font-size: 12px;
}

.task-agent strong {
  margin-top: 4px;
  color: #0f172a;
  font-size: clamp(18px, 2.6vw, 28px);
  letter-spacing: -0.04em;
}

.task-status {
  padding: 7px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.task-status--amber {
  color: #92400e;
  background: #fef3c7;
}

.task-status--emerald {
  color: #047857;
  background: #d1fae5;
}

.task-status--red {
  color: #b91c1c;
  background: #fee2e2;
}

.task-progress {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.task-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #4f46e5, #06b6d4);
  transition: width 240ms ease;
}

.task-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.task-meta div {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
}

.task-meta dt {
  color: #64748b;
  font-size: 12px;
}

.task-meta dd {
  margin: 5px 0 0;
  color: #0f172a;
  font-size: 13px;
  font-weight: 800;
}

.task-block {
  margin-top: 16px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(248, 250, 252, 0.88);
}

.task-block h2 {
  margin: 0 0 8px;
  color: #0f172a;
  font-size: 14px;
}

.task-markdown {
  margin: 0;
  color: #334155;
  font-size: 14px;
  line-height: 1.8;
}

.task-actions {
  flex-wrap: wrap;
  margin-top: 18px;
}

.complete-button,
.delete-button,
.clear-finished {
  min-height: 38px;
  border: 0;
  border-radius: 999px;
  padding: 0 15px;
  font-weight: 800;
  cursor: pointer;
}

.complete-button {
  color: #047857;
  background: #d1fae5;
}

.delete-button {
  color: #b91c1c;
  background: #fee2e2;
}

.empty-list,
.empty-detail {
  display: grid;
  place-items: center;
  color: #64748b;
  text-align: center;
}

.empty-list {
  min-height: 240px;
  padding: 24px;
}

.empty-list p,
.empty-detail h2 {
  margin: 0;
  color: #0f172a;
  font-weight: 800;
}

.empty-list span,
.empty-detail p {
  margin-top: 8px;
  font-size: 13px;
}

.empty-detail {
  min-height: calc(100% - 60px);
  align-content: center;
  padding: 40px;
}

.agent-stack {
  display: flex;
  justify-content: center;
  margin-bottom: 18px;
}

.agent-stack img {
  width: 54px;
  height: 54px;
  margin-left: -10px;
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
}

.agent-stack img:first-child {
  margin-left: 0;
}

.chat-link--large {
  margin-top: 16px;
}

.clear-finished {
  position: sticky;
  bottom: 0;
  margin-top: 16px;
  color: #475569;
  background: rgba(255, 255, 255, 0.86);
}

@keyframes task-detail-rise {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 980px) {
  .tasks-page {
    margin-left: 0;
  }

  .tasks-shell {
    grid-template-columns: 1fr;
    height: auto;
  }

  .task-detail-panel {
    min-height: 560px;
  }
}

@media (max-width: 680px) {
  .tasks-topbar {
    padding: 12px 16px;
  }

  .tasks-shell {
    padding: 12px;
  }

  .task-tabs,
  .task-summary-grid,
  .task-meta {
    grid-template-columns: 1fr 1fr;
  }

  .task-detail-head {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-tab-indicator,
  .task-tabs button,
  .task-tab-count,
  .task-list-switch-enter-active,
  .task-list-switch-leave-active,
  .task-list-switch-move,
  .task-detail-switch-enter-active,
  .task-detail-switch-leave-active,
  .task-list-item {
    transition-duration: 1ms;
    animation-duration: 1ms;
  }

  .task-list-switch-enter-from,
  .task-list-switch-leave-to,
  .task-detail-switch-enter-from,
  .task-detail-switch-leave-to,
  .task-list-item:hover {
    filter: none;
    transform: none;
  }
}
</style>
