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
    class="flex-1 min-h-dvh min-w-0 flex flex-col max-md:!ml-0"
    style="margin-left: 68px; transition: margin-left 200ms ease-out; background: transparent"
  >
    <div
      class="sticky z-30 h-header transition-shadow duration-200 [clip-path:inset(0_0_-20px_0)] bg-[#f6f5fc]/85 backdrop-blur-md"
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
        <img alt="思燕智选" width="28" height="28" decoding="async" class="ml-2 h-5 w-auto" src="/assets/icons/siyan-logo.png">
        <div class="ml-auto shrink-0"></div>
      </div>

      <div class="hidden md:flex items-center px-5 h-full">
        <nav aria-label="Breadcrumb" class="min-w-0">
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
        <div class="ml-auto shrink-0"></div>
      </div>
    </div>

    <div class="flex-1 relative">
      <div class="pointer-events-none fixed inset-0 z-0" style="background: linear-gradient(135deg, rgba(238,240,254,0.6) 0%, rgba(238,240,254,0) 35%)"></div>

      <div class="w-full relative z-10 max-w-4xl lg:max-w-6xl 2xl:max-w-8xl 3xl:max-w-9xl 4xl:max-w-10xl mx-auto px-4 md:px-6 2xl:px-8 pb-24">
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
          <div class="workspace-market-content" :class="{ 'is-switching': isMarketSwitching }">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-6 3xl:pt-8 4xl:pt-10 mb-5 3xl:mb-6 4xl:mb-8">
            <div>
              <h1 class="text-xl 3xl:text-2xl font-serif italic text-gray-900">{{ workspaceData.header.title }}</h1>
              <p class="mt-1 text-xs text-gray-500 max-w-xl">{{ workspaceData.header.description }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="shrink-0 text-[10px] font-semibold tracking-wide text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded">
                {{ workspaceData.header.badge }}
              </span>
              <div
                class="min-w-0 max-w-[420px] overflow-hidden text-xs text-gray-500 bg-white/70 border border-gray-100 rounded-full px-3 py-1 shadow-sm"
                aria-live="polite"
              >
                <span :key="newsIndex" class="workspace-news-item truncate">{{ currentNews }}</span>
              </div>
            </div>
          </div>

          <section class="mb-8 3xl:mb-10 4xl:mb-12">
            <div class="flex items-center justify-between mb-3 3xl:mb-4">
              <h3 class="text-base 3xl:text-lg font-serif italic text-gray-800 flex items-center gap-2">今日表现</h3>
              <div class="relative">
                <button
                  class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-200 cursor-pointer bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:shadow-sm"
                  type="button"
                  aria-haspopup="listbox"
                  :aria-expanded="String(isMarketMenuOpen)"
                  @click="isMarketMenuOpen = !isMarketMenuOpen"
                >
                  <span class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-violet-50 text-base leading-none ring-1 ring-violet-100 shrink-0" aria-hidden="true">
                    {{ getMarketFlag(activeMarket) }}
                  </span>
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
                    class="w-3 h-3 text-gray-400 transition-transform duration-200"
                    :class="{ 'rotate-180': isMarketMenuOpen }"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6"></path>
                  </svg>
                </button>
                <div
                  v-if="isMarketMenuOpen"
                  class="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-2xl border border-gray-100 bg-white/95 p-1.5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] backdrop-blur"
                  role="listbox"
                >
                  <button
                    v-for="market in markets"
                    :key="market.code"
                    type="button"
                    class="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left transition-colors hover:bg-violet-50"
                    :class="market.code === activeMarketCode ? 'bg-violet-50 text-violet-700' : 'text-gray-600'"
                    role="option"
                    :aria-selected="String(market.code === activeMarketCode)"
                    @click="selectMarket(market.code)"
                  >
                    <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-violet-50 text-base leading-none ring-1 ring-violet-100">{{ getMarketFlag(market) }}</span>
                    <span class="min-w-0 flex-1">
                      <span class="block text-xs font-semibold">{{ market.label }} · {{ market.code }}</span>
                      <span class="block truncate text-[11px] text-gray-400">{{ market.note }}</span>
                    </span>
                    <span v-if="market.code === activeMarketCode" class="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
                  </button>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3 2xl:gap-4 4xl:gap-5 mb-3">
              <WorkspacePerformanceCard
                v-for="card in performanceCards"
                :key="card.id"
                :card="card"
              />
            </div>
          </section>

          <section class="mb-8 3xl:mb-10 4xl:mb-12 animate-fade-in" data-section="ai-brief">
            <div class="flex items-center justify-between mb-3 3xl:mb-4">
              <h3 class="text-base 3xl:text-lg font-serif italic text-gray-800 flex items-center gap-2">
                今日机会
                <span class="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-3 w-3 text-violet-500" aria-hidden="true">
                    <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                    <path d="M20 2v4"></path>
                    <path d="M22 4h-4"></path>
                    <circle cx="4" cy="20" r="2"></circle>
                  </svg>
                  AI 洞察
                </span>
              </h3>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 2xl:gap-4 4xl:gap-5 md:[grid-auto-rows:680px]">
              <WorkspaceOpportunityCard
                v-for="panel in opportunityPanels"
                :key="`${activeMarketCode}-${panel.id}`"
                :panel="panel"
              />
            </div>
          </section>

          <section v-if="support" class="mb-8 3xl:mb-10 4xl:mb-12">
            <h3 class="text-base 3xl:text-lg font-serif italic text-gray-800 mb-3 3xl:mb-4">对话与任务</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 2xl:gap-4 4xl:gap-5">
              <article class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                <div class="flex items-center justify-between mb-3">
                  <a class="flex items-center gap-0.5 group" :href="`#${support.chat.href}`">
                    <h3 class="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">{{ support.chat.title }}</h3>
                    <span class="relative w-3.5 h-3.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute inset-0 w-3.5 h-3.5 text-gray-300 group-hover:opacity-0 group-hover:translate-x-1 transition-all duration-300" aria-hidden="true">
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </span>
                  </a>
                </div>
                <p class="mb-3 text-xs text-gray-500">{{ support.chat.summary }}</p>
                <div class="space-y-2">
                  <a
                    v-for="message in support.chat.messages"
                    :key="`${message.agent}-${message.time}`"
                    :href="`#${support.chat.href}`"
                    class="flex items-start gap-3 rounded-xl px-3 py-2.5 text-left hover:bg-violet-50/50 transition-colors cursor-pointer group"
                  >
                    <img :src="message.avatar" :alt="message.agent" class="w-8 h-8 rounded-full object-cover object-top shrink-0">
                    <div class="min-w-0 flex-1">
                      <div class="flex items-center justify-between gap-2">
                        <p class="text-xs font-semibold text-gray-800">{{ message.agent }}</p>
                        <span class="text-[10px] text-gray-300">{{ message.time }}</span>
                      </div>
                      <p class="mt-1 text-xs leading-relaxed text-gray-500 group-hover:text-gray-700 transition-colors">{{ message.text }}</p>
                    </div>
                  </a>
                </div>
              </article>

              <article class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col">
                <div class="flex items-center justify-between mb-2">
                  <a class="flex items-center gap-0.5 group" :href="`#${support.tasks.href}`">
                    <h3 class="text-sm font-medium text-gray-900 group-hover:text-gray-600 transition-colors">{{ support.tasks.title }}</h3>
                    <span class="relative w-3.5 h-3.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="absolute inset-0 w-3.5 h-3.5 text-gray-300 group-hover:opacity-0 group-hover:translate-x-1 transition-all duration-300" aria-hidden="true">
                        <path d="m9 18 6-6-6-6"></path>
                      </svg>
                    </span>
                  </a>
                  <div class="flex rounded-md border border-border p-0.5 text-xs">
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
                <div class="space-y-2">
                  <a
                    v-for="task in support.tasks.items"
                    :key="task.title"
                    :href="`#${support.tasks.href}`"
                    class="block rounded-xl border border-gray-100 px-3 py-2.5 hover:bg-gray-50/80 transition-colors"
                  >
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <p class="truncate text-xs font-semibold text-gray-900">{{ task.title }}</p>
                        <p class="mt-1 text-[11px] text-gray-400">{{ task.agent }} · {{ task.due }}</p>
                      </div>
                      <span
                        class="rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0"
                        :class="task.tone === 'emerald' ? 'bg-emerald-50 text-emerald-600' : task.tone === 'sky' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'"
                      >
                        {{ task.status }}
                      </span>
                    </div>
                    <div class="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        class="h-full rounded-full"
                        :class="task.tone === 'emerald' ? 'bg-emerald-400' : task.tone === 'sky' ? 'bg-sky-400' : 'bg-amber-400'"
                        :style="{ width: `${task.progress}%` }"
                      ></div>
                    </div>
                  </a>
                </div>
              </article>
            </div>
          </section>
          </div>
        </template>
      </div>
    </div>
  </main>

  <div
    v-if="workspaceData?.dock"
    class="fixed bottom-0 right-0 left-0 md:left-[var(--dock-left)] md:[transition:left_200ms_cubic-bezier(0.16,1,0.3,1)] z-30 pointer-events-none animate-fade-in max-md:overflow-hidden"
    style="--agent-rgb: 14 165 233; --dock-left: 68px;"
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
