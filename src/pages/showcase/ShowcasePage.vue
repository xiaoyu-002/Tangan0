<script setup>
const navItems = [
  { label: '洞察', target: 'capabilities' },
  { label: '工作台', target: 'dashboard' },
  { label: 'AI', target: 'assistant' },
  { label: '场景', target: 'scenarios' },
]

const metrics = [
  { label: '市场趋势追踪', value: '24h', note: '跨平台同步洞察' },
  { label: '选品机会识别', value: '4类', note: '商品、店铺、达人、内容' },
  { label: '内容生产链路', value: '3步', note: '洞察到脚本再到排期' },
]

const capabilityCards = [
  {
    title: '选品机会雷达',
    text: '把 TikTok、Shopify 与内容信号收拢到同一个判断面板，快速定位值得跟进的机会。',
  },
  {
    title: '创意生产中枢',
    text: '围绕爆款结构、脚本、视频与图文素材形成可复用的内容工作流。',
  },
  {
    title: '社媒运营看板',
    text: '统一管理发布、评论、账号与表现数据，让日常运营更像一个清晰队列。',
  },
]

const scenarioCards = [
  '跨境电商选品团队',
  'TikTok Shop 内容团队',
  '独立站增长负责人',
  '品牌社媒运营小组',
]

const scrollToSection = (target) => {
  document.getElementById(target)?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}
</script>

<template>
  <main class="showcase-page">
    <header class="showcase-nav">
      <a class="showcase-brand" href="#/showcase" aria-label="糖安罗盘展示页">
        <img src="/assets/icons/tangan-logo.png" alt="糖安罗盘">
        <span>糖安罗盘</span>
      </a>

      <nav class="showcase-options" aria-label="展示页导航">
        <button
          v-for="item in navItems"
          :key="item.target"
          type="button"
          class="showcase-option"
          @click="scrollToSection(item.target)"
        >
          {{ item.label }}
        </button>
      </nav>

      <a class="showcase-login" href="#/login">登录</a>
    </header>

    <section class="showcase-hero" aria-labelledby="showcase-title">
      <img
        class="showcase-hero-image"
        src="/assets/showcase/cosmic-solitude.png"
        alt=""
        aria-hidden="true"
      >
      <div class="showcase-hero-overlay"></div>

      <div class="showcase-hero-content">
        <p class="showcase-eyebrow">Quiet Intelligence For Cross-Border Growth</p>
        <h1 id="showcase-title">糖安罗盘</h1>
        <p class="showcase-hero-copy">
          在庞大的市场噪声里，看见真正值得前进的方向。
        </p>
        <div class="showcase-actions">
          <a class="showcase-primary-action" href="#/login">进入工作台</a>
          <button type="button" class="showcase-secondary-action" @click="scrollToSection('capabilities')">
            继续探索
          </button>
        </div>
      </div>

      <p class="showcase-scroll-cue">向下滚动</p>
    </section>

    <section class="showcase-metrics" aria-label="关键能力指标">
      <article v-for="metric in metrics" :key="metric.label" class="showcase-metric-card">
        <strong>{{ metric.value }}</strong>
        <span>{{ metric.label }}</span>
        <p>{{ metric.note }}</p>
      </article>
    </section>

    <section id="capabilities" class="showcase-section showcase-z-block showcase-z-block-left">
      <div class="showcase-section-heading">
        <span>Capabilities</span>
        <h2>从发现机会到执行动作，放在同一个节奏里</h2>
      </div>
      <div class="showcase-capability-grid">
        <article v-for="card in capabilityCards" :key="card.title" class="showcase-card">
          <h3>{{ card.title }}</h3>
          <p>{{ card.text }}</p>
        </article>
      </div>
    </section>

    <section id="dashboard" class="showcase-section showcase-dashboard-section showcase-z-block showcase-z-block-right">
      <div class="showcase-section-heading">
        <span>Dashboard</span>
        <h2>面向 B 端团队的清晰数据工作台</h2>
      </div>
      <div class="showcase-dashboard-preview">
        <div class="preview-sidebar">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>
        <div class="preview-main">
          <div class="preview-topline"></div>
          <div class="preview-grid">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="preview-chart">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </div>
        </div>
      </div>
    </section>

    <section id="assistant" class="showcase-section showcase-assistant-section showcase-z-block showcase-z-block-left">
      <div>
        <div class="showcase-section-heading">
          <span>AI Copilot</span>
          <h2>让每个模块都有可执行的下一步建议</h2>
        </div>
        <p class="showcase-section-copy">
          小思可以围绕当前页面上下文，帮助你拆解市场机会、生成脚本、规划发布节奏，并沉淀成任务。
        </p>
      </div>
      <img
        class="showcase-assistant-image"
        src="/assets/showcase/ai-copilot-preview.svg"
        alt="数据与 AI 工作流视觉"
      >
    </section>

    <section id="scenarios" class="showcase-section showcase-z-block showcase-z-block-right">
      <div class="showcase-section-heading">
        <span>Scenarios</span>
        <h2>适合需要把增长动作标准化的团队</h2>
      </div>
      <div class="showcase-scenario-list">
        <span v-for="item in scenarioCards" :key="item">{{ item }}</span>
      </div>
    </section>
  </main>
