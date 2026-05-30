<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import {
  DEEPSEEK_DEFAULT_MODEL,
  streamDeepSeekChatCompletion,
} from '../../../utils/deepseekApi'
import { renderMarkdown } from '../../../utils/markdown'
import { makeCreationTitle, saveCreation } from '../creationStore'

const modes = [
  { value: 'product', label: '商品脚本', hint: '从商品信息生成带货脚本' },
  { value: 'rewrite', label: '爆款仿写', hint: '拆解爆款后改写成可拍脚本' },
]

const countries = [
  { value: 'US', label: '美国', flag: 'US', audience: 'TikTok Shop 美国用户' },
  { value: 'GB', label: '英国', flag: 'GB', audience: 'TikTok Shop 英国用户' },
  { value: 'JP', label: '日本', flag: 'JP', audience: 'TikTok Shop 日本用户' },
  { value: 'SG', label: '新加坡', flag: 'SG', audience: 'TikTok Shop 新加坡用户' },
]

const durations = [
  { value: '20s', label: '20 秒' },
  { value: '30s', label: '30 秒' },
  { value: '45s', label: '45 秒' },
  { value: '60s', label: '60 秒' },
]

const structures = [
  { value: 'pain-solution', label: '痛点解决' },
  { value: 'demo-proof', label: '演示证明' },
  { value: 'comparison', label: '对比种草' },
  { value: 'deal-first', label: '优惠驱动' },
]

const tones = [
  { value: 'direct', label: '直接转化' },
  { value: 'friendly', label: '朋友推荐' },
  { value: 'premium', label: '品质背书' },
  { value: 'energetic', label: '高能快节奏' },
]

const outputLanguages = [
  { value: 'zh', label: '中文脚本' },
  { value: 'en', label: '英文口播' },
  { value: 'bilingual', label: '中英双语' },
]

const samples = {
  product: [
    '便携式榨汁杯，USB-C 充电，6 叶刀头，适合健身和办公室人群',
    'TikTok 商品链接：https://www.tiktok.com/shop/p/123456，重点突出懒人清洁和送礼场景',
    '儿童可调节学习台灯，护眼、定时、三档亮度，目标人群是有小学生的家长',
  ],
  rewrite: [
    '爆款视频开头：Nobody told me this tiny gadget could clean my whole desk in 10 seconds...',
    '参考视频是先展示脏乱桌面，再用产品快速清洁，最后给优惠码。请改成键盘清洁套装脚本。',
    '仿写一个“Before/After 强反差”结构，产品是旅行收纳压缩袋，强调节省行李箱空间。',
  ],
}

const mode = ref('product')
const country = ref('US')
const duration = ref('30s')
const structure = ref('pain-solution')
const tone = ref('direct')
const outputLanguage = ref('zh')
const productInput = ref('')
const productBrief = ref('')
const referenceInput = ref('')
const adaptationProduct = ref('')
const audience = ref('TikTok Shop 美国用户')
const model = ref("Tangan-agent-v5")
const result = ref('')
const errorMessage = ref('')
const copyStatus = ref('')
const savedStatus = ref('')
const isLoading = ref(false)
const outputRef = ref(null)
const renderedResult = ref('')
let abortController = null
let renderTimer = null
let lastRenderAt = 0
let scrollFrame = null

const STREAM_RENDER_INTERVAL = 80

const activeMode = computed(() => modes.find((item) => item.value === mode.value) || modes[0])
const activeCountry = computed(() => countries.find((item) => item.value === country.value) || countries[0])
const activeDuration = computed(() => durations.find((item) => item.value === duration.value) || durations[1])
const activeStructure = computed(() => structures.find((item) => item.value === structure.value) || structures[0])
const activeTone = computed(() => tones.find((item) => item.value === tone.value) || tones[0])
const activeLanguage = computed(() => outputLanguages.find((item) => item.value === outputLanguage.value) || outputLanguages[0])
const primaryInput = computed(() => (mode.value === 'product' ? productInput.value : referenceInput.value).trim())
const canGenerate = computed(() => Boolean(primaryInput.value) && !isLoading.value)
const currentSamples = computed(() => samples[mode.value] || samples.product)
const resultStatus = computed(() => {
  if (isLoading.value) return '生成中'
  if (result.value.trim()) return '已生成'
  return '待生成'
})

