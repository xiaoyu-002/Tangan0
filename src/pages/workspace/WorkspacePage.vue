<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import WorkspaceOpportunityCard from './components/WorkspaceOpportunityCard.vue'
import WorkspacePerformanceCard from './components/WorkspacePerformanceCard.vue'
import WorkspaceSkeleton from './components/WorkspaceSkeleton.vue'
import { fetchWorkspaceData, getWorkspaceData } from './workspaceApi'

const workspaceData = ref(getWorkspaceData())
const isLoading = ref(false)
const loadError = ref('')
const activeMarketCode = ref(workspaceData.value?.market?.code || 'US')
const isMarketMenuOpen = ref(false)
const isMarketSwitching = ref(false)
const pendingMarketCode = ref('')
const newsIndex = ref(0)
let newsTimer = null
let marketSwitchTimer = null
let loadRequestId = 0

const marketFlagEmojis = {
  US: '🇺🇸',
  UK: '🇬🇧',
  GB: '🇬🇧',
  DE: '🇩🇪',
  JP: '🇯🇵',
  FR: '🇫🇷',
  IT: '🇮🇹',
  ES: '🇪🇸',
  CA: '🇨🇦',
  AU: '🇦🇺',
  SG: '🇸🇬',
  MY: '🇲🇾',
  TH: '🇹🇭',
  VN: '🇻🇳',
  PH: '🇵🇭',
  ID: '🇮🇩',
}

const getMarketFlag = (market = {}) => {
  const code = String(market.code || '').toUpperCase()
  return market.flag || marketFlagEmojis[code] || '🌐'
}

const support = computed(() => workspaceData.value?.support || null)
const markets = computed(() => workspaceData.value?.markets || [workspaceData.value?.market].filter(Boolean))
const activeMarket = computed(() => {
  return markets.value.find((market) => market.code === activeMarketCode.value) || markets.value[0] || {
    label: '美国',
    code: 'US',
    flag: '🇺🇸',
  }
})
const activeMarketSnapshot = computed(() => {
  return workspaceData.value?.marketSnapshots?.[activeMarketCode.value] || {}
})
const pendingMarket = computed(() => {
  return markets.value.find((market) => market.code === pendingMarketCode.value) || activeMarket.value
})
const newsItems = computed(() => activeMarketSnapshot.value.news || workspaceData.value?.header?.news || [])
const currentNews = computed(() => {
  if (newsItems.value.length === 0) return '已同步模拟接口数据'
  return newsItems.value[newsIndex.value % newsItems.value.length]
})
const performanceCards = computed(() => {
  return (activeMarketSnapshot.value.performance?.cards || workspaceData.value?.performance?.cards || []).map((card) => ({
    ...card,
    locale: getMarketFlag(activeMarket.value),
  }))
})
const opportunityPanels = computed(() => activeMarketSnapshot.value.opportunities || workspaceData.value?.opportunities || [])
// UI modification: view-only projections for the Unifydata dashboard layout.
// These values reuse existing workspace data and do not change API state, events, or business logic.
const dashboardKpiCards = computed(() => {
  const displayLabels = ['访客数', '联系人', '交易数', '收入']
  return performanceCards.value
    .flatMap((card) => (card.metrics || []).map((metric) => ({
      ...metric,
      displayLabel: displayLabels.length ? displayLabels.shift() : metric.label,
      sourceTitle: card.title,
      href: metric.href || card.href,
    })))
    .slice(0, 4)
})
const dashboardLineCard = computed(() => performanceCards.value[0] || null)
const dashboardChannelCards = computed(() => performanceCards.value.slice(0, 3))
const dashboardTableRows = computed(() => support.value?.tasks?.items || [])
const dashboardChannelSegments = computed(() => {
  const colors = ['#6082F7', '#E2BBFF', '#DBFFBA']
  const values = dashboardChannelCards.value.map((card) => {
    const chartValues = Array.isArray(card.chart?.values) ? card.chart.values : []
    return Number(chartValues[chartValues.length - 1]) || 1
  })
  const total = values.reduce((sum, value) => sum + value, 0) || 1

  return dashboardChannelCards.value.map((card, index) => ({
    ...card,
    color: colors[index % colors.length],
    value: values[index],
    percent: Math.round((values[index] / total) * 100),
  }))
})
const dashboardDonutStyle = computed(() => {
  let cursor = 0
  const stops = dashboardChannelSegments.value.map((segment) => {
    const start = cursor
    cursor += segment.percent
    return `${segment.color} ${start}% ${cursor}%`
  })

  return { background: `conic-gradient(${stops.join(', ')})` }
})

