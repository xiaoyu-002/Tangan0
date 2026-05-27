<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchCreativeDimensionVideos, fetchCreativeSummary } from '../createApi'
import CreateFilterControls from './CreateFilterControls.vue'
import CreatePageShell from './CreatePageShell.vue'
import CreateVideoCard from './CreateVideoCard.vue'

const props = defineProps({
  kind: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: '',
  },
  dimensionLabel: {
    type: String,
    default: '创意维度',
  },
})

const timeRange = ref('7d')
const countryCode = ref('US')
const summary = ref([])
const selectedId = ref('')
const videos = ref([])
const total = ref(0)
const loadingSummary = ref(false)
const loadingVideos = ref(false)
const error = ref('')

let summaryController
let videoController

const selectedItem = computed(() => summary.value.find((item) => item.id === selectedId.value))
const maxShare = computed(() => Math.max(...summary.value.map((item) => item.shareValue), 1))

const loadSummary = async () => {
  summaryController?.abort()
  summaryController = new AbortController()
  loadingSummary.value = true
  error.value = ''

  try {
    const data = await fetchCreativeSummary(props.kind, {
      timeRange: timeRange.value,
      countryCode: countryCode.value,
      signal: summaryController.signal,
    })
    summary.value = data
    selectedId.value = data[0]?.id || ''
  } catch (err) {
    if (err.name !== 'AbortError') error.value = err.message || '创意洞察数据加载失败'
  } finally {
    if (!summaryController.signal.aborted) loadingSummary.value = false
  }
}

const loadVideos = async () => {
  if (!selectedId.value) {
    videos.value = []
    total.value = 0
    return
  }

  videoController?.abort()
  videoController = new AbortController()
  loadingVideos.value = true

  try {
    const data = await fetchCreativeDimensionVideos(props.kind, selectedId.value, {
      timeRange: timeRange.value,
      countryCode: countryCode.value,
      limit: 8,
      signal: videoController.signal,
    })
    videos.value = data.videos
    total.value = data.total
  } catch (err) {
    if (err.name !== 'AbortError') error.value = err.message || '维度视频数据加载失败'
  } finally {
    if (!videoController.signal.aborted) loadingVideos.value = false
  }
}

watch([timeRange, countryCode], loadSummary)
watch(selectedId, loadVideos)

onMounted(loadSummary)
onBeforeUnmount(() => {
  summaryController?.abort()
  videoController?.abort()
})
</script>

<template>
  <CreatePageShell :title="title" :description="description">
    <CreateFilterControls
      v-model:time-range="timeRange"
      v-model:country-code="countryCode"
      :show-search="false"
      @refresh="loadSummary"
    />

    <div class="trend-note">
      <span>{{ dimensionLabel }}表现</span>
      <strong v-if="selectedItem">{{ selectedItem.name }} · {{ total.toLocaleString() }} 条证据视频</strong>
    </div>

    <div v-if="loadingSummary" class="insight-skeleton">
      <i v-for="index in 6" :key="index"></i>
    </div>

    <div v-else-if="error" class="empty-card">
      <strong>数据暂时不可用</strong>
      <p>{{ error }}</p>
      <button type="button" @click="loadSummary">重试</button>
    </div>

    <section v-else class="insight-layout">
      <aside class="ranking-panel">
        <h2>{{ dimensionLabel }}排行</h2>
        <button
          v-for="(item, index) in summary"
          :key="item.id"
          type="button"
          class="rank-item"
          :class="{ active: selectedId === item.id }"
          @click="selectedId = item.id"
        >
          <span class="rank-num">{{ index + 1 }}</span>
          <span class="rank-main">
            <strong>{{ item.name }}</strong>
            <small>{{ item.videoCount.toLocaleString() }} 条视频</small>
            <i :style="{ width: `${Math.max(8, (item.shareValue / maxShare) * 100)}%` }"></i>
          </span>
          <em>{{ item.sharePercent }}</em>
        </button>
      </aside>

      <article class="evidence-panel">
        <div v-if="selectedItem" class="selected-summary">
          <div>
            <span>{{ dimensionLabel }}</span>
            <h2>{{ selectedItem.name }}</h2>
          </div>
          <strong>{{ selectedItem.avgGmv }}</strong>
        </div>

        <div v-if="selectedItem" class="metric-grid">
          <div>
            <span>平均 GMV</span>
            <strong>{{ selectedItem.avgGmv }}</strong>
          </div>
          <div>
            <span>平均播放</span>
            <strong>{{ selectedItem.avgViews }}</strong>
          </div>
          <div>
            <span>占比</span>
            <strong>{{ selectedItem.sharePercent }}</strong>
          </div>
          <div>
            <span>视频数</span>
            <strong>{{ selectedItem.videoCount.toLocaleString() }}</strong>
          </div>
        </div>

        <p v-if="selectedItem" class="insight-copy">{{ selectedItem.description }}</p>

        <div class="video-section-head">
          <h3>证据视频</h3>
          <span v-if="loadingVideos">加载中...</span>
          <span v-else>{{ videos.length }} / {{ total.toLocaleString() }}</span>
        </div>

        <div v-if="loadingVideos" class="video-skeleton">
          <i v-for="index in 4" :key="index"></i>
        </div>
        <div v-else class="compact-grid">
          <CreateVideoCard
            v-for="video in videos"
            :key="video.id"
            :video="video"
            compact
          />
        </div>
      </article>
    </section>
  </CreatePageShell>
