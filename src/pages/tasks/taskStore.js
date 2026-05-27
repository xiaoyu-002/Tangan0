export const TASK_STORE_KEY = 'chj-ai-tasks-v1'

export const taskStatuses = {
  running: 'running',
  completed: 'completed',
  failed: 'failed',
}

export const statusLabels = {
  all: '全部',
  running: '进行中',
  completed: '已完成',
  failed: '失败',
}

export const statusTones = {
  running: 'amber',
  completed: 'emerald',
  failed: 'red',
}

const isBrowser = () => typeof window !== 'undefined' && Boolean(window.localStorage)

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizeTask = (task) => {
  const status = Object.values(taskStatuses).includes(task?.status) ? task.status : taskStatuses.running
  const now = Date.now()

  return {
    id: task?.id || createId(),
    title: String(task?.title || '未命名任务').trim() || '未命名任务',
    prompt: String(task?.prompt || ''),
    result: String(task?.result || ''),
    agentId: String(task?.agentId || 'market-analyst'),
    agentName: String(task?.agentName || '小思'),
    agentAvatar: String(task?.agentAvatar || '/assets/avatars/market-analyst.png'),
    status,
    progress: Number.isFinite(task?.progress) ? task.progress : status === taskStatuses.completed ? 100 : status === taskStatuses.failed ? 100 : 35,
    source: String(task?.source || 'chat'),
    createdAt: Number.isFinite(task?.createdAt) ? task.createdAt : now,
    updatedAt: Number.isFinite(task?.updatedAt) ? task.updatedAt : now,
    completedAt: Number.isFinite(task?.completedAt) ? task.completedAt : null,
    failedAt: Number.isFinite(task?.failedAt) ? task.failedAt : null,
  }
}

export const loadTasks = () => {
  if (!isBrowser()) return []

  try {
    const raw = window.localStorage.getItem(TASK_STORE_KEY)
    const tasks = raw ? JSON.parse(raw) : []
    return Array.isArray(tasks)
      ? tasks.map(normalizeTask).sort((left, right) => right.createdAt - left.createdAt)
      : []
  } catch (error) {
    console.warn('Failed to load local tasks', error)
    return []
  }
}

export const saveTasks = (tasks) => {
  if (!isBrowser()) return []

  const normalizedTasks = Array.isArray(tasks)
    ? tasks.map(normalizeTask).sort((left, right) => right.createdAt - left.createdAt).slice(0, 80)
    : []

  window.localStorage.setItem(TASK_STORE_KEY, JSON.stringify(normalizedTasks))
  window.dispatchEvent(new CustomEvent('chj-tasks:updated', { detail: normalizedTasks }))
  return normalizedTasks
}

export const createTask = (task) => {
  const nextTask = normalizeTask(task)
  saveTasks([nextTask, ...loadTasks().filter((item) => item.id !== nextTask.id)])
  return nextTask
}

export const updateTask = (id, patch = {}) => {
  const tasks = loadTasks()
  const target = tasks.find((task) => task.id === id)
  if (!target) return null

  const nextTask = normalizeTask({
    ...target,
    ...patch,
    id,
    updatedAt: Date.now(),
  })

  saveTasks(tasks.map((task) => (task.id === id ? nextTask : task)))
  return nextTask
}

export const deleteTask = (id) => {
  saveTasks(loadTasks().filter((task) => task.id !== id))
}

export const clearTasks = () => {
  saveTasks([])
}
