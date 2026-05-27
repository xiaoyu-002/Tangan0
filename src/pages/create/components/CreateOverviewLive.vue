<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchCreateOverview } from '../createApi'
import CreateFilterControls from './CreateFilterControls.vue'
import CreatePageShell from './CreatePageShell.vue'
import CreateVideoCard from './CreateVideoCard.vue'

const timeRange = ref('7d')
const countryCode = ref('US')
const data = ref({ videos: [], totalVideos: 0, sections: [] })
const loading = ref(false)
const error = ref('')

let controller

const headlineStats = computed(() => {
  const cards = data.value.sections.flatMap((section) => section.items.slice(0, 1))
  return [
    { label: '热门视频', value: data.value.totalVideos.toLocaleString(), hint: '实时趋势' },
    { label: '最高 GMV', value: cards[0]?.avgGmv || '$0', hint: cards[0]?.name || '黄金3秒' },
    { label: '爆款模式', value: data.value.sections[2]?.items[0]?.name || '-', hint: data.value.sections[2]?.items[0]?.avgGmv || '实时更新' },
    { label: '转化镜头', value: data.value.sections[3]?.items[0]?.name || '-', hint: data.value.sections[3]?.items[0]?.sharePercent || '实时更新' },
  ]
})

const loadOverview = async () => {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''

  try {
    data.value = await fetchCreateOverview({
      timeRange: timeRange.value,
      countryCode: countryCode.value,
      signal: controller.signal,
    })
  } catch (err) {
    if (err.name !== 'AbortError') error.value = err.message || '创作概览数据加载失败'
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

watch([timeRange, countryCode], loadOverview)
onMounted(loadOverview)
onBeforeUnmount(() => controller?.abort())
</script>

<template>
  <CreatePageShell
    title="概览"
    description="汇总热门视频、黄金3秒、卖点角度、爆款模式和转化镜头，让创意判断更快落到可执行的素材方向。"
  >
    <CreateFilterControls
      v-model:time-range="timeRange"
      v-model:country-code="countryCode"
      :show-search="false"
      @refresh="loadOverview"
    />

    <section class="hero-card">
      <div>
        <span>Creative Director</span>
        <h2>从真实爆款数据里拆创意，不再只看静态页面。</h2>
        <p>筛选条件会同步到各个创作子页面，方便连续比较不同市场和时间段里的素材表现。</p>
      </div>
      <img src="/assets/avatars/creative-director.png" alt="创意总监">
    </section>

    <div v-if="loading" class="overview-skeleton">
      <i v-for="index in 8" :key="index"></i>
    </div>

    <div v-else-if="error" class="empty-card">
      <strong>数据暂时不可用</strong>
      <p>{{ error }}</p>
      <button type="button" @click="loadOverview">重试</button>
    </div>

    <template v-else>
      <section class="stat-grid">
        <article v-for="item in headlineStats" :key="item.label">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.hint }}</small>
        </article>
      </section>

      <section class="section-grid">
        <article v-for="section in data.sections" :key="section.key" class="dimension-card">
          <div class="dimension-head">
            <h3>{{ section.label }}</h3>
            <a :href="section.href">查看详情</a>
          </div>
          <div class="dimension-list">
            <div v-for="item in section.items.slice(0, 4)" :key="item.id">
              <span>{{ item.name }}</span>
              <strong>{{ item.avgGmv }}</strong>
              <small>{{ item.sharePercent }} · {{ item.videoCount.toLocaleString() }} 条视频</small>
            </div>
          </div>
        </article>
      </section>

      <section class="latest-videos">
        <div class="section-title">
          <h3>最新热门视频</h3>
          <a href="#/create/hottest-videos">全部视频</a>
        </div>
        <div class="video-row">
          <CreateVideoCard v-for="video in data.videos.slice(0, 6)" :key="video.id" :video="video" />
        </div>
      </section>
    </template>
  </CreatePageShell>
</template>

<style scoped>
.hero-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
  padding: 24px;
  overflow: hidden;
  border: 1px solid rgba(249, 115, 22, 0.16);
  border-radius: 26px;
  background:
    radial-gradient(circle at 82% 20%, rgba(249, 115, 22, 0.18), transparent 30%),
    linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(255, 247, 237, 0.88));
  box-shadow: 0 22px 54px rgba(17, 24, 39, 0.08);
}

.hero-card span {
  display: inline-flex;
  color: #f97316;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.hero-card h2 {
  max-width: 690px;
  margin: 8px 0;
  color: #111827;
  font-size: clamp(26px, 4vw, 44px);
  line-height: 1.08;
  letter-spacing: -0.06em;
}

.hero-card p {
  max-width: 620px;
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.7;
}

.hero-card img {
  width: 108px;
  height: 108px;
  flex: 0 0 auto;
  border-radius: 999px;
  object-fit: cover;
  object-position: top;
  filter: drop-shadow(0 18px 30px rgba(249, 115, 22, 0.22));
}

.stat-grid,
.section-grid {
  display: grid;
  gap: 14px;
}

.stat-grid {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 18px;
}

.stat-grid article,
.dimension-card,
.empty-card {
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.08);
}

.stat-grid article {
  padding: 16px;
}

.stat-grid span,
.stat-grid small {
  display: block;
  color: #9ca3af;
  font-size: 12px;
}

.stat-grid strong {
  display: block;
  margin: 8px 0 4px;
  color: #111827;
  font-size: 24px;
  line-height: 1;
}

.section-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-bottom: 22px;
}

.dimension-card {
  padding: 16px;
}

.dimension-head,
.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dimension-head h3,
.section-title h3 {
  margin: 0;
  color: #111827;
  font-size: 17px;
}

.dimension-head a,
.section-title a {
  color: #4c53f5;
  font-size: 12px;
  font-weight: 800;
  text-decoration: none;
}

.dimension-list {
  display: grid;
  gap: 8px;
  margin-top: 12px;
}

.dimension-list div {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 12px;
  padding: 10px;
  border-radius: 14px;
  background: #f8fafc;
}

.dimension-list span {
  color: #111827;
  font-size: 13px;
  font-weight: 800;
}

.dimension-list strong {
  color: #4c53f5;
  font-size: 13px;
}

.dimension-list small {
  grid-column: 1 / -1;
  color: #9ca3af;
  font-size: 11px;
}

.latest-videos {
  margin-top: 8px;
}

.video-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 12px;
}

.overview-skeleton {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-skeleton i {
  min-height: 148px;
  border-radius: 20px;
  background: linear-gradient(90deg, rgba(229, 231, 235, 0.9), rgba(255, 255, 255, 0.9), rgba(229, 231, 235, 0.9));
  background-size: 220% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.empty-card {
  display: grid;
  place-items: center;
  min-height: 320px;
  padding: 32px;
  text-align: center;
}

.empty-card strong {
  color: #111827;
  font-size: 18px;
}

.empty-card p {
  max-width: 460px;
  margin: 8px 0 16px;
  color: #6b7280;
  font-size: 13px;
}

.empty-card button {
  height: 36px;
  border: 0;
  border-radius: 10px;
  background: #4c53f5;
  color: white;
  cursor: pointer;
  font-weight: 800;
  padding: 0 16px;
}

@keyframes shimmer {
  to {
    background-position: -220% 0;
  }
}

@media (max-width: 980px) {
  .stat-grid,
  .section-grid,
  .overview-skeleton {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .hero-card {
    align-items: flex-start;
  }

  .hero-card img {
    display: none;
  }

  .stat-grid,
  .section-grid,
  .overview-skeleton {
    grid-template-columns: 1fr;
  }
}
</style>