const getChartPointData = (values = [], width = 320, height = 136) => {
  if (!Array.isArray(values) || values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = values.length > 1 ? width / (values.length - 1) : width

  return values
    .map((value, index) => {
      const x = Math.round(index * step)
      const y = Math.round(height - 12 - ((value - min) / range) * (height - 24))
      return { x, y, value }
    })
}

const getChartPoints = (values = [], width = 320, height = 136) => {
  return getChartPointData(values, width, height)
    .map((point) => `${point.x},${point.y}`)
    .join(' ')
}

const getSmoothChartPath = (values = [], width = 320, height = 136) => {
  const points = getChartPointData(values, width, height)
  if (points.length === 0) return ''
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`

    const previous = points[index - 1]
    const controlDistance = (point.x - previous.x) * 0.45
    const c1x = Math.round(previous.x + controlDistance)
    const c2x = Math.round(point.x - controlDistance)
    return `${path} C ${c1x} ${previous.y}, ${c2x} ${point.y}, ${point.x} ${point.y}`
  }, '')
}

const getChartAreaPath = (values = [], width = 320, height = 136) => {
  const points = getChartPointData(values, width, height)
  const linePath = getSmoothChartPath(values, width, height)
  if (!linePath || points.length === 0) return ''

  const baseline = height - 8
  const first = points[0]
  const last = points[points.length - 1]
  return `${linePath} L ${last.x} ${baseline} L ${first.x} ${baseline} Z`
}

const syncActiveMarket = () => {
  if (!markets.value.some((market) => market.code === activeMarketCode.value)) {
    activeMarketCode.value = markets.value[0]?.code || 'US'
  }
}

const clearMarketSwitchTimer = () => {
  if (!marketSwitchTimer) return
  window.clearTimeout(marketSwitchTimer)
  marketSwitchTimer = null
}

const getMarketSwitchDelay = () => Math.round(450 + Math.random() * 450)

const selectMarket = (code) => {
  isMarketMenuOpen.value = false
  if (code === activeMarketCode.value) return

  clearMarketSwitchTimer()
  pendingMarketCode.value = code
  isMarketSwitching.value = true

  marketSwitchTimer = window.setTimeout(() => {
    activeMarketCode.value = code
    newsIndex.value = 0
    pendingMarketCode.value = ''
    isMarketSwitching.value = false
    marketSwitchTimer = null
  }, getMarketSwitchDelay())
}

const startNewsTicker = () => {
  if (newsTimer) window.clearInterval(newsTimer)
  newsTimer = window.setInterval(() => {
    if (newsItems.value.length > 1) newsIndex.value = (newsIndex.value + 1) % newsItems.value.length
  }, 3200)
}

const loadWorkspace = async () => {
  isLoading.value = true
  loadError.value = ''
  const requestId = ++loadRequestId

  const applyWorkspaceData = (data) => {
    if (requestId !== loadRequestId || !data) return
    workspaceData.value = data
    newsIndex.value = 0
    syncActiveMarket()
  }

  try {
    const data = await fetchWorkspaceData({
      onUpdate: applyWorkspaceData,
    })
    applyWorkspaceData(data)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '工作台数据加载失败'
  } finally {
    if (requestId === loadRequestId) isLoading.value = false
  }
}

onMounted(() => {
  startNewsTicker()
  loadWorkspace()
})

onBeforeUnmount(() => {
  if (newsTimer) window.clearInterval(newsTimer)
  clearMarketSwitchTimer()
})
</script>

<template>
  <main
    class="workspace-dashboard-page flex-1 min-h-dvh min-w-0 flex flex-col max-md:!ml-0"
    style="margin-left: 220px; transition: margin-left 200ms ease-out; background: #ffffff"
  >
    <div
      class="workspace-dashboard-topbar sticky z-30 h-header transition-shadow duration-200 [clip-path:inset(0_0_-20px_0)] bg-[#f6f5fc]/85 backdrop-blur-md"
      style="top: var(--promo-banner-h, 0px)"
    >
      <div class="md:hidden flex items-center px-3 h-full">
        <button aria-label="菜单" class="flex items-center justify-center w-8 h-8 rounded-md text-gray-700 hover:text-gray-900 hover:bg-stone-200 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5" aria-hidden="true">
            <path d="M4 5h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 19h16"></path>
          </svg>
        </button>
        <img alt="糖安罗盘" width="28" height="28" decoding="async" class="ml-2 h-5 w-auto" src="/assets/icons/tangan-logo.png">
        <div class="ml-auto shrink-0"></div>
      </div>

      <!-- UI modification: Unifydata 风格顶部标题栏和搜索框。 -->
      <div class="workspace-dashboard-titlebar hidden md:flex items-center px-5 h-full">
        <div class="workspace-dashboard-heading">
          <!-- UI modification: production-facing workspace title copy. -->
          <h1 class="workspace-dashboard-title">增长工作台</h1>
          <p class="workspace-dashboard-subtitle">集中查看市场机会、内容表现、渠道收入与待办任务，快速判断下一步增长动作。</p>
        </div>
        <label class="workspace-dashboard-search">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input type="search" aria-label="搜索" placeholder="搜索" autocomplete="off">
        </label>
        <nav aria-label="Breadcrumb" class="workspace-dashboard-breadcrumb min-w-0">
          <ol class="flex items-center gap-1.5 text-sm list-none m-0 p-0">
            <li class="flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0 text-gray-700" aria-hidden="true">
                <rect width="7" height="9" x="3" y="3" rx="1"></rect>
                <rect width="7" height="5" x="14" y="3" rx="1"></rect>
                <rect width="7" height="9" x="14" y="12" rx="1"></rect>
                <rect width="7" height="5" x="3" y="16" rx="1"></rect>
              </svg>
              <span class="font-medium text-gray-700">工作台</span>
            </li>
          </ol>
        </nav>
      </div>
    </div>

    <div class="flex-1 relative">
      <div class="pointer-events-none fixed inset-0 z-0" style="background: linear-gradient(135deg, rgba(238,240,254,0.6) 0%, rgba(238,240,254,0) 35%)"></div>

      <div class="workspace-dashboard-container w-full relative z-10 px-4 md:px-6 2xl:px-8 pb-24">
        <WorkspaceSkeleton v-if="isLoading && !workspaceData" />

        <div v-else-if="loadError && !workspaceData" class="flex min-h-[55vh] items-center justify-center">
          <div class="rounded-2xl border border-red-100 bg-white px-5 py-4 text-center shadow-sm">
            <p class="text-sm font-semibold text-gray-900">数据加载失败</p>
            <p class="mt-1 text-xs text-gray-500">{{ loadError }}</p>
            <button type="button" class="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-white" @click="loadWorkspace">
              重新加载
            </button>
          </div>
        </div>

        <template v-else-if="workspaceData">
          <div
            v-if="isLoading"
            class="sticky top-[calc(var(--promo-banner-h,0px)+var(--header-h,64px)+8px)] z-20 mb-3 flex justify-end pointer-events-none"
            role="status"
            aria-live="polite"
          >
            <span class="inline-flex items-center gap-1.5 rounded-full border border-violet-100 bg-white/90 px-3 py-1 text-[11px] font-medium text-violet-600 shadow-sm backdrop-blur">
              <span class="workspace-sync-dot" aria-hidden="true"></span>
              后台同步中
            </span>
          </div>
          <Transition name="workspace-market-loader">
            <div
              v-if="isMarketSwitching"
              class="workspace-market-loader"
              role="status"
              aria-live="polite"
            >
              <div class="workspace-market-loader-card">
                <span class="workspace-market-loader-flag">{{ getMarketFlag(pendingMarket) }}</span>
                <span class="workspace-market-loader-copy">切换到 {{ pendingMarket.label }}</span>
                <span class="workspace-market-loader-dots" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
            </div>
          </Transition>
          <div class="workspace-market-content workspace-dashboard-content" :class="{ 'is-switching': isMarketSwitching }">
            <!-- UI modification: compact market/news control strip using existing data and market switch event. -->
            <div class="workspace-dashboard-meta-row">
              <div class="workspace-dashboard-news" aria-live="polite">
                <span class="workspace-dashboard-badge">{{ workspaceData.header.badge }}</span>
                <span :key="newsIndex" class="workspace-news-item truncate">{{ currentNews }}</span>
              </div>
              <div class="relative">
                <button
                  class="workspace-dashboard-market-button"
                  type="button"
                  aria-haspopup="listbox"
                  :aria-expanded="String(isMarketMenuOpen)"
                  @click="isMarketMenuOpen = !isMarketMenuOpen"
                >
                  <span aria-hidden="true">{{ getMarketFlag(activeMarket) }}</span>
                  <span>{{ activeMarket.label }}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    class="workspace-dashboard-chevron"
                    :class="{ 'rotate-180': isMarketMenuOpen }"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
                <div
                  v-if="isMarketMenuOpen"
                  class="workspace-dashboard-market-menu"
                  role="listbox"
                >
                  <button
                    v-for="market in markets"
                    :key="market.code"
                    type="button"
                    class="workspace-dashboard-market-option"
                    :class="market.code === activeMarketCode ? 'is-active' : ''"
                    role="option"
                    :aria-selected="String(market.code === activeMarketCode)"
                    @click="selectMarket(market.code)"
                  >
                    <span>{{ getMarketFlag(market) }}</span>
                    <span class="workspace-dashboard-market-copy">
                      <span>{{ market.label }} / {{ market.code }}</span>
                      <small>{{ market.note }}</small>
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <!-- UI modification: first row - 4 KPI cards in 2x2 layout, reusing existing metric links and values. -->
            <section class="workspace-dashboard-kpi-grid" aria-label="工作台指标">
              <a
                v-for="metric in dashboardKpiCards"
                :key="`${metric.sourceTitle}-${metric.label}`"
                :href="`#${metric.href}`"
                class="workspace-dashboard-card workspace-dashboard-kpi-card"
              >
                <span class="workspace-dashboard-kpi-label">{{ metric.displayLabel }}</span>
                <strong class="workspace-dashboard-kpi-value">{{ metric.value }}</strong>
                <span class="workspace-dashboard-kpi-footer">
                  <span :class="metric.deltaClass || 'text-emerald-600'">{{ metric.delta }}</span>
                  <span>{{ metric.label }}</span>
                </span>
              </a>
            </section>

            <!-- UI modification: 第二行交易收入折线图和主要收入渠道环形图。 -->
            <section class="workspace-dashboard-chart-grid">
              <article class="workspace-dashboard-card workspace-dashboard-line-card">
                <div class="workspace-dashboard-card-header">
                  <div>
                    <h2>交易与收入</h2>
                    <p>{{ dashboardLineCard?.title }}</p>
                  </div>
                  <a v-if="dashboardLineCard" :href="`#${dashboardLineCard.href}`" class="workspace-dashboard-link">查看</a>
                </div>
                <svg class="workspace-dashboard-line-chart" viewBox="0 0 320 136" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="workspaceLineArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#6082F7" stop-opacity="0.24"></stop>
                      <stop offset="58%" stop-color="#E2BBFF" stop-opacity="0.12"></stop>
                      <stop offset="100%" stop-color="#6082F7" stop-opacity="0"></stop>
                    </linearGradient>
                    <linearGradient id="workspaceLineStroke" x1="0" x2="1" y1="0" y2="0">
                      <stop offset="0%" stop-color="#6082F7"></stop>
                      <stop offset="62%" stop-color="#7C9AFB"></stop>
                      <stop offset="100%" stop-color="#6082F7"></stop>
                    </linearGradient>
                    <filter id="workspaceLineGlow" x="-8%" y="-35%" width="116%" height="170%">
                      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#6082F7" flood-opacity="0.2"></feDropShadow>
                    </filter>
                  </defs>
                  <line class="workspace-dashboard-grid-line" x1="0" y1="112" x2="320" y2="112"></line>
                  <line class="workspace-dashboard-grid-line" x1="0" y1="76" x2="320" y2="76"></line>
                  <line class="workspace-dashboard-grid-line" x1="0" y1="40" x2="320" y2="40"></line>
                  <path
                    class="workspace-dashboard-line-area"
                    :d="getChartAreaPath(dashboardLineCard?.chart?.values || [])"
                  ></path>
                  <path
                    class="workspace-dashboard-line-path"
                    :d="getSmoothChartPath(dashboardLineCard?.chart?.values || [])"
                  ></path>
                  <circle
                    v-for="(point, index) in getChartPointData(dashboardLineCard?.chart?.values || [])"
                    :key="`${point.x}-${point.y}-${index}`"
                    class="workspace-dashboard-line-dot"
                    :class="{ 'is-last': index === getChartPointData(dashboardLineCard?.chart?.values || []).length - 1 }"
                    :cx="point.x"
                    :cy="point.y"
                    :r="index === getChartPointData(dashboardLineCard?.chart?.values || []).length - 1 ? 4 : 2.8"
                  ></circle>
                </svg>
                <div class="workspace-dashboard-chart-caption" v-if="dashboardLineCard">
                  <span>{{ dashboardLineCard.chart.minLabel }}</span>
                  <strong>{{ dashboardLineCard.chart.maxLabel }}</strong>
                </div>
                <div class="workspace-dashboard-chart-metrics" v-if="dashboardLineCard">
                  <a
                    v-for="metric in dashboardLineCard.metrics"
                    :key="metric.label"
                    :href="`#${metric.href || dashboardLineCard.href}`"
                  >
                    <span>{{ metric.label }}</span>
                    <strong>{{ metric.value }}</strong>
                    <em :class="metric.deltaClass || 'text-emerald-600'">{{ metric.delta }}</em>
                  </a>
                </div>
              </article>

              <article class="workspace-dashboard-card workspace-dashboard-donut-card">
                <div class="workspace-dashboard-card-header">
                  <div>
                    <h2>主要收入渠道</h2>
                    <p>{{ activeMarket.label }}</p>
                  </div>
                </div>
                <div class="workspace-dashboard-donut-wrap">
                  <div class="workspace-dashboard-donut" :style="dashboardDonutStyle">
                    <span>{{ dashboardChannelSegments[0]?.percent || 0 }}%</span>
                  </div>
                  <div class="workspace-dashboard-donut-legend">
                    <a
                      v-for="segment in dashboardChannelSegments"
                      :key="segment.id"
                      :href="`#${segment.href}`"
                      class="workspace-dashboard-legend-row"
                    >
                      <i :style="{ backgroundColor: segment.color }"></i>
                      <span>{{ segment.title }}</span>
                      <strong>{{ segment.percent }}%</strong>
                    </a>
                  </div>
                </div>
                <div class="workspace-dashboard-channel-detail">
                  <div v-for="segment in dashboardChannelSegments.slice(1)" :key="`${segment.id}-metrics`">
                    <h3>{{ segment.title }}</h3>
                    <a
                      v-for="metric in segment.metrics"
                      :key="`${segment.id}-${metric.label}`"
                      :href="`#${metric.href || segment.href}`"
                    >
                      <span>{{ metric.label }}</span>
                      <strong>{{ metric.value }}</strong>
                      <em :class="metric.deltaClass || 'text-emerald-600'">{{ metric.delta }}</em>
                    </a>
                  </div>
                </div>
              </article>
            </section>

            <!-- UI modification: 第三行全宽活动表现表格，复用原有任务数据和链接。 -->
            <section v-if="support" class="workspace-dashboard-card workspace-dashboard-table-card">
              <div class="workspace-dashboard-card-header">
                <div>
                  <h2>活动表现</h2>
                  <p>{{ support.tasks.title }}</p>
                </div>
                <a :href="`#${support.tasks.href}`" class="workspace-dashboard-link">查看全部</a>
              </div>
              <div class="workspace-dashboard-table-wrap">
                <table class="workspace-dashboard-table">
                  <thead>
                    <tr>
                      <th>活动</th>
                      <th>负责人</th>
                      <th>状态</th>
                      <th>进度</th>
                      <th>截止时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="task in dashboardTableRows" :key="task.title">
                      <td>
                        <a :href="`#${support.tasks.href}`">{{ task.title }}</a>
                      </td>
                      <td>{{ task.agent }}</td>
                      <td><span class="workspace-dashboard-status">{{ task.status }}</span></td>
                      <td>
                        <div class="workspace-dashboard-progress">
                          <span :style="{ width: `${task.progress}%` }"></span>
                        </div>
                      </td>
                      <td>{{ task.due }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <!-- UI modification: original interactive opportunity tabs retained and styled in the new dashboard system. -->
            <section class="workspace-dashboard-panel-section animate-fade-in" data-section="ai-brief">
              <div class="workspace-dashboard-section-heading">
                <h2>{{ workspaceData.header.title }}</h2>
                <p>{{ workspaceData.header.description }}</p>
              </div>
              <div class="workspace-dashboard-opportunity-grid">
                <WorkspaceOpportunityCard
                  v-for="panel in opportunityPanels"
                  :key="`${activeMarketCode}-${panel.id}`"
                  :panel="panel"
                />
              </div>
            </section>

            <!-- UI modification: original support links and task filters retained below the dashboard table. -->
            <section v-if="support" class="workspace-dashboard-support-grid">
              <article class="workspace-dashboard-card workspace-dashboard-support-card">
                <div class="workspace-dashboard-card-header">
                  <a class="workspace-dashboard-card-title-link" :href="`#${support.chat.href}`">
                    <h2>{{ support.chat.title }}</h2>
                  </a>
                </div>
                <p>{{ support.chat.summary }}</p>
                <div class="workspace-dashboard-message-list">
                  <a
                    v-for="message in support.chat.messages"
                    :key="`${message.agent}-${message.time}`"
                    :href="`#${support.chat.href}`"
                    class="workspace-dashboard-message-row"
                  >
                    <img :src="message.avatar" :alt="message.agent">
                    <span>
                      <strong>{{ message.agent }}</strong>
                      <small>{{ message.text }}</small>
                    </span>
                    <time>{{ message.time }}</time>
                  </a>
                </div>
              </article>

              <article class="workspace-dashboard-card workspace-dashboard-support-card">
                <div class="workspace-dashboard-card-header">
                  <a class="workspace-dashboard-card-title-link" :href="`#${support.tasks.href}`">
                    <h2>{{ support.tasks.title }}</h2>
                  </a>
                  <div class="workspace-dashboard-tabs">
                    <button
                      v-for="filter in support.tasks.filters"
                      :key="filter.key"
                      type="button"
                      class="rounded-[5px] px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer"
                      :class="filter.key === support.tasks.activeFilter ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                    >
                      {{ filter.label }}
                    </button>
                  </div>
                </div>
                <div class="workspace-dashboard-task-list">
                  <a
                    v-for="task in support.tasks.items"
                    :key="task.title"
                    :href="`#${support.tasks.href}`"
                    class="workspace-dashboard-task-row"
                  >
                    <span>
                      <strong>{{ task.title }}</strong>
                      <small>{{ task.agent }} / {{ task.due }}</small>
                    </span>
                    <em>{{ task.status }}</em>
                  </a>
                </div>
              </article>
            </section>
          </div>
        </template>
      </div>
    </div>
  </main>

  <div
    v-if="workspaceData?.dock"
    class="fixed bottom-0 right-0 left-0 md:left-[var(--dock-left)] md:[transition:left_200ms_cubic-bezier(0.16,1,0.3,1)] z-30 pointer-events-none animate-fade-in max-md:overflow-hidden"
    style="--agent-rgb: 96 130 247; --dock-left: 220px;"
  >
    <div class="pointer-events-none bg-gradient-to-t from-background/90 to-transparent" style="height:32px;opacity:0.8;transition:height 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 200ms cubic-bezier(0.16, 1, 0.3, 1)"></div>
    <div class="bg-background/80 backdrop-blur-xl pointer-events-auto pb-3 sm:pb-5">
      <div class="max-w-full md:max-w-4xl lg:max-w-5xl mx-auto px-4 md:px-6">
        <div style="opacity:1;transform:translateY(0) scale(1);pointer-events:auto;height:auto;overflow:hidden;transition:opacity 280ms cubic-bezier(0.16, 1, 0.3, 1) 180ms, transform 280ms cubic-bezier(0.16, 1, 0.3, 1) 180ms, height 0ms 0ms">
          <div class="flex justify-center">
            <button
              type="button"
              class="flex items-center gap-2.5 pl-1.5 pr-1.5 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border-2 border-[rgb(var(--agent-rgb,139_92_246)/0.3)] hover:border-[rgb(var(--agent-rgb,139_92_246)/0.5)] animate-dock-pill-glow transition-[border-color] duration-200 cursor-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
              aria-label="打开 AI 助手"
            >
              <img :alt="workspaceData.dock.agent" class="rounded-full object-cover object-top shrink-0" :src="workspaceData.dock.avatar" style="width: 32px; height: 32px;">
              <span class="text-sm font-medium text-gray-600 pr-1 animate-fade-in truncate">{{ workspaceData.dock.prompt }}</span>
              <kbd class="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200 text-[10px] font-medium text-gray-400 shrink-0">{{ workspaceData.dock.shortcut }}</kbd>
              <span role="button" class="p-1.5 rounded-full bg-[rgb(var(--agent-rgb,139_92_246))] hover:bg-[rgb(var(--agent-rgb,139_92_246)/0.85)] shadow-sm shadow-[rgb(var(--agent-rgb,139_92_246)/0.3)] hover:shadow-[rgb(var(--agent-rgb,139_92_246)/0.4)] transition-[background,box-shadow] duration-200">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 text-white stroke-[2.5]" aria-hidden="true">
                  <path d="m5 12 7-7 7 7"></path>
                  <path d="M12 19V5"></path>
                </svg>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* UI modification: Unifydata layout, palette, and card system. */
.workspace-dashboard-page {
  --workspace-primary: #6082f7;
  --workspace-secondary: #e2bbff;
  --workspace-growth: #dbffba;
  --workspace-ink: #151921;
  --workspace-body: #333333;
  --workspace-muted: #666666;
  color: var(--workspace-body);
  background: #fff !important;
}

.workspace-dashboard-topbar {
  height: 92px !important;
  border-bottom: 1px solid #eef0f4;
  background: #fff !important;
  backdrop-filter: none;
}

.workspace-dashboard-titlebar {
  justify-content: space-between;
  gap: 24px;
  padding-right: 32px !important;
  padding-left: 32px !important;
}

.workspace-dashboard-heading {
  min-width: 0;
}

.workspace-dashboard-title {
  margin: 0;
  color: #151921;
  font-size: 28px;
  font-weight: 700;
  line-height: 1.15;
  letter-spacing: 0;
}

.workspace-dashboard-subtitle {
  max-width: 640px;
  margin: 6px 0 0;
  overflow: hidden;
  color: #666666;
  font-size: 13px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-dashboard-search {
  display: flex;
  width: min(320px, 34vw);
  height: 42px;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  background: #f5f7fb;
  padding: 0 14px;
  color: #666666;
}

.workspace-dashboard-search input {
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: #333333;
  font-size: 14px;
}

.workspace-dashboard-search input::placeholder {
  color: #666666;
}

.workspace-dashboard-breadcrumb {
  display: none;
}

.workspace-dashboard-page > .flex-1 {
  background: #fff;
}

.workspace-dashboard-page .pointer-events-none.fixed.inset-0 {
  display: none;
}

.workspace-dashboard-container {
  /* UI modification: make the dashboard display area use the full main content width. */
  max-width: none !important;
  margin-right: 0 !important;
  margin-left: 0 !important;
  padding-right: clamp(24px, 2.6vw, 48px) !important;
  padding-left: clamp(24px, 2.6vw, 48px) !important;
}

.workspace-dashboard-page :deep(.workspace-dashboard-card),
.workspace-dashboard-card {
  border: 0 !important;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.workspace-dashboard-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 32px 0 56px;
}

.workspace-dashboard-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.workspace-dashboard-news {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
  color: #666666;
  font-size: 13px;
}

.workspace-dashboard-badge {
  flex: 0 0 auto;
  border-radius: 8px;
  background: rgba(96, 130, 247, 0.1);
  color: #6082f7;
  padding: 5px 9px;
  font-size: 11px;
  font-weight: 700;
}

.workspace-dashboard-market-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  border: 0;
  border-radius: 8px;
  background: #151921;
  color: #fff;
  padding: 0 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.workspace-dashboard-chevron {
  width: 14px;
  height: 14px;
  transition: transform 180ms ease;
}

.workspace-dashboard-market-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 40;
  width: 240px;
  overflow: hidden;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 18px 45px rgba(21, 25, 33, 0.16);
  padding: 8px;
}

.workspace-dashboard-market-option {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  padding: 10px;
  color: #333333;
  text-align: left;
  cursor: pointer;
}

.workspace-dashboard-market-option:hover,
.workspace-dashboard-market-option.is-active {
  background: rgba(96, 130, 247, 0.1);
  color: #6082f7;
}

.workspace-dashboard-market-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
  font-size: 13px;
  font-weight: 600;
}

.workspace-dashboard-market-copy small {
  overflow: hidden;
  color: #666666;
  font-size: 11px;
  font-weight: 400;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-dashboard-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 24px;
}

.workspace-dashboard-kpi-card {
  display: flex;
  min-height: 156px;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px;
  text-decoration: none;
}

.workspace-dashboard-kpi-label {
  color: #666666;
  font-size: 13px;
  font-weight: 600;
}

.workspace-dashboard-kpi-value {
  margin-top: 18px;
  color: #151921;
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
}

.workspace-dashboard-kpi-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 18px;
  color: #666666;
  font-size: 12px;
}

.workspace-dashboard-kpi-footer span:first-child {
  border-radius: 999px;
  background: #dbffba;
  color: #151921 !important;
  padding: 4px 8px;
  font-weight: 700;
}

.workspace-dashboard-chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(360px, 0.85fr);
  gap: 24px;
}