</template>

<style scoped>
.showcase-page {
  --showcase-primary: #6082F7;
  --showcase-secondary: #E2BBFF;
  --showcase-accent: #DBFFBA;
  --showcase-ink: #151921;
  --showcase-body: #333333;
  --showcase-muted: #666666;
  --showcase-glass: rgba(255, 255, 255, 0.62);
  --showcase-glass-strong: rgba(255, 255, 255, 0.78);
  --showcase-glass-border: rgba(255, 255, 255, 0.42);
  --showcase-radius: 12px;
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 18%, rgba(96, 130, 247, 0.28), transparent 30%),
    radial-gradient(circle at 86% 28%, rgba(226, 187, 255, 0.32), transparent 34%),
    radial-gradient(circle at 62% 72%, rgba(219, 255, 186, 0.26), transparent 32%),
    linear-gradient(135deg, rgba(96, 130, 247, 0.12), rgba(226, 187, 255, 0.1) 48%, rgba(219, 255, 186, 0.12)),
    linear-gradient(180deg, #08141d 0%, #102331 42%, #f7f8fc 42.1%, #fbfcff 100%);
  color: #eaf5f9;
  font-family: Inter, "PingFang SC", "Microsoft YaHei", sans-serif;
  line-height: 1.6;
}

.showcase-nav {
  position: fixed;
  top: -58px;
  left: 0;
  z-index: 50;
  display: grid;
  grid-template-columns: minmax(150px, 1fr) auto minmax(110px, 1fr);
  align-items: center;
  width: 100%;
  height: 64px;
  padding: 0 40px;
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-top: 0;
  box-shadow: 0 20px 60px rgba(21, 25, 33, 0.18);
  backdrop-filter: blur(10px) saturate(1.25);
  transition: top 260ms ease, background 260ms ease;
}

.showcase-nav::after {
  content: "";
  position: absolute;
  left: 50%;
  bottom: -8px;
  width: 86px;
  height: 2px;
  border-radius: var(--showcase-radius);
  background: rgba(219, 255, 186, 0.86);
  transform: translateX(-50%);
}

.showcase-nav:hover,
.showcase-nav:focus-within {
  top: 0;
  background: rgba(255, 255, 255, 0.18);
}

.showcase-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  color: #f7fbff;
  font-size: 18px;
  font-weight: 700;
  text-decoration: none;
}

.showcase-brand img {
  width: 34px;
  height: 34px;
  object-fit: contain;
}

.showcase-options {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: var(--showcase-radius);
  backdrop-filter: blur(10px);
}

