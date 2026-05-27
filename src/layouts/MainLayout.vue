<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { handlePageClick } from '../utils/pageInteractions'
import AppSidebar from './components/AppSidebar.vue'
import MainFloatingAi from './components/MainFloatingAi.vue'

const props = defineProps({
  bodyClass: {
    type: String,
    default: '',
  },
  htmlAttrs: {
    type: Object,
    default: () => ({}),
  },
  currentPath: {
    type: String,
    default: '/workspace',
  },
})

const layoutRoot = ref(null)
const previousBodyClass = document.body.className
const previousLang = document.documentElement.getAttribute('lang')
const previousBrand = document.documentElement.getAttribute('data-brand')

const applyDocumentState = () => {
  document.body.className = props.bodyClass || ''
  document.documentElement.setAttribute('lang', props.htmlAttrs?.lang || 'zh-CN')
  document.documentElement.setAttribute('data-brand', props.htmlAttrs?.dataBrand || 'chj')
}

const handleClick = (event) => {
  handlePageClick(event, layoutRoot.value)
}

onMounted(applyDocumentState)

watch(() => [props.bodyClass, props.htmlAttrs], applyDocumentState, { deep: true })

onBeforeUnmount(() => {
  document.body.className = previousBodyClass

  if (previousLang) document.documentElement.setAttribute('lang', previousLang)
  else document.documentElement.removeAttribute('lang')

  if (previousBrand) document.documentElement.setAttribute('data-brand', previousBrand)
  else document.documentElement.removeAttribute('data-brand')
})
</script>

<template>
  <div ref="layoutRoot" class="main-layout app-page-shell" @click="handleClick">
    <div class="layout-top-spacer"></div>
    <div class="layout-frame">
      <AppSidebar :current-path="currentPath" />
      <slot />
    </div>
    <MainFloatingAi :current-path="currentPath" />
    <section aria-label="Notifications alt+T" tabindex="-1" aria-live="polite" aria-relevant="additions text" aria-atomic="false" />
  </div>
</template>

<style scoped>
.layout-top-spacer {
  position: sticky;
  top: 0;
  z-index: 30;
}

.layout-frame {
  display: flex;
  min-height: 100dvh;
  flex-direction: row;
  overflow-x: clip;
  background: linear-gradient(to right, #f5f6fc, #f7f5fc);
}
</style>
