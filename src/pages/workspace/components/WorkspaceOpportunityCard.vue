<script setup>
// Renders one data-driven "今日机会" panel.
import { computed, ref, watch } from 'vue'

const props = defineProps({
  panel: {
    type: Object,
    required: true,
  },
})

const toneMap = {
  sky: {
    card: 'border-sky-100',
    title: 'text-sky-700',
    accent: 'text-sky-500',
    tabActive: 'bg-sky-50 text-sky-700 border-sky-200/60',
    tabIdle: 'text-gray-500 hover:text-sky-600 hover:bg-sky-50/60',
    preview: 'bg-sky-200/60',
    bullet: 'bg-sky-400',
    footer: 'bg-sky-100 text-sky-700 hover:bg-sky-200',
    lock: 'text-sky-500',
  },
  orange: {
    card: 'border-orange-100',
    title: 'text-orange-700',
    accent: 'text-orange-500',
    tabActive: 'bg-orange-50 text-orange-700 border-orange-200/60',
    tabIdle: 'text-gray-500 hover:text-orange-600 hover:bg-orange-50/60',
    preview: 'bg-orange-200/60',
    bullet: 'bg-orange-400',
    footer: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    lock: 'text-orange-500',
  },
}

const tone = computed(() => toneMap[props.panel.tone] || toneMap.sky)
const activeTab = ref(props.panel.activeTab || props.panel.tabs?.[0]?.key || '')

watch(
  () => props.panel.activeTab,
  (value) => {
    if (value) activeTab.value = value
  },
)

const currentTabKey = computed(() => activeTab.value || props.panel.tabs?.[0]?.key || '')
const currentTab = computed(() => {
  return props.panel.tabs?.find((tab) => tab.key === currentTabKey.value) || props.panel.tabs?.[0] || { key: '', label: '', description: '' }
})
const currentList = computed(() => {
  if (props.panel.layout !== 'list') return []
  return props.panel.tabContent?.[currentTabKey.value] || []
})
const currentGridItems = computed(() => {
  if (props.panel.layout !== 'grid') return []
  return props.panel.tabContent?.[currentTabKey.value] || []
})

const setTab = (key) => {
  activeTab.value = key
}
</script>