.showcase-option,
.showcase-secondary-action {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.showcase-option {
  min-width: 72px;
  height: 36px;
  padding: 0 16px;
  color: rgba(234, 245, 249, 0.68);
  background: transparent;
  border-radius: var(--showcase-radius);
  font-size: 14px;
  font-weight: 600;
  transition: color 180ms ease, background 180ms ease, box-shadow 180ms ease;
}

.showcase-option:hover {
  color: #ffffff;
  background: rgba(96, 130, 247, 0.28);
  box-shadow: none;
}

.showcase-login {
  justify-self: end;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 38px;
  padding: 0 18px;
  color: #ffffff;
  background: rgba(96, 130, 247, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--showcase-radius);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 10px 28px rgba(96, 130, 247, 0.3);
  backdrop-filter: blur(10px);
}

.showcase-hero {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 100vh;
  padding: 112px max(40px, calc((100vw - 1180px) / 2)) 82px;
  overflow: hidden;
}

.showcase-hero-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
}

.showcase-hero-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 60% 34%, rgba(96, 130, 247, 0.08), transparent 34%),
    radial-gradient(circle at 22% 62%, rgba(226, 187, 255, 0.08), transparent 28%),
    linear-gradient(90deg, rgba(7, 16, 24, 0.56) 0%, rgba(7, 16, 24, 0.34) 31%, rgba(7, 16, 24, 0.08) 64%, rgba(7, 16, 24, 0.36) 100%),
    linear-gradient(180deg, rgba(7, 16, 24, 0.32) 0%, rgba(7, 16, 24, 0.06) 46%, rgba(7, 16, 24, 0.78) 100%);
}

.showcase-hero-content {
  position: relative;
  z-index: 1;
  width: min(540px, 100%);
  color: rgba(226, 239, 244, 0.76);
  transform: translateY(7vh);
  opacity: 0.92;
}

.showcase-eyebrow,
.showcase-section-heading span {
  margin: 0 0 14px;
  color: rgba(219, 255, 186, 0.6);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
}

.showcase-hero h1 {
  margin: 0;
  color: rgba(221, 235, 241, 0.76);
  font-size: clamp(50px, 6.8vw, 96px);
  line-height: 0.98;
  font-weight: 500;
  letter-spacing: 0;
  text-shadow: 0 18px 56px rgba(3, 10, 15, 0.32), 0 0 34px rgba(151, 210, 231, 0.1);
}

.showcase-hero-copy {
  max-width: 620px;
  margin: 22px 0 0;
  color: rgba(221, 235, 241, 0.62);
  font-size: 20px;
  line-height: 1.7;
  font-weight: 400;
  text-shadow: 0 12px 34px rgba(3, 10, 15, 0.28);
}

.showcase-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: 34px;
}

.showcase-primary-action,
.showcase-secondary-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  padding: 0 22px;
  border-radius: var(--showcase-radius);
  font-size: 15px;
  font-weight: 700;
  text-decoration: none;
}

.showcase-primary-action {
  color: rgba(232, 243, 247, 0.78);
  background: rgba(96, 130, 247, 0.18);
  border: 1px solid rgba(234, 245, 249, 0.12);
  box-shadow: 0 10px 26px rgba(3, 10, 15, 0.12);
  backdrop-filter: blur(10px) saturate(1.2);
}

.showcase-secondary-action {
  color: rgba(232, 243, 247, 0.58);
  background: rgba(255, 255, 255, 0.035);
  border: 1px solid rgba(234, 245, 249, 0.09);
  backdrop-filter: blur(10px) saturate(1.2);
}

.showcase-scroll-cue {
  position: absolute;
  left: max(40px, calc((100vw - 1180px) / 2));
  bottom: 32px;
  z-index: 2;
  margin: 0;
  color: rgba(234, 245, 249, 0.58);
  font-size: 12px;
  font-weight: 700;
}

.showcase-scroll-cue::before {
  content: "";
  display: inline-block;
  width: 42px;
  height: 1px;
  margin-right: 12px;
  vertical-align: middle;
  background: rgba(234, 245, 249, 0.38);
}

