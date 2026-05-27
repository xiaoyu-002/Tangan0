<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  SIYAN_VIDEO_DISPLAY_MODEL,
  createAireiterTaskId,
  extractAireiterVideoResult,
  pollAireiterTask,
  submitSeedanceFastVideo,
} from '../aireiterApi.js'
import CreatePageShell from '../components/CreatePageShell.vue'
import { makeCreationTitle, saveCreation, updateCreation } from '../creationStore'

const model = ref(SIYAN_VIDEO_DISPLAY_MODEL)
const prompt = ref('为一款 TikTok Shop 便携式榨汁杯生成 8 秒竖屏短视频：前三秒展示通勤没时间吃水果的痛点，中段展示榨汁和清洗，结尾突出便携、USB-C 充电和适合健身人群。')
const ratio = ref('9:16')
const duration = ref(8)
const motion = ref('自然手持镜头')
const style = ref('真实电商广告')
const taskId = ref('')
const taskStatus = ref('')
const loading = ref(false)
const errorMessage = ref('')
const savedStatus = ref('')
const result = ref(null)

let abortController = null
let activeCreationId = ''
let stopRequested = false

const ratios = [
  { value: '9:16', label: '9:16 竖屏', resolution: '720p' },
  { value: '16:9', label: '16:9 横屏', resolution: '720p' },
  { value: '1:1', label: '1:1 方形', resolution: '720p' },
]
const durations = [5, 8, 10]
const motions = ['自然手持镜头', '产品特写推进', '生活方式跟拍', '电影感慢推', '快节奏广告剪辑']
const styles = ['真实电商广告', '生活方式 Vlog', '高级产品大片', 'UGC 达人推荐', '清爽科技感']
const promptSamples = [
  '为一款免安装无线补光灯生成 8 秒竖屏视频：开头展示昏暗自拍痛点，中段展示夹在电脑和手机上的效果，结尾突出三档亮度和直播带货场景。',
  '为旅行压缩收纳袋生成 8 秒短视频：前三秒展示行李箱塞不下，中段演示压缩前后对比，结尾强调省空间、适合周末旅行。',
  '为宠物自动饮水机生成 8 秒视频：开头展示猫咪不爱喝水，中段展示循环活水和滤芯，结尾突出安静运行和透明水位。',
]

const selectedRatio = computed(() => ratios.find((item) => item.value === ratio.value) || ratios[0])
const videoAssets = computed(() => result.value?.assets.filter((asset) => asset.type === 'video') || [])
const canSubmit = computed(() => prompt.value.trim() && !loading.value)
const activeStep = computed(() => {
  if (result.value) return 3
  if (loading.value && taskStatus.value && taskStatus.value !== '任务已提交') return 2
  if (loading.value || taskId.value) return 1
  return 0
})
const progressSteps = [
  { label: '提交任务', hint: 'Submit' },
  { label: '生成中', hint: 'Render' },
  { label: '完成保存', hint: 'Save' },
]
const statusLabel = computed(() => {
  if (loading.value && taskStatus.value) return taskStatus.value
  if (loading.value) return '提交任务中'
  if (result.value) return '已完成'
  return '等待提交'
})

const buildPrompt = () => [
  prompt.value.trim(),
  '',
  `画幅：${ratio.value}`,
  `时长：${duration.value} 秒`,
  `风格：${style.value}`,
  `镜头语言：${motion.value}`,
  '要求：适合 TikTok/Reels 投放，开头抓人，主体动作清楚，结尾有明确购买理由；不要出现平台水印、乱码字幕或变形文字。',
].join('\n')

const buildParams = () => ({
  prompt: buildPrompt(),
  type: 'all_reference',
  aspect_ratio: ratio.value,
  video_length: String(duration.value),
  resolution: selectedRatio.value.resolution,
  generate_audio: true,
})

const useSample = (sample) => {
  if (loading.value) return
  prompt.value = sample
}

const updateTaskStatus = (task) => {
  const rawStatus = task?.status || 'processing'
  const statusMap = {
    pending: '排队中',
    submitted: '任务已提交',
    queued: '排队中',
    running: '生成中',
    processing: '生成中',
    completed: '生成完成',
    failed: '生成失败',
  }
  taskStatus.value = statusMap[rawStatus] || rawStatus
}

const buildCreationContent = (status = '') => {
  const content = [
    prompt.value.trim(),
    '',
    `Aireiter 任务 ID：${taskId.value}`,
    status ? `任务状态：${status}` : '',
  ].filter(Boolean).join('\n')

  return content
}

const buildCreationParams = (status = 'submitted', extra = {}) => ({
  ratio: ratio.value,
  duration: `${duration.value}s`,
  motion: motion.value,
  style: style.value,
  taskId: taskId.value,
  provider: 'Aireiter',
  providerStatus: status,
  ...extra,
})

