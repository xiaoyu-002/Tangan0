<script setup>
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { streamDeepSeekChatCompletion } from '../../utils/deepseekApi'
import { renderMarkdown } from '../../utils/markdown'

const DEFAULT_MODEL = import.meta.env.VITE_DEEPSEEK_MODEL || 'deepseek-v4-flash'
const AGENT_RUNS_KEY = 'chj-agent-runs-v1'
const STEP_DURATIONS = {
  intake: 1600,
  context: 2100,
  plan: 1900,
  executeMin: 3600,
  review: 1700,
  handoff: 1300,
}

const workflowBlueprint = [
  {
    id: 'intake',
    title: '理解任务',
    description: '识别目标、约束和预期交付物',
    agents: ['总控代理', '需求分析'],
  },
  {
    id: 'context',
    title: '整理上下文',
    description: '抽取行业、用户、渠道和执行条件',
    agents: ['资料代理', '市场判断'],
  },
  {
    id: 'plan',
    title: '拆解流程',
    description: '生成可执行步骤和检查点',
    agents: ['规划代理', '执行编排'],
  },
  {
    id: 'execute',
    title: '执行生成',
    description: '调用 DeepSeek 生成完整交付结果',
    agents: ['DeepSeek', '执行代理'],
  },
  {
    id: 'review',
    title: '质量校验',
    description: '检查结构、风险、遗漏项和可落地性',
    agents: ['质检代理'],
  },
  {
    id: 'handoff',
    title: '交付归档',
    description: '整理最终产出和下一步任务',
    agents: ['交付代理'],
  },
]

const templates = [
  {
    id: 'growth',
    label: '增长方案',
    prompt: '帮我为一个跨境电商商品设计从选品判断、内容测试、达人合作到复盘优化的一整套增长执行方案。',
  },
  {
    id: 'content',
    label: '内容生产',
    prompt: '帮我完成一套 TikTok 带货短视频工作流：卖点提炼、脚本结构、镜头清单、发布节奏和复盘指标。',
  },
  {
    id: 'research',
    label: '市场调研',
    prompt: '帮我调研一个品类机会，输出目标用户、竞品切入点、价格带、风险点和测试优先级。',
  },
  {
    id: 'operations',
    label: '运营排期',
    prompt: '帮我规划未来 14 天运营排期，包含内容、店铺、达人、广告和复盘动作。',
  },
]

const modelOptions = [
  { value: 'deepseek-v4-flash', label: '快速代理' },
  { value: 'deepseek-v4-pro', label: '深度代理' },
]

const statusLabels = {
  queued: '待执行',
  running: '执行中',
  done: '已完成',
  error: '失败',
  stopped: '已停止',
}

const selectedTemplateId = ref('growth')
const input = ref(templates[0].prompt)
const model = ref(DEFAULT_MODEL)
const runs = ref([])
const activeRun = ref(null)
const isRunning = ref(false)
const errorMessage = ref('')
const activeController = ref(null)
const outputRef = ref(null)

const selectedTemplate = computed(() => templates.find((template) => template.id === selectedTemplateId.value) || templates[0])
const activeModelLabel = computed(() => modelOptions.find((option) => option.value === model.value)?.label || model.value)
const canRun = computed(() => input.value.trim().length > 0 && !isRunning.value)
const progressPercent = computed(() => {
  if (!activeRun.value?.steps?.length) return 0
  const finished = activeRun.value.steps.filter((step) => ['done', 'error', 'stopped'].includes(step.status)).length
  return Math.round((finished / activeRun.value.steps.length) * 100)
})
const progressStyle = computed(() => ({ width: `${progressPercent.value}%` }))

const createId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const makeTitle = (value = '') => {
  const text = value.trim().replace(/\s+/g, ' ')
  if (!text) return '全能代理任务'
  return text.length > 26 ? `${text.slice(0, 26)}...` : text
}

const formatTime = (timestamp) => {
  if (!timestamp) return '尚未运行'
  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(timestamp))
}

const createSteps = () => workflowBlueprint.map((step) => ({
  ...step,
  status: 'queued',
  detail: step.description,
  updatedAt: 0,
}))

const saveRuns = () => {
  try {
    window.localStorage.setItem(AGENT_RUNS_KEY, JSON.stringify(runs.value.slice(0, 8)))
  } catch (error) {
    console.warn('Failed to save agent runs', error)
  }
}