const selectMode = (nextMode) => {
  if (isLoading.value) return
  mode.value = nextMode
  errorMessage.value = ''
  copyStatus.value = ''
  savedStatus.value = ''
}

const updateCountry = (event) => {
  country.value = event.target.value
  const nextCountry = countries.find((item) => item.value === country.value)
  if (nextCountry) audience.value = nextCountry.audience
}

const useSample = (sample) => {
  if (mode.value === 'product') {
    productInput.value = sample
  } else {
    referenceInput.value = sample
  }
}

const buildPrompt = () => {
  const common = [
    `目标市场：${activeCountry.value.label}`,
    `目标受众：${audience.value || activeCountry.value.audience}`,
    `视频时长：${activeDuration.value.label}`,
    `脚本结构：${activeStructure.value.label}`,
    `表达风格：${activeTone.value.label}`,
    `输出语言：${activeLanguage.value.label}`,
  ]

  const taskLines = mode.value === 'product'
    ? [
      '任务：基于商品信息生成 TikTok Shop 带货短视频脚本。',
      `商品/链接/关键词：${productInput.value.trim()}`,
      `补充卖点/禁忌/素材条件：${productBrief.value.trim() || '无'}`,
    ]
    : [
      '任务：先拆解参考爆款，再把结构改写成新的 TikTok Shop 带货脚本。',
      `参考爆款/脚本/链接：${referenceInput.value.trim()}`,
      `要适配的商品：${adaptationProduct.value.trim() || '由参考内容推断，并明确假设'}`,
      `改写要求：${productBrief.value.trim() || '无'}`,
    ]

  return [
    ...taskLines,
    '',
    ...common,
    '',
    '请按以下结构输出，内容要能直接交给拍摄团队：',
    '1. 核心卖点提炼：3-5 条，标注对应用户痛点。',
    '2. 3 秒开头钩子：给 5 个可直接口播的版本。',
    '3. 完整口播脚本：按时间段拆分，语气自然，避免夸大承诺。',
    '4. 分镜表：用 Markdown 表格输出「时间｜画面｜口播｜字幕｜道具/动作」。',
    '5. CTA 与评论区引导：给 3 个版本。',
    '6. 拍摄注意事项：列出镜头节奏、风险词规避、可替换素材。',
  ].join('\n')
}

const scrollOutput = () => {
  if (scrollFrame) return

  scrollFrame = window.requestAnimationFrame(async () => {
    scrollFrame = null
    await nextTick()
    const target = outputRef.value
    if (!target) return
    target.scrollTop = target.scrollHeight
  })
}

const flushRenderedResult = () => {
  if (renderTimer) {
    window.clearTimeout(renderTimer)
    renderTimer = null
  }

  lastRenderAt = window.performance.now()
  renderedResult.value = result.value.trim() ? renderMarkdown(result.value) : ''
  scrollOutput()
}

const scheduleRenderedResult = () => {
  if (renderTimer) return

  const now = window.performance.now()
  const delay = Math.max(0, STREAM_RENDER_INTERVAL - (now - lastRenderAt))
  renderTimer = window.setTimeout(() => {
    renderTimer = null
    lastRenderAt = window.performance.now()
    renderedResult.value = result.value.trim() ? renderMarkdown(result.value) : ''
    scrollOutput()
  }, delay)
}

const setResult = (value, options = {}) => {
  result.value = value
  if (options.immediate) {
    flushRenderedResult()
    return
  }
  scheduleRenderedResult()
}