.workspace-dashboard-line-card,
.workspace-dashboard-donut-card,
.workspace-dashboard-table-card,
.workspace-dashboard-support-card {
  padding: 20px;
}

.workspace-dashboard-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.workspace-dashboard-card-header h2,
.workspace-dashboard-section-heading h2 {
  margin: 0;
  color: #151921;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.25;
}

.workspace-dashboard-card-header p,
.workspace-dashboard-section-heading p,
.workspace-dashboard-support-card > p {
  margin: 5px 0 0;
  color: #666666;
  font-size: 12px;
}

.workspace-dashboard-link,
.workspace-dashboard-card-title-link {
  color: #6082f7;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
}

.workspace-dashboard-line-chart {
  width: 100%;
  height: 220px;
  overflow: visible;
}

.workspace-dashboard-grid-line {
  stroke: #e9edf5;
  stroke-width: 1;
  stroke-dasharray: 4 6;
}

.workspace-dashboard-line-area {
  fill: url("#workspaceLineArea");
}

.workspace-dashboard-line-path {
  fill: none;
  filter: url("#workspaceLineGlow");
  stroke: url("#workspaceLineStroke");
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4.5;
}

.workspace-dashboard-line-dot {
  fill: #ffffff;
  stroke: #6082f7;
  stroke-width: 2;
}

