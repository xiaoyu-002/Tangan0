import {
  demoCreativeSummaries,
  demoCreativeVideos,
  demoCreativeVideosTotal,
} from './createDemoData'
import { backendUrl } from '../../utils/backendApi'

const CACHE_PREFIX = 'chj:create-api:v2:'
const API_RESOURCE_PATH = '/svc/passthrough/entity/tiktok/creative'
const DEFAULT_PROXY_PREFIXES = [backendUrl('/api/chj')]
const PROXY_CACHE_KEY = `${CACHE_PREFIX}active-proxy`
const SESSION_SYNC_KEY = `${CACHE_PREFIX}session-synced`
const CACHE_TTL_MS = 30 * 60 * 1000
const STALE_CACHE_TTL_MS = 24 * 60 * 60 * 1000
const SESSION_CACHE_TTL_MS = Number.POSITIVE_INFINITY
const NETWORK_COOLDOWN_MS = 45 * 1000
const PROXY_COOLDOWN_MS = 2 * 60 * 1000
const MAX_CACHE_ENTRIES = 80
const DEMO_RESPONSE_DELAY_MS = 560
const inFlightRequests = new Map()
const memoryCache = new Map()
const blockedProxyUntil = new Map()
let createSessionCachePromise

const TIME_FILTER_KEY = 'tiktok_creative_search_launch_time'
const COMMERCIAL_VIDEO_FILTER = {
  filter_key: 'tiktok_creative_search_commercial_video',
  quick_option_name: 'tiktok_creative_search_commercial_video_1',
}
const AI_VIDEO_FILTER = {
  filter_key: 'tiktok_creative_search_is_aigc_video',
  quick_option_name: 'tiktok_creative_search_is_aigc_video_1',
}

const cloneDemoData = (value) => JSON.parse(JSON.stringify(value))

const waitForDemoData = (signal, delay = DEMO_RESPONSE_DELAY_MS) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(new DOMException('Aborted', 'AbortError'))
    return
  }

  const timer = window.setTimeout(resolve, delay)
  const abort = () => {
    window.clearTimeout(timer)
    reject(new DOMException('Aborted', 'AbortError'))
  }

  signal?.addEventListener('abort', abort, { once: true })
})

const matchesDemoVideo = (video, keyword) => {
  const query = String(keyword || '').trim().toLowerCase()
  if (!query) return true

  return [
    video.description,
    video.creatorName,
    video.creatorUid,
    video.countryCode,
    ...(video.tags || []),
  ].join(' ').toLowerCase().includes(query)
}

const rotateDemoVideos = (seed = '') => {
  const source = cloneDemoData(demoCreativeVideos)
  if (!source.length) return source

  const offset = Math.abs(String(seed).split('').reduce((total, char) => total + char.charCodeAt(0), 0)) % source.length
  return [...source.slice(offset), ...source.slice(0, offset)]
}

export const createCountries = [
  { code: 'US', label: '美国', flag: '🇺🇸' },
  { code: 'GB', label: '英国', flag: '🇬🇧' },
  { code: 'DE', label: '德国', flag: '🇩🇪' },
  { code: 'JP', label: '日本', flag: '🇯🇵' },
]

export const createTimeRanges = [
  { value: '7d', label: '7 天' },
  { value: '14d', label: '14 天' },
  { value: '30d', label: '30 天' },
]

export const CREATE_REFRESH_COOLDOWN_SECONDS = 2

