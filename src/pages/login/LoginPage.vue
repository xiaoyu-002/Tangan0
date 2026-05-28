<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'

const brandName = '思燕智选'
const brandLogoSrc = '/assets/icons/siyan-logo.png'

const features = [
  {
    title: '发现爆品',
    description: '实时扫描 TikTok / Amazon 选品数据，捕捉上升期机会',
    icon: 'trend',
  },
  {
    title: '生成视频',
    description: '一句话产出产品短视频脚本 + 画面，出片效率翻倍',
    icon: 'film',
  },
  {
    title: '一键分发',
    description: '多平台内容排期、评论聚合，社媒运营提速 10 倍',
    icon: 'send',
  },
  {
    title: '数据洞察',
    description: '销量、爆款、竞品一屏纵览，每天只看结论',
    icon: 'chart',
  },
]

const qrCells = Array.from({ length: 169 }, (_, index) => {
  const row = Math.floor(index / 13)
  const col = index % 13
  const inFinder =
    (row <= 3 && col <= 3) ||
    (row <= 3 && col >= 9) ||
    (row >= 9 && col <= 3)
  const finderFill =
    (row === 0 && col <= 3) ||
    (col === 0 && row <= 3) ||
    (row === 3 && col <= 3) ||
    (col === 3 && row <= 3) ||
    (row <= 3 && (col === 9 || col === 12)) ||
    (row === 0 && col >= 9) ||
    (row === 3 && col >= 9) ||
    (row >= 9 && (col === 0 || col === 3)) ||
    (col <= 3 && (row === 9 || row === 12)) ||
    ((row === 1 || row === 2 || row === 10 || row === 11) && (col === 1 || col === 2 || col === 10 || col === 11))

  if (row >= 5 && row <= 7 && col >= 5 && col <= 7) return false
  if (inFinder) return finderFill

  return ((row * 7 + col * 11 + row * col) % 5 < 2) || ((row + col) % 9 === 0)
})

const authMode = ref('login')
const loginMethod = ref('wechat')
const phone = ref('13800138000')
const code = ref('246810')
const account = ref('demo@chuhaijiang.com')
const password = ref('123456')
const registerName = ref('思燕智选新用户')
const acceptedPolicy = ref(true)
const isSubmitting = ref(false)
const isSendingCode = ref(false)
const sendCountdown = ref(0)
const statusMessage = ref('微信扫码后会自动完成登录，也可以切换其它方式。')
const formError = ref('')
const timers = new Set()

const isRegister = computed(() => authMode.value === 'register')
const authPanelKey = computed(() => `${authMode.value}-${loginMethod.value}`)
const submitText = computed(() => {
  if (isSubmitting.value) return isRegister.value ? '正在创建账号...' : '正在登录...'
  return isRegister.value ? '注册并进入工作台' : '登录并进入工作台'
})
const codeButtonText = computed(() => {
  if (isSendingCode.value) return '发送中...'
  if (sendCountdown.value > 0) return `${sendCountdown.value}s 后重发`
  return '获取验证码'
})

const setTimer = (callback, delay) => {
  const timer = window.setTimeout(() => {
    timers.delete(timer)
    callback()
  }, delay)
  timers.add(timer)
  return timer
}

const clearPendingTimers = () => {
  timers.forEach((timer) => window.clearTimeout(timer))
  timers.clear()
}

const redirectToWorkspace = () => {
  statusMessage.value = '登录成功，正在进入工作台...'
  setTimer(() => {
    window.location.hash = '/workspace'
  }, 700)
}

const switchAuthMode = (mode) => {
  authMode.value = mode
  formError.value = ''
  statusMessage.value = mode === 'register'
    ? '填写手机号并完成验证码校验，即可创建模拟账号。'
    : '微信扫码后会自动完成登录，也可以切换其它方式。'
}

const switchLoginMethod = (method) => {
  loginMethod.value = method
  formError.value = ''
  statusMessage.value = method === 'wechat'
    ? '微信扫码后会自动完成登录，也可以切换其它方式。'
    : method === 'phone'
      ? '输入手机号与验证码，模拟短信登录。'
      : '输入账号和密码，模拟账号密码登录。'
}

const validatePhone = () => /^1\d{10}$/.test(phone.value.trim())

const sendCode = () => {
  formError.value = ''
  if (!validatePhone()) {
    formError.value = '请输入 11 位手机号。'
    return
  }
  if (isSendingCode.value || sendCountdown.value > 0) return

  isSendingCode.value = true
  statusMessage.value = '正在请求短信验证码...'
  setTimer(() => {
    isSendingCode.value = false
    sendCountdown.value = 6
    code.value = '246810'
    statusMessage.value = '验证码已发送，模拟验证码为 246810。'

    const tick = () => {
      if (sendCountdown.value <= 1) {
        sendCountdown.value = 0
        return
      }
      sendCountdown.value -= 1
      setTimer(tick, 1000)
    }
    setTimer(tick, 1000)
  }, 900)
}