const generateScript = async () => {
  if (!canGenerate.value) return

  if (abortController) abortController.abort()
  abortController = new AbortController()
  isLoading.value = true
  errorMessage.value = ''
  copyStatus.value = ''
  savedStatus.value = ''
  setResult('', { immediate: true })

  const messages = [
    {
      role: 'system',
      content: [
        '你是糖安罗盘的跨境电商短视频脚本策略师，擅长 TikTok Shop 带货内容、爆款结构拆解和拍摄执行。',
        '输出必须具体、可拍、可复用，避免空泛营销词。',
        '不要编造平台数据、销量、功效或用户评价；遇到链接无法读取时，基于用户已输入的信息生成并说明假设。',
      ].join('\n'),
    },
    {
      role: 'user',
      content: buildPrompt(),
    },
  ]

  try {
    let streamed = ''
    await streamDeepSeekChatCompletion({
      messages,
      model: 'deepseek-v4-flash',
      signal: abortController.signal,
      temperature: 0.72,
      maxTokens: 2200,
      onDelta: (delta) => {
        streamed += delta
        setResult(streamed)
      },
    })

    const finalContent = streamed.trim()
    setResult(finalContent || '小思Agent 暂时没有返回有效内容，请补充商品信息后再试。', { immediate: true })
    if (finalContent) {
      const creation = saveCreation({
        type: 'script',
        title: makeCreationTitle(primaryInput.value, activeMode.value.label),
        prompt: buildPrompt(),
        content: finalContent,
        text: finalContent,
        model: model.value,
        source: activeMode.value.label,
        params: {
          mode: activeMode.value.label,
          country: activeCountry.value.label,
          duration: activeDuration.value.label,
          structure: activeStructure.value.label,
          tone: activeTone.value.label,
          outputLanguage: activeLanguage.value.label,
          audience: audience.value,
        },
      })
      savedStatus.value = creation ? '已保存到我的创作' : ''
    }
  } catch (error) {
    const partial = result.value.trim()
    if (error?.name === 'AbortError') {
      setResult(partial ? `${partial}\n\n（已停止生成）` : '已停止生成。', { immediate: true })
    } else {
      errorMessage.value = error?.message || '小思Agent 请求失败，请稍后重试。'
      setResult(partial, { immediate: true })
    }
  } finally {
    isLoading.value = false
    abortController = null
    flushRenderedResult()
  }
}

const stopGeneration = () => {
  abortController?.abort()
}

const copyResult = async () => {
  if (!result.value.trim()) return

  try {
    await navigator.clipboard.writeText(result.value)
    copyStatus.value = '已复制'
  } catch {
    copyStatus.value = '复制失败'
  }

  window.setTimeout(() => {
    copyStatus.value = ''
  }, 1600)
}

const resetForm = () => {
  if (isLoading.value) stopGeneration()
  productInput.value = ''
  productBrief.value = ''
  referenceInput.value = ''
  adaptationProduct.value = ''
  audience.value = activeCountry.value.audience
  setResult('', { immediate: true })
  errorMessage.value = ''
  copyStatus.value = ''
  savedStatus.value = ''
}

onBeforeUnmount(() => {
  abortController?.abort()
  if (renderTimer) window.clearTimeout(renderTimer)
  if (scrollFrame) window.cancelAnimationFrame(scrollFrame)
})
</script>