.workspace-dashboard-line-dot.is-last {
  fill: #6082f7;
  stroke: #ffffff;
  stroke-width: 2.5;
}

.workspace-dashboard-chart-caption {
  display: flex;
  justify-content: space-between;
  color: #666666;
  font-size: 12px;
}

.workspace-dashboard-chart-caption strong {
  color: #6082f7;
  font-weight: 800;
}

.workspace-dashboard-chart-metrics,
.workspace-dashboard-channel-detail {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.workspace-dashboard-chart-metrics a,
.workspace-dashboard-channel-detail a {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 10px;
  border-radius: 8px;
  background: #f8f9fc;
  padding: 10px;
  color: #333333;
  text-decoration: none;
}

.workspace-dashboard-chart-metrics span,
.workspace-dashboard-channel-detail span {
  overflow: hidden;
  color: #666666;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-dashboard-chart-metrics strong,
.workspace-dashboard-channel-detail strong {
  color: #151921;
  font-size: 12px;
  font-weight: 800;
}

.workspace-dashboard-chart-metrics em,
.workspace-dashboard-channel-detail em {
  grid-column: 1 / -1;
  color: #151921 !important;
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
}

.workspace-dashboard-channel-detail {
  grid-template-columns: 1fr;
}

.workspace-dashboard-channel-detail > div {
  display: grid;
  gap: 10px;
}

.workspace-dashboard-channel-detail h3 {
  margin: 0;
  color: #151921;
  font-size: 13px;
  font-weight: 600;
}

.workspace-dashboard-donut-wrap {
  display: flex;
  align-items: center;
  gap: 28px;
}

.workspace-dashboard-donut {
  position: relative;
  display: grid;
  width: 168px;
  height: 168px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 999px;
}

.workspace-dashboard-donut::after {
  position: absolute;
  inset: 36px;
  border-radius: inherit;
  background: #fff;
  content: "";
}

.workspace-dashboard-donut span {
  position: relative;
  z-index: 1;
  color: #151921;
  font-size: 24px;
  font-weight: 800;
}

.workspace-dashboard-donut-legend {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 14px;
}

.workspace-dashboard-legend-row {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  color: #333333;
  font-size: 13px;
  text-decoration: none;
}

.workspace-dashboard-legend-row i {
  width: 10px;
  height: 10px;
  border-radius: 999px;
}

.workspace-dashboard-legend-row span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-dashboard-legend-row strong {
  color: #151921;
  font-weight: 700;
}

.workspace-dashboard-table-wrap {
  overflow-x: auto;
}

.workspace-dashboard-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
  color: #333333;
  font-size: 13px;
}

.workspace-dashboard-table th {
  padding: 0 14px 12px;
  color: #666666;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
}

.workspace-dashboard-table td {
  border-top: 1px solid #eef0f4;
  padding: 16px 14px;
  vertical-align: middle;
}

.workspace-dashboard-table a {
  color: #151921;
  font-weight: 600;
  text-decoration: none;
}

.workspace-dashboard-status {
  display: inline-flex;
  border-radius: 999px;
  background: rgba(96, 130, 247, 0.1);
  color: #6082f7;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 700;
}

.workspace-dashboard-progress {
  width: 120px;
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: #eef0f4;
}

.workspace-dashboard-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #6082f7;
}

