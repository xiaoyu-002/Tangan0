<script setup>
import { computed, ref, watch } from 'vue'
import MainLayout from './layouts/MainLayout.vue'
import ModuleLayout from './layouts/ModuleLayout.vue'
import { useHashRouter } from './router/useHashRouter'

const { currentPath, currentRoute, pageComponent } = useHashRouter()

const routeDirection = ref('forward')
const routeKey = computed(() => currentPath.value)
const isAuthRoute = computed(() => currentRoute.value?.layout === 'auth')

watch(currentPath, (nextPath, previousPath) => {
  routeDirection.value = nextPath.length >= previousPath.length ? 'forward' : 'back'
})
</script>

<template>
  <div
    class="route-transition-root"
    :class="`route-direction-${routeDirection}`"
  >
    <div v-if="isAuthRoute" :key="routeKey" class="route-page-shell">
      <component :is="pageComponent" />
    </div>
    <MainLayout
      v-else
      :body-class="currentRoute.bodyClass"
      :html-attrs="currentRoute.htmlAttrs"
      :current-path="currentPath"
    >
      <ModuleLayout :current-path="currentPath">
        <div :key="routeKey" class="route-page-shell">
          <component :is="pageComponent" />
        </div>
      </ModuleLayout>
    </MainLayout>
  </div>
</template>