<template>
  <main class="script-generator-page">
    <header class="script-topbar">
      <div class="mobile-bar">
        <button aria-label="菜单" class="icon-button" type="button">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5h16"></path>
            <path d="M4 12h16"></path>
            <path d="M4 19h16"></path>
          </svg>
        </button>
        <img src="/assets/icons/tangan-logo.png" alt="出海匠" class="mobile-logo">
      </div>

      <nav class="breadcrumb" aria-label="Breadcrumb">
        <span class="crumb-main">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="m12.296 3.464 3.02 3.956"></path>
            <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"></path>
            <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <path d="m6.18 5.276 3.1 3.899"></path>
          </svg>
          创作
        </span>
        <svg class="crumb-arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6"></path>
        </svg>
        <span class="crumb-current">脚本生成</span>
      </nav>
    </header>

    <section class="script-content">
      <div class="page-heading">
        <div>
          <span class="heading-kicker">小思Agent</span>
          <h1>带货视频脚本生成</h1>
          <p>输入商品或爆款参考，生成口播、分镜、字幕和 CTA。</p>
        </div>
        <span class="model-badge">{{ model }}</span>
      </div>

      <form class="script-workspace" @submit.prevent="generateScript">
        <section class="composer-panel" aria-label="脚本参数">
          <div class="mode-switch" role="tablist" aria-label="脚本模式">
            <button
              v-for="item in modes"
              :key="item.value"
              class="mode-button"
              :class="{ active: mode === item.value }"
              type="button"
              role="tab"
              :aria-selected="mode === item.value"
              @click="selectMode(item.value)"
            >
              <strong>{{ item.label }}</strong>
              <span>{{ item.hint }}</span>
            </button>
          </div>

          <div class="input-stack">
            <label v-if="mode === 'product'" class="field-block">
              <span>商品名称、链接或关键词</span>
              <textarea
                v-model="productInput"
                rows="5"
                placeholder="输入商品名称、TikTok 商品链接、亚马逊链接，或直接粘贴商品卖点"
              ></textarea>
            </label>

            <template v-else>
              <label class="field-block">
                <span>爆款参考</span>
                <textarea
                  v-model="referenceInput"
                  rows="5"
                  placeholder="粘贴爆款视频链接、口播文案、分镜结构或你观察到的内容节奏"
                ></textarea>
              </label>
              <label class="field-block">
                <span>适配商品</span>
                <input
                  v-model="adaptationProduct"
                  type="text"
                  placeholder="输入要套用该爆款结构的商品"
                >
              </label>
            </template>

            <label class="field-block">
              <span>{{ mode === 'product' ? '补充卖点和素材限制' : '改写要求' }}</span>
              <textarea
                v-model="productBrief"
                rows="3"
                :placeholder="mode === 'product' ? '例如：必须突出免安装、可水洗；不要提医疗功效' : '例如：保留强反差开头，减少夸张语气，加入优惠 CTA'"
              ></textarea>
            </label>
          </div>

          <div class="quick-samples" aria-label="示例输入">
            <button
              v-for="sample in currentSamples"
              :key="sample"
              type="button"
              @click="useSample(sample)"
            >
              {{ sample }}
            </button>
          </div>

          <div class="control-grid">
            <label>
              <span>市场</span>
              <select :value="country" @change="updateCountry">
                <option v-for="item in countries" :key="item.value" :value="item.value">
                  {{ item.flag }} · {{ item.label }}
                </option>
              </select>
            </label>

            <label>
              <span>视频时长</span>
              <select v-model="duration">
                <option v-for="item in durations" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>

            <label>
              <span>结构</span>
              <select v-model="structure">
                <option v-for="item in structures" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>

            <label>
              <span>语气</span>
              <select v-model="tone">
                <option v-for="item in tones" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>

            <label>
              <span>输出语言</span>
              <select v-model="outputLanguage">
                <option v-for="item in outputLanguages" :key="item.value" :value="item.value">
                  {{ item.label }}
                </option>
              </select>
            </label>
 
          </div>

          <label class="field-block">
            <span>目标受众</span>
            <input v-model="audience" type="text" placeholder="例如：25-35 岁通勤女性、健身新手、宠物主人">
          </label>

          <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>

          <div class="action-bar">
            <div class="action-summary">
              <strong>{{ activeMode.label }} · {{ activeCountry.label }}</strong>
              <span>{{ activeDuration.label }} / {{ activeStructure.label }} / {{ activeTone.label }}</span>
            </div>
            <div class="action-buttons">
              <button class="ghost-button" type="button" @click="resetForm">清空</button>
              <button
                v-if="isLoading"
                class="stop-button"
                type="button"
                @click="stopGeneration"
              >
                停止
              </button>
              <button class="generate-button" type="submit" :disabled="!canGenerate">
                {{ isLoading ? '生成中...' : '生成脚本' }}
              </button>
            </div>
          </div>
        </section>

        <section class="output-panel" aria-live="polite">
          <div class="output-header">
            <div>
              <span>Output</span>
              <h2>小思Agent 脚本结果</h2>
            </div>
            <div class="output-actions">
              <span class="status-pill" :class="{ active: isLoading }">{{ resultStatus }}</span>
              <span v-if="savedStatus" class="saved-pill">{{ savedStatus }}</span>
              <button
                class="ghost-button compact"
                type="button"
                :disabled="!result.trim()"
                @click="copyResult"
              >
                {{ copyStatus || '复制' }}
              </button>
            </div>
          </div>

          <div ref="outputRef" class="output-body">
            <div v-if="result.trim()" class="markdown-body script-result" :class="{ streaming: isLoading }" v-html="renderedResult"></div>

            <div v-else class="empty-state">
              <div class="empty-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M8 4h8"></path>
                  <path d="M6 8h12"></path>
                  <path d="M8 12h8"></path>
                  <path d="M7 20h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"></path>
                </svg>
              </div>
              <strong>脚本会实时出现在这里</strong>
              <span>包含卖点、钩子、完整口播、分镜表和 CTA。</span>
            </div>
          </div>
        </section>
      </form>
    </section>
  </main>
</template>