const savePendingVideoCreation = () => {
  const content = buildCreationContent('已提交，等待生成完成')
  const creation = saveCreation({
    type: 'video',
    title: makeCreationTitle(prompt.value, 'Seedance 视频'),
    prompt: buildPrompt(),
    text: content,
    content,
    model: model.value,
    source: 'Aireiter Seedance 2.0 Fast',
    assets: [],
    params: buildCreationParams('submitted'),
  })

  activeCreationId = creation?.id || ''
  savedStatus.value = creation ? '任务 ID 已保存到我的创作' : ''
}

const updateSavedVideoCreation = (status = 'processing', patch = {}) => {
  if (!activeCreationId) return null

  const content = buildCreationContent(status === 'completed' ? '生成完成' : status)
  const updated = updateCreation(activeCreationId, {
    text: content,
    content,
    assets: patch.assets || result.value?.assets || [],
    params: buildCreationParams(status, patch.params || {}),
  })

  if (updated) savedStatus.value = status === 'completed' ? '已更新到我的创作' : '任务 ID 已保存到我的创作'
  return updated
}

const generateVideo = async () => {
  if (!canSubmit.value) return

  stopRequested = false
  abortController?.abort()
  abortController = new AbortController()
  loading.value = true
  errorMessage.value = ''
  savedStatus.value = ''
  result.value = null
  taskStatus.value = ''
  taskId.value = createAireiterTaskId()
  activeCreationId = ''
  savePendingVideoCreation()

  try {
    await submitSeedanceFastVideo({
      outTaskId: taskId.value,
      params: buildParams(),
      signal: abortController.signal,
    })
    taskStatus.value = '任务已提交'
    updateSavedVideoCreation('submitted')

    const completedTask = await pollAireiterTask({
      outTaskId: taskId.value,
      signal: abortController.signal,
      onStatus: (task) => {
        updateTaskStatus(task)
        updateSavedVideoCreation(task?.status || 'processing')
      },
    })
    result.value = extractAireiterVideoResult(completedTask)
    updateSavedVideoCreation('completed', {
      assets: result.value.assets,
      params: {
        rawStatus: completedTask?.status || 'completed',
      },
    })
  } catch (error) {
    if (error?.name === 'AbortError') {
      errorMessage.value = stopRequested ? '已停止本地轮询，可在我的创作继续查询。' : ''
      updateSavedVideoCreation(stopRequested ? 'stopped' : 'submitted')
    } else {
      errorMessage.value = error?.message || '视频生成失败'
      updateSavedVideoCreation('submit_failed', {
        params: {
          error: errorMessage.value,
        },
      })
    }
  } finally {
    loading.value = false
    abortController = null
  }
}

const stopGeneration = () => {
  stopRequested = true
  abortController?.abort()
}

onBeforeUnmount(() => {
  stopRequested = false
  abortController?.abort()
})
</script>

