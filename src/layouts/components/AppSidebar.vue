<script setup>
import { computed } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { getActiveModule, logoSrc, primaryNav } from '../sidebarData'

const props = defineProps({
  currentPath: {
    type: String,
    default: '/workspace',
  },
})

const activeModule = computed(() => getActiveModule(props.currentPath))

const isModuleActive = (module) => activeModule.value === module
const isFeaturedModule = (item) => item.module === 'agent'

const mobileNavClass = (item) => [
  'app-sidebar-mobile-link',
  { 'is-active': isModuleActive(item.module), 'is-featured': isFeaturedModule(item) },
]
const desktopItemClass = (item) => [
  'app-sidebar-item',
  { 'is-featured': isFeaturedModule(item), 'is-active': isModuleActive(item.module) },
]
const desktopIconClass = (item) => [
  'app-sidebar-icon',
  { 'is-active': isModuleActive(item.module), 'is-featured': isFeaturedModule(item) },
]
const desktopTextClass = (item) => [
  'app-sidebar-text',
  { 'is-active': isModuleActive(item.module), 'is-featured': isFeaturedModule(item) },
]
</script>
<template>
  <div class="app-sidebar-mobile-overlay"></div>
  <div class="app-sidebar-mobile-drawer">
    <div class="app-sidebar-mobile-logo-row">
      <img alt="思燕智选" loading="lazy" width="88" height="26" decoding="async" class="app-sidebar-mobile-logo" style="color: transparent" :srcset="logoSrc + ' 1x, ' + logoSrc + ' 2x'" :src="logoSrc" />
    </div>
    <nav class="app-sidebar-mobile-nav">
      <ul class="app-sidebar-mobile-list">
        <li v-for="item in primaryNav" :key="item.module">
          <a
            data-ph-capture-attribute-button-name="nav:module_switched"
            :data-ph-capture-attribute-to-module="item.module"
            :class="mobileNavClass(item)"
            :href="'#' + item.path"
          >
            <AppIcon :name="item.icon" class="app-sidebar-mobile-icon" :stroke-width="1.6" />
            {{ item.label }}
          </a>
        </li>
      </ul>
    </nav>
  </div>

  <div class="app-sidebar-desktop">
    <div class="app-sidebar-desktop-panel">
      <nav class="app-sidebar-desktop-nav">
        <template v-for="item in primaryNav" :key="item.module">
          <a
            :title="item.label"
            :data-tour="'nav-' + item.module"
            data-ph-capture-attribute-button-name="nav:module_switched"
            :data-ph-capture-attribute-to-module="item.module"
            :class="desktopItemClass(item)"
            :href="'#' + item.path"
          >
            <div :class="desktopIconClass(item)">
              <AppIcon :name="item.icon" class="app-sidebar-desktop-icon" :stroke-width="1.8" />
            </div>
            <span :class="desktopTextClass(item)">{{ item.label }}</span>
            <span v-if="isFeaturedModule(item)" class="app-sidebar-feature-badge">AI</span>
            <div class="app-sidebar-active-rail" :class="{ 'is-active': isModuleActive(item.module) }"></div>
          </a>
          <div v-if="item.breakAfter" class="app-sidebar-break"></div>
        </template>
      </nav>
      <a class="app-sidebar-home-link" href="#/workspace">
        <img alt="思燕智选" loading="lazy" width="36" height="36" decoding="async" class="app-sidebar-home-logo" style="color: transparent" :src="logoSrc" />
      </a>
    </div>
  </div>
</template>
<style scoped>
.app-sidebar-mobile-overlay,
.app-sidebar-mobile-drawer,
.app-sidebar-desktop {
  display: none;
}

.app-sidebar-mobile-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  background: rgba(0, 0, 0, 0.4);
  opacity: 0;
  pointer-events: none;
  transition: opacity 300ms ease;
}

.app-sidebar-mobile-overlay.is-open {
  opacity: 1;
  pointer-events: auto;
}

.app-sidebar-mobile-drawer {
  position: fixed;
  left: 0;
  top: var(--promo-banner-h, 0px);
  z-index: 50;
  width: 220px;
  height: calc(100dvh - var(--promo-banner-h, 0px));
  flex-direction: column;
  background: #fff;
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.22);
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

.app-sidebar-mobile-drawer.is-open {
  transform: translateX(0);
}

.app-sidebar-mobile-logo-row {
  display: flex;
  height: var(--header-height);
  flex: 0 0 auto;
  align-items: center;
  padding: 0 16px;
}

.app-sidebar-mobile-logo {
  width: auto;
  height: 22px;
}

.app-sidebar-mobile-nav {
  flex: 1 1 auto;
  overflow-y: auto;
  padding: 12px 10px 24px;
}

.app-sidebar-mobile-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.app-sidebar-mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 8px;
  padding: 8px 10px;
  color: #4b5563;
  font-size: 13px;
  text-decoration: none;
  transition: background-color 220ms ease, color 220ms ease;
}

.app-sidebar-mobile-link:hover {
  color: #111827;
  background: #f9fafb;
}