export const creativeKinds = {
  hook: {
    summaryPath: '/hook/summary',
    videoPath: '/hook/video',
    listKey: 'hook_list',
    typeFilter: 'tiktok_creative_search_hook_type',
    optionPrefix: 'tiktok_creative_search_hook_type_',
    summaryKey: 'hook-summary',
    videoKey: 'hook-videos',
    labels: {
      question: '问题式开场',
      misconception: '反常识开场',
      direct_offer: '直接利益开场',
      conflict: '冲突反差开场',
      proof_first: '结果先行开场',
      scene: '场景代入开场',
      fear: '痛点警示开场',
    },
  },
  angle: {
    summaryPath: '/angle/summary',
    videoPath: '/angle/video',
    listKey: 'angle_list',
    typeFilter: 'tiktok_creative_search_angle_type',
    optionPrefix: 'tiktok_creative_search_angle_type_',
    summaryKey: 'angle-summary',
    videoKey: 'angle-videos',
    labels: {
      convenience: '便捷省心',
      proof: '效果证明',
      innovation: '新奇功能',
      emotional: '情绪共鸣',
      value: '高性价比',
      safety: '安心可靠',
      gift: '送礼场景',
      lifestyle: '生活方式',
    },
  },
  formula: {
    summaryPath: '/formula/summary',
    videoPath: '/formula/video',
    listKey: 'formula_list',
    typeFilter: 'tiktok_creative_search_formula_type',
    optionPrefix: 'tiktok_creative_search_formula_type_',
    summaryKey: 'template-summary',
    videoKey: 'template-videos',
    labels: {
      pov_first_person: '第一人称 POV',
      grwm_product: 'GRWM 种草',
      split_screen_compare: '分屏对比',
      unboxing_asmr: '开箱 ASMR',
      day_in_life_vlog: '日常 Vlog',
      tutorial_demo: '教程演示',
      testimonial: '用户证言',
    },
  },
  moneyShot: {
    summaryPath: '/money_shot/summary',
    videoPath: '/money_shot/video',
    listKey: 'money_shot_list',
    typeFilter: 'tiktok_creative_search_money_shot_type',
    optionPrefix: 'tiktok_creative_search_money_shot_type_',
    summaryKey: 'money-shot-summary',
    videoKey: 'money-shot-videos',
    labels: {
      hands_on_demo: '上手演示',
      before_after: '前后对比',
      close_up_texture: '细节特写',
      result_reveal: '结果揭晓',
      use_case_scene: '使用场景',
      problem_solution: '痛点解决',
    },
  },
}

const withRegionHeaders = (countryCode, extra = {}) => ({
  ...extra,
  'x-biyi-data-region': countryCode || 'US',
})

const createJsonHeaders = (countryCode) => withRegionHeaders(countryCode, {
  'Content-Type': 'application/json',
})

const safeStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    const storage = window.localStorage
    const testKey = `${CACHE_PREFIX}test`
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

const safeSessionStorage = () => {
  try {
    if (typeof window === 'undefined') return null
    const storage = window.sessionStorage
    const testKey = `${CACHE_PREFIX}session-test`
    storage.setItem(testKey, '1')
    storage.removeItem(testKey)
    return storage
  } catch {
    return null
  }
}

const hasSyncedThisSession = () => safeSessionStorage()?.getItem(SESSION_SYNC_KEY) === '1'

const markSyncedThisSession = () => {
  const storage = safeSessionStorage()
  if (!storage) return

  try {
    storage.setItem(SESSION_SYNC_KEY, '1')
  } catch {
    // Session sync is an optimization; local cache still works without it.
  }
}