const loadRuns = () => {
  try {
    const rawRuns = window.localStorage.getItem(AGENT_RUNS_KEY)
    const parsed = rawRuns ? JSON.parse(rawRuns) : []
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((run) => run?.id && run?.prompt)
      .slice(0, 8)
      .map((run) => ({
        ...run,
        steps: Array.isArray(run.steps) && run.steps.length ? run.steps : createSteps(),
        output: String(run.output || ''),
      }))
  } catch {
    return []
  }
}

runs.value = loadRuns()
activeRun.value = runs.value[0] || null

const scrollOutput = () => {
  nextTick(() => {
    if (outputRef.value) outputRef.value.scrollTop = outputRef.value.scrollHeight
  })
}

const setStepState = (stepId, patch) => {
  if (!activeRun.value) return
  activeRun.value.steps = activeRun.value.steps.map((step) => (
    step.id === stepId ? { ...step, ...patch, updatedAt: Date.now() } : step
  ))
}

const wait = (ms, signal) => new Promise((resolve, reject) => {
  if (signal?.aborted) {
    reject(new DOMException('Aborted', 'AbortError'))
    return
  }

  const timer = window.setTimeout(resolve, ms)
  signal?.addEventListener('abort', () => {
    window.clearTimeout(timer)
    reject(new DOMException('Aborted', 'AbortError'))
  }, { once: true })
})

const runLocalStep = async (stepId, runningDetail, doneDetail, duration, signal) => {
  setStepState(stepId, { status: 'running', detail: runningDetail })
  await wait(duration, signal)
  setStepState(stepId, { status: 'done', detail: doneDetail })
}

const waitForMinimumElapsed = async (startedAt, minimumMs, signal) => {
  const remaining = Math.max(0, minimumMs - (Date.now() - startedAt))
  if (remaining > 0) await wait(remaining, signal)
}

const buildSystemPrompt = () => [
  '你是“全能代理”，负责把用户的模糊需求拆成一套完整可执行流程。',
  '你需要像多代理协作一样工作，但最终只输出一份清晰交付物。',
  '请用中文回答，口吻专业、直接、可执行。',
  '输出结构必须包含：任务理解、代理流程、关键决策、最终方案、风险校验、下一步清单。',
  '不要编造具体业务数据；缺少信息时先写明假设，再给出可执行建议。',
].join('\n')

const buildUserPrompt = (content) => [
  `流程类型：${selectedTemplate.value.label}`,
  `用户任务：${content}`,
  '',
  '请模拟一个全能代理从拆解到交付的完整执行过程，并给出最终可落地方案。',
].join('\n')

const normalizeError = (error) => {
  if (error?.name === 'AbortError') return '本次代理流程已停止。'
  if (String(error?.message || '').includes('Failed to fetch')) {
    return '请求没有到达后端代理，请确认后端服务和 DeepSeek 配置。'
  }
  return error?.message || '代理执行失败，请稍后重试。'
}

const applyTemplate = (template) => {
  if (isRunning.value) return
  selectedTemplateId.value = template.id
  input.value = template.prompt
  errorMessage.value = ''
}

const selectRun = (run) => {
  if (isRunning.value) return
  activeRun.value = run
  selectedTemplateId.value = run.templateId || selectedTemplateId.value
  input.value = run.prompt || input.value
  errorMessage.value = ''
}

const stopRun = () => {
  activeController.value?.abort()
}