.showcase-metrics,
.showcase-section {
  width: min(1180px, calc(100% - 48px));
  margin: 0 auto;
}

.showcase-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: -72px;
  position: relative;
  z-index: 3;
}

.showcase-metrics::before {
  content: "";
  position: absolute;
  inset: -22px;
  z-index: -1;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(8, 20, 29, 0.08), rgba(96, 130, 247, 0.01));
  filter: blur(2px);
}

.showcase-metrics::after {
  content: "";
  position: absolute;
  right: 5%;
  bottom: -64px;
  width: min(460px, 42vw);
  height: 2px;
  background: linear-gradient(90deg, rgba(96, 130, 247, 0), rgba(96, 130, 247, 0.18), rgba(226, 187, 255, 0.16), rgba(219, 255, 186, 0));
  transform: rotate(10deg);
  transform-origin: right center;
}

.showcase-metric-card,
.showcase-card,
.showcase-dashboard-preview {
  background: var(--showcase-glass);
  border: 1px solid var(--showcase-glass-border);
  border-radius: var(--showcase-radius);
  box-shadow: 0 18px 48px rgba(21, 25, 33, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px) saturate(1.24);
  transition: box-shadow 180ms ease, transform 180ms ease, border-color 180ms ease;
}

.showcase-metric-card:hover,
.showcase-card:hover,
.showcase-dashboard-preview:hover,
.showcase-scenario-list span:hover {
  box-shadow: 0 24px 58px rgba(21, 25, 33, 0.13), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.58);
}

.showcase-metric-card {
  padding: 24px;
  background: rgba(10, 23, 32, 0.1);
  border-color: rgba(234, 245, 249, 0.08);
  box-shadow: 0 12px 34px rgba(3, 10, 15, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.showcase-metric-card:nth-child(2) {
  transform: translateY(24px);
}

.showcase-metric-card:nth-child(3) {
  transform: translateY(48px);
}

.showcase-metric-card strong {
  display: block;
  color: rgba(191, 217, 230, 0.62);
  font-size: 31px;
  line-height: 1;
  font-weight: 700;
}

.showcase-metric-card span {
  display: block;
  margin-top: 14px;
  color: rgba(232, 243, 247, 0.54);
  font-size: 16px;
  font-weight: 600;
}

.showcase-metric-card p {
  color: rgba(232, 243, 247, 0.36);
}

.showcase-metric-card p,
.showcase-card p,
.showcase-section-copy {
  margin: 8px 0 0;
  color: var(--showcase-muted);
}

.showcase-section {
  position: relative;
  padding: 112px 0 0;
  scroll-margin-top: 96px;
}

.showcase-z-block::before {
  content: "";
  position: absolute;
  top: 48px;
  width: min(380px, 32vw);
  height: 2px;
  background: linear-gradient(90deg, rgba(226, 187, 255, 0), rgba(96, 130, 247, 0.42), rgba(226, 187, 255, 0.36), rgba(219, 255, 186, 0));
  pointer-events: none;
}

.showcase-z-block-left::before {
  right: 0;
  transform: rotate(-11deg);
  transform-origin: right center;
}

.showcase-z-block-right::before {
  left: 0;
  transform: rotate(11deg);
  transform-origin: left center;
}

.showcase-z-block-left .showcase-section-heading {
  margin-right: auto;
}

.showcase-z-block-right .showcase-section-heading {
  margin-left: auto;
  text-align: right;
}

.showcase-section-heading {
  max-width: 680px;
}

.showcase-section-heading h2 {
  margin: 0;
  color: var(--showcase-ink);
  font-size: clamp(32px, 4vw, 52px);
  line-height: 1.18;
  font-weight: 800;
  letter-spacing: 0;
}

.showcase-card,
.showcase-scenario-list span,
.showcase-dashboard-preview,
.showcase-assistant-image {
  border: 1px solid var(--showcase-glass-border);
}

.showcase-card {
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.68), rgba(255, 255, 255, 0.46));
  backdrop-filter: blur(10px) saturate(1.18);
}

