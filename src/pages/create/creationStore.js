export const CREATE_CREATIONS_STORAGE_KEY = 'chj:create:creations:v1'
export const CREATE_CREATIONS_EVENT = 'chj:create:creations-updated'
export const MAX_LOCAL_CREATIONS = 80

export const creationTypes = [
  { value: 'script', label: '脚本' },
  { value: 'image', label: '图片' },
  { value: 'video', label: '视频' },
]

const trimString = (value) => String(value || '').trim()

const safeStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizeAsset = (asset) => {
  if (!asset) return null
  const url = trimString(asset.url || asset.src)
  if (!url) return null

  return {
    type: ['image', 'video', 'file'].includes(asset.type) ? asset.type : 'file',
    url,
    label: trimString(asset.label),
  }
}

const normalizeCreation = (item) => {
  if (!item || typeof item !== 'object') return null

  const type = creationTypes.some((typeItem) => typeItem.value === item.type) ? item.type : 'script'
  const createdAt = Number(item.createdAt || item.updatedAt || Date.now())
  const assets = Array.isArray(item.assets)
    ? item.assets.map(normalizeAsset).filter(Boolean).slice(0, 12)
    : []

  return {
    id: trimString(item.id) || createId(),
    type,
    title: trimString(item.title) || defaultTitle(type),
    prompt: trimString(item.prompt),
    content: trimString(item.content || item.text),
    text: trimString(item.text || item.content),
    model: trimString(item.model),
    source: trimString(item.source),
    params: item.params && typeof item.params === 'object' ? item.params : {},
    assets,
    createdAt,
    updatedAt: Number(item.updatedAt || createdAt),
  }
}

const defaultTitle = (type) => {
  if (type === 'image') return '图片生成'
  if (type === 'video') return '视频创作'
  return '脚本生成'
}

const pruneForStorage = (items) => {
  const normalized = items
    .map(normalizeCreation)
    .filter(Boolean)
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, MAX_LOCAL_CREATIONS)

  let payload = JSON.stringify(normalized)
  if (payload.length <= 4_500_000) return normalized

  const withoutRawData = normalized.map((item) => ({
    ...item,
    assets: item.assets.filter((asset) => !asset.url.startsWith('data:')),
  }))
  payload = JSON.stringify(withoutRawData)
  if (payload.length <= 4_500_000) return withoutRawData

  return withoutRawData.slice(0, Math.max(8, Math.floor(MAX_LOCAL_CREATIONS / 4)))
}

const writeCreations = (items) => {
  const storage = safeStorage()
  const nextItems = pruneForStorage(items)

  if (storage) {
    try {
      storage.setItem(CREATE_CREATIONS_STORAGE_KEY, JSON.stringify(nextItems))
    } catch {
      const compactItems = nextItems.map((item) => ({
        ...item,
        assets: item.assets.filter((asset) => !asset.url.startsWith('data:')),
      }))
      try {
        storage.setItem(CREATE_CREATIONS_STORAGE_KEY, JSON.stringify(compactItems))
      } catch {
        // Local persistence is best-effort; generation should not fail because storage is full.
      }
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CREATE_CREATIONS_EVENT, { detail: nextItems }))
  }

  return nextItems
}

export const loadCreations = () => {
  const storage = safeStorage()
  if (!storage) return []

  try {
    const items = JSON.parse(storage.getItem(CREATE_CREATIONS_STORAGE_KEY) || '[]')
    return Array.isArray(items)
      ? items.map(normalizeCreation).filter(Boolean).sort((left, right) => right.createdAt - left.createdAt)
      : []
  } catch {
    return []
  }
}

export const makeCreationTitle = (value, fallback = '新的创作') => {
  const source = trimString(value).replace(/\s+/g, ' ')
  if (!source) return fallback
  return source.length > 34 ? `${source.slice(0, 34)}...` : source
}

export const saveCreation = (creation) => {
  const nextCreation = normalizeCreation({
    ...creation,
    id: creation?.id || createId(),
    createdAt: creation?.createdAt || Date.now(),
    updatedAt: Date.now(),
  })

  if (!nextCreation) return null

  const existing = loadCreations().filter((item) => item.id !== nextCreation.id)
  writeCreations([nextCreation, ...existing])
  return nextCreation
}

export const updateCreation = (id, patch) => {
  const targetId = trimString(id)
  if (!targetId) return null

  const items = loadCreations()
  const current = items.find((item) => item.id === targetId)
  if (!current) return null

  const patchValue = typeof patch === 'function' ? patch(current) : patch
  if (!patchValue || typeof patchValue !== 'object') return current

  const nextCreation = normalizeCreation({
    ...current,
    ...patchValue,
    id: current.id,
    createdAt: current.createdAt,
    updatedAt: Date.now(),
    params: {
      ...(current.params || {}),
      ...(patchValue.params || {}),
    },
    assets: Array.isArray(patchValue.assets) ? patchValue.assets : current.assets,
  })

  if (!nextCreation) return null

  writeCreations([nextCreation, ...items.filter((item) => item.id !== targetId)])
  return nextCreation
}

export const deleteCreation = (id) => {
  const targetId = trimString(id)
  if (!targetId) return loadCreations()
  return writeCreations(loadCreations().filter((item) => item.id !== targetId))
}

export const clearCreations = () => writeCreations([])

export const subscribeCreations = (listener) => {
  if (typeof window === 'undefined') return () => {}

  const notify = () => listener(loadCreations())
  const onCustomEvent = (event) => listener(Array.isArray(event.detail) ? event.detail : loadCreations())
  const onStorage = (event) => {
    if (event.key === CREATE_CREATIONS_STORAGE_KEY) notify()
  }

  window.addEventListener(CREATE_CREATIONS_EVENT, onCustomEvent)
  window.addEventListener('storage', onStorage)

  return () => {
    window.removeEventListener(CREATE_CREATIONS_EVENT, onCustomEvent)
    window.removeEventListener('storage', onStorage)
  }
}

export const getCreationTypeLabel = (type) => creationTypes.find((item) => item.value === type)?.label || '创作'