const normalizeProxyPrefix = (value) => {
  const trimmed = String(value || '').trim().replace(/\/+$/, '')
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

const configuredProxyPrefixes = () => {
  const envValue = import.meta.env?.VITE_CHJ_PROXY_PREFIXES || ''
  const prefixes = String(envValue)
    .split(',')
    .map(normalizeProxyPrefix)
    .filter((prefix) => /(^|\/)api\/chj$/i.test(prefix))
    .filter(Boolean)

  return prefixes.length ? prefixes : DEFAULT_PROXY_PREFIXES
}

const readPreferredProxyPrefix = () => {
  const storage = safeStorage()
  if (!storage) return ''
  return normalizeProxyPrefix(storage.getItem(PROXY_CACHE_KEY))
}

const rememberProxyPrefix = (prefix) => {
  blockedProxyUntil.delete(prefix)

  const storage = safeStorage()
  if (!storage) return

  try {
    storage.setItem(PROXY_CACHE_KEY, prefix)
  } catch {
    // Preferred proxy is only a hint for the next request.
  }
}

const proxyPrefixes = () => {
  const prefixes = configuredProxyPrefixes()
  const preferred = readPreferredProxyPrefix()
  const ordered = preferred ? [preferred, ...prefixes] : prefixes
  return [...new Set(ordered)]
}

const isProxyCoolingDown = (prefix) => (blockedProxyUntil.get(prefix) || 0) > Date.now()

const markProxyCoolingDown = (prefix) => {
  blockedProxyUntil.set(prefix, Date.now() + PROXY_COOLDOWN_MS)
}

const availableProxyPrefixes = () => {
  const prefixes = proxyPrefixes()
  const available = prefixes.filter((prefix) => !isProxyCoolingDown(prefix))
  return available.length ? available : prefixes
}

const proxyUrl = (prefix, path) => `${prefix}${API_RESOURCE_PATH}${path}`

const hashString = (value) => {
  let hash = 5381
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(index)
  }
  return (hash >>> 0).toString(36)
}

const normalizeHeaders = (headers = {}) => {
  if (typeof headers.get === 'function') {
    return {
      region: headers.get('x-biyi-data-region') || '',
      contentType: headers.get('Content-Type') || headers.get('content-type') || '',
    }
  }

  return {
    region: headers['x-biyi-data-region'] || headers['X-Biyi-Data-Region'] || '',
    contentType: headers['Content-Type'] || headers['content-type'] || '',
  }
}

const requestSignature = (path, options = {}) => JSON.stringify({
  path,
  method: options.method || 'GET',
  ...normalizeHeaders(options.headers),
  body: options.body || '',
})

const requestSignatureFor = (path, options = {}) => requestSignature(path, options)

const cacheKeys = (signature) => {
  const hash = hashString(signature)
  return {
    dataKey: `${CACHE_PREFIX}data:${hash}`,
    lastKey: `${CACHE_PREFIX}last:${hash}`,
  }
}

const readRecord = (dataKey, signature, maxAge) => {
  const now = Date.now()
  const memoryRecord = memoryCache.get(dataKey)

  if (memoryRecord?.signature === signature && now - memoryRecord.savedAt <= maxAge) {
    return memoryRecord
  }

  const storage = safeStorage()
  if (!storage) return null

  try {
    const record = JSON.parse(storage.getItem(dataKey) || 'null')
    if (!record || record.signature !== signature || now - record.savedAt > maxAge) return null
    memoryCache.set(dataKey, record)
    return record
  } catch {
    storage.removeItem(dataKey)
    return null
  }
}

const writeRecord = (dataKey, signature, data) => {
  const record = {
    signature,
    savedAt: Date.now(),
    data,
  }
  memoryCache.set(dataKey, record)

  const storage = safeStorage()
  if (!storage) return

  try {
    storage.setItem(dataKey, JSON.stringify(record))
    pruneCache(storage)
  } catch {
    pruneCache(storage, true)
    try {
      storage.setItem(dataKey, JSON.stringify(record))
    } catch {
      // localStorage may be disabled or full. Memory cache still protects this session.
    }
  }
}

const pruneCache = (storage, force = false) => {
  try {
    const records = []
    const now = Date.now()

    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index)
      if (!key?.startsWith(`${CACHE_PREFIX}data:`)) continue

      try {
        const record = JSON.parse(storage.getItem(key) || 'null')
        if (!record?.savedAt || force || now - record.savedAt > STALE_CACHE_TTL_MS) {
          storage.removeItem(key)
          memoryCache.delete(key)
        } else {
          records.push({ key, savedAt: record.savedAt })
        }
      } catch {
        storage.removeItem(key)
        memoryCache.delete(key)
      }
    }

    records
      .sort((left, right) => left.savedAt - right.savedAt)
      .slice(0, Math.max(0, records.length - MAX_CACHE_ENTRIES))
      .forEach(({ key }) => {
        storage.removeItem(key)
        memoryCache.delete(key)
      })
  } catch {
    // Best-effort cache pruning only.
  }
}