.showcase-capability-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 24px;
  margin-top: 34px;
}

.showcase-card {
  padding: 24px;
}

.showcase-card h3 {
  margin: 0;
  color: var(--showcase-ink);
  font-size: 20px;
  font-weight: 700;
}

.showcase-dashboard-section {
  display: grid;
  grid-template-columns: minmax(520px, 1.18fr) minmax(0, 0.82fr);
  align-items: center;
  gap: 42px;
}

.showcase-dashboard-section .showcase-section-heading {
  order: 2;
}

.showcase-dashboard-section .showcase-dashboard-preview {
  order: 1;
}

.showcase-dashboard-preview {
  position: relative;
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr);
  min-height: 420px;
  overflow: hidden;
  isolation: isolate;
}

/* UI modification: enrich the dashboard preview with CSS-only product details. */
.preview-sidebar {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px 20px;
  background:
    linear-gradient(180deg, rgba(21, 25, 33, 0.94), rgba(21, 25, 33, 0.86)),
    linear-gradient(135deg, rgba(96, 130, 247, 0.24), rgba(226, 187, 255, 0.1));
}

.preview-sidebar::before {
  content: "";
  display: block;
  width: 44px;
  height: 44px;
  margin-bottom: 18px;
  border-radius: var(--showcase-radius);
  background:
    radial-gradient(circle at 50% 50%, rgba(219, 255, 186, 0.86) 0 5px, transparent 6px),
    linear-gradient(135deg, rgba(96, 130, 247, 0.9), rgba(226, 187, 255, 0.58));
  box-shadow: 0 12px 28px rgba(96, 130, 247, 0.3);
}

.preview-sidebar::after {
  content: "";
  position: absolute;
  left: 20px;
  right: 20px;
  bottom: 24px;
  height: 38px;
  border-radius: var(--showcase-radius);
  background:
    radial-gradient(circle at 18px 19px, rgba(226, 187, 255, 0.8) 0 8px, transparent 9px),
    linear-gradient(90deg, transparent 0 38px, rgba(255, 255, 255, 0.22) 39px 78px, transparent 79px),
    linear-gradient(90deg, transparent 0 38px, rgba(255, 255, 255, 0.12) 39px 58px, transparent 59px);
  background-size: auto, 100% 9px, 100% 7px;
  background-position: center, 0 10px, 0 24px;
  background-repeat: no-repeat;
}

.preview-sidebar span {
  position: relative;
  height: 36px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
}

.preview-sidebar span::before,
.preview-sidebar span::after {
  content: "";
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  border-radius: 8px;
}

.preview-sidebar span::before {
  left: 14px;
  width: 9px;
  height: 9px;
  background: rgba(255, 255, 255, 0.34);
}

.preview-sidebar span::after {
  left: 32px;
  right: 16px;
  height: 7px;
  background: rgba(255, 255, 255, 0.18);
}

.preview-sidebar span:first-child {
  background: var(--showcase-primary);
}

.preview-sidebar span:first-child::before,
.preview-sidebar span:first-child::after {
  background: rgba(255, 255, 255, 0.78);
}

.preview-main {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 28px;
  background:
    radial-gradient(circle at 80% 10%, rgba(219, 255, 186, 0.22), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.62), rgba(255, 255, 255, 0.44));
  backdrop-filter: blur(10px);
}

.preview-main::before {
  content: "";
  position: absolute;
  top: 28px;
  right: 28px;
  width: 156px;
  height: 28px;
  border-radius: var(--showcase-radius);
  background:
    radial-gradient(circle at 122px 14px, var(--showcase-primary) 0 10px, transparent 11px),
    radial-gradient(circle at 150px 14px, rgba(226, 187, 255, 0.9) 0 10px, transparent 11px),
    linear-gradient(90deg, rgba(21, 25, 33, 0.1) 0 92px, transparent 93px);
}