<template>
  <CreatePageShell
    title="视频创作"
    description="使用 Siyan-video-v3-flash 生成可投放短视频。"
  >
    <form class="video-workbench" @submit.prevent="generateVideo">
      <section class="video-panel">
        <div class="panel-head">
          <div>
            <span>Text to Video</span>
            <h2>Seedance 任务配置</h2>
          </div>
          <strong>{{ selectedRatio.resolution }}</strong>
        </div>

        <div class="parameter-strip">
          <div>
            <span>模型</span>
            <strong>{{ model }}</strong>
          </div>
          <div>
            <span>画幅</span>
            <strong>{{ ratio }}</strong>
          </div>
          <div>
            <span>时长</span>
            <strong>{{ duration }}s</strong>
          </div>
        </div>

        <div class="model-card">
          <span>当前模型</span>
          <strong>{{ model }}</strong>
          <small>平台内置视频模型，生成任务会自动排队并同步保存。</small>
        </div>

        <label class="field">
          <span>提示词</span>
          <textarea
            v-model="prompt"
            placeholder="描述你要生成的视频内容、产品、镜头和卖点"
            rows="7"
          ></textarea>
        </label>

        <div class="sample-row" aria-label="提示词示例">
          <button
            v-for="sample in promptSamples"
            :key="sample"
            type="button"
            :disabled="loading"
            @click="useSample(sample)"
          >
            {{ sample }}
          </button>
        </div>

        <div class="field-grid compact">
          <label class="field">
            <span>比例</span>
            <select v-model="ratio">
              <option v-for="item in ratios" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </label>

          <label class="field">
            <span>时长</span>
            <select v-model.number="duration">
              <option v-for="item in durations" :key="item" :value="item">{{ item }} 秒</option>
            </select>
          </label>
        </div>

        <div class="field-grid compact">
          <label class="field">
            <span>风格</span>
            <select v-model="style">
              <option v-for="item in styles" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>

          <label class="field">
            <span>镜头</span>
            <select v-model="motion">
              <option v-for="item in motions" :key="item" :value="item">{{ item }}</option>
            </select>
          </label>
        </div>

        <div class="actions">
          <button class="primary-action" type="submit" :disabled="!canSubmit">
            {{ loading ? '生成中...' : '生成视频' }}
          </button>
          <button v-if="loading" class="ghost-action" type="button" @click="stopGeneration">停止</button>
          <p class="status-text">生成完成后会自动保存到我的创作。</p>
        </div>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </section>

      <section class="result-panel" aria-live="polite">
        <div class="result-header">
          <div>
            <span>{{ model }}</span>
            <h2>生成结果</h2>
          </div>
          <div class="result-status">
            <span>{{ statusLabel }}</span>
            <span v-if="savedStatus" class="saved-pill">{{ savedStatus }}</span>
          </div>
        </div>

        <div class="progress-track">
          <div
            v-for="(step, index) in progressSteps"
            :key="step.label"
            class="progress-step"
            :class="{ active: activeStep >= index + 1, current: activeStep === index + 1 }"
          >
            <i>{{ index + 1 }}</i>
            <span>{{ step.label }}</span>
            <small>{{ step.hint }}</small>
          </div>
        </div>

        <div v-if="taskId" class="task-card">
          <span>任务 ID</span>
          <strong>{{ taskId }}</strong>
        </div>

        <div v-if="loading" class="loading-state">
          <i></i>
          <strong>{{ taskStatus || '正在提交任务' }}</strong>
          <span>任务完成后会自动显示视频，并保存到我的创作。</span>
        </div>

        <div v-else-if="videoAssets.length" class="video-list">
          <figure v-for="asset in videoAssets" :key="asset.url" class="video-card">
            <div class="video-frame">
              <video :src="asset.url" controls playsinline></video>
            </div>
            <figcaption>
              <span>Seedance 输出视频</span>
              <a :href="asset.url" target="_blank" rel="noreferrer">打开视频</a>
            </figcaption>
          </figure>
        </div>

        <div v-else class="empty-state">提交后会在这里显示生成状态和最终视频。</div>

        <details v-if="result?.raw" class="raw-response">
          <summary>原始响应</summary>
          <pre>{{ JSON.stringify(result.raw, null, 2) }}</pre>
        </details>
      </section>
    </form>
  </CreatePageShell>
</template>

<style scoped>
.video-workbench {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(420px, 1.1fr);
  gap: 20px;
  align-items: start;
}

.video-panel,
.result-panel {
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 34px rgba(16, 24, 40, 0.07);
  animation: create-panel-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.video-panel {
  display: grid;
  gap: 15px;
  padding: 18px;
}

.result-panel {
  min-height: 520px;
  padding: 18px;
  animation-delay: 80ms;
}

.panel-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eaecf0;
}

.panel-head span,
.result-header > div > span {
  color: #155eef;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.panel-head h2 {
  margin: 4px 0 0;
  color: #101828;
  font-size: 18px;
  line-height: 1.3;
}

.panel-head strong {
  display: inline-flex;
  align-items: center;
  min-height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  background: #eff8ff;
  color: #175cd3;
  font-size: 12px;
  font-weight: 900;
}

.parameter-strip {
  display: grid;
  grid-template-columns: 1.4fr 0.8fr 0.8fr;
  gap: 8px;
}

.parameter-strip div {
  min-width: 0;
  display: grid;
  gap: 3px;
  padding: 10px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fcfcfd;
}

.parameter-strip span {
  color: #667085;
  font-size: 11px;
  font-weight: 800;
}