.workspace-dashboard-panel-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workspace-dashboard-opportunity-grid,
.workspace-dashboard-support-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
}

.workspace-dashboard-message-list,
.workspace-dashboard-task-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 18px;
}

.workspace-dashboard-message-row,
.workspace-dashboard-task-row {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #333333;
  text-decoration: none;
}

.workspace-dashboard-message-row img {
  width: 36px;
  height: 36px;
  flex: 0 0 auto;
  border-radius: 999px;
  object-fit: cover;
  object-position: top;
}

.workspace-dashboard-message-row span,
.workspace-dashboard-task-row span {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  flex-direction: column;
}

.workspace-dashboard-message-row strong,
.workspace-dashboard-task-row strong {
  overflow: hidden;
  color: #151921;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-dashboard-message-row small,
.workspace-dashboard-task-row small {
  overflow: hidden;
  color: #666666;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-dashboard-message-row time,
.workspace-dashboard-task-row em {
  flex: 0 0 auto;
  color: #666666;
  font-size: 12px;
  font-style: normal;
}

.workspace-dashboard-tabs {
  display: flex;
  gap: 8px;
}

.workspace-dashboard-tabs button[class*="bg-primary"] {
  background: #6082f7 !important;
  color: #fff !important;
}

@media (max-width: 1280px) {
  .workspace-dashboard-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workspace-dashboard-opportunity-grid,
  .workspace-dashboard-support-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .workspace-dashboard-chart-grid,
  .workspace-dashboard-opportunity-grid,
  .workspace-dashboard-support-grid {
    grid-template-columns: 1fr;
  }

  .workspace-dashboard-donut-wrap {
    flex-wrap: wrap;
  }
}

@media (max-width: 767px) {
  .workspace-dashboard-page {
    margin-left: 0 !important;
  }

  .workspace-dashboard-topbar {
    height: var(--header-height) !important;
  }

  .workspace-dashboard-kpi-grid {
    grid-template-columns: 1fr;
  }
}

.workspace-news-item {
  display: block;
  animation: workspace-news-slide 520ms ease both;
}

.workspace-sync-dot {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgb(139 92 246);
  box-shadow: 0 0 0 0 rgb(139 92 246 / 0.32);
  animation: workspace-sync-pulse 1.2s ease-out infinite;
}

.workspace-market-content {
  transition:
    opacity 220ms ease,
    filter 220ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: 50% 80px;
}

.workspace-market-content.is-switching {
  pointer-events: none;
  opacity: 0.58;
  filter: blur(3px);
  transform: scale(0.994);
}

.workspace-market-loader {
  position: absolute;
  inset: 0;
  z-index: 40;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 132px;
  pointer-events: auto;
  background: linear-gradient(180deg, rgba(246, 245, 252, 0.66), rgba(246, 245, 252, 0.18) 54%, transparent);
}

.workspace-market-loader-card {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  min-height: 44px;
  padding: 9px 14px;
  border: 1px solid rgba(139, 92, 246, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 18px 44px rgba(76, 83, 245, 0.14);
  color: #34405c;
  backdrop-filter: blur(14px);
}

.workspace-market-loader-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 999px;
  background: #f4f1ff;
  font-size: 15px;
  line-height: 1;
}

.workspace-market-loader-copy {
  font-size: 12px;
  font-weight: 700;
}

.workspace-market-loader-dots {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 1px;
}

.workspace-market-loader-dots i {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: #8a5cff;
  animation: workspace-market-dot 760ms ease-in-out infinite;
}

.workspace-market-loader-dots i:nth-child(2) {
  animation-delay: 110ms;
}

.workspace-market-loader-dots i:nth-child(3) {
  animation-delay: 220ms;
}

.workspace-market-loader-enter-active,
.workspace-market-loader-leave-active {
  transition:
    opacity 180ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.workspace-market-loader-enter-from,
.workspace-market-loader-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@keyframes workspace-news-slide {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes workspace-sync-pulse {
  0% {
    box-shadow: 0 0 0 0 rgb(139 92 246 / 0.32);
  }

  100% {
    box-shadow: 0 0 0 8px rgb(139 92 246 / 0);
  }
}

@keyframes workspace-market-dot {
  0%,
  100% {
    opacity: 0.38;
    transform: translateY(0);
  }

  50% {
    opacity: 1;
    transform: translateY(-3px);
  }
}
</style>