const startAgentRun = async () => {
  const content = input.value.trim()
  if (!content || isRunning.value) return

  const run = {
    id: createId(),
    title: makeTitle(content),
    prompt: content,
    templateId: selectedTemplate.value.id,
    templateLabel: selectedTemplate.value.label,
    model: model.value || DEFAULT_MODEL,
    status: 'running',
    output: '',
    steps: createSteps(),
    startedAt: Date.now(),
    endedAt: 0,
  }

  activeRun.value = run
  runs.value = [run, ...runs.value.filter((item) => item.id !== run.id)].slice(0, 8)
  errorMessage.value = ''
  isRunning.value = true

  const controller = new AbortController()
  activeController.value = controller

  try {
    await runLocalStep('intake', '正在解析目标、约束和交付口径', '已确认任务边界和交付口径', STEP_DURATIONS.intake, controller.signal)
    await runLocalStep('context', '正在整理业务上下文和可用假设', '已形成上下文摘要和关键假设', STEP_DURATIONS.context, controller.signal)
    await runLocalStep('plan', '正在拆解代理执行路径和检查点', '已生成执行路径和检查点', STEP_DURATIONS.plan, controller.signal)

    setStepState('execute', { status: 'running', detail: '正在调用 DeepSeek 生成完整交付物' })
    const executeStartedAt = Date.now()
    const streamedContent = await streamDeepSeekChatCompletion({
      model: run.model,
      signal: controller.signal,
      temperature: selectedTemplate.value.id === 'research' ? 0.45 : 0.58,
      maxTokens: 1800,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: buildUserPrompt(content) },
      ],
      onDelta: (delta) => {
        if (!delta || !activeRun.value) return
        activeRun.value.output += delta
        scrollOutput()
      },
    })

    const finalOutput = activeRun.value.output.trim() || String(streamedContent || '').trim()
    if (!finalOutput) throw new Error('代理返回为空，请稍后重试或检查模型配置。')
    await waitForMinimumElapsed(executeStartedAt, STEP_DURATIONS.executeMin, controller.signal)
    activeRun.value.output = finalOutput
    setStepState('execute', { status: 'done', detail: '已生成完整代理交付物' })

    await runLocalStep('review', '正在检查结构完整度和执行风险', '已完成结构、风险和下一步检查', STEP_DURATIONS.review, controller.signal)
    await runLocalStep('handoff', '正在整理交付记录', '已完成交付归档', STEP_DURATIONS.handoff, controller.signal)

    activeRun.value.status = 'completed'
    activeRun.value.endedAt = Date.now()
  } catch (error) {
    const friendlyMessage = normalizeError(error)
    const nextStatus = error?.name === 'AbortError' ? 'stopped' : 'error'
    const runningStep = activeRun.value?.steps.find((step) => step.status === 'running')

    if (runningStep) {
      setStepState(runningStep.id, { status: nextStatus, detail: friendlyMessage })
    }

    if (activeRun.value) {
      activeRun.value.status = nextStatus
      activeRun.value.endedAt = Date.now()
      if (!activeRun.value.output.trim()) activeRun.value.output = friendlyMessage
    }

    errorMessage.value = nextStatus === 'error' ? friendlyMessage : ''
  } finally {
    isRunning.value = false
    activeController.value = null
    saveRuns()
  }
}

onBeforeUnmount(() => {
  if (isRunning.value) stopRun()
})
</script>