const readCachedResponse = (path, options = {}, maxAge = SESSION_CACHE_TTL_MS) => {
  const signature = requestSignatureFor(path, options)
  const { dataKey } = cacheKeys(signature)
  return readRecord(dataKey, signature, maxAge)?.data || null
}

const readLastNetworkAt = (lastKey) => {
  const storage = safeStorage()
  if (!storage) return 0
  return Number(storage.getItem(lastKey) || 0)
}

const writeLastNetworkAt = (lastKey) => {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(lastKey, String(Date.now()))
  } catch {
    // Last-request timestamps are an optimization, not critical state.
  }
}

const shouldRetryWithNextProxy = (error) => {
  const status = Number(error?.status || 0)
  if ([403, 407, 408, 425, 429, 500, 502, 503, 504].includes(status)) return true

  const message = String(error?.message || '')
  return /failed to fetch|networkerror|load failed|blocked|cors|err_|timeout|usage limit|rate limit|too many requests/i.test(message)
}

const responseError = (response, data) => {
  const error = new Error(data?.base_resp?.msg || `数据加载失败：${response.status}`)
  error.status = response.status
  return error
}

const dataError = (data) => {
  const error = new Error(data?.base_resp?.msg || '数据返回异常')
  error.code = data?.base_resp?.code
  return error
}

const fetchWithAutomaticProxy = async (path, options = {}) => {
  const prefixes = availableProxyPrefixes()
  let lastError

  for (const prefix of prefixes) {
    try {
      const response = await fetch(proxyUrl(prefix, path), options)
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        const error = responseError(response, data)
        if (prefixes.length > 1 && shouldRetryWithNextProxy(error)) {
          markProxyCoolingDown(prefix)
          lastError = error
          continue
        }
        throw error
      }

      if (data?.base_resp && data.base_resp.code !== 0) {
        const error = dataError(data)
        if (prefixes.length > 1 && shouldRetryWithNextProxy(error)) {
          markProxyCoolingDown(prefix)
          lastError = error
          continue
        }
        throw error
      }

      rememberProxyPrefix(prefix)
      return data
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      lastError = error

      if (prefixes.length <= 1 || !shouldRetryWithNextProxy(error)) throw error
      markProxyCoolingDown(prefix)
    }
  }

  throw lastError || new Error('数据加载失败')
}

const normalizeApiError = (error) => {
  const message = error?.message || '数据加载失败'
  if (/out of usage limit/i.test(message)) {
    return new Error('数据源繁忙，已暂时降频；有本地缓存时会自动展示缓存数据。')
  }
  return error
}

const request = async (path, options = {}, {
  allowNetwork = !hasSyncedThisSession(),
  ignoreCooldown = false,
} = {}) => {
  const signature = requestSignature(path, options)
  const { dataKey, lastKey } = cacheKeys(signature)
  const freshRecord = readRecord(
    dataKey,
    signature,
    hasSyncedThisSession() ? SESSION_CACHE_TTL_MS : CACHE_TTL_MS,
  )

  if (freshRecord) return freshRecord.data

  const staleRecord = readRecord(dataKey, signature, STALE_CACHE_TTL_MS)
  const inFlight = inFlightRequests.get(dataKey)
  if (inFlight) return inFlight

  if (!allowNetwork) {
    if (staleRecord) return staleRecord.data
    throw new Error('本地暂无缓存数据，请重启浏览器后重新同步。')
  }

  const nextAllowedAt = readLastNetworkAt(lastKey) + NETWORK_COOLDOWN_MS
  const now = Date.now()

  if (!ignoreCooldown && now < nextAllowedAt) {
    if (staleRecord) return staleRecord.data
    throw new Error(`刷新太频繁，${Math.ceil((nextAllowedAt - now) / 1000)} 秒后再试。`)
  }

  const promise = (async () => {
    writeLastNetworkAt(lastKey)

    try {
      const data = await fetchWithAutomaticProxy(path, options)
      writeRecord(dataKey, signature, data)
      return data
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (staleRecord) return staleRecord.data
      throw normalizeApiError(error)
    }
  })()

  inFlightRequests.set(dataKey, promise)
  try {
    return await promise
  } finally {
    inFlightRequests.delete(dataKey)
  }
}