.app-sidebar-mobile-link.is-featured {
  color: #4c53f5;
  background: linear-gradient(135deg, rgba(76, 83, 245, 0.12), rgba(139, 92, 246, 0.1));
  font-weight: 700;
  box-shadow: inset 0 0 0 1px rgba(76, 83, 245, 0.16);
}

.app-sidebar-mobile-link.is-active {
  color: #111827;
  background: #f3f4f6;
  font-weight: 600;
}

.app-sidebar-mobile-link.is-featured.is-active {
  color: #4c53f5;
  background: linear-gradient(135deg, rgba(76, 83, 245, 0.18), rgba(139, 92, 246, 0.14));
  box-shadow: inset 0 0 0 1px rgba(76, 83, 245, 0.24);
}

.app-sidebar-mobile-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.app-sidebar-desktop-panel {
  display: flex;
  width: 68px;
  height: 100%;
  flex-direction: column;
  align-items: center;
  border-right: 1px solid rgba(243, 244, 246, 0.6);
  background: #fff;
  padding: 12px 0;
}

.app-sidebar-desktop-nav {
  display: flex;
  width: 100%;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  padding: 0 10px;
}

.app-sidebar-item {
  position: relative;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.app-sidebar-item.is-featured {
  margin: 2px 0 1px;
}

.app-sidebar-icon,
.app-sidebar-text {
  transition: background-color 220ms ease, color 220ms ease, opacity 220ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease;
}

.app-sidebar-icon {
  position: relative;
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: #6b7280;
}

.app-sidebar-item:hover .app-sidebar-icon {
  color: #374151;
  background: #f9fafb;
  transform: translateY(-1px);
}

.app-sidebar-item.is-featured .app-sidebar-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: #fff;
  background:
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(135deg, #4c53f5, #8b5cf6);
  box-shadow:
    0 16px 34px rgba(76, 83, 245, 0.3),
    inset 0 0 0 1px rgba(255, 255, 255, 0.28);
}

.app-sidebar-item.is-featured:hover .app-sidebar-icon {
  color: #fff;
  background:
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.42), transparent 30%),
    linear-gradient(135deg, #3f46e8, #7c3aed);
  box-shadow:
    0 18px 40px rgba(76, 83, 245, 0.38),
    inset 0 0 0 1px rgba(255, 255, 255, 0.34);
}

.app-sidebar-icon.is-active {
  color: #4c53f5;
  background: rgba(76, 83, 245, 0.1);
  transform: translateY(-1px) scale(1.04);
  box-shadow: 0 8px 18px rgba(76, 83, 245, 0.12);
}

.app-sidebar-icon.is-featured.is-active {
  color: #fff;
  background:
    radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.42), transparent 30%),
    linear-gradient(135deg, #4c53f5, #8b5cf6);
  box-shadow:
    0 20px 44px rgba(76, 83, 245, 0.42),
    0 0 0 5px rgba(76, 83, 245, 0.1);
}

.app-sidebar-desktop-icon {
  width: 18px;
  height: 18px;
}

.app-sidebar-text {
  color: #4b5563;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.15;
  white-space: nowrap;
}

.app-sidebar-text.is-active {
  color: #4c53f5;
  font-weight: 600;
  transform: translateY(1px);
}

.app-sidebar-text.is-featured {
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  color: #4c53f5;
  font-weight: 800;
  white-space: nowrap;
}

.app-sidebar-text.is-featured.is-active {
  color: #4c53f5;
}

.app-sidebar-feature-badge {
  position: absolute;
  right: -8px;
  top: 5px;
  display: inline-flex;
  min-width: 19px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #f97316;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
  line-height: 1;
  box-shadow:
    0 8px 16px rgba(249, 115, 22, 0.26),
    0 0 0 2px #fff;
}

.app-sidebar-active-rail {
  position: absolute;
  left: -10px;
  top: 50%;
  width: 3px;
  height: 20px;
  border-radius: 0 999px 999px 0;
  background: #4c53f5;
  opacity: 0;
  transform: translate(-6px, -50%) scaleY(0.58);
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.app-sidebar-item.is-featured .app-sidebar-active-rail {
  background: linear-gradient(180deg, #4c53f5, #8b5cf6);
}

.app-sidebar-active-rail.is-active {
  opacity: 1;
  transform: translate(0, -50%) scaleY(1);
}

.app-sidebar-break {
  width: 28px;
  height: 1px;
  margin: 10px 0;
  background: #e5e7eb;
}

.app-sidebar-home-link {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}

.app-sidebar-home-logo {
  width: 36px;
  height: 36px;
}

@media (max-width: 767px) {
  .app-sidebar-mobile-overlay,
  .app-sidebar-mobile-drawer {
    display: flex;
  }
}

@media (min-width: 768px) {
  .app-sidebar-desktop {
    position: fixed;
    left: 0;
    top: var(--promo-banner-h, 0px);
    z-index: 50;
    display: flex;
    height: calc(100dvh - var(--promo-banner-h, 0px));
  }
}
</style>
