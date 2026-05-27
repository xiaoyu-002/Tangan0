import { backendJson, backendUrl } from '../../utils/backendApi'

const DATA_REGION_HEADER = 'x-biyi-data-region'
const CHJ_ENTITY_API_BASE = backendUrl('/api/chj/svc/passthrough/entity/tiktok')

const DISCOVER_ENDPOINTS = {
  products: `${CHJ_ENTITY_API_BASE}/product/search/list`,
  newProducts: `${CHJ_ENTITY_API_BASE}/product/new/list`,
  shops: `${CHJ_ENTITY_API_BASE}/seller/search/list`,
  creators: `${CHJ_ENTITY_API_BASE}/creator/search/list`,
  agencies: `${CHJ_ENTITY_API_BASE}/creator_partner/search/list`,
  videos: `${CHJ_ENTITY_API_BASE}/video/search/list`,
  b2bVideos: `${CHJ_ENTITY_API_BASE}/video/b2b/list`,
  ads: `${CHJ_ENTITY_API_BASE}/ads/search/list`,
  lives: `${CHJ_ENTITY_API_BASE}/live/search/list`,
  opportunities: `${CHJ_ENTITY_API_BASE}/dashboard/opportunities/product`,
}

const DEFAULT_BODY = {
  limit: 10,
  offset: 0,
}

const OPPORTUNITY_BODY = {
  field_filter: [
    {
      filter_key: 'tiktok_product_dashboard_opportunity_type',
      quick_option_name: 'tiktok_product_dashboard_opportunity_type_sales_spikes',
    },
  ],
  sort_filter: [
    {
      field_key: 'tiktok_product_dashboard_spike_sort_score',
      order: 1,
    },
  ],
  limit: 10,
  offset: 0,
}

const SECTION_CONFIG = {
  products: {
    title: '商品搜索',
    href: '/discover/tiktok/products',
    tone: 'sky',
    mapper: (entity) => mapProduct(entity, 'tiktok_product_search'),
  },
  shops: {
    title: '店铺搜索',
    href: '/discover/tiktok/shops',
    tone: 'emerald',
    mapper: (entity) => mapShop(entity),
  },
  creators: {
    title: '达人搜索',
    href: '/discover/tiktok/creators',
    tone: 'violet',
    mapper: (entity) => mapCreator(entity),
  },
  videos: {
    title: '视频搜索',
    href: '/discover/tiktok/videos',
    tone: 'rose',
    mapper: (entity) => mapVideo(entity, 'tiktok_video_search'),
  },
  ads: {
    title: '广告搜索',
    href: '/discover/tiktok/ads',
    tone: 'amber',
    mapper: (entity) => mapAd(entity),
  },
  lives: {
    title: '直播搜索',
    href: '/discover/tiktok/lives',
    tone: 'cyan',
    mapper: (entity) => mapLive(entity),
  },
}

const getFieldMap = (entity) => {
  return Object.fromEntries((entity?.field_list || []).map((field) => [field.field_key, field.value]))
}

const valueOf = (value) => {
  if (value && typeof value === 'object' && 'value' in value) return value.value
  return value
}

const numberOf = (value) => {
  const number = Number(valueOf(value))
  return Number.isFinite(number) ? number : 0
}

const formatCompact = (value) => {
  const number = numberOf(value)
  const abs = Math.abs(number)
  if (abs >= 100000000) return `${(number / 100000000).toFixed(1).replace(/\.0$/, '')}亿`
  if (abs >= 10000) return `${(number / 10000).toFixed(1).replace(/\.0$/, '')}万`
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 }).format(number)
}

const formatCurrency = (value) => {
  return `$${formatCompact(value)}`
}

const formatRate = (value) => {
  const number = numberOf(value)
  const percent = Math.abs(number) <= 1 ? number * 100 : number
  return `${percent.toFixed(Math.abs(percent) >= 10 ? 0 : 1)}%`
}

const imageUrl = (value) => {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return imageUrl(value[0])
  return value.thumb_url || value.url || ''
}

const categoryLabel = (value) => {
  return value ? `类目 ${value}` : 'TikTok'
}

const mapProduct = (entity, prefix) => {
  const fields = getFieldMap(entity)
  const name = fields[`${prefix}_product_name`] || `商品 ${entity.entity_id}`
  return {
    id: entity.entity_id,
    title: name,
    subtitle: fields[`${prefix}_shop_name`] || categoryLabel(fields[`${prefix}_l3_category`]),
    image: imageUrl(fields[`${prefix}_product_images`]),
    metricLabel: '30日 GMV',
    metric: formatCurrency(fields[`${prefix}_product_gmv_for_last_30_days`] || fields[`${prefix}_product_gmv`]),
    auxLabel: '30日销量',
    aux: formatCompact(fields[`${prefix}_product_sold_count_for_last_30_days`] || fields[`${prefix}_product_sold_count`]),
    badge: categoryLabel(fields[`${prefix}_l3_category`]),
  }
}

const mapShop = (entity) => {
  const fields = getFieldMap(entity)
  return {
    id: entity.entity_id,
    title: fields.tiktok_seller_search_shop_name || `店铺 ${entity.entity_id}`,
    subtitle: fields.tiktok_seller_search_seller_business_info || categoryLabel(fields.tiktok_seller_search_shop_main_category),
    image: imageUrl(fields.tiktok_seller_search_seller_avatar),
    metricLabel: '7日 GMV',
    metric: formatCurrency(fields.tiktok_seller_search_shop_gmv_for_last_7_days),
    auxLabel: '总销量',
    aux: formatCompact(fields.tiktok_seller_search_shop_total_sold_count),
    badge: categoryLabel(fields.tiktok_seller_search_shop_main_category),
  }
}

