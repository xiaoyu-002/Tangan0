<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchDiscoverOverview } from './discoverApi'

const discoverData = ref(null)
const isLoading = ref(true)
const loadError = ref('')
const activeRegion = ref('US')

const regions = [
  { code: 'US', label: '美国' },
  { code: 'UK', label: '英国' },
  { code: 'DE', label: '德国' },
  { code: 'JP', label: '日本' },
]

const moduleCounts = computed(() => {
  const modules = discoverData.value?.status?.cache?.modules || []
  return Object.fromEntries(modules.map((item) => [item.module_key, item.total]))
})

const totalVisibleItems = computed(() => {
  return (discoverData.value?.sections || []).reduce((sum, section) => sum + section.items.length, 0)
})

const loadDiscover = async (region = activeRegion.value) => {
  isLoading.value = true
  loadError.value = ''
  activeRegion.value = region

  try {
    discoverData.value = await fetchDiscoverOverview(region)
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '选品数据加载失败'
  } finally {
    isLoading.value = false
  }
}

const switchRegion = (region) => {
  if (region === activeRegion.value && discoverData.value) return
  loadDiscover(region)
}

onMounted(() => {
  loadDiscover()
})
</script>

<template>
  <main class="discover-live-page">
    <header class="discover-topbar">
      <nav class="discover-breadcrumb" aria-label="Breadcrumb">
        <span>选品</span>
        <span>/</span>
        <strong>实时总览</strong>
      </nav>
    </header>

    <div class="discover-scroll">
      <section class="discover-hero">
        <div>
          <p class="discover-kicker">出海匠公开数据</p>
          <h1>选品实时总览</h1>
          <p class="discover-subtitle">
            商品、店铺、达人、视频、广告和直播先抓取公开可访问的首屏数据；全量分页、导出和锁定区域需要登录出海匠后才能继续同步。
          </p>
        </div>
        <div class="discover-region-tabs" aria-label="市场">
          <button
            v-for="region in regions"
            :key="region.code"
            type="button"
            :class="{ active: region.code === activeRegion }"
            @click="switchRegion(region.code)"
          >
            {{ region.label }}
          </button>
        </div>
      </section>

      <section class="discover-status-grid">
        <article>
          <span>可见数据</span>
          <strong>{{ totalVisibleItems }}</strong>
          <small>当前公开接口首屏条目</small>
        </article>
        <article>
          <span>商品缓存</span>
          <strong>{{ moduleCounts.discover_products || 0 }}</strong>
          <small>discover_products</small>
        </article>
        <article>
          <span>广告缓存</span>
          <strong>{{ moduleCounts.discover_ads || 0 }}</strong>
          <small>discover_ads</small>
        </article>
        <article>
          <span>机会缓存</span>
          <strong>{{ moduleCounts.today_opportunities || 0 }}</strong>
          <small>今日机会模块</small>
        </article>
      </section>

      <div v-if="isLoading" class="discover-loading">
        <span></span>
        正在从后端缓存读取公开数据
      </div>

      <div v-else-if="loadError" class="discover-error">
        <strong>数据读取失败</strong>
        <p>{{ loadError }}</p>
        <button type="button" @click="loadDiscover()">重新加载</button>
      </div>

      <template v-else-if="discoverData">
        <section class="discover-lock-note">
          <div>
            <strong>公开数据已补齐，更多数据需要登录</strong>
            <p>出海匠页面未登录状态下会返回首批数据，同时页面包含“登录解锁全量数据”。当前先展示公开可抓取部分，避免本地选品页空缺。</p>
          </div>
          <a href="https://www.chuhaijiang.com/app/discover" target="_blank" rel="noreferrer">打开出海匠</a>
        </section>

        <section v-if="discoverData.opportunities.items.length" class="discover-opportunities">
          <div class="discover-section-heading">
            <div>
              <span>今日机会</span>
              <h2>机会商品</h2>
            </div>
            <a href="#/discover/overview/opportunities">查看机会页</a>
          </div>
          <div class="discover-opportunity-strip">
            <article v-for="item in discoverData.opportunities.items" :key="item.id">
              <img v-if="item.image" :src="item.image" :alt="item.title">
              <div>
                <strong>{{ item.title }}</strong>
                <span>{{ item.badge }}</span>
                <p>{{ item.metricLabel }} {{ item.metric }} · {{ item.auxLabel }} {{ item.aux }}</p>
              </div>
            </article>
          </div>
        </section>

        <section class="discover-sections">
          <article v-for="section in discoverData.sections" :key="section.key" class="discover-section-card">
            <div class="discover-section-heading">
              <div>
                <span>{{ section.total ? `共 ${section.total.toLocaleString('zh-CN')} 条` : '暂无公开数据' }}</span>
                <h2>{{ section.title }}</h2>
              </div>
              <a :href="`#${section.href}`">进入详情</a>
            </div>

            <p v-if="section.error" class="discover-section-error">{{ section.error }}</p>
            <div v-else class="discover-items">
              <a
                v-for="item in section.items"
                :key="item.id"
                class="discover-item"
                :href="`#${section.href}`"
              >
                <img v-if="item.image" :src="item.image" :alt="item.title">
                <span v-else class="discover-image-fallback">{{ section.title.slice(0, 1) }}</span>
                <div>
                  <strong>{{ item.title }}</strong>
                  <p>{{ item.subtitle }}</p>
                  <div class="discover-metrics">
                    <span>{{ item.metricLabel }} <b>{{ item.metric }}</b></span>
                    <span>{{ item.auxLabel }} <b>{{ item.aux }}</b></span>
                  </div>
                </div>
                <em>{{ item.badge }}</em>
              </a>
            </div>

            <div v-if="section.locked" class="discover-section-lock">
              当前展示公开首屏数据；全量 {{ section.total.toLocaleString('zh-CN') }} 条需要登录解锁。
            </div>
          </article>
        </section>
      </template>
    </div>
  </main>