const timeFilter = (timeRange = '7d') => ({
  filter_key: TIME_FILTER_KEY,
  quick_option_name: `tiktok_creative_search_launch_time_last_${String(timeRange).replace('d', '')}_days`,
})

const optionalCategoryFilter = (category) => (
  category && category !== 'all'
    ? [{ filter_key: 'tiktok_creative_search_category', quick_option_name: category }]
    : []
)

const compactNumber = (value) => {
  const number = Number(value || 0)
  if (number >= 100000000) return `${(number / 100000000).toFixed(1)}亿`
  if (number >= 10000) return `${(number / 10000).toFixed(1)}万`
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`
  return number.toLocaleString()
}

const formatCurrency = (currency) => {
  const value = typeof currency === 'object' ? Number(currency?.value || 0) : Number(currency || 0)
  if (!value) return '$0'
  if (value >= 10000) return `$${(value / 10000).toFixed(1)}万`
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`
  return `$${value.toFixed(value >= 100 ? 0 : 1)}`
}

const stripHighlight = (text = '') => (
  String(text)
    .replace(/<highlight[^>]*>/g, '')
    .replace(/<\/highlight>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
)

const humanizeType = (value = '') => (
  String(value)
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
)

const imageUrl = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  return value.url || value.thumb_url || ''
}

const fieldValue = (entity, key) => entity?.field_list?.find((field) => field.field_key === key)?.value

const fieldText = (entity, key, fallback = '') => {
  const value = fieldValue(entity, key)
  if (value == null) return fallback
  if (typeof value === 'object') return value.value ?? fallback
  return value
}

const entitySearchText = (entity) => {
  const tags = fieldValue(entity, 'tiktok_creative_search_content_tag_v2') || []
  return [
    fieldText(entity, 'tiktok_creative_search_video_id'),
    fieldText(entity, 'tiktok_creative_search_video_desc'),
    fieldText(entity, 'tiktok_creative_search_author_nickname'),
    fieldText(entity, 'tiktok_creative_search_author_unique_id'),
    ...(Array.isArray(tags) ? tags : []),
  ].join(' ').toLowerCase()
}

const convertSummaryItem = (item, kind) => {
  const config = creativeKinds[kind]
  const id = item.type
  const avgGmv = formatCurrency(item.avg_gmv)

  return {
    id,
    type: id,
    name: config.labels[id] || humanizeType(id),
    strategy: item.strategy || '',
    sharePercent: `${((item.usage_percent || 0) * 100).toFixed(1)}%`,
    shareValue: (item.usage_percent || 0) * 100,
    avgGmv,
    avgViews: compactNumber(item.avg_views),
    videoCount: item.video_count || 0,
    description: stripHighlight(item.description_zh || item.description_en || ''),
    categories: item.categories || [],
  }
}