<template>
  <article class="workspace-unify-card rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden flex flex-col min-w-0 h-[680px]">
    <div class="w-full px-4 py-3 flex items-center gap-2.5 text-left">
      <a :href="`#${panel.footer.href}`" class="shrink-0">
        <img
          :src="panel.avatar"
          :alt="panel.title"
          class="w-7 h-7 rounded-full object-cover object-top shrink-0 ring-2 ring-sky-200/50 cursor-pointer hover:ring-sky-300 transition-all"
        >
      </a>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <span class="text-[13px] font-semibold text-gray-900">{{ panel.title }}</span>
          <span class="text-sm leading-none">{{ panel.locale }}</span>
          <span class="w-2 h-2 rounded-full bg-blue-400 animate-pulse" title="Refreshing..."></span>
        </div>
        <p class="text-xs text-gray-500 mt-0.5 truncate">{{ panel.subtitle }}</p>
      </div>
    </div>

    <div class="relative border-b border-gray-100">
      <div class="flex items-center">
        <div class="shrink-0 flex items-center justify-center transition-all duration-200 overflow-hidden w-0 opacity-0">
          <button class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer" aria-label="向左滚动标签" tabindex="-1" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true">
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          </button>
        </div>
        <div class="flex-1 min-w-0 overflow-x-auto scrollbar-none">
          <div class="pl-3 pr-6 flex gap-0.5 w-max select-none" role="tablist">
            <button
              v-for="tab in panel.tabs"
              :key="tab.key"
              role="tab"
              type="button"
              :aria-selected="String(currentTabKey === tab.key)"
              :tabindex="currentTabKey === tab.key ? 0 : -1"
              class="group/matab relative flex items-center gap-1 px-1.5 py-2 text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2 outline-none"
              :class="currentTabKey === tab.key ? tone.tabActive : tone.tabIdle"
              @click="setTab(tab.key)"
            >
              <span>{{ tab.label }}</span>
              <span class="absolute bottom-0 inset-x-1.5 h-[2px] rounded-full transition-colors bg-transparent group-hover/matab:bg-violet-200"></span>
            </button>
          </div>
        </div>
        <div class="shrink-0 flex items-center justify-center transition-all duration-200 overflow-hidden w-0 opacity-0">
          <button class="p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer" aria-label="向右滚动标签" tabindex="-1" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true">
              <path d="m9 18 6-6-6-6"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <div class="relative flex-1 min-h-0 flex flex-col">
      <div class="overflow-y-auto scrollbar-hide px-4 pt-3 pb-1 flex-1 min-h-0">
        <div class="mb-3 text-xs leading-relaxed text-gray-500">
          {{ currentTab.description }}
        </div>

        <div v-if="panel.layout === 'grid'" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a
            v-for="item in currentGridItems"
            :key="item.title"
            :href="`#${item.href || panel.footer.href}`"
            class="group rounded-xl border border-gray-100 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)] hover:border-sky-100 hover:bg-sky-50/30 transition-colors"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900 group-hover:text-sky-700 transition-colors">{{ item.title }}</p>
                <p class="mt-1 text-[11px] text-gray-400">{{ item.tag }}</p>
              </div>
              <span class="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-600 shrink-0">{{ item.delta }}</span>
            </div>
            <p class="mt-3 text-xs font-semibold tabular-nums text-gray-700">{{ item.metric }}</p>
          </a>
        </div>

        <div v-else class="space-y-2">
          <div
            v-for="item in currentList"
            :key="item.title"
            class="rounded-xl border border-gray-100 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
          >
            <div class="flex items-start gap-3">
              <div class="mt-1.5 h-2 w-2 rounded-full shrink-0" :class="tone.bullet"></div>
              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-900">{{ item.title }}</p>
                    <p class="text-[11px] text-gray-500 mt-0.5">{{ item.subtitle }}</p>
                  </div>
                  <span class="text-[10px] font-semibold uppercase tracking-wide text-gray-400 shrink-0">{{ item.badge }}</span>
                </div>
                <p class="mt-1 text-xs leading-relaxed text-gray-500">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <div class="mt-auto px-4 py-2 border-t border-gray-200/60 flex items-center justify-center gap-2">
      <a
        :href="`#${panel.footer.href}`"
        class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-colors"
        :class="tone.footer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3.5 h-3.5" aria-hidden="true">
          <path d="m12.296 3.464 3.02 3.956"></path>
          <path d="M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z"></path>
          <path d="M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
          <path d="m6.18 5.276 3.1 3.899"></path>
        </svg>
        {{ panel.footer.text }}
      </a>
    </div>
  </article>
</template>

<style scoped>
/* UI modification: Unifydata card, tab, and interaction styling while preserving tab click bindings. */
.workspace-unify-card {
  border: 0 !important;
  border-radius: 8px !important;
  background: #fff !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05) !important;
  padding: 20px !important;
}

.workspace-unify-card > div {
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.workspace-unify-card :deep(.text-gray-900) {
  color: #151921 !important;
}

.workspace-unify-card :deep(.text-gray-500),
.workspace-unify-card :deep(.text-gray-400) {
  color: #666666 !important;
}

.workspace-unify-card :deep([role="tablist"]) {
  gap: 18px !important;
  padding-right: 0 !important;
  padding-left: 0 !important;
}

.workspace-unify-card :deep([role="tab"]) {
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: #666666 !important;
  padding: 8px 0 10px !important;
}

.workspace-unify-card :deep([role="tab"][aria-selected="true"]) {
  color: #151921 !important;
  font-weight: 600 !important;
}

.workspace-unify-card :deep([role="tab"][aria-selected="true"] span:last-child) {
  background: #6082f7 !important;
}

.workspace-unify-card :deep(.rounded-xl) {
  border: 0 !important;
  border-radius: 8px !important;
  background: #fff !important;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05) !important;
}

.workspace-unify-card :deep(.bg-sky-100),
.workspace-unify-card :deep(.bg-orange-100) {
  background: #6082f7 !important;
  color: #fff !important;
}
</style>
