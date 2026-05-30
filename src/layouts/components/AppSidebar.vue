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
      <img alt="糖安罗盘" loading="lazy" width="88" height="26" decoding="async" class="app-sidebar-mobile-logo" style="color: transparent" :srcset="logoSrc + ' 1x, ' + logoSrc + ' 2x'" :src="logoSrc" />
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
      <!-- UI modification: bottom user information block, presentational only. -->
      <div class="app-sidebar-user">
        <div class="app-sidebar-user-avatar">U</div>
        <div class="app-sidebar-user-copy">
          <span class="app-sidebar-user-name">User</span>
          <span class="app-sidebar-user-role">Workspace</span>
        </div>
      </div>

      <!-- UI modification: existing menu entries keep their original href/data/class bindings. -->
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
      <!-- UI modification: Unifydata-style logo placement; original logo href is preserved. -->
      <a class="app-sidebar-home-link" href="#/workspace">
        <img alt="糖安罗盘" loading="lazy" width="36" height="36" decoding="async" class="app-sidebar-home-logo" style="color: transparent" :src="logoSrc" />
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
  /* UI modification: mobile drawer follows the same dark Unifydata sidebar style. */
  background: #151921;
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
  filter: brightness(0) invert(1);
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
  color: rgba(255, 255, 255, 0.66);
  font-size: 13px;
  text-decoration: none;
  transition: background-color 220ms ease, color 220ms ease;
}

.app-sidebar-mobile-link:hover {
  color: #fff;
  background: rgba(96, 130, 247, 0.16);
}

.app-sidebar-mobile-link.is-featured {
  color: #fff;
  background: rgba(96, 130, 247, 0.16);
  font-weight: 700;
  box-shadow: none;
}

.app-sidebar-mobile-link.is-active {
  color: #fff;
  background: rgba(96, 130, 247, 0.18);
  font-weight: 600;
}

.app-sidebar-mobile-link.is-featured.is-active {
  color: #fff;
  background: rgba(96, 130, 247, 0.18);
  box-shadow: none;
}

.app-sidebar-mobile-icon {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

/* UI modification: Unifydata-style dark left sidebar with 220px width. */
.app-sidebar-desktop-panel {
  display: flex;
  width: 220px;
  height: 100%;
  flex-direction: column;
  align-items: stretch;
  border-right: 0;
  background: #151921;
  padding: 24px 16px 18px;
}

.app-sidebar-desktop-nav {
  order: 2;
  display: flex;
  width: 100%;
  flex: 1 1 auto;
  flex-direction: column;
  align-items: stretch;
  gap: 8px;
  padding: 28px 0 0;
}

.app-sidebar-item {
  position: relative;
  display: flex;
  min-height: 44px;
  width: 100%;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.66);
  padding: 0 12px;
  text-decoration: none;
  transition: background-color 180ms ease, color 180ms ease;
}

.app-sidebar-item.is-featured {
  margin: 0;
}

.app-sidebar-icon,
.app-sidebar-text {
  transition: background-color 220ms ease, color 220ms ease, opacity 220ms ease, transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease;
}

.app-sidebar-icon {
  position: relative;
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: inherit;
}

.app-sidebar-item:hover .app-sidebar-icon {
  color: #fff;
  background: transparent;
  transform: none;
}

.app-sidebar-item.is-featured .app-sidebar-icon {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  color: inherit;
  background: transparent;
  box-shadow: none;
}

.app-sidebar-item.is-featured:hover .app-sidebar-icon {
  color: #fff;
  background: transparent;
  box-shadow: none;
}

.app-sidebar-icon.is-active {
  color: #fff;
  background: transparent;
  transform: none;
  box-shadow: none;
}

.app-sidebar-icon.is-featured.is-active {
  color: #fff;
  background: transparent;
  box-shadow: none;
}

.app-sidebar-desktop-icon {
  width: 19px;
  height: 19px;
}

.app-sidebar-text {
  color: inherit;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
}

.app-sidebar-text.is-active {
  color: #fff;
  font-weight: 600;
  transform: none;
}

.app-sidebar-text.is-featured {
  width: auto;
  height: auto;
  overflow: visible;
  clip-path: none;
  color: inherit;
  font-weight: 500;
  white-space: nowrap;
}

.app-sidebar-text.is-featured.is-active {
  color: #fff;
}

.app-sidebar-feature-badge {
  position: absolute;
  right: 12px;
  top: 50%;
  display: inline-flex;
  min-width: 19px;
  height: 16px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #6082f7;
  color: #fff;
  font-size: 8px;
  font-weight: 900;
  line-height: 1;
  box-shadow: none;
  transform: translateY(-50%);
}

.app-sidebar-active-rail {
  position: absolute;
  left: 0;
  top: 50%;
  width: 4px;
  height: 20px;
  border-radius: 0 999px 999px 0;
  background: #6082f7;
  opacity: 0;
  transform: translate(-6px, -50%) scaleY(0.58);
  transition: opacity 220ms ease, transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.app-sidebar-item.is-featured .app-sidebar-active-rail {
  background: #6082f7;
}

.app-sidebar-active-rail.is-active {
  opacity: 1;
  transform: translate(0, -50%) scaleY(1);
}

.app-sidebar-break {
  width: 100%;
  height: 1px;
  margin: 10px 0 6px;
  background: rgba(255, 255, 255, 0.08);
}

.app-sidebar-home-link {
  display: flex;
  order: 1;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 0;
  padding: 0 8px;
}

.app-sidebar-home-logo {
  width: auto;
  height: 34px;
  filter: brightness(0) invert(1);
}

.app-sidebar-item:hover,
.app-sidebar-item.is-active {
  color: #fff;
  background: rgba(96, 130, 247, 0.16);
}

/* UI modification: bottom user-info visual treatment without changing navigation logic. */
.app-sidebar-user {
  order: 3;
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: auto;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  padding: 12px;
}

.app-sidebar-user-avatar {
  display: flex;
  width: 34px;
  height: 34px;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  border-radius: 999px;
  background: #6082f7;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.app-sidebar-user-copy {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.app-sidebar-user-name {
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.app-sidebar-user-role {
  color: rgba(255, 255, 255, 0.52);
  font-size: 11px;
}

.app-sidebar-desktop-panel::after {
  content: none;
  display: none;
}

.app-sidebar-desktop-panel::before {
  content: none;
  display: none;
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