const submitAuth = () => {
  formError.value = ''
  if (isSubmitting.value) return

  if (isRegister.value || loginMethod.value === 'phone') {
    if (!validatePhone()) {
      formError.value = '请输入 11 位手机号。'
      return
    }
    if (code.value.trim() !== '246810') {
      formError.value = '验证码不正确，试试 246810。'
      return
    }
  }

  if (loginMethod.value === 'password' && !isRegister.value) {
    if (!account.value.trim() || password.value.length < 6) {
      formError.value = '请输入账号，并保证密码不少于 6 位。'
      return
    }
  }

  if (isRegister.value) {
    if (!registerName.value.trim()) {
      formError.value = '请输入昵称或团队名称。'
      return
    }
    if (password.value.length < 6) {
      formError.value = '请设置不少于 6 位的密码。'
      return
    }
    if (!acceptedPolicy.value) {
      formError.value = '请先同意服务条款和隐私政策。'
      return
    }
  }

  isSubmitting.value = true
  statusMessage.value = isRegister.value ? '正在创建模拟账号...' : '正在校验登录信息...'
  setTimer(() => {
    isSubmitting.value = false
    redirectToWorkspace()
  }, 1100)
}

const simulateWechatLogin = () => {
  if (isSubmitting.value) return
  formError.value = ''
  isSubmitting.value = true
  statusMessage.value = '已扫描二维码，正在确认微信授权...'
  setTimer(() => {
    statusMessage.value = '授权成功，正在同步你的跨境团队...'
    setTimer(() => {
      isSubmitting.value = false
      redirectToWorkspace()
    }, 800)
  }, 1000)
}

onBeforeUnmount(clearPendingTimers)
</script>

<template>
  <div class="login-page">
    <div class="login-bg-carousel" aria-hidden="true">
      <span class="login-bg-slide login-bg-slide-1"></span>
      <span class="login-bg-slide login-bg-slide-2"></span>
      <span class="login-bg-slide login-bg-slide-3"></span>
      <span class="login-bg-slide login-bg-slide-4"></span>
    </div>
    <div class="login-bg-overlay" aria-hidden="true"></div>
    <div class="login-glow login-glow-left"></div>
    <div class="login-glow login-glow-right"></div>

    <header class="login-header">
      <a class="brand" href="#/workspace" :aria-label="brandName">
        <img :src="brandLogoSrc" :alt="brandName" class="brand-logo">
        <span class="brand-name">{{ brandName }}</span>
      </a>
    </header>

    <main class="login-shell">
      <section class="hero-panel" aria-label="产品介绍">
        <div class="hero-copy">
          <h1>智选，只为你的成功。</h1>
          <p class="hero-subcopy-en">Curated intelligence for your next win.</p>
        </div>

        <div class="feature-grid">
          <article v-for="feature in features" :key="feature.title" class="feature-card">
            <div class="feature-icon" :data-icon="feature.icon">
              <AppIcon :name="feature.icon" :size="17" :stroke-width="1.9" />
            </div>
            <h2>{{ feature.title }}</h2>
            <p>{{ feature.description }}</p>
          </article>
        </div>

        <div class="assistant-tip">
          <div class="avatar-stack">
            <img src="/assets/avatars/creative-director.png" alt="小思">
            <img src="/assets/avatars/market-analyst.png" alt="市场顾问">
          </div>
          <div>
            <strong>小思已就位</strong>
            <span>登录后立即开始你的跨境之旅</span>
          </div>
        </div>
      </section>

      <section class="login-card search-auth-card" :class="{ 'is-submitting': isSubmitting }" aria-label="登录">
        <div class="login-tabs" role="tablist" aria-label="登录方式">
          <button
            type="button"
            role="tab"
            :aria-selected="isRegister"
            :class="{ active: isRegister }"
            @click="switchAuthMode('register')"
          >
            注册
          </button>
          <button
            type="button"
            role="tab"
            :aria-selected="!isRegister"
            :class="{ active: !isRegister }"
            @click="switchAuthMode('login')"
          >
            登录
          </button>
        </div>

        <div v-if="!isRegister" class="method-tabs" aria-label="登录渠道">
          <button type="button" :class="{ active: loginMethod === 'wechat' }" @click="switchLoginMethod('wechat')">微信扫码</button>
          <button type="button" :class="{ active: loginMethod === 'phone' }" @click="switchLoginMethod('phone')">手机号</button>
          <button type="button" :class="{ active: loginMethod === 'password' }" @click="switchLoginMethod('password')">账号密码</button>
        </div>

        <Transition name="auth-panel" mode="out-in">
          <div v-if="!isRegister && loginMethod === 'wechat'" :key="authPanelKey" class="auth-panel qr-panel">
          <button type="button" class="qr-frame" aria-label="模拟微信扫码登录" @click="simulateWechatLogin">
            <div class="qr-grid">
              <span
                v-for="(isDark, index) in qrCells"
                :key="index"
                :class="{ dark: isDark }"
                :style="{ '--dot-delay': `${(index % 17) * 10}ms` }"
              ></span>
            </div>
            <div class="qr-logo">
              <img :src="brandLogoSrc" alt="">
            </div>
            <span v-if="isSubmitting" class="qr-mask">确认中...</span>
          </button>

          <div class="scan-copy">
            <strong>微信扫码</strong>
            <span>点击二维码可模拟扫码确认登录</span>
          </div>

          <div class="divider">
            <span></span>
            <em>或者</em>
            <span></span>
          </div>

          <button type="button" class="login-method" @click="switchLoginMethod('phone')">手机号登录</button>
          <button type="button" class="login-method" @click="switchLoginMethod('password')">用账号密码登录</button>
          </div>

        <form v-else :key="authPanelKey" class="auth-form auth-panel" @submit.prevent="submitAuth">
          <label v-if="isRegister" class="field">
            <span>昵称 / 团队名称</span>
            <input v-model.trim="registerName" autocomplete="name" placeholder="请输入你的团队名称">
          </label>

          <template v-if="isRegister || loginMethod === 'phone'">
            <label class="field">
              <span>手机号</span>
              <input v-model.trim="phone" inputmode="tel" maxlength="11" autocomplete="tel" placeholder="请输入手机号">
            </label>
            <label class="field">
              <span>验证码</span>
              <div class="code-row">
                <input v-model.trim="code" inputmode="numeric" maxlength="6" placeholder="246810">
                <button type="button" :disabled="isSendingCode || sendCountdown > 0" @click="sendCode">
                  {{ codeButtonText }}
                </button>
              </div>
            </label>
          </template>

          <template v-if="isRegister || loginMethod === 'password'">
            <label v-if="!isRegister" class="field">
              <span>账号</span>
              <input v-model.trim="account" autocomplete="username" placeholder="demo@chuhaijiang.com">
            </label>
            <label class="field">
              <span>密码</span>
              <input v-model="password" type="password" autocomplete="current-password" placeholder="不少于 6 位">
            </label>
          </template>

          <label v-if="isRegister" class="policy-check">
            <input v-model="acceptedPolicy" type="checkbox">
            <span>我已阅读并同意服务条款和隐私政策</span>
          </label>

          <p v-if="formError" class="form-error">{{ formError }}</p>
          <button type="submit" class="submit-button" :disabled="isSubmitting">
            <span v-if="isSubmitting" class="spinner"></span>
            {{ submitText }}
          </button>
        </form>
        </Transition>

        <p :key="statusMessage" class="status-message">{{ statusMessage }}</p>

        <p class="policy">
          <a href="#/workspace" @click.prevent>服务条款</a>
          <span>、</span>
          <a href="#/workspace" @click.prevent>隐私政策</a>
        </p>
      </section>
    </main>

    <footer class="login-footer">© 2026 思燕智选</footer>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100dvh;
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  isolation: isolate;
  background:
    radial-gradient(circle at 8% 16%, rgba(124, 58, 237, 0.1), transparent 28%),
    radial-gradient(circle at 88% 20%, rgba(76, 83, 245, 0.12), transparent 25%),
    #eef3ff;
  color: #0b1631;
  font-family: "Inter", "PingFang SC", "Microsoft YaHei", sans-serif;
}

