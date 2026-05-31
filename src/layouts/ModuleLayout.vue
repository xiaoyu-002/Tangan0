<script setup>
import ModuleSidebar from './components/ModuleSidebar.vue'

defineProps({
  currentPath: {
    type: String,
    default: '/workspace',
  },
})
</script>

<template>
  <!-- UI modification: keeps the original module sidebar/slot structure while inheriting the unified layout styles. -->
  <ModuleSidebar :current-path="currentPath" />
  <slot />
</template>