export const convertCreativeVideo = (entity) => {
  const gmv30d = fieldValue(entity, 'tiktok_creative_search_video_30d_gmv')
  const launchTime = fieldValue(entity, 'tiktok_creative_search_video_launch_time')
  const date = fieldText(entity, 'tiktok_creative_search_video_date')
  const durationMs = Number(fieldValue(entity, 'tiktok_creative_search_video_duration') || 0)

  return {
    id: entity.entity_id,
    videoId: fieldText(entity, 'tiktok_creative_search_video_id', entity.entity_id),
    cover: imageUrl(fieldValue(entity, 'tiktok_creative_search_video_cover')),
    videoUri: fieldText(entity, 'tiktok_creative_search_video_uri'),
    productImage: imageUrl(fieldValue(entity, 'tiktok_creative_search_product_images')),
    description: fieldText(entity, 'tiktok_creative_search_video_desc', '暂无视频描述'),
    countryCode: String(fieldText(entity, 'tiktok_creative_search_country_code', '')).toUpperCase(),
    creatorName: fieldText(entity, 'tiktok_creative_search_author_nickname', 'TikTok Creator'),
    creatorUid: fieldText(entity, 'tiktok_creative_search_author_unique_id', ''),
    creatorAvatar: imageUrl(fieldValue(entity, 'tiktok_creative_search_user_avatar')),
    followers: compactNumber(fieldValue(entity, 'tiktok_creative_search_follower_cnt')),
    playCount: compactNumber(fieldValue(entity, 'tiktok_creative_search_video_play_count')),
    likeCount: compactNumber(fieldValue(entity, 'tiktok_creative_search_video_like_count')),
    commentCount: compactNumber(fieldValue(entity, 'tiktok_creative_search_video_comment_count')),
    shareCount: compactNumber(fieldValue(entity, 'tiktok_creative_search_video_share_count')),
    gmv30d: formatCurrency(gmv30d),
    gpm30d: formatCurrency(fieldValue(entity, 'tiktok_creative_search_video_30d_gpm')),
    launchDate: date || (launchTime ? new Date(Number(launchTime)).toLocaleDateString('zh-CN') : ''),
    duration: durationMs ? `${Math.round(durationMs / 1000)}s` : '',
    isAiVideo: Boolean(fieldValue(entity, 'tiktok_creative_search_is_aigc_video')),
    tags: fieldValue(entity, 'tiktok_creative_search_content_tag_v2') || [],
  }
}

const creativeSearchRequest = ({
  keyword = '',
  timeRange = '7d',
  countryCode = 'US',
  limit = 20,
  offset = 0,
  aiOnly = false,
  category = 'all',
  sortBy = 'tiktok_creative_search_video_date',
} = {}) => {
  const fieldFilter = [
    aiOnly ? AI_VIDEO_FILTER : COMMERCIAL_VIDEO_FILTER,
    ...optionalCategoryFilter(category),
    timeFilter(timeRange),
  ]

  return {
    path: '/search/list',
    options: {
      method: 'POST',
      headers: createJsonHeaders(countryCode),
      body: JSON.stringify({
        field_filter: fieldFilter,
        limit,
        offset,
        keyword_filter: keyword,
        sort_filter: [{ field_key: sortBy, order: 1 }],
        entity_id_list: [],
        os_key: '',
        ai_keyword_filter: '',
        is_ai_search: false,
      }),
    },
  }
}

const creativeSummaryRequest = (kind, {
  category = 'all',
  timeRange = '7d',
  countryCode = 'US',
} = {}) => {
  const config = creativeKinds[kind]
  if (!config) throw new Error(`未知创意维度：${kind}`)

  return {
    path: config.summaryPath,
    options: {
      method: 'POST',
      headers: createJsonHeaders(countryCode),
      body: JSON.stringify({
        field_filter: [
          ...optionalCategoryFilter(category),
          timeFilter(timeRange),
        ],
      }),
    },
  }
}

const creativeDimensionVideosRequest = (kind, type, {
  category = 'all',
  timeRange = '7d',
  countryCode = 'US',
  limit = 10,
  offset = 0,
} = {}) => {
  const config = creativeKinds[kind]
  if (!config) throw new Error(`未知创意维度：${kind}`)

  return {
    path: config.videoPath,
    options: {
      method: 'POST',
      headers: createJsonHeaders(countryCode),
      body: JSON.stringify({
        field_filter: [
          COMMERCIAL_VIDEO_FILTER,
          { filter_key: config.typeFilter, quick_option_name: `${config.optionPrefix}${type}` },
          ...optionalCategoryFilter(category),
          timeFilter(timeRange),
        ],
        limit,
        offset,
        keyword_filter: '',
        sort_filter: [{ field_key: 'tiktok_creative_search_video_date', order: 1 }],
        entity_id_list: [],
        os_key: '',
        ai_keyword_filter: '',
        is_ai_search: false,
        time_range: timeRange,
      }),
    },
  }
}