.login-bg-carousel,
.login-bg-overlay {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}

.login-bg-carousel {
  overflow: hidden;
  background: #eef3ff;
}

.login-bg-slide {
  position: absolute;
  inset: -2%;
  background-position: center;
  background-size: cover;
  opacity: 0;
  transform: scale(1.04);
  animation: login-bg-crossfade 28s ease-in-out infinite;
  will-change: opacity, transform;
}

.login-bg-slide::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(238, 243, 255, 0.8) 0%, rgba(238, 243, 255, 0.48) 44%, rgba(238, 243, 255, 0.22) 100%);
}

.login-bg-slide-1 {
  background-image: url('/assets/storyboards/7638139108254059789/shot_3_01-03dae8.jpg');
  animation-delay: 0s;
}

.login-bg-slide-2 {
  background-image: url('/assets/storyboards/7637993570737065247/shot_4_00-157b70.jpg');
  animation-delay: 7s;
}

.login-bg-slide-3 {
  background-image: url('/assets/storyboards/7638368345523326222/shot_3_00-113ab9.jpg');
  animation-delay: 14s;
}

.login-bg-slide-4 {
  background-image: url('/assets/storyboards/7638339931768638750/shot_5_00-25935f.jpg');
  animation-delay: 21s;
}

.login-bg-overlay {
  background:
    radial-gradient(circle at 8% 16%, rgba(124, 58, 237, 0.16), transparent 28%),
    radial-gradient(circle at 88% 20%, rgba(76, 83, 245, 0.16), transparent 25%),
    linear-gradient(135deg, rgba(245, 248, 255, 0.82) 0%, rgba(238, 243, 255, 0.68) 48%, rgba(229, 236, 255, 0.54) 100%);
  backdrop-filter: blur(1px);
}

.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.34) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.28) 1px, transparent 1px);
  background-size: 54px 54px;
  opacity: 0.28;
  pointer-events: none;
  animation: grid-drift 18s linear infinite;
}

.login-page::after {
  content: "";
  position: absolute;
  inset: -18%;
  z-index: 0;
  background:
    conic-gradient(from 110deg at 22% 48%, transparent 0 18%, rgba(124, 92, 255, 0.11) 22%, transparent 32% 100%),
    conic-gradient(from -40deg at 82% 42%, transparent 0 12%, rgba(76, 83, 245, 0.1) 17%, transparent 30% 100%);
  opacity: 0.72;
  pointer-events: none;
  animation: aurora-shift 16s ease-in-out infinite alternate;
}