<template>
  <main class="agent-page">
    <header class="agent-topbar">
      <div class="agent-title">
        <span class="agent-mark">
          <AppIcon name="bot" :stroke-width="1.7" />
        </span>
        <span>
          <span class="agent-eyebrow">Agent</span>
          <h1>全能代理</h1>
        </span>
      </div>
      <div class="agent-status-row">
        <span>{{ activeModelLabel }}</span>
        <strong>{{ isRunning ? '运行中' : '待命' }}</strong>
      </div>
    </header>

    <div class="agent-workspace">
      <section class="agent-compose-panel">
        <div class="panel-heading">
          <span class="agent-eyebrow">任务编排</span>
          <h2>选择流程</h2>
        </div>

        <div class="template-grid" aria-label="流程模板">
          <button
            v-for="template in templates"
            :key="template.id"
            type="button"
            class="template-button"
            :class="{ 'is-active': template.id === selectedTemplateId }"
            :disabled="isRunning"
            @click="applyTemplate(template)"
          >
            <span>{{ template.label }}</span>
          </button>
        </div>

        <label class="agent-field">
          <span>任务输入</span>
          <textarea
            v-model="input"
            rows="9"
            placeholder="输入你要交给全能代理完成的任务"
            :disabled="isRunning"
          ></textarea>
        </label>

        <label class="agent-field">
          <span>模型</span>
          <select v-model="model" :disabled="isRunning">
            <option v-for="option in modelOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <div class="agent-action-row">
          <button type="button" class="run-button" :disabled="!canRun" @click="startAgentRun">
            <AppIcon name="send" :stroke-width="2" />
            <span>{{ isRunning ? '执行中' : '启动代理' }}</span>
          </button>
          <button v-if="isRunning" type="button" class="stop-button" @click="stopRun">
            停止
          </button>
        </div>

        <p v-if="errorMessage" class="agent-error">{{ errorMessage }}</p>
      </section>

      <section class="agent-flow-panel">
        <div class="flow-header">
          <div>
            <span class="agent-eyebrow">执行图</span>
            <h2>{{ activeRun?.title || '等待任务' }}</h2>
          </div>
          <span class="flow-percent">{{ progressPercent }}%</span>
        </div>
        <div class="progress-track">
          <span :style="progressStyle"></span>
        </div>

        <div class="workflow-list">
          <article
            v-for="(step, index) in (activeRun?.steps || createSteps())"
            :key="step.id"
            class="workflow-node"
            :class="`workflow-node--${step.status}`"
          >
            <span class="node-index">{{ index + 1 }}</span>
            <div class="node-body">
              <div class="node-topline">
                <h3>{{ step.title }}</h3>
                <span>{{ statusLabels[step.status] }}</span>
              </div>
              <p>{{ step.detail || step.description }}</p>
              <div class="node-agents">
                <span v-for="agent in step.agents" :key="agent">{{ agent }}</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section class="agent-output-panel">
        <div class="panel-heading output-heading">
          <span>
            <span class="agent-eyebrow">交付物</span>
            <h2>{{ activeRun?.templateLabel || selectedTemplate.label }}</h2>
          </span>
          <small>{{ formatTime(activeRun?.startedAt) }}</small>
        </div>

        <div ref="outputRef" class="output-scroll">
          <div v-if="activeRun?.output" class="agent-output markdown-body" v-html="renderMarkdown(activeRun.output)"></div>
          <div v-else class="output-empty">
            <span class="empty-mark">
              <AppIcon name="bot" :stroke-width="1.7" />
            </span>
            <strong>等待代理交付</strong>
          </div>
        </div>

        <div class="run-history">
          <div class="history-title">
            <span>最近运行</span>
            <small>{{ runs.length }} 条</small>
          </div>
          <button
            v-for="run in runs"
            :key="run.id"
            type="button"
            class="history-item"
            :class="{ 'is-active': activeRun?.id === run.id }"
            :disabled="isRunning"
            @click="selectRun(run)"
          >
            <span>{{ run.title }}</span>
            <small>{{ formatTime(run.startedAt) }}</small>
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.agent-page {
  --agent-primary: #4c53f5;
  --agent-primary-dark: #4338ca;
  --agent-accent: #8b5cf6;
  --agent-accent-dark: #7c3aed;
  --agent-soft: rgba(76, 83, 245, 0.1);
  --agent-soft-strong: rgba(139, 92, 246, 0.14);
  --agent-border: rgba(76, 83, 245, 0.18);
  flex: 1 1 auto;
  min-width: 0;
  min-height: 100dvh;
  margin-left: 68px;
  background:
    radial-gradient(circle at 16% 12%, rgba(76, 83, 245, 0.14), transparent 32%),
    radial-gradient(circle at 88% 18%, rgba(139, 92, 246, 0.12), transparent 30%),
    linear-gradient(135deg, #f8fafc 0%, #f5f3ff 48%, #f7f5fc 100%);
  color: #172033;
}

.agent-topbar {
  position: sticky;
  top: var(--promo-banner-h, 0px);
  z-index: 18;
  display: flex;
  min-height: var(--header-height, 56px);
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(255, 255, 255, 0.76);
  padding: 12px 28px;
  backdrop-filter: blur(18px);
}

.agent-title,
.agent-status-row,
.agent-action-row,
.flow-header,
.node-topline,
.history-title,
.output-heading {
  display: flex;
  align-items: center;
}

.agent-title {
  gap: 12px;
}

.agent-mark,
.empty-mark {
  display: grid;
  place-items: center;
  border-radius: 14px;
  color: var(--agent-primary-dark);
  background: linear-gradient(135deg, rgba(76, 83, 245, 0.13), rgba(139, 92, 246, 0.12));
  box-shadow: inset 0 0 0 1px var(--agent-border);
}

.agent-mark {
  width: 40px;
  height: 40px;
}

.agent-mark svg,
.empty-mark svg {
  width: 20px;
  height: 20px;
}

.agent-eyebrow {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.agent-topbar h1,
.panel-heading h2,
.flow-header h2,
.node-topline h3 {
  margin: 0;
  letter-spacing: 0;
}

.agent-topbar h1 {
  color: #0f172a;
  font-size: 22px;
  line-height: 1.15;
}

.agent-status-row {
  gap: 10px;
  color: #64748b;
  font-size: 13px;
}

.agent-status-row strong {
  border-radius: 999px;
  background: var(--agent-soft);
  color: var(--agent-primary-dark);
  padding: 6px 10px;
}

.agent-workspace {
  display: grid;
  grid-template-columns: minmax(280px, 340px) minmax(360px, 1fr) minmax(310px, 380px);
  gap: 18px;
  padding: 18px;
}

.agent-compose-panel,
.agent-flow-panel,
.agent-output-panel {
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.76);
  box-shadow: 0 22px 70px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
}

.agent-compose-panel,
.agent-output-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 18px;
}

