<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  eyebrow: {
    type: String,
    default: '创作',
  },
  description: {
    type: String,
    default: '',
  },
})
</script>

<template>
  <main class="create-main">
    <header class="create-topbar">
      <div class="mobile-bar">
        <button aria-label="菜单" class="mobile-menu">
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
          {{ eyebrow }}
        </span>
        <svg class="crumb-arrow" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 18 6-6-6-6"></path>
        </svg>
        <span class="crumb-current">{{ title }}</span>
      </nav>
    </header>

    <section class="create-content">
      <div class="page-heading">
        <span class="heading-kicker">创意工作台</span>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </div>
      <slot />
    </section>
  </main>
</template>

<style scoped>
.create-main {
  flex: 1;
  min-width: 0;
  min-height: 100dvh;
  margin-left: 244px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top left, rgba(79, 70, 229, 0.08), transparent 28rem),
    linear-gradient(180deg, rgba(248, 250, 252, 0.72), rgba(246, 245, 252, 0));
  transition: margin-left 200ms ease-out;
}

.create-topbar {
  position: sticky;
  top: var(--promo-banner-h, 0px);
  z-index: 30;
  height: var(--header-height, 56px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  background: rgba(246, 245, 252, 0.88);
  backdrop-filter: blur(14px);
  clip-path: inset(0 0 -20px 0);
}

.mobile-bar {
  display: none;
}

.mobile-menu {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #374151;
  cursor: pointer;
}

.mobile-menu svg,
.breadcrumb svg {
  width: 18px;
  height: 18px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.mobile-logo {
  height: 20px;
  width: auto;
  margin-left: 8px;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  color: #6b7280;
  font-size: 14px;
}

.crumb-main,
.crumb-current {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.crumb-main {
  color: #374151;
  font-weight: 600;
}

.crumb-current {
  color: #111827;
  font-weight: 700;
}

.crumb-arrow {
  width: 14px;
  height: 14px;
  color: #9ca3af;
}

.create-content {
  width: min(100% - 32px, 1280px);
  margin: 0 auto;
  padding: 24px 0 132px;
}

.page-heading {
  margin-bottom: 18px;
}

.heading-kicker {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: rgba(79, 70, 229, 0.1);
  color: #4338ca;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.page-heading h1 {
  margin: 10px 0 6px;
  color: #111827;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.16;
}

.page-heading p {
  max-width: 720px;
  margin: 0;
  color: #6b7280;
  font-size: 14px;
  line-height: 1.7;
}

@media (max-width: 767px) {
  .create-main {
    margin-left: 0;
  }

  .create-topbar {
    padding: 0 12px;
  }

  .mobile-bar {
    display: flex;
    align-items: center;
  }

  .breadcrumb {
    display: none;
  }

  .create-content {
    width: min(100% - 24px, 1280px);
    padding-top: 18px;
  }
}
</style>