.login-glow {
  position: absolute;
  width: 360px;
  height: 360px;
  border-radius: 999px;
  filter: blur(64px);
  opacity: 0.35;
  pointer-events: none;
  animation: glow-breathe 7s ease-in-out infinite;
}

.login-glow-left {
  left: -140px;
  top: 290px;
  background: #b7c4ff;
}

.login-glow-right {
  right: 80px;
  top: 150px;
  background: #d6b3ff;
  animation-delay: -2.4s;
}

.login-header {
  position: relative;
  z-index: 1;
  width: min(1184px, calc(100% - 48px));
  margin: 22px auto 0;
  animation: slide-down-soft 620ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.brand {
  width: max-content;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  color: #223051;
  text-decoration: none;
  font-size: 26px;
  font-weight: 800;
  letter-spacing: -0.04em;
  transition: transform 220ms ease, filter 220ms ease;
}

.brand:hover {
  transform: translateY(-1px);
  filter: drop-shadow(0 10px 22px rgba(76, 83, 245, 0.18));
}

.brand-logo {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(0 5px 12px rgba(124, 58, 237, 0.25));
}

.brand-name {
  transform: translateY(-1px);
}

.login-shell {
  position: relative;
  z-index: 1;
  width: min(1184px, calc(100% - 48px));
  flex: 1;
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 450px;
  align-items: center;
  gap: 72px;
  padding: 74px 0 88px;
}

.hero-panel {
  max-width: 664px;
  animation: content-rise 780ms cubic-bezier(0.16, 1, 0.3, 1) 80ms both;
}

.hero-copy h1 {
  margin: 0;
  max-width: 430px;
  font-size: clamp(42px, 5vw, 52px);
  line-height: 1.08;
  font-weight: 900;
  letter-spacing: -0.08em;
  color: #050b1a;
  animation: text-focus-in 760ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.hero-copy h1 span {
  display: inline-block;
  background: linear-gradient(95deg, #365cff 0%, #8c5cff 46%, #c84fff 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 15px 30px rgba(110, 85, 255, 0.18);
  background-size: 180% 100%;
  animation: gradient-flow 4.8s ease-in-out infinite;
}

.hero-copy p {
  margin: 18px 0 26px;
  color: #33405f;
  font-size: 16px;
  animation: content-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 160ms both;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.feature-card {
  min-height: 112px;
  padding: 16px;
  border: 1px solid rgba(204, 211, 231, 0.86);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow:
    0 13px 32px rgba(24, 36, 80, 0.08),
    0 2px 5px rgba(24, 36, 80, 0.06);
  backdrop-filter: blur(14px);
  opacity: 0;
  translate: 0 18px;
  animation: card-rise 680ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  transition:
    translate 260ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 260ms ease,
    border-color 260ms ease;
}

.feature-card:nth-child(1) {
  animation-delay: 220ms;
}

.feature-card:nth-child(2) {
  animation-delay: 300ms;
}

.feature-card:nth-child(3) {
  animation-delay: 380ms;
}

.feature-card:nth-child(4) {
  animation-delay: 460ms;
}

.feature-card:hover {
  transform: translateY(-5px);
  border-color: rgba(124, 92, 255, 0.32);
  box-shadow:
    0 20px 42px rgba(24, 36, 80, 0.12),
    0 6px 16px rgba(124, 92, 255, 0.12);
}

.feature-icon {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
  border: 1px solid rgba(124, 92, 255, 0.2);
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.12), rgba(200, 79, 255, 0.12));
  color: #7b5cff;
  transition: transform 260ms ease, background 260ms ease;
}

.feature-card:hover .feature-icon {
  transform: rotate(-3deg) scale(1.08);
  background: linear-gradient(135deg, rgba(124, 92, 255, 0.18), rgba(200, 79, 255, 0.18));
}

.feature-icon svg {
  width: 17px;
  height: 17px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.9;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.feature-card h2 {
  margin: 0 0 6px;
  font-size: 14px;
  color: #061025;
}

.feature-card p {
  margin: 0;
  color: #52607b;
  font-size: 12px;
  line-height: 1.55;
}

.assistant-tip {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
  color: #465475;
  font-size: 12px;
  animation: content-rise 700ms cubic-bezier(0.16, 1, 0.3, 1) 560ms both;
}

.avatar-stack {
  display: flex;
  align-items: center;
}

.avatar-stack img {
  width: 38px;
  height: 38px;
  border: 2px solid #eef3ff;
  border-radius: 999px;
  object-fit: cover;
  background: white;
  box-shadow: 0 7px 18px rgba(76, 83, 245, 0.18);
  animation: avatar-float 4.2s ease-in-out infinite;
}

.avatar-stack img + img {
  margin-left: -13px;
  animation-delay: -1.8s;
}

.assistant-tip strong,
.assistant-tip span {
  display: block;
}

.assistant-tip strong {
  color: #2b3452;
  font-size: 14px;
}

.login-card {
  position: relative;
  width: 100%;
  min-height: 600px;
  padding: 32px;
  overflow: hidden;
  border: 1.5px solid rgba(156, 111, 255, 0.78);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow:
    0 28px 64px rgba(72, 84, 160, 0.18),
    0 4px 18px rgba(124, 58, 237, 0.1);
  animation: card-enter 820ms cubic-bezier(0.16, 1, 0.3, 1) 180ms both;
  transition:
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 260ms ease,
    box-shadow 260ms ease;
}

.login-card::before,
.login-card::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.login-card::before {
  inset: 0;
  z-index: 0;
  background:
    linear-gradient(115deg, transparent 0 34%, rgba(255, 255, 255, 0.72) 45%, transparent 57% 100%),
    radial-gradient(circle at 16% 0%, rgba(124, 92, 255, 0.1), transparent 34%);
  opacity: 0.46;
  transform: translateX(-62%);
  animation: card-sheen 5.8s ease-in-out infinite;
}

.login-card::after {
  inset: 1px;
  z-index: 0;
  border-radius: 16px;
  background:
    radial-gradient(circle at 50% 0%, rgba(124, 92, 255, 0.14), transparent 30%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.64), transparent 34%);
  opacity: 0;
  transition: opacity 240ms ease;
}

.login-card:hover {
  transform: translateY(-3px);
  border-color: rgba(138, 92, 255, 0.88);
  box-shadow:
    0 34px 76px rgba(72, 84, 160, 0.22),
    0 8px 24px rgba(124, 58, 237, 0.14);
}

.login-card.is-submitting {
  transform: translateY(-2px) scale(1.005);
}

.login-card.is-submitting::after {
  opacity: 1;
}

.login-card > * {
  position: relative;
  z-index: 1;
}

.login-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  padding: 3px;
  margin-bottom: 16px;
  border-radius: 9px;
  background: #edf1f8;
}

.login-tabs button,
.method-tabs button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.login-tabs button {
  height: 34px;
  border-radius: 8px;
  background: transparent;
  color: #17213b;
  font-size: 14px;
  transition:
    background 220ms ease,
    color 220ms ease,
    box-shadow 220ms ease,
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.login-tabs button:hover {
  transform: translateY(-1px);
}

.login-tabs button.active {
  background: #f8f6fb;
  box-shadow:
    inset 0 0 0 1px rgba(210, 215, 230, 0.86),
    0 2px 5px rgba(31, 41, 55, 0.08);
  color: #050b1a;
  animation: tab-pop 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.method-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.method-tabs button {
  flex: 1;
  height: 32px;
  border-radius: 999px;
  background: #f4f6fb;
  color: #64708a;
  font-size: 12px;
  transition:
    background 180ms ease,
    color 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 180ms ease;
}

.method-tabs button:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(76, 83, 245, 0.08);
}

.method-tabs button.active {
  background: rgba(76, 83, 245, 0.1);
  color: #4c53f5;
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(76, 83, 245, 0.1);
}

.qr-frame {
  position: relative;
  display: block;
  width: 240px;
  height: 240px;
  margin: 0 auto 9px;
  padding: 7px;
  border: 1px solid #d6dce8;
  border-radius: 9px;
  background: white;
  cursor: pointer;
  overflow: hidden;
  animation: qr-float 5.2s ease-in-out infinite;
  transition:
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 220ms ease,
    box-shadow 220ms ease;
}

.qr-frame::before,
.qr-frame::after {
  content: "";
  position: absolute;
  pointer-events: none;
}

.qr-frame::before {
  left: 12px;
  right: 12px;
  top: 18px;
  z-index: 2;
  height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(76, 83, 245, 0.72), transparent);
  box-shadow: 0 0 16px rgba(76, 83, 245, 0.42);
  animation: qr-scan 2.8s ease-in-out infinite;
}

.qr-frame::after {
  inset: -30%;
  z-index: 3;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.72) 48%, transparent 58%);
  transform: translateX(-58%);
  animation: qr-shine 4.4s ease-in-out infinite;
}

