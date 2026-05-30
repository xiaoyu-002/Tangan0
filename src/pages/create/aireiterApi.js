import { backendUrl } from '../../utils/backendApi'

export const AIREITER_API_BASE_URL = backendUrl('/api/video')
export const AIREITER_SEEDANCE_FAST_MODEL = 'seedance2_fast'
export const TANGAN_VIDEO_DISPLAY_MODEL = 'Tangan-video-v3-flash'
export const AIREITER_DEFAULT_POLL_INTERVAL_MS = 4000
export const AIREITER_MAX_POLL_ATTEMPTS = 120

const trimString = (value) => String(value || '').trim()

export const createAireiterTaskId = () => {
  const suffix = Math.random().toString(36).slice(2, 8)
  return `chj_seedance_${Date.now()}_${suffix}`
}

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

const unwrapAireiterResponse = (payload) => {
  const code = payload?.statusCode ?? payload?.code
  const hasErrorCode = code != null && String(code) !== '200'

  if (payload?.success === false || hasErrorCode) {
    throw new Error(payload?.message || payload?.msg || 'Aireiter 请求失败')
  }

  return payload?.data ?? payload
}

const requestAireiter = async (path, { body, signal }) => {
  const response = await fetch(`${AIREITER_API_BASE_URL}${path}`, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const message = await readErrorBody(response)
    throw new Error(`Aireiter 请求失败：${message}`)
  }

  return unwrapAireiterResponse(await response.json())
}

export const submitSeedanceFastVideo = async ({
  params,
  outTaskId = createAireiterTaskId(),
  signal,
}) => {
  if (!trimString(params?.prompt)) throw new Error('请填写视频生成提示词')

  return requestAireiter('/submit', {
    signal,
    body: {
      model: AIREITER_SEEDANCE_FAST_MODEL,
      params,
      out_task_id: outTaskId,
    },
  })
}

export const queryAireiterTask = async ({ outTaskId, signal }) => {
  const taskId = trimString(outTaskId)
  if (!taskId) throw new Error('缺少任务 ID')

  return requestAireiter('/query', {
    signal,
    body: {
      out_task_id: taskId,
    },
  })
}

const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(new DOMException('Aborted', 'AbortError'))
    return
  }

  const timer = window.setTimeout(resolve, ms)
  const abort = () => {
    window.clearTimeout(timer)
    reject(new DOMException('Aborted', 'AbortError'))
  }

  signal?.addEventListener('abort', abort, { once: true })
})

export const pollAireiterTask = async ({
  outTaskId,
  signal,
  onStatus,
  intervalMs = AIREITER_DEFAULT_POLL_INTERVAL_MS,
  maxAttempts = AIREITER_MAX_POLL_ATTEMPTS,
}) => {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const task = await queryAireiterTask({ outTaskId, signal })
    onStatus?.(task)

    if (task.status === 'completed') return task
    if (task.status === 'failed') {
      throw new Error(task.error?.message || task.error?.code || '视频生成任务失败')
    }

    await wait(intervalMs, signal)
  }

  throw new Error('任务仍在处理中，请稍后使用任务 ID 查询结果。')
}

const outputUrl = (item) => (
  typeof item === 'string'
    ? item
    : item?.url || item?.video_url || item?.output_url || item?.file_url || ''
)

export const extractAireiterVideoResult = (task) => {
  const output = Array.isArray(task?.output) ? task.output : []
  const assets = output
    .map(outputUrl)
    .map(trimString)
    .filter(Boolean)
    .map((url) => ({ type: 'video', url, label: 'Seedance 2.0 Fast 视频' }))

  return {
    assets,
    raw: task,
    text: task?.error?.message || '',
    task,
  }
}