const addSignal = (options, signal) => (signal ? { ...options, signal } : options)

const requestOnceForCache = async ({ path, options }) => {
  await request(path, options, { allowNetwork: true, ignoreCooldown: true })
}

const fetchSummaryRaw = async (kind, params) => {
  const { path, options } = creativeSummaryRequest(kind, params)
  return request(path, options, { allowNetwork: false })
}

const preloadDimensionVideosForSummary = async (kind, params) => {
  const config = creativeKinds[kind]
  const summary = await fetchSummaryRaw(kind, params).catch(() => null)
  const types = (summary?.[config.listKey] || []).map((item) => item.type).filter(Boolean)

  await Promise.allSettled(types.map((type) => (
    requestOnceForCache(creativeDimensionVideosRequest(kind, type, {
      ...params,
      limit: 8,
    }))
  )))
}

const createPreloadTasks = () => {
  const tasks = []
  const baseParamsList = createCountries.flatMap(({ code }) => (
    createTimeRanges.map(({ value }) => ({
      countryCode: code,
      timeRange: value,
    }))
  ))
  const kinds = Object.keys(creativeKinds)

  baseParamsList.forEach((params) => {
    tasks.push(() => requestOnceForCache(creativeSearchRequest({ ...params, limit: 8 })))
    tasks.push(() => requestOnceForCache(creativeSearchRequest({ ...params, limit: 20 })))
    tasks.push(() => requestOnceForCache(creativeSearchRequest({ ...params, limit: 20, aiOnly: true })))

    kinds.forEach((kind) => {
      tasks.push(() => requestOnceForCache(creativeSummaryRequest(kind, params)))
      tasks.push(() => preloadDimensionVideosForSummary(kind, params))
    })
  })

  return tasks
}

const runPreloadTasks = async (tasks, concurrency = 1) => {
  let cursor = 0

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const task = tasks[cursor]
      cursor += 1
      await task().catch(() => {})
    }
  })

  await Promise.all(workers)
}

export const ensureCreateSessionCache = () => {
  if (createSessionCachePromise) return createSessionCachePromise

  createSessionCachePromise = runPreloadTasks(createPreloadTasks(), 2)
    .catch((error) => {
      console.warn('[create] RDS cache preload skipped', error)
    })
    .then(() => waitForDemoData(null, 180))
    .then(() => {
      markSyncedThisSession()
    })

  return createSessionCachePromise
}

const demoCreativeSearch = async ({
  signal,
  ...params
} = {}) => {
  await waitForDemoData(signal)

  const limit = Number(params.limit || 20)
  const offset = Number(params.offset || 0)
  const seed = `${params.timeRange || '7d'}:${params.countryCode || 'US'}:${params.aiOnly ? 'ai' : 'all'}`
  const filtered = rotateDemoVideos(seed)
    .filter((video) => (params.aiOnly ? video.isAiVideo : true))
    .filter((video) => matchesDemoVideo(video, params.keyword))
  const total = params.keyword || params.aiOnly ? filtered.length : demoCreativeVideosTotal

  return {
    videos: filtered.slice(offset, offset + limit),
    total,
  }
}

const demoCreativeSummary = async (kind, { signal } = {}) => {
  if (!demoCreativeSummaries[kind]) throw new Error(`鏈煡鍒涙剰缁村害锛?{kind}`)

  await waitForDemoData(signal)
  return cloneDemoData(demoCreativeSummaries[kind])
}

const demoCreativeDimensionVideos = async (kind, type, { signal } = {}) => {
  if (!demoCreativeSummaries[kind]) throw new Error(`鏈煡鍒涙剰缁村害锛?{kind}`)
  if (!type) return { videos: [], total: 0 }

  await waitForDemoData(signal, 420)
  const seed = `${kind}:${type}`
  const videos = rotateDemoVideos(seed).slice(0, 8)
  const item = demoCreativeSummaries[kind].find((summary) => summary.id === type)

  return {
    videos,
    total: item?.videoCount || videos.length,
  }
}