.qr-frame:hover {
  border-color: #9c6fff;
  box-shadow: 0 18px 34px rgba(76, 83, 245, 0.16);
  transform: translateY(-3px) scale(1.012);
}

.qr-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(13, 1fr);
  grid-template-rows: repeat(13, 1fr);
  width: 100%;
  height: 100%;
  gap: 3px;
  padding: 4px;
  background: white;
}

.qr-grid span {
  border-radius: 1px;
  background: transparent;
}

.qr-grid span.dark {
  background: #050505;
  animation: qr-dot-pop 440ms cubic-bezier(0.16, 1, 0.3, 1) both;
  animation-delay: var(--dot-delay);
}

.qr-logo,
.qr-mask {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.qr-logo {
  z-index: 4;
  width: 39px;
  height: 39px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: white;
  box-shadow: 0 0 0 6px white;
  animation: logo-pulse 2.9s ease-in-out infinite;
}

.qr-logo img {
  width: 25px;
  height: 25px;
  object-fit: contain;
}

.qr-mask {
  z-index: 5;
  width: 150px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #4c53f5;
  font-size: 13px;
  font-weight: 700;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
  animation: mask-pop 240ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.scan-copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  margin-bottom: 19px;
}

.scan-copy strong {
  color: #0d162d;
  font-size: 14px;
}

.scan-copy span {
  color: #37435f;
  font-size: 12px;
}

.divider {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 10px;
  margin-bottom: 22px;
}

.divider span {
  height: 1px;
  background: #d6dce8;
}

.divider em {
  color: #5c6680;
  font-size: 12px;
  font-style: normal;
}

.login-method,
.submit-button {
  width: 100%;
  height: 44px;
  border-radius: 9px;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.login-method {
  display: block;
  margin-top: 16px;
  border: 1px solid #d6dce8;
  background: white;
  color: #10182f;
}

.login-method:hover {
  border-color: #9c6fff;
  box-shadow: 0 10px 26px rgba(124, 92, 255, 0.13);
  transform: translateY(-1px);
}

.login-method:active,
.submit-button:active:not(:disabled),
.code-row button:active:not(:disabled) {
  transform: translateY(1px) scale(0.99);
}

.auth-panel {
  will-change: opacity, transform, filter;
}

.auth-panel-enter-active,
.auth-panel-leave-active {
  transition:
    opacity 260ms ease,
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1),
    filter 260ms ease;
}

.auth-panel-enter-from {
  opacity: 0;
  filter: blur(5px);
  transform: translateY(14px) scale(0.985);
}

.auth-panel-leave-to {
  opacity: 0;
  filter: blur(4px);
  transform: translateY(-8px) scale(0.99);
}

.auth-form {
  display: grid;
  gap: 14px;
}

.field {
  display: grid;
  gap: 7px;
}

.field span {
  color: #37435f;
  font-size: 12px;
  font-weight: 700;
}

.field input {
  height: 42px;
  width: 100%;
  border: 1px solid #d7ddeb;
  border-radius: 10px;
  background: #fff;
  color: #10182f;
  font-size: 14px;
  outline: none;
  padding: 0 12px;
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.field input:focus {
  border-color: #8a5cff;
  box-shadow: 0 0 0 3px rgba(138, 92, 255, 0.12);
  transform: translateY(-1px);
}

.code-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 112px;
  gap: 10px;
}

.code-row button {
  border: 1px solid rgba(76, 83, 245, 0.24);
  border-radius: 10px;
  background: rgba(76, 83, 245, 0.08);
  color: #4c53f5;
  cursor: pointer;
  font-size: 12px;
  font-weight: 700;
  transition:
    background 180ms ease,
    box-shadow 180ms ease,
    transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.code-row button:hover:not(:disabled) {
  background: rgba(76, 83, 245, 0.12);
  box-shadow: 0 8px 18px rgba(76, 83, 245, 0.1);
  transform: translateY(-1px);
}

.code-row button:disabled,
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.72;
}

.policy-check {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #51607d;
  font-size: 12px;
}

.policy-check input {
  accent-color: #4c53f5;
}

.form-error {
  margin: -4px 0 0;
  color: #e11d48;
  font-size: 12px;
}

.submit-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
  border: 0;
  background: linear-gradient(90deg, #4c53f5 0%, #8a5cff 52%, #c84fff 100%);
  background-size: 180% 100%;
  color: white;
  font-weight: 800;
  box-shadow: 0 12px 28px rgba(126, 87, 255, 0.24);
  animation: button-gradient 5s ease-in-out infinite;
}

.submit-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 16px 32px rgba(126, 87, 255, 0.32);
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: white;
  border-radius: 999px;
  animation: spin 800ms linear infinite;
}