</template>

<style scoped>
.trend-note {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  color: #9ca3af;
  font-size: 12px;
}

.trend-note strong {
  color: #4c53f5;
}

.insight-layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 18px;
}

.ranking-panel,
.evidence-panel,
.empty-card {
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 18px 42px rgba(17, 24, 39, 0.08);
}

.ranking-panel {
  align-self: start;
  padding: 14px;
}

.ranking-panel h2 {
  margin: 0 0 10px;
  color: #111827;
  font-size: 14px;
}

.rank-item {
  width: 100%;
  display: grid;
  grid-template-columns: 26px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  padding: 10px;
  text-align: left;
  transition: background 160ms ease, transform 160ms ease;
}

.rank-item:hover,
.rank-item.active {
  background: rgba(76, 83, 245, 0.07);
}

.rank-item.active {
  transform: translateX(2px);
}

.rank-num {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 12px;
  font-weight: 900;
}

.rank-item.active .rank-num {
  background: #4c53f5;
  color: white;
}

.rank-main {
  min-width: 0;
}

.rank-main strong,
.rank-main small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-main strong {
  color: #111827;
  font-size: 13px;
}

.rank-main small {
  margin-top: 2px;
  color: #9ca3af;
  font-size: 11px;
}

.rank-main i {
  display: block;
  height: 3px;
  margin-top: 7px;
  border-radius: 999px;
  background: linear-gradient(90deg, #4c53f5, #c84fff);
}

.rank-item em {
  color: #4c53f5;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.evidence-panel {
  min-width: 0;
  padding: 20px;
}

.selected-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.selected-summary span {
  color: #9ca3af;
  font-size: 12px;
  font-weight: 800;
}

.selected-summary h2 {
  margin: 3px 0 0;
  color: #111827;
  font-size: 26px;
  letter-spacing: -0.04em;
}

.selected-summary > strong {
  color: #4c53f5;
  font-size: 26px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin: 18px 0;
}

.metric-grid div {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
}

.metric-grid span,
.metric-grid strong {
  display: block;
}

.metric-grid span {
  color: #9ca3af;
  font-size: 11px;
}

.metric-grid strong {
  margin-top: 5px;
  color: #111827;
  font-size: 17px;
}

.insight-copy {
  margin: 0 0 20px;
  padding-left: 13px;
  border-left: 3px solid rgba(76, 83, 245, 0.18);
  color: #4b5563;
  font-size: 13px;
  line-height: 1.75;
}

.video-section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.video-section-head h3 {
  margin: 0;
  color: #111827;
  font-size: 15px;
}

.video-section-head span {
  color: #9ca3af;
  font-size: 12px;
}

.compact-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.insight-skeleton,
.video-skeleton {
  display: grid;
  gap: 12px;
}

.insight-skeleton {
  grid-template-columns: 280px 1fr;
}

.insight-skeleton i,
.video-skeleton i {
  min-height: 88px;
  border-radius: 18px;
  background: linear-gradient(90deg, rgba(229, 231, 235, 0.9), rgba(255, 255, 255, 0.9), rgba(229, 231, 235, 0.9));
  background-size: 220% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.video-skeleton {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.empty-card {
  display: grid;
  place-items: center;
  min-height: 300px;
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

@media (max-width: 1020px) {
  .insight-layout {
    grid-template-columns: 1fr;
  }

  .ranking-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
    gap: 8px;
  }

  .ranking-panel h2 {
    grid-column: 1 / -1;
  }
}

@media (max-width: 720px) {
  .metric-grid,
  .compact-grid,
  .video-skeleton {
    grid-template-columns: 1fr;
  }
}
</style>
