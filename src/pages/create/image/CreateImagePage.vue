<script setup>
import { computed, ref } from 'vue'
import CreatePageShell from '../components/CreatePageShell.vue'
import {
  KKAI_DEFAULT_IMAGE_MODEL,
  createKkaiImageGeneration,
  extractKkaiAssets,
} from '../kkaiApi.js'
import { makeCreationTitle, saveCreation } from '../creationStore'

const model = ref(KKAI_DEFAULT_IMAGE_MODEL)
const prompt = ref('一只新鲜的、摆在桌子上的黄色香蕉照片，高清，写实风格')
const ratio = ref('1:1')
const style = ref('写实摄影')
const loading = ref(false)
const errorMessage = ref('')
const savedStatus = ref('')
const result = ref(null)

const quickPrompts = [
  '产品主图',
  '卖点可视化',
  '生活方式场景',
  '广告封面',
  '白底高清图',
  '社媒种草图',
]

const ratios = [
  { value: '1:1', label: '方图', size: '1024x1024' },
  { value: '4:5', label: '商品竖图', size: '1024x1536' },
  { value: '9:16', label: '短视频封面', size: '1024x1536' },
  { value: '16:9', label: '横版广告', size: '1536x1024' },
]

const styles = ['写实摄影', '电商主图', '高端质感', '生活方式', '极简白底', '社媒广告']

const examples = [
  '一瓶护肤精华摆在浅色大理石台面上，柔和自然光，高级电商摄影',
  '一双运动鞋悬浮在干净背景前，突出鞋底纹理，强光影，高清写实',
  '咖啡杯和办公桌场景，晨光，生活方式广告图，温暖质感',
]

const imageAssets = computed(() => result.value?.assets.filter((asset) => asset.type === 'image') || [])
const otherAssets = computed(() => result.value?.assets.filter((asset) => asset.type !== 'image') || [])
const selectedRatio = computed(() => ratios.find((item) => item.value === ratio.value) || ratios[0])
const canSubmit = computed(() => model.value.trim() && prompt.value.trim() && !loading.value)

const buildPrompt = () => [
  prompt.value.trim(),
  `画幅比例：${ratio.value}`,
  `视觉风格：${style.value}`,
  '要求：主体清晰，画面干净，适合跨境电商商品素材使用。',
].join('\n')

const useQuickPrompt = (label) => {
  const additions = {
    产品主图: '产品居中，白色背景，真实摄影，高清，适合商品详情页',
    卖点可视化: '用清晰视觉元素突出核心卖点，构图干净，适合广告投放',
    生活方式场景: '真实生活场景，自然光，人物可选，氛围轻松高级',
    广告封面: '强视觉中心，留出标题空间，适合 TikTok/Reels 封面',
    白底高清图: '纯白背景，无杂物，产品轮廓清晰，电商主图标准',
    社媒种草图: '自然摆拍，色彩明亮，适合 Instagram 和 TikTok 种草',
  }

  prompt.value = additions[label] || label
}

const useExample = (text) => {
  prompt.value = text
}

