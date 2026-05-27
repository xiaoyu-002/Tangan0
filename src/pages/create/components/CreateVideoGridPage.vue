<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { fetchCreativeSearch } from '../createApi'
import CreateFilterControls from './CreateFilterControls.vue'
import CreatePageShell from './CreatePageShell.vue'
import CreateVideoCard from './CreateVideoCard.vue'

const props = defineProps({
  title: {
    type: String,
    default: '热门视频',
  },
  description: {
    type: String,
    default: '展示近 7/14/30 天正在爆发的 TikTok 带货与 AI 素材，快速定位值得拆解的创意样本。',
  },
})

const timeRange = ref('7d')
const countryCode = ref('US')
const keyword = ref('')
const aiOnly = ref(false)
const videos = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')

let controller
let keywordTimer

const loadVideos = async () => {
  controller?.abort()
  controller = new AbortController()
  loading.value = true
  error.value = ''

  try {
    const data = await fetchCreativeSearch({
      keyword: keyword.value.trim(),
      timeRange: timeRange.value,
      countryCode: countryCode.value,
      aiOnly: aiOnly.value,
      limit: 20,
      signal: controller.signal,
    })
    videos.value = data.videos
    total.value = data.total
  } catch (err) {
    if (err.name !== 'AbortError') {
      error.value = err.message || '热门视频数据加载失败'
    }
  } finally {
    if (!controller.signal.aborted) loading.value = false
  }
}

watch([timeRange, countryCode, aiOnly], loadVideos)
watch(keyword, () => {
  window.clearTimeout(keywordTimer)
  keywordTimer = window.setTimeout(loadVideos, 360)
})

onMounted(loadVideos)
onBeforeUnmount(() => {
  controller?.abort()
  window.clearTimeout(keywordTimer)
})
</script>

<template>
  <CreatePageShell :title="props.title" :description="props.description">
    <CreateFilterControls
      v-model:time-range="timeRange"
      v-model:country-code="countryCode"
      v-model:keyword="keyword"
      v-model:ai-only="aiOnly"
      show-ai-toggle
      @refresh="loadVideos"
    />

    <div class="result-meta">
      <span>实时素材榜单</span>
      <strong>{{ total.toLocaleString() }} 条结果</strong>
    </div>

    <div v-if="loading" class="loading-grid" aria-label="加载中">
      <i v-for="index in 10" :key="index"></i>
    </div>

    <div v-else-if="error" class="empty-card">
      <strong>数据暂时不可用</strong>
      <p>{{ error }}</p>
      <button type="button" @click="loadVideos">重试</button>
    </div>

    <div v-else class="video-grid">
      <CreateVideoCard v-for="video in videos" :key="video.id" :video="video" />
    </div>
  </CreatePageShell>
</template>

<style scoped>
.result-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  color: #9ca3af;
  font-size: 12px;
}

.result-meta strong {
  color: #4c53f5;
}

.video-grid,
.loading-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 18px;
}

.loading-grid i {
  aspect-ratio: 9 / 16;
  border-radius: 18px;
  background:
    linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.55), transparent),
    rgba(229, 231, 235, 0.74);
  background-size: 220% 100%, 100% 100%;
  animation: shimmer 1.2s ease-in-out infinite;
}

.empty-card {
  display: grid;
  place-items: center;
  min-height: 320px;
  padding: 32px;
  border: 1px solid #e5e7eb;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
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
    background-position: -220% 0, 0 0;
  }
}
</style>
