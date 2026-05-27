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
  <ModuleSidebar :current-path="currentPath" />
  <slot />
</template>