.parameter-strip strong {
  overflow: hidden;
  color: #101828;
  font-size: 13px;
  font-weight: 900;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.model-card {
  display: grid;
  gap: 5px;
  padding: 13px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: linear-gradient(135deg, #eff8ff, #ffffff);
}

.model-card span {
  color: #175cd3;
  font-size: 11px;
  font-weight: 900;
}

.model-card strong {
  color: #101828;
  font-size: 18px;
  line-height: 1.2;
}

.model-card small {
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.field {
  display: grid;
  gap: 7px;
  color: #475467;
  font-size: 13px;
  font-weight: 800;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 7px;
  background: #fff;
  color: #111827;
  font: inherit;
  font-weight: 500;
  outline: none;
  transition: border-color 140ms ease, box-shadow 140ms ease;
}

.field input,
.field select {
  height: 40px;
  padding: 0 12px;
}

.field input:disabled {
  background: #f9fafb;
  color: #6b7280;
}

.field textarea {
  min-height: 168px;
  resize: vertical;
  padding: 12px;
  line-height: 1.55;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.12);
}

.sample-row {
  display: grid;
  gap: 8px;
}

.sample-row button {
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #f8fafc;
  color: #667085;
  padding: 9px 10px;
  font: inherit;
  font-size: 12px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
}

.sample-row button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #bfdbfe;
  background: #eff8ff;
}

.sample-row button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.primary-action,
.ghost-action {
  min-width: 112px;
  height: 40px;
  border-radius: 7px;
  font-weight: 800;
  cursor: pointer;
}

.primary-action {
  border: 0;
  background: #155eef;
  color: #fff;
  box-shadow: 0 10px 20px rgba(21, 94, 239, 0.18);
}

.ghost-action {
  border: 1px solid #fecaca;
  background: #fff5f5;
  color: #b42318;
}

.primary-action:disabled {
  cursor: not-allowed;
  background: #98a2b3;
  box-shadow: none;
}

.status-text,
.error-text {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.status-text {
  color: #6b7280;
}

.error-text {
  padding: 10px 12px;
  border-radius: 7px;
  background: #fef2f2;
  color: #b91c1c;
}

.result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.result-header h2 {
  margin: 3px 0 0;
  color: #111827;
  font-size: 18px;
}

.task-card span {
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.result-status > span:first-child {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 8px;
  background: #f2f4f7;
  color: #475467;
  font-size: 12px;
  font-weight: 800;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.progress-track {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}

.progress-step {
  position: relative;
  display: grid;
  gap: 3px;
  min-width: 0;
  padding: 10px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #fcfcfd;
  color: #98a2b3;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease;
}

.progress-step i {
  width: 24px;
  height: 24px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: #f2f4f7;
  color: #667085;
  font-size: 12px;
  font-style: normal;
  font-weight: 900;
}

.progress-step span {
  color: #475467;
  font-size: 12px;
  font-weight: 900;
}

.progress-step small {
  color: #98a2b3;
  font-size: 11px;
  font-weight: 800;
}

.progress-step.active {
  border-color: #bfdbfe;
  background: #eff8ff;
}

.progress-step.active i {
  background: #155eef;
  color: #fff;
}

.progress-step.current {
  box-shadow: 0 0 0 3px rgba(21, 94, 239, 0.1);
}

.saved-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 8px;
  background: #ecfdf3;
  color: #047857 !important;
  font-size: 12px;
  font-weight: 800;
}

.task-card {
  display: grid;
  gap: 4px;
  margin-bottom: 14px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fcfcfd;
}

.task-card strong {
  overflow-wrap: anywhere;
  color: #111827;
  font-size: 13px;
}

.empty-state,
.loading-state {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 8px;
  min-height: 340px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(239, 248, 255, 0.82), rgba(255, 255, 255, 0.9)),
    #fff;
  color: #6b7280;
  text-align: center;
  line-height: 1.6;
}

.loading-state i {
  width: 34px;
  height: 34px;
  border: 3px solid #e5e7eb;
  border-top-color: #4f46e5;
  border-radius: 999px;
  animation: spin 900ms linear infinite;
}

.loading-state strong {
  color: #111827;
}

.loading-state span {
  max-width: 300px;
  font-size: 13px;
}

.video-list {
  display: grid;
  gap: 14px;
}

.video-card {
  margin: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #0f172a;
  animation: asset-pop 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.video-frame {
  padding: 12px;
  background:
    linear-gradient(135deg, rgba(21, 94, 239, 0.16), transparent),
    #0f172a;
}

.video-frame video {
  display: block;
  width: min(100%, 420px);
  max-height: 620px;
  margin: 0 auto;
  border-radius: 8px;
  background: #111827;
}

.video-card figcaption {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  background: #fff;
  font-size: 13px;
  font-weight: 700;
}

.video-card figcaption span {
  color: #344054;
}

.video-card a {
  color: #4338ca;
  text-decoration: none;
}

.raw-response {
  margin-top: 16px;
  color: #374151;
  font-size: 13px;
}

.raw-response pre {
  max-height: 280px;
  overflow: auto;
  padding: 12px;
  border-radius: 7px;
  background: #111827;
  color: #f9fafb;
  font-size: 12px;
}

@keyframes create-panel-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes asset-pop {
  from {
    opacity: 0;
    transform: scale(0.975) translateY(8px);
  }

  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 980px) {
  .video-workbench {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .field-grid,
  .parameter-strip,
  .progress-track {
    grid-template-columns: 1fr;
  }

  .result-header {
    align-items: stretch;
    flex-direction: column;
  }

  .result-status {
    justify-content: flex-start;
  }
}
</style>