export const fetchCreativeSearch = async ({
  signal,
  ...params
} = {}) => {
  const { path, options } = creativeSearchRequest(params)

  try {
    const data = await request(path, addSignal(options, signal), { allowNetwork: true, ignoreCooldown: true })
    const entities = data?.entity_list || []
    return {
      videos: entities.map(convertCreativeVideo),
      total: Number(data?.total || entities.length),
    }
  } catch (error) {
    console.warn('[create] RDS creative search fallback', error)
    return demoCreativeSearch({ signal, ...params })
  }
}

const legacyFetchCreativeSummary = async (kind, {
  signal,
} = {}) => {
  if (!demoCreativeSummaries[kind]) throw new Error(`未知创意维度：${kind}`)

  await waitForDemoData(signal)
  return cloneDemoData(demoCreativeSummaries[kind])
}

const legacyFetchCreativeDimensionVideos = async (kind, type, {
  signal,
} = {}) => {
  if (!demoCreativeSummaries[kind]) throw new Error(`未知创意维度：${kind}`)
  if (!type) return { videos: [], total: 0 }

  await waitForDemoData(signal, 420)
  const seed = `${kind}:${type}`
  const videos = rotateDemoVideos(seed).slice(0, 8)
  const item = demoCreativeSummaries[kind].find((summary) => summary.id === type)

  return {
    videos,
    total: item?.videoCount || videos.length,
  }
}

export const fetchCreativeSummary = async (kind, {
  signal,
  ...params
} = {}) => {
  const { path, options } = creativeSummaryRequest(kind, params)

  try {
    const data = await request(path, addSignal(options, signal), { allowNetwork: true, ignoreCooldown: true })
    const config = creativeKinds[kind]
    return (data?.[config.listKey] || []).map((item) => convertSummaryItem(item, kind))
  } catch (error) {
    console.warn(`[create] RDS creative ${kind} summary fallback`, error)
    return legacyFetchCreativeSummary(kind, { signal, ...params })
  }
}

export const fetchCreativeDimensionVideos = async (kind, type, {
  signal,
  ...params
} = {}) => {
  if (!type) return { videos: [], total: 0 }

  const { path, options } = creativeDimensionVideosRequest(kind, type, params)

  try {
    const data = await request(path, addSignal(options, signal), { allowNetwork: true, ignoreCooldown: true })
    const entities = data?.entity_list || []
    return {
      videos: entities.map(convertCreativeVideo),
      total: Number(data?.total || entities.length),
    }
  } catch (error) {
    console.warn(`[create] RDS creative ${kind} videos fallback`, error)
    return legacyFetchCreativeDimensionVideos(kind, type, { signal, ...params })
  }
}

export const fetchCreateOverview = async ({ timeRange = '7d', countryCode = 'US', signal } = {}) => {
  await waitForDemoData(signal)

  const [videos, hooks, angles, formulas, moneyShots] = await Promise.all([
    fetchCreativeSearch({ timeRange, countryCode, limit: 8, signal }),
    fetchCreativeSummary('hook', { timeRange, countryCode, signal }),
    fetchCreativeSummary('angle', { timeRange, countryCode, signal }),
    fetchCreativeSummary('formula', { timeRange, countryCode, signal }),
    fetchCreativeSummary('moneyShot', { timeRange, countryCode, signal }),
  ])

  return {
    videos: videos.videos,
    totalVideos: videos.total,
    sections: [
      { key: 'hook', label: '黄金3秒', href: '#/create/hooks', items: hooks },
      { key: 'angle', label: '卖点角度', href: '#/create/angles', items: angles },
      { key: 'formula', label: '爆款模式', href: '#/create/formulas', items: formulas },
      { key: 'moneyShot', label: '转化镜头', href: '#/create/money-shots', items: moneyShots },
    ],
  }
}