const generateImage = async () => {
  if (!canSubmit.value) return

  loading.value = true
  errorMessage.value = ''
  savedStatus.value = ''
  result.value = null

  try {
    const response = await createKkaiImageGeneration({
      model: model.value,
      prompt: buildPrompt(),
      size: selectedRatio.value.size,
      n: 1,
    })
    result.value = extractKkaiAssets(response)
    if (imageAssets.value.length || result.value?.text) {
      const creation = saveCreation({
        type: 'image',
        title: makeCreationTitle(prompt.value, '图片生成'),
        prompt: buildPrompt(),
        text: result.value?.text || '',
        content: result.value?.text || '',
        model: model.value,
        source: '图片生成',
        assets: result.value?.assets || [],
        params: {
          ratio: ratio.value,
          size: selectedRatio.value.size,
          style: style.value,
        },
      })
      savedStatus.value = creation ? '已保存到我的创作' : ''
    }
  } catch (error) {
    errorMessage.value = error?.message || '图片生成失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <CreatePageShell
    title="图片生成"
    description="输入商品或场景想法，快速生成适合跨境电商投放的图片素材。"
  >
    <form class="image-studio" @submit.prevent="generateImage">
      <section class="composer-panel">
        <div class="quick-row" aria-label="快捷创意">
          <button
            v-for="item in quickPrompts"
            :key="item"
            class="quick-chip"
            type="button"
            @click="useQuickPrompt(item)"
          >
            {{ item }}
          </button>
        </div>

        <div class="prompt-card">
          <div class="reference-stack" aria-hidden="true">
            <span class="ghost-card ghost-card-back"></span>
            <span class="ghost-card ghost-card-mid"></span>
            <span class="ghost-card ghost-card-front">
              <svg viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                <circle cx="9" cy="9" r="2"></circle>
                <path d="m21 15-3.2-3.2a2 2 0 0 0-2.8 0L6 21"></path>
              </svg>
              <small>参考</small>
            </span>
          </div>

          <label class="prompt-field">
            <span>描述你想生成的图片</span>
            <textarea
              v-model="prompt"
              placeholder="例如：一只新鲜的、摆在桌子上的黄色香蕉照片，高清，写实风格"
              rows="8"
            ></textarea>
          </label>
        </div>

        <div class="settings-panel">
          <div class="setting-line">
            <span class="setting-label">模型</span>
            <span class="model-pill">Siyan-image-v5 · standard</span>
          </div>

          <div class="setting-block">
            <span class="setting-label">画幅</span>
            <div class="segmented">
              <button
                v-for="item in ratios"
                :key="item.value"
                class="segment-button"
                :class="{ active: ratio === item.value }"
                type="button"
                @click="ratio = item.value"
              >
                <strong>{{ item.value }}</strong>
                <span>{{ item.label }}</span>
              </button>
            </div>
          </div>

          <div class="setting-block">
            <span class="setting-label">风格</span>
            <div class="style-grid">
              <button
                v-for="item in styles"
                :key="item"
                class="style-button"
                :class="{ active: style === item }"
                type="button"
                @click="style = item"
              >
                {{ item }}
              </button>
            </div>
          </div>

          <div class="examples">
            <button
              v-for="item in examples"
              :key="item"
              type="button"
              @click="useExample(item)"
            >
              {{ item }}
            </button>
          </div>
        </div>

        <div class="action-bar">
          <div>
            <strong>{{ selectedRatio.size }}</strong>
            <span>{{ selectedRatio.label }} · {{ style }}</span>
          </div>
          <button class="generate-button" type="submit" :disabled="!canSubmit">
            {{ loading ? '生成中...' : '生成图片' }}
          </button>
        </div>

        <p v-if="errorMessage" class="error-text">{{ errorMessage }}</p>
      </section>

      <section class="preview-panel" aria-live="polite">
        <div class="preview-header">
          <div>
            <span>Output</span>
            <h2>生成结果</h2>
          </div>
          <div class="result-status">
            <span class="status-pill">{{ loading ? '生成中' : result ? '已完成' : '待生成' }}</span>
            <span v-if="savedStatus" class="saved-pill">{{ savedStatus }}</span>
          </div>
        </div>

        <div v-if="loading" class="preview-empty loading-state">
          <span></span>
          <strong>正在生成图片</strong>
        </div>

        <div v-else-if="imageAssets.length" class="image-grid">
          <figure v-for="asset in imageAssets" :key="asset.url" class="image-card">
            <img :src="asset.url" alt="生成图片">
            <figcaption>
              <a :href="asset.url" target="_blank" rel="noreferrer">打开原图</a>
            </figcaption>
          </figure>
        </div>

        <div v-else-if="result?.text" class="text-result">{{ result.text }}</div>

        <div v-else class="preview-empty">
          <div class="empty-frame">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <strong>你的图片会出现在这里</strong>
        </div>

        <div v-if="otherAssets.length" class="asset-list">
          <a
            v-for="asset in otherAssets"
            :key="asset.url"
            :href="asset.url"
            target="_blank"
            rel="noreferrer"
          >
            {{ asset.type }} 资源
          </a>
        </div>

        <details v-if="result?.raw" class="raw-response">
          <summary>原始响应</summary>
          <pre>{{ JSON.stringify(result.raw, null, 2) }}</pre>
        </details>
      </section>
    </form>
  </CreatePageShell>
</template>

<style scoped>
.image-studio {
  --agent-rgb: 249 115 22;
  display: grid;
  grid-template-columns: minmax(420px, 0.95fr) minmax(360px, 1.05fr);
  gap: 18px;
  align-items: start;
}

.composer-panel,
.preview-panel {
  border: 1px solid rgba(229, 231, 235, 0.86);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10px 30px rgba(17, 24, 39, 0.06);
}

.composer-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.quick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-chip,
.style-button,
.segment-button,
.examples button {
  border: 1px solid rgba(229, 231, 235, 0.9);
  background: rgba(255, 255, 255, 0.86);
  color: #4b5563;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.quick-chip {
  height: 31px;
  padding: 0 11px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
}

.quick-chip:hover,
.style-button:hover,
.segment-button:hover,
.examples button:hover {
  transform: translateY(-1px);
  border-color: rgba(var(--agent-rgb), 0.38);
  color: #111827;
}

.prompt-card {
  display: grid;
  grid-template-columns: 90px minmax(0, 1fr);
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(var(--agent-rgb), 0.18);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(var(--agent-rgb), 0.08), rgba(255, 255, 255, 0.94) 40%),
    #fff;
}

.reference-stack {
  position: relative;
  width: 82px;
  height: 96px;
  align-self: start;
}

.ghost-card {
  position: absolute;
  top: 6px;
  width: 58px;
  height: 72px;
  border: 2px dashed rgba(var(--agent-rgb), 0.22);
  border-radius: 8px;
  background: rgba(249, 250, 251, 0.78);
}

.ghost-card-back {
  left: 22px;
  transform: rotate(6deg);
  opacity: 0.56;
}

.ghost-card-mid {
  left: 11px;
  transform: rotate(2deg);
  opacity: 0.72;
}

.ghost-card-front {
  left: 0;
  display: grid;
  place-items: center;
  color: rgba(var(--agent-rgb), 0.68);
  background: linear-gradient(135deg, rgba(var(--agent-rgb), 0.1), #fff);
}

.ghost-card-front svg {
  width: 22px;
  height: 22px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ghost-card-front small {
  margin-top: -16px;
  font-size: 10px;
  font-weight: 800;
}

.prompt-field {
  display: grid;
  gap: 8px;
}

.prompt-field span,
.setting-label {
  color: #6b7280;
  font-size: 12px;
  font-weight: 800;
}

.prompt-field textarea {
  width: 100%;
  min-height: 156px;
  resize: vertical;
  border: 0;
  background: transparent;
  color: #111827;
  font: inherit;
  font-size: 14px;
  line-height: 1.7;
  outline: none;
}

.settings-panel {
  display: grid;
  gap: 14px;
}

.setting-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fbfbfd;
}

.model-pill {
  color: #4338ca;
  font-size: 12px;
  font-weight: 800;
}

.setting-block {
  display: grid;
  gap: 8px;
}

.segmented {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.segment-button {
  min-height: 58px;
  display: grid;
  gap: 3px;
  justify-items: start;
  padding: 9px 10px;
  border-radius: 8px;
  text-align: left;
}

.segment-button strong {
  color: #111827;
  font-size: 13px;
}

.segment-button span {
  color: #6b7280;
  font-size: 11px;
  line-height: 1.3;
}

.segment-button.active,
.style-button.active {
  border-color: rgba(var(--agent-rgb), 0.55);
  background: rgba(var(--agent-rgb), 0.1);
  color: #9a3412;
}

.style-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.style-button {
  height: 36px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
}

.examples {
  display: grid;
  gap: 8px;
}

.examples button {
  padding: 10px 11px;
  border-radius: 8px;
  text-align: left;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 2px;
}

.action-bar div {
  display: grid;
  gap: 2px;
}

.action-bar strong {
  color: #111827;
  font-size: 13px;
}

.action-bar span {
  color: #6b7280;
  font-size: 12px;
}

.generate-button {
  min-width: 132px;
  height: 42px;
  border: 0;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-weight: 900;
  cursor: pointer;
  box-shadow: 0 12px 22px rgba(17, 24, 39, 0.18);
}

.generate-button:disabled {
  cursor: not-allowed;
  background: #9ca3af;
  box-shadow: none;
}

.error-text {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
  font-size: 12px;
  line-height: 1.5;
}

.preview-panel {
  min-height: 610px;
  padding: 16px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.preview-header span {
  color: #9ca3af;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.preview-header h2 {
  margin: 3px 0 0;
  color: #111827;
  font-size: 18px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.08);
  color: #4338ca !important;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.saved-pill {
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 10px;
  border-radius: 8px;
  background: #ecfdf3;
  color: #047857;
  font-size: 12px;
  font-weight: 800;
}

.preview-empty,
.text-result {
  display: grid;
  place-items: center;
  min-height: 486px;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background:
    linear-gradient(45deg, rgba(17, 24, 39, 0.025) 25%, transparent 25%),
    linear-gradient(-45deg, rgba(17, 24, 39, 0.025) 25%, transparent 25%),
    #fafafa;
  color: #6b7280;
  text-align: center;
}

.preview-empty strong {
  color: #4b5563;
  font-size: 13px;
}

.empty-frame {
  width: min(66%, 300px);
  aspect-ratio: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.empty-frame span {
  border-radius: 8px;
  background: linear-gradient(135deg, #eef2ff, #fff7ed);
}

.empty-frame span:first-child {
  grid-row: span 2;
}

.loading-state > span {
  width: 46px;
  height: 46px;
  border: 3px solid rgba(79, 70, 229, 0.16);
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 900ms linear infinite;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}

.image-card {
  margin: 0;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
  animation: asset-pop 360ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.image-card img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: contain;
  background: #fff;
}

.image-card figcaption {
  padding: 10px 12px;
  background: #fff;
  font-size: 13px;
  font-weight: 800;
}

.image-card a,
.asset-list a {
  color: #4338ca;
  text-decoration: none;
}

.text-result {
  place-items: start;
  padding: 16px;
  white-space: pre-wrap;
  text-align: left;
  line-height: 1.6;
}

.asset-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
  font-size: 13px;
  font-weight: 800;
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
  border-radius: 8px;
  background: #111827;
  color: #f9fafb;
  font-size: 12px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.composer-panel,
.preview-panel {
  animation: create-panel-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.preview-panel {
  animation-delay: 80ms;
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

@media (max-width: 1080px) {
  .image-studio {
    grid-template-columns: 1fr;
  }

  .preview-panel {
    min-height: auto;
  }
}

@media (max-width: 680px) {
  .prompt-card {
    grid-template-columns: 1fr;
  }

  .reference-stack {
    display: none;
  }

  .segmented,
  .style-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .action-bar {
    align-items: stretch;
    flex-direction: column;
  }

  .generate-button {
    width: 100%;
  }
}
</style>