const mapCreator = (entity) => {
  const fields = getFieldMap(entity)
  return {
    id: entity.entity_id,
    title: fields.tiktok_creator_search_nickname || fields.tiktok_creator_search_unique_id || `达人 ${entity.entity_id}`,
    subtitle: fields.tiktok_creator_search_unique_id ? `@${fields.tiktok_creator_search_unique_id}` : categoryLabel(fields.tiktok_creator_search_category_label),
    image: imageUrl(fields.tiktok_creator_search_user_avatar),
    metricLabel: '30日 GMV',
    metric: formatCurrency(fields.tiktok_creator_search_total_video_live_30d_gmv),
    auxLabel: '粉丝',
    aux: formatCompact(fields.tiktok_creator_search_follower_count),
    badge: fields.tiktok_creator_search_has_live_product ? '直播带货' : '视频带货',
  }
}

const mapVideo = (entity, prefix) => {
  const fields = getFieldMap(entity)
  return {
    id: entity.entity_id,
    title: fields[`${prefix}_video_desc`] || fields[`${prefix}_product_title`] || `视频 ${entity.entity_id}`,
    subtitle: fields[`${prefix}_author_nickname`] || fields[`${prefix}_author_unique_id`] || 'TikTok 视频',
    image: imageUrl(fields[`${prefix}_video_cover`]),
    metricLabel: '播放',
    metric: formatCompact(fields[`${prefix}_video_play_count`]),
    auxLabel: '30日 GMV',
    aux: formatCurrency(fields[`${prefix}_video_30d_gmv`]),
    badge: `互动 ${formatRate(fields[`${prefix}_video_engagement_rate`])}`,
  }
}

const mapAd = (entity) => {
  const fields = getFieldMap(entity)
  return {
    id: entity.entity_id,
    title: fields.tiktok_ads_search_ad_title || fields.tiktok_ads_search_product_title || `广告 ${entity.entity_id}`,
    subtitle: fields.tiktok_ads_search_advertiser_name || fields.tiktok_ads_search_advertiser_url || 'TikTok 广告',
    image: imageUrl(fields.tiktok_ads_search_ad_cover),
    metricLabel: 'GMV',
    metric: formatCurrency(fields.tiktok_ads_search_total_gmv),
    auxLabel: 'ROAS',
    aux: `${numberOf(fields.tiktok_ads_search_ad_roas).toFixed(1)}x`,
    badge: `播放 ${formatCompact(fields.tiktok_ads_search_video_play_count)}`,
  }
}

const mapLive = (entity) => {
  const fields = getFieldMap(entity)
  return {
    id: entity.entity_id,
    title: fields.tiktok_live_search_title || `${fields.tiktok_live_search_user_nickname || '直播间'} Live`,
    subtitle: fields.tiktok_live_search_user_nickname || fields.tiktok_live_search_user_unique_id || 'TikTok Live',
    image: imageUrl(fields.tiktok_live_search_cover || fields.tiktok_live_search_user_avatar),
    metricLabel: 'GMV',
    metric: formatCurrency(fields.tiktok_live_search_gmv),
    auxLabel: '销量',
    aux: formatCompact(fields.tiktok_live_search_total_sold_count),
    badge: categoryLabel(fields.tiktok_live_search_most_product_category_label),
  }
}

const postChj = async (url, body, region = 'US') => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [DATA_REGION_HEADER]: region,
    },
    body: JSON.stringify(body),
  })
  const data = await response.json()
  if (!response.ok || (data?.base_resp && data.base_resp.code !== 0)) {
    throw new Error(data?.base_resp?.msg || data?.detail || `CHJ ${response.status}`)
  }
  return data
}

const emptySection = (key, error = '') => ({
  key,
  ...SECTION_CONFIG[key],
  total: 0,
  items: [],
  error,
})

const fetchSection = async (key, region) => {
  const data = await postChj(DISCOVER_ENDPOINTS[key], DEFAULT_BODY, region)
  const config = SECTION_CONFIG[key]
  return {
    key,
    ...config,
    total: data.total_count || data.entity_list?.length || 0,
    items: (data.entity_list || []).slice(0, 8).map(config.mapper),
    locked: (data.total_count || 0) > (data.entity_list?.length || 0),
  }
}

export const fetchDiscoverOverview = async (region = 'US') => {
  const [status, sections, opportunities] = await Promise.all([
    backendJson('/api/chj/cache/status').catch(() => null),
    Promise.all(Object.keys(SECTION_CONFIG).map((key) => fetchSection(key, region).catch((error) => emptySection(key, error.message)))),
    postChj(DISCOVER_ENDPOINTS.opportunities, OPPORTUNITY_BODY, region)
      .then((data) => ({
        total: data.total_count || data.entity_list?.length || 0,
        items: (data.entity_list || []).slice(0, 6).map((entity) => mapProduct(entity, 'tiktok_product_dashboard')),
      }))
      .catch(() => ({ total: 0, items: [] })),
  ])

  return {
    region,
    status,
    sections,
    opportunities,
    fetchedAt: new Date().toISOString(),
    loginRequired: true,
  }
}