.preview-main::after {
  content: "";
  position: absolute;
  right: 28px;
  bottom: 28px;
  width: 42%;
  height: 78px;
  border-radius: var(--showcase-radius);
  background:
    linear-gradient(90deg, rgba(21, 25, 33, 0.16) 0 22%, transparent 22% 30%, rgba(21, 25, 33, 0.08) 30% 58%, transparent 58% 68%, rgba(96, 130, 247, 0.18) 68% 100%),
    repeating-linear-gradient(180deg, rgba(21, 25, 33, 0.08) 0 1px, transparent 1px 24px);
  opacity: 0.72;
}

.preview-topline {
  position: relative;
  width: 56%;
  height: 28px;
  margin-bottom: 4px;
  border-radius: var(--showcase-radius);
  background:
    linear-gradient(90deg, rgba(21, 25, 33, 0.16) 0 38%, transparent 38%),
    rgba(96, 130, 247, 0.12);
}

.preview-topline::before,
.preview-topline::after {
  content: "";
  position: absolute;
  border-radius: 8px;
}

.preview-topline::before {
  left: 14px;
  top: 50%;
  width: 10px;
  height: 10px;
  border: 2px solid rgba(96, 130, 247, 0.42);
  transform: translateY(-50%);
}

.preview-topline::after {
  left: 34px;
  right: 18px;
  top: 50%;
  height: 7px;
  background: rgba(21, 25, 33, 0.12);
  transform: translateY(-50%);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.preview-grid span {
  position: relative;
  height: 86px;
  border-radius: var(--showcase-radius);
  background: linear-gradient(135deg, rgba(96, 130, 247, 0.22), rgba(226, 187, 255, 0.28));
  border: 1px solid rgba(255, 255, 255, 0.45);
}

.preview-grid span::before,
.preview-grid span::after {
  content: "";
  position: absolute;
  left: 18px;
  border-radius: 8px;
}

.preview-grid span::before {
  top: 18px;
  width: 42%;
  height: 8px;
  background: rgba(21, 25, 33, 0.16);
  box-shadow: 0 22px 0 rgba(21, 25, 33, 0.26);
}

.preview-grid span::after {
  right: 18px;
  bottom: 16px;
  height: 18px;
  background:
    linear-gradient(135deg, transparent 0 24%, rgba(219, 255, 186, 0.88) 25% 33%, transparent 34% 48%, rgba(96, 130, 247, 0.68) 49% 57%, transparent 58%);
  opacity: 0.9;
}

.preview-grid span:nth-child(2) {
  background: linear-gradient(135deg, rgba(226, 187, 255, 0.32), rgba(219, 255, 186, 0.2));
}

.preview-grid span:nth-child(3) {
  background: linear-gradient(135deg, rgba(219, 255, 186, 0.34), rgba(96, 130, 247, 0.14));
}

.preview-chart {
  position: relative;
  display: flex;
  align-items: end;
  gap: 16px;
  height: 156px;
  margin-top: 0;
  padding: 42px 18px 18px;
  border-radius: var(--showcase-radius);
  background: rgba(255, 255, 255, 0.58);
  border: 1px solid rgba(255, 255, 255, 0.46);
}

.preview-chart::before {
  content: "";
  position: absolute;
  left: 18px;
  top: 16px;
  width: 48%;
  height: 8px;
  border-radius: 8px;
  background: rgba(21, 25, 33, 0.14);
  box-shadow: 0 16px 0 rgba(21, 25, 33, 0.08);
}

.preview-chart::after {
  content: "";
  position: absolute;
  inset: 46px 18px 22px;
  border-radius: 8px;
  background:
    linear-gradient(135deg, transparent 0 24%, rgba(96, 130, 247, 0.4) 25% 27%, transparent 28% 42%, rgba(226, 187, 255, 0.5) 43% 45%, transparent 46% 64%, rgba(219, 255, 186, 0.52) 65% 67%, transparent 68%),
    repeating-linear-gradient(180deg, rgba(21, 25, 33, 0.08) 0 1px, transparent 1px 24px);
  opacity: 0.78;
}

.preview-chart i {
  position: relative;
  z-index: 1;
  display: block;
  flex: 1;
  border-radius: 8px 8px 0 0;
  background: var(--showcase-primary);
}

.preview-chart i:nth-child(1) {
  height: 42%;
}

.preview-chart i:nth-child(2) {
  height: 68%;
  background: var(--showcase-secondary);
}

.preview-chart i:nth-child(3) {
  height: 54%;
  background: var(--showcase-accent);
}

.preview-chart i:nth-child(4) {
  height: 86%;
}

.showcase-assistant-section {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(420px, 1.1fr);
  align-items: center;
  gap: 42px;
}

.showcase-section-copy {
  max-width: 560px;
  margin-top: 22px;
  font-size: 18px;
}

.showcase-assistant-image {
  width: 100%;
  min-height: 320px;
  object-fit: cover;
  filter: saturate(0.82) contrast(1.04);
  border-radius: var(--showcase-radius);
  box-shadow: 0 18px 48px rgba(21, 25, 33, 0.08);
}

.showcase-scenario-list {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding-bottom: 96px;
  margin-top: 34px;
}

.showcase-z-block-right .showcase-scenario-list {
  direction: rtl;
}

.showcase-z-block-right .showcase-scenario-list span {
  direction: ltr;
}

.showcase-scenario-list span {
  display: flex;
  align-items: center;
  min-height: 88px;
  padding: 20px;
  color: var(--showcase-body);
  background: var(--showcase-glass-strong);
  border-radius: var(--showcase-radius);
  box-shadow: 0 18px 48px rgba(21, 25, 33, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.48);
  backdrop-filter: blur(10px) saturate(1.18);
  transition: box-shadow 180ms ease, border-color 180ms ease;
  font-weight: 700;
}

@media (max-width: 980px) {
  .showcase-nav {
    grid-template-columns: 1fr auto;
    height: auto;
    min-height: 68px;
    padding: 14px 20px;
  }

  .showcase-options {
    grid-column: 1 / -1;
    justify-self: stretch;
    margin-top: 12px;
    overflow-x: auto;
  }

  .showcase-hero {
    grid-template-columns: 1fr;
    min-height: 86vh;
    padding: 150px 24px 70px;
  }

  .showcase-hero-panel {
    justify-self: start;
  }

  .showcase-metrics,
  .showcase-capability-grid,
  .showcase-dashboard-section,
  .showcase-assistant-section,
  .showcase-scenario-list {
    grid-template-columns: 1fr;
  }

  .showcase-dashboard-section,
  .showcase-assistant-section {
    gap: 28px;
  }

  .showcase-dashboard-section .showcase-section-heading,
  .showcase-dashboard-section .showcase-dashboard-preview {
    order: initial;
  }

  .showcase-z-block-right .showcase-section-heading {
    margin-left: 0;
    text-align: left;
  }

  .showcase-z-block::before,
  .showcase-metrics::after,
  .showcase-hero-panel::before {
    display: none;
  }

  .showcase-metric-card:nth-child(2),
  .showcase-metric-card:nth-child(3) {
    transform: none;
  }

  .showcase-dashboard-preview {
    grid-template-columns: 96px minmax(0, 1fr);
    min-height: 360px;
  }
}

@media (max-width: 640px) {
  .showcase-brand span {
    font-size: 16px;
  }

  .showcase-login {
    height: 36px;
    padding: 0 14px;
  }

  .showcase-option {
    min-width: max-content;
  }

  .showcase-hero-copy {
    font-size: 18px;
  }

  .showcase-metrics,
  .showcase-section {
    width: min(100% - 32px, 1180px);
  }

  .showcase-dashboard-preview {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .preview-main {
    padding: 20px;
  }
}
</style>