.agent-flow-panel {
  padding: 18px;
}

.panel-heading {
  justify-content: space-between;
  gap: 12px;
}

.panel-heading h2,
.flow-header h2 {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.25;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.template-button {
  min-height: 48px;
  border: 1px solid var(--agent-border);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.72);
  color: #334155;
  cursor: pointer;
  font-weight: 800;
  transition: border-color 180ms ease, background 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.template-button:hover:not(:disabled),
.template-button.is-active {
  color: var(--agent-primary-dark);
  transform: translateY(-1px);
  border-color: rgba(76, 83, 245, 0.38);
  background: linear-gradient(135deg, rgba(76, 83, 245, 0.08), rgba(139, 92, 246, 0.08)), #fff;
  box-shadow: 0 12px 28px rgba(76, 83, 245, 0.1);
}

.agent-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #475569;
  font-size: 13px;
  font-weight: 800;
}

.agent-field textarea,
.agent-field select {
  width: 100%;
  border: 1px solid rgba(148, 163, 184, 0.26);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.82);
  color: #0f172a;
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.agent-field textarea {
  min-height: 190px;
  resize: vertical;
  padding: 14px;
  line-height: 1.6;
}

.agent-field select {
  height: 42px;
  padding: 0 12px;
}

.agent-field textarea:focus,
.agent-field select:focus {
  border-color: rgba(76, 83, 245, 0.46);
  background: #fff;
  box-shadow: 0 0 0 4px var(--agent-soft);
}

.agent-action-row {
  gap: 10px;
}

.run-button,
.stop-button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 0;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 900;
  transition: opacity 160ms ease, transform 160ms ease, box-shadow 160ms ease, background 160ms ease;
}

.run-button {
  flex: 1 1 auto;
  background: linear-gradient(135deg, var(--agent-primary), var(--agent-accent));
  color: #fff;
  box-shadow: 0 16px 34px rgba(76, 83, 245, 0.22);
}

.run-button svg {
  width: 16px;
  height: 16px;
}

.stop-button {
  flex: 0 0 auto;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  padding: 0 14px;
}

.run-button:hover:not(:disabled),
.stop-button:hover {
  transform: translateY(-1px);
}

.run-button:disabled,
.template-button:disabled,
.history-item:disabled {
  cursor: not-allowed;
  opacity: 0.58;
}

.agent-error {
  margin: 0;
  border-radius: 12px;
  background: rgba(239, 68, 68, 0.1);
  color: #b91c1c;
  padding: 10px 12px;
  font-size: 13px;
  line-height: 1.5;
}

.flow-header {
  justify-content: space-between;
  gap: 16px;
}

.flow-percent {
  color: var(--agent-primary-dark);
  font-size: 28px;
  font-weight: 900;
}

.progress-track {
  height: 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.18);
  margin: 16px 0 18px;
}

.progress-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--agent-primary), var(--agent-accent), #c084fc);
  transition: width 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.workflow-list {
  display: grid;
  gap: 12px;
}

.workflow-node {
  position: relative;
  display: grid;
  grid-template-columns: 42px minmax(0, 1fr);
  gap: 12px;
  min-height: 104px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(248, 250, 252, 0.72);
  padding: 14px;
  transition: border-color 220ms ease, background 220ms ease, box-shadow 220ms ease, transform 220ms ease;
}

.workflow-node--running {
  border-color: rgba(76, 83, 245, 0.34);
  background: rgba(245, 243, 255, 0.88);
  box-shadow: 0 16px 34px rgba(76, 83, 245, 0.12);
  transform: translateY(-1px);
}