<style scoped>
.script-generator-page {
  flex: 1;
  min-width: 0;
  min-height: 100dvh;
  margin-left: 244px;
  display: flex;
  flex-direction: column;
  background: #f6f7fb;
  transition: margin-left 200ms ease-out;
}

.script-topbar {
  position: sticky;
  top: var(--promo-banner-h, 0px);
  z-index: 30;
  height: var(--header-height, 56px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: rgba(246, 247, 251, 0.9);
  backdrop-filter: blur(14px);
  clip-path: inset(0 0 -20px 0);
}

.mobile-bar {
  display: none;
}

.mobile-logo {
  height: 20px;
  width: auto;
  margin-left: 8px;
}

.breadcrumb,
.crumb-main,
.crumb-current {
  display: inline-flex;
  align-items: center;
}

.breadcrumb {
  gap: 8px;
  color: #667085;
  font-size: 14px;
}

.crumb-main,
.crumb-current {
  gap: 6px;
  font-weight: 700;
}

.crumb-main {
  color: #3f4656;
}

.crumb-current {
  color: #111827;
}

svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.crumb-arrow {
  width: 14px;
  height: 14px;
  color: #98a2b3;
}

.script-content {
  width: min(100% - 32px, 1320px);
  margin: 0 auto;
  padding: 24px 0 120px;
}

.page-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.heading-kicker,
.model-badge,
.status-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 800;
}

.heading-kicker {
  background: #eaf5ee;
  color: #047857;
}

.page-heading h1 {
  margin: 10px 0 6px;
  color: #101828;
  font-size: 32px;
  line-height: 1.16;
}

.page-heading p {
  margin: 0;
  color: #667085;
  font-size: 14px;
  line-height: 1.7;
}

.model-badge {
  border: 1px solid #d0d5dd;
  background: #fff;
  color: #344054;
}

.script-workspace {
  display: grid;
  grid-template-columns: minmax(380px, 0.92fr) minmax(420px, 1.08fr);
  gap: 18px;
  align-items: start;
}

.composer-panel,
.output-panel {
  border: 1px solid #e4e7ec;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.06);
}

.composer-panel {
  display: grid;
  gap: 14px;
  padding: 16px;
}

.mode-switch {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  padding: 4px;
  border: 1px solid #eaecf0;
  border-radius: 8px;
  background: #f8fafc;
}

.mode-button {
  min-height: 58px;
  display: grid;
  gap: 3px;
  justify-items: start;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #667085;
  padding: 10px 12px;
  text-align: left;
  cursor: pointer;
}

.mode-button strong {
  color: #344054;
  font-size: 14px;
}

.mode-button span {
  font-size: 12px;
  line-height: 1.35;
}

.mode-button.active {
  background: #fff;
  color: #155eef;
  box-shadow: 0 1px 4px rgba(16, 24, 40, 0.1);
}

.mode-button.active strong {
  color: #155eef;
}

.input-stack,
.control-grid,
.field-block {
  display: grid;
  gap: 8px;
}

.field-block span,
.control-grid span {
  color: #667085;
  font-size: 12px;
  font-weight: 800;
}

.field-block textarea,
.field-block input,
.control-grid select,
.control-grid input {
  width: 100%;
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  background: #fff;
  color: #101828;
  font: inherit;
  font-size: 14px;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.field-block textarea {
  min-height: 96px;
  padding: 11px 12px;
  resize: vertical;
  line-height: 1.65;
}

.field-block input,
.control-grid select,
.control-grid input {
  height: 40px;
  padding: 0 11px;
}

.field-block textarea:focus,
.field-block input:focus,
.control-grid select:focus,
.control-grid input:focus {
  border-color: #2e90fa;
  box-shadow: 0 0 0 3px rgba(46, 144, 250, 0.13);
}

.quick-samples {
  display: grid;
  gap: 8px;
}

.quick-samples button,
.ghost-button,
.stop-button,
.generate-button {
  border-radius: 8px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease, color 160ms ease;
}

.quick-samples button {
  border: 1px solid #eaecf0;
  background: #fcfcfd;
  color: #667085;
  padding: 9px 10px;
  text-align: left;
  font-size: 12px;
  line-height: 1.45;
}

.quick-samples button:hover,
.ghost-button:hover,
.stop-button:hover,
.generate-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.control-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.error-banner {
  margin: 0;
  padding: 10px 12px;
  border: 1px solid #fecaca;
  border-radius: 8px;
  background: #fff5f5;
  color: #b42318;
  font-size: 13px;
  line-height: 1.5;
}

.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding-top: 2px;
}