</template>

<style scoped>
.discover-live-page {
  min-height: 100dvh;
  flex: 1;
  margin-left: 244px;
  background: transparent;
  color: #111827;
}

.discover-topbar {
  position: sticky;
  top: var(--promo-banner-h, 0px);
  z-index: 30;
  height: var(--spacing-header, 64px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: rgb(246 245 252 / 0.86);
  backdrop-filter: blur(14px);
}

.discover-breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

.discover-breadcrumb strong {
  color: #111827;
  font-weight: 650;
}

.discover-scroll {
  height: calc(100dvh - var(--spacing-header, 64px));
  overflow: auto;
  padding: 22px 28px 96px;
}

.discover-hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-start;
  max-width: 1220px;
  margin: 0 auto 18px;
}

.discover-kicker {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #4c53f5;
}

.discover-hero h1 {
  margin: 0;
  font-family: Georgia, 'Times New Roman', serif;
  font-size: 30px;
  font-style: italic;
  letter-spacing: 0;
}

.discover-subtitle {
  max-width: 720px;
  margin: 8px 0 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.75;
}

.discover-region-tabs {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;
}

.discover-region-tabs button {
  height: 30px;
  padding: 0 12px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
}

.discover-region-tabs button.active {
  background: #4c53f5;
  color: #fff;
}

.discover-status-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  max-width: 1220px;
  margin: 0 auto 18px;
}

.discover-status-grid article,
.discover-section-card,
.discover-lock-note,
.discover-opportunities {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.92);
  box-shadow: 0 12px 36px rgb(15 23 42 / 0.06);
}

.discover-status-grid article {
  padding: 14px;
}

.discover-status-grid span,
.discover-section-heading span {
  display: block;
  font-size: 11px;
  color: #64748b;
}

.discover-status-grid strong {
  display: block;
  margin-top: 5px;
  font-size: 24px;
  font-weight: 760;
}

.discover-status-grid small {
  display: block;
  margin-top: 2px;
  color: #94a3b8;
  font-size: 11px;
}

.discover-loading,
.discover-error,
.discover-lock-note {
  max-width: 1220px;
  margin: 0 auto 18px;
}

.discover-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4c53f5;
  font-size: 13px;
}

.discover-loading span {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #4c53f5;
  animation: discover-pulse 1.2s infinite;
}

.discover-error {
  padding: 20px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff;
}

.discover-error p {
  color: #64748b;
  font-size: 13px;
}

.discover-error button,
.discover-lock-note a,
.discover-section-heading a {
  border: 0;
  border-radius: 6px;
  background: #4c53f5;
  color: #fff;
  text-decoration: none;
  font-size: 12px;
  font-weight: 650;
  cursor: pointer;
}

.discover-error button,
.discover-lock-note a {
  padding: 8px 12px;
}

.discover-lock-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
}

.discover-lock-note p {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
}

.discover-opportunities,
.discover-sections {
  max-width: 1220px;
  margin: 0 auto;
}

.discover-opportunities {
  padding: 16px;
  margin-bottom: 18px;
}

.discover-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
}

.discover-section-heading h2 {
  margin: 2px 0 0;
  font-size: 16px;
  font-weight: 740;
}

.discover-section-heading a {
  padding: 6px 10px;
  white-space: nowrap;
}

.discover-opportunity-strip {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.discover-opportunity-strip article {
  display: flex;
  gap: 10px;
  min-width: 0;
  padding: 10px;
  border-radius: 8px;
  background: #f8fafc;
}

.discover-opportunity-strip img,
.discover-item img,
.discover-image-fallback {
  width: 52px;
  height: 52px;
  border-radius: 8px;
  object-fit: cover;
  flex: 0 0 auto;
  background: #eef2ff;
}

.discover-opportunity-strip strong,
.discover-item strong {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 13px;
  line-height: 1.35;
}

.discover-opportunity-strip span,
.discover-opportunity-strip p {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-size: 11px;
}

.discover-sections {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.discover-section-card {
  min-width: 0;
  padding: 16px;
}

.discover-items {
  display: grid;
  gap: 8px;
}

.discover-item {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  min-width: 0;
  padding: 8px;
  border-radius: 8px;
  color: inherit;
  text-decoration: none;
  transition: background 160ms ease;
}

.discover-item:hover {
  background: #f8fafc;
}

.discover-image-fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #4c53f5;
  font-weight: 750;
}

.discover-item p {
  overflow: hidden;
  margin: 4px 0 0;
  color: #64748b;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.discover-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 5px;
  color: #64748b;
  font-size: 11px;
}

.discover-metrics b {
  color: #111827;
}

.discover-item em {
  max-width: 94px;
  overflow: hidden;
  padding: 3px 7px;
  border-radius: 999px;
  background: #eef2ff;
  color: #4c53f5;
  font-size: 10px;
  font-style: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.discover-section-error,
.discover-section-lock {
  color: #64748b;
  font-size: 12px;
}

.discover-section-lock {
  margin-top: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: #fff7ed;
  color: #9a3412;
}

@keyframes discover-pulse {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(1);
  }

  50% {
    opacity: 1;
    transform: scale(1.35);
  }
}

@media (max-width: 980px) {
  .discover-live-page {
    margin-left: 68px;
  }

  .discover-hero {
    flex-direction: column;
  }

  .discover-status-grid,
  .discover-sections,
  .discover-opportunity-strip {
    grid-template-columns: 1fr;
  }
}
</style>