.workflow-node--done {
  border-color: rgba(139, 92, 246, 0.24);
  background: rgba(250, 245, 255, 0.72);
}

.workflow-node--error,
.workflow-node--stopped {
  border-color: rgba(239, 68, 68, 0.28);
  background: rgba(254, 242, 242, 0.72);
}

.node-index {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 14px;
  background: #fff;
  color: var(--agent-primary-dark);
  font-weight: 900;
  box-shadow: inset 0 0 0 1px var(--agent-border);
}

.workflow-node--running .node-index {
  color: var(--agent-primary-dark);
  animation: node-pulse 1200ms ease-in-out infinite;
}

.workflow-node--done .node-index {
  color: var(--agent-accent-dark);
  background: rgba(243, 232, 255, 0.86);
}

.node-body {
  min-width: 0;
}

.node-topline {
  justify-content: space-between;
  gap: 10px;
}

.node-topline h3 {
  color: #0f172a;
  font-size: 15px;
}

.node-topline span {
  flex: 0 0 auto;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.06);
  color: #64748b;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 900;
}

.workflow-node--running .node-topline span {
  color: var(--agent-primary-dark);
  background: var(--agent-soft);
}

.workflow-node--done .node-topline span {
  color: var(--agent-accent-dark);
  background: var(--agent-soft-strong);
}

.workflow-node--error .node-topline span,
.workflow-node--stopped .node-topline span {
  color: #b91c1c;
  background: rgba(239, 68, 68, 0.12);
}

.node-body p {
  margin: 8px 0 10px;
  color: #64748b;
  font-size: 13px;
  line-height: 1.55;
}

.node-agents {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.node-agents span {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.82);
  color: #475569;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 800;
}

.agent-output-panel {
  max-height: calc(100dvh - 92px);
}

.output-heading {
  flex: 0 0 auto;
  justify-content: space-between;
}

.output-heading small {
  flex: 0 0 auto;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 800;
}

.output-scroll {
  flex: 1 1 auto;
  min-height: 300px;
  overflow-y: auto;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  padding: 16px;
}

.agent-output {
  color: #172033;
  font-size: 14px;
}

.output-empty {
  display: grid;
  min-height: 260px;
  place-items: center;
  align-content: center;
  gap: 12px;
  color: #64748b;
  text-align: center;
}

.empty-mark {
  width: 46px;
  height: 46px;
}

.run-history {
  flex: 0 0 auto;
  display: grid;
  gap: 8px;
}

.history-title {
  justify-content: space-between;
  color: #475569;
  font-size: 13px;
  font-weight: 900;
}

.history-title small {
  color: #94a3b8;
}

.history-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  width: 100%;
  min-height: 42px;
  align-items: center;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.72);
  color: #334155;
  cursor: pointer;
  padding: 8px 10px;
  text-align: left;
  transition: border-color 160ms ease, background 160ms ease, transform 160ms ease;
}

.history-item:hover:not(:disabled),
.history-item.is-active {
  border-color: rgba(76, 83, 245, 0.3);
  background: #fff;
  transform: translateY(-1px);
}

.history-item span,
.history-item small {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item span {
  font-size: 12px;
  font-weight: 800;
}

.history-item small {
  color: #94a3b8;
  font-size: 11px;
}

@keyframes node-pulse {
  0%,
  100% {
    box-shadow: inset 0 0 0 1px rgba(76, 83, 245, 0.18), 0 0 0 0 rgba(76, 83, 245, 0.28);
  }

  50% {
    box-shadow: inset 0 0 0 1px rgba(76, 83, 245, 0.22), 0 0 0 8px rgba(76, 83, 245, 0);
  }
}

@media (max-width: 1180px) {
  .agent-workspace {
    grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
  }

  .agent-output-panel {
    grid-column: 1 / -1;
    max-height: none;
  }

  .output-scroll {
    min-height: 240px;
  }
}

@media (max-width: 767px) {
  .agent-page {
    margin-left: 0;
  }

  .agent-topbar {
    align-items: flex-start;
    flex-direction: column;
    padding: 14px 16px;
  }

  .agent-workspace {
    grid-template-columns: 1fr;
    padding: 12px;
  }

  .template-grid {
    grid-template-columns: 1fr;
  }

  .workflow-node {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .node-index {
    width: 34px;
    height: 34px;
    border-radius: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .workflow-node--running .node-index {
    animation: none;
  }
}
</style>