.status-message {
  min-height: 18px;
  margin: 16px 0 0;
  color: #4f5f7d;
  font-size: 12px;
  text-align: center;
  animation: status-slide 260ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.policy {
  margin: 12px 0 0;
  text-align: center;
  color: #51607d;
  font-size: 12px;
}

.policy a {
  color: inherit;
  text-decoration: none;
}

.policy a:hover {
  color: #6c4df6;
}

.login-footer {
  position: relative;
  z-index: 1;
  margin: 0 auto 28px;
  color: #8a96ad;
  font-size: 12px;
}

@keyframes login-bg-crossfade {
  0% {
    opacity: 0;
    transform: scale(1.04);
  }

  7% {
    opacity: 1;
  }

  28% {
    opacity: 1;
  }

  36% {
    opacity: 0;
    transform: scale(1.1);
  }

  100% {
    opacity: 0;
    transform: scale(1.1);
  }
}

@keyframes grid-drift {
  from {
    background-position: 0 0, 0 0;
  }

  to {
    background-position: 54px 54px, 54px 54px;
  }
}

@keyframes aurora-shift {
  from {
    transform: translate3d(-1.5%, -1%, 0) rotate(-1deg) scale(1);
  }

  to {
    transform: translate3d(1.5%, 1%, 0) rotate(1deg) scale(1.04);
  }
}

@keyframes glow-breathe {
  0%,
  100% {
    opacity: 0.26;
    transform: scale(0.96);
  }

  50% {
    opacity: 0.42;
    transform: scale(1.08);
  }
}

@keyframes slide-down-soft {
  from {
    opacity: 0;
    transform: translateY(-14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes content-rise {
  from {
    opacity: 0;
    transform: translateY(22px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes text-focus-in {
  from {
    opacity: 0;
    filter: blur(8px);
    transform: translateY(16px) scale(0.985);
  }

  to {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0) scale(1);
  }
}

@keyframes gradient-flow {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

@keyframes card-rise {
  from {
    opacity: 0;
    translate: 0 18px;
  }

  to {
    opacity: 1;
    translate: 0 0;
  }
}

@keyframes avatar-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-4px);
  }
}

@keyframes card-enter {
  from {
    opacity: 0;
    filter: blur(10px);
    translate: 0 24px;
    scale: 0.985;
  }

  to {
    opacity: 1;
    filter: blur(0);
    translate: 0 0;
    scale: 1;
  }
}

@keyframes card-sheen {
  0%,
  18% {
    transform: translateX(-68%);
    opacity: 0;
  }

  34% {
    opacity: 0.5;
  }

  56%,
  100% {
    transform: translateX(68%);
    opacity: 0;
  }
}

@keyframes tab-pop {
  0% {
    transform: scale(0.98);
  }

  70% {
    transform: scale(1.02);
  }

  100% {
    transform: scale(1);
  }
}

@keyframes qr-float {
  0%,
  100% {
    translate: 0 0;
  }

  50% {
    translate: 0 -3px;
  }
}

@keyframes qr-scan {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0;
  }

  14% {
    opacity: 0.95;
  }

  72% {
    opacity: 0.95;
  }

  86% {
    transform: translateY(188px);
    opacity: 0;
  }
}

@keyframes qr-shine {
  0%,
  36% {
    transform: translateX(-62%) rotate(0deg);
    opacity: 0;
  }

  52% {
    opacity: 0.62;
  }

  74%,
  100% {
    transform: translateX(62%) rotate(0deg);
    opacity: 0;
  }
}

@keyframes qr-dot-pop {
  from {
    opacity: 0;
    transform: scale(0.42);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes logo-pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 0 0 6px white;
  }

  50% {
    transform: translate(-50%, -50%) scale(1.05);
    box-shadow: 0 0 0 7px white, 0 10px 24px rgba(124, 92, 255, 0.16);
  }
}

@keyframes mask-pop {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.92);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes button-gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

@keyframes status-slide {
  from {
    opacity: 0;
    transform: translateY(6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Search-style auth layout experiment */
.login-page {
  background: #101827;
}

.login-bg-slide::after {
  background: linear-gradient(180deg, rgba(5, 10, 20, 0.18) 0%, rgba(5, 10, 20, 0.46) 58%, rgba(5, 10, 20, 0.7) 100%);
}

.login-bg-overlay {
  background:
    linear-gradient(180deg, rgba(8, 13, 28, 0.18) 0%, rgba(8, 13, 28, 0.08) 34%, rgba(8, 13, 28, 0.68) 100%),
    radial-gradient(circle at 50% 38%, rgba(255, 255, 255, 0.16), transparent 34%);
  backdrop-filter: none;
}

.login-page::before {
  opacity: 0.12;
}

.login-page::after,
.login-glow,
.feature-grid,
.assistant-tip,
.status-message,
.policy,
.login-footer {
  display: none;
}

.login-header {
  width: min(1320px, calc(100% - 56px));
  margin-top: 24px;
}

.brand {
  color: #fff;
  text-shadow: 0 10px 30px rgba(0, 0, 0, 0.28);
}

.login-shell {
  width: min(1320px, calc(100% - 56px));
  min-height: calc(100dvh - 92px);
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: auto auto;
  align-content: center;
  align-items: center;
  gap: 28px;
  padding: 0 0 24px;
}

.hero-panel {
  max-width: none;
  align-self: center;
  justify-self: center;
  text-align: center;
  transform: translateY(0);
}

.hero-copy h1 {
  max-width: none;
  color: #fff;
  font-size: clamp(68px, 7.2vw, 118px);
  line-height: 0.94;
  letter-spacing: 0;
  text-align: center;
  white-space: nowrap;
  text-shadow: 0 18px 48px rgba(0, 0, 0, 0.38);
}

.hero-copy p {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 15px;
}

.hero-subcopy-en {
  margin-top: 10px !important;
  color: rgba(255, 255, 255, 0.72) !important;
  font-size: 18px !important;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-align: center;
  text-transform: uppercase;
}

.search-auth-card {
  align-self: start;
  justify-self: center;
  width: min(1120px, 100%);
  min-height: 0;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 28px 80px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(18px);
  display: grid;
  grid-template-columns: 156px minmax(0, 1fr);
  gap: 10px;
  overflow: visible;
}

.search-auth-card::before,
.search-auth-card::after {
  display: none;
}

.search-auth-card:hover,
.search-auth-card.is-submitting {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.68);
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.32);
}

.search-auth-card .login-tabs {
  align-self: center;
  margin: 0;
  height: 48px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
}

.search-auth-card .login-tabs button {
  height: 42px;
  border-radius: 999px;
  font-size: 13px;
}

.search-auth-card .login-tabs button.active {
  background: #111827;
  color: #fff;
  box-shadow: 0 10px 22px rgba(17, 24, 39, 0.2);
}

.search-auth-card .method-tabs {
  grid-column: 1 / -1;
  grid-row: 2;
  display: flex;
  justify-content: center;
  gap: 8px;
  margin: 2px 0 -44px;
}

.search-auth-card .method-tabs button {
  flex: 0 0 auto;
  min-width: 96px;
  height: 30px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(15, 23, 42, 0.42);
  color: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(10px);
}

.search-auth-card .method-tabs button.active {
  background: #fff;
  color: #111827;
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.18);
}

.search-auth-card .auth-panel {
  align-self: center;
}

.search-auth-card .qr-panel {
  display: grid;
  grid-template-columns: 56px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
}

.search-auth-card .qr-frame {
  width: 48px;
  height: 48px;
  margin: 0;
  padding: 4px;
  border-radius: 999px;
  animation: none;
}

.search-auth-card .qr-frame::before,
.search-auth-card .qr-frame::after,
.search-auth-card .qr-logo {
  display: none;
}

.search-auth-card .qr-grid {
  gap: 1px;
  padding: 2px;
  border-radius: 999px;
  overflow: hidden;
}

.search-auth-card .scan-copy {
  align-items: flex-start;
  gap: 2px;
  margin: 0;
  min-width: 0;
}

.search-auth-card .scan-copy strong {
  font-size: 14px;
}

.search-auth-card .scan-copy span {
  max-width: 260px;
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-auth-card .divider {
  display: none;
}

.search-auth-card .login-method {
  width: auto;
  min-width: 128px;
  height: 44px;
  margin: 0;
  border-radius: 999px;
  background: #f8fafc;
}

.search-auth-card .auth-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
  align-items: end;
  gap: 8px;
}

.search-auth-card .field {
  gap: 4px;
}

.search-auth-card .field span,
.search-auth-card .policy-check,
.search-auth-card .form-error {
  display: none;
}

.search-auth-card .field input,
.search-auth-card .code-row button,
.search-auth-card .submit-button {
  height: 46px;
  border-radius: 999px;
}

.search-auth-card .code-row {
  grid-template-columns: minmax(0, 1fr) 104px;
  gap: 8px;
}

.search-auth-card .submit-button {
  min-width: 172px;
  margin: 0;
  padding: 0 20px;
  background: #111827;
  box-shadow: 0 14px 30px rgba(17, 24, 39, 0.24);
  animation: none;
}

.search-auth-card .auth-form .field:nth-of-type(4) {
  display: none;
}

/* Product feature cards below the auth bar */
.hero-panel {
  display: contents;
}

.hero-copy {
  grid-row: 1;
  justify-self: center;
  text-align: center;
  transform: translateY(-18px);
}

.search-auth-card {
  grid-row: 2;
}

.feature-grid {
  grid-row: 3;
  display: grid;
  width: min(1120px, 100%);
  justify-self: center;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 2px;
}

.feature-card {
  min-height: 96px;
  padding: 14px;
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.16);
  box-shadow: 0 16px 42px rgba(0, 0, 0, 0.16);
  backdrop-filter: blur(18px);
}

.feature-card:hover {
  border-color: rgba(255, 255, 255, 0.52);
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.22);
}

.feature-icon {
  margin-bottom: 8px;
  border-color: rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}

.feature-card h2 {
  color: #fff;
  font-size: 13px;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 11px;
  line-height: 1.5;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}

@media (max-width: 980px) {
  .login-shell {
    min-height: calc(100dvh - 84px);
    padding-bottom: 48px;
  }

  .hero-panel {
    transform: translateY(0);
  }

  .hero-copy h1 {
    font-size: clamp(42px, 9vw, 64px);
    white-space: normal;
  }

  .hero-subcopy-en {
    font-size: 14px !important;
  }

  .search-auth-card {
    width: min(760px, 100%);
    border-radius: 28px;
    grid-template-columns: 1fr;
  }

  .search-auth-card .login-tabs {
    width: 100%;
  }

  .search-auth-card .qr-panel,
  .search-auth-card .auth-form {
    grid-template-columns: 1fr;
  }

  .search-auth-card .qr-frame {
    display: none;
  }

  .search-auth-card .login-method,
  .search-auth-card .submit-button {
    width: 100%;
  }
}

@media (max-width: 980px) {
  .login-shell {
    grid-template-columns: 1fr;
    gap: 36px;
    padding-top: 46px;
  }

  .hero-panel {
    max-width: none;
  }

  .login-card {
    max-width: 450px;
    margin: 0 auto;
  }
}

@media (max-width: 640px) {
  .login-header,
  .login-shell {
    width: min(100% - 28px, 1184px);
  }

  .brand {
    font-size: 22px;
  }

  .login-shell {
    padding-bottom: 52px;
  }

  .hero-copy h1 {
    font-size: 38px;
  }

  .feature-grid {
    grid-template-columns: 1fr;
  }

  .login-card {
    min-height: auto;
    padding: 22px;
  }

  .qr-frame {
    width: 210px;
    height: 210px;
  }

  .method-tabs {
    gap: 6px;
  }

  .method-tabs button {
    font-size: 11px;
  }
}
</style>