.action-summary {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.action-summary strong {
  color: #101828;
  font-size: 13px;
}

.action-summary span {
  color: #667085;
  font-size: 12px;
}

.action-buttons,
.output-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ghost-button,
.stop-button,
.generate-button {
  height: 40px;
  border: 1px solid #d0d5dd;
  padding: 0 13px;
  font-size: 13px;
}

.ghost-button {
  background: #fff;
  color: #344054;
}

.ghost-button.compact {
  height: 32px;
  padding: 0 11px;
}

.ghost-button:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.stop-button {
  border-color: #fecaca;
  background: #fff5f5;
  color: #b42318;
}

.generate-button {
  min-width: 108px;
  border-color: #111827;
  background: #111827;
  color: #fff;
}

.generate-button:disabled {
  cursor: not-allowed;
  border-color: #d0d5dd;
  background: #98a2b3;
}

.output-panel {
  min-height: 720px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid #eaecf0;
}

.output-header span:first-child {
  color: #98a2b3;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
}

.output-header h2 {
  margin: 3px 0 0;
  color: #101828;
  font-size: 18px;
  line-height: 1.3;
}

.status-pill {
  background: #f2f4f7;
  color: #475467;
}

.saved-pill {
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 9px;
  border-radius: 8px;
  background: #ecfdf3;
  color: #047857;
  font-size: 12px;
  font-weight: 800;
}

.status-pill.active {
  background: #ecfdf3;
  color: #027a48;
}

.output-body {
  flex: 1;
  min-height: 640px;
  max-height: calc(100dvh - 210px);
  overflow: auto;
  padding: 18px;
  background: #fff;
}

.script-result {
  color: #1d2939;
  font-size: 14px;
  overflow-anchor: auto;
  contain: layout paint;
  transform: translateZ(0);
}

.script-result.streaming :deep(p:last-child)::after,
.script-result.streaming :deep(li:last-child)::after {
  content: "";
  display: inline-block;
  width: 2px;
  height: 1em;
  margin-left: 3px;
  vertical-align: text-bottom;
  border-radius: 1px;
  background: #155eef;
  animation: caret-pulse 1.1s ease-in-out infinite;
}

.empty-state {
  min-height: 560px;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 9px;
  border: 1px dashed #d0d5dd;
  border-radius: 8px;
  background: #fcfcfd;
  color: #667085;
  text-align: center;
}

.empty-state strong {
  color: #344054;
  font-size: 14px;
}

.empty-state span {
  max-width: 330px;
  font-size: 13px;
  line-height: 1.6;
}

.empty-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #eff8ff;
  color: #175cd3;
}

.empty-icon svg {
  width: 27px;
  height: 27px;
}

.composer-panel,
.output-panel {
  animation: create-panel-in 420ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.output-panel {
  animation-delay: 80ms;
}

.mode-button.active,
.status-pill,
.saved-pill {
  transition: background 180ms ease, color 180ms ease, box-shadow 180ms ease, transform 180ms ease;
}

.icon-button {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #344054;
}

@keyframes caret-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.28;
  }
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

@media (max-width: 1120px) {
  .script-workspace {
    grid-template-columns: 1fr;
  }

  .output-panel {
    min-height: 520px;
  }

  .output-body {
    min-height: 460px;
    max-height: none;
  }
}

@media (max-width: 767px) {
  .script-generator-page {
    margin-left: 0;
  }

  .script-topbar {
    padding: 0 12px;
  }

  .mobile-bar {
    display: flex;
    align-items: center;
  }

  .breadcrumb {
    display: none;
  }

  .script-content {
    width: min(100% - 24px, 1320px);
    padding-top: 18px;
  }

  .page-heading,
  .action-bar,
  .output-header {
    align-items: stretch;
    flex-direction: column;
  }

  .control-grid,
  .mode-switch {
    grid-template-columns: 1fr;
  }

  .action-buttons,
  .output-actions {
    width: 100%;
  }

  .ghost-button,
  .stop-button,
  .generate-button {
    flex: 1;
  }
}
</style>
