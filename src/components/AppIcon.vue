<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: {
    type: String,
    default: 'dashboard',
  },
  size: {
    type: [Number, String],
    default: 24,
  },
  strokeWidth: {
    type: [Number, String],
    default: 1.8,
  },
  label: {
    type: String,
    default: '',
  },
})

const iconShapes = {
  dashboard: [
    ['rect', { width: 7, height: 9, x: 3, y: 3, rx: 1 }],
    ['rect', { width: 7, height: 5, x: 14, y: 3, rx: 1 }],
    ['rect', { width: 7, height: 9, x: 14, y: 12, rx: 1 }],
    ['rect', { width: 7, height: 5, x: 3, y: 16, rx: 1 }],
  ],
  discover: [
    ['circle', { cx: 11, cy: 11, r: 7.5 }],
    ['path', { d: 'm16.5 16.5 4 4' }],
    ['path', { d: 'M6 18h4' }],
    ['path', { d: 'M8 16v4' }],
  ],
  clapperboard: [
    ['path', { d: 'm12.296 3.464 3.02 3.956' }],
    ['path', { d: 'M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3z' }],
    ['path', { d: 'M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }],
    ['path', { d: 'm6.18 5.276 3.1 3.899' }],
  ],
  messageDot: [
    ['path', { d: 'M12.7 3H4a2 2 0 0 0-2 2v16.286a.71.71 0 0 0 1.212.502l2.202-2.202A2 2 0 0 1 6.828 19H20a2 2 0 0 0 2-2v-4.7' }],
    ['circle', { cx: 19, cy: 6, r: 3 }],
  ],
  bot: [
    ['path', { d: 'M12 8V4' }],
    ['circle', { cx: 12, cy: 3, r: 1 }],
    ['rect', { x: 4, y: 8, width: 16, height: 12, rx: 3 }],
    ['path', { d: 'M8 13h.01' }],
    ['path', { d: 'M16 13h.01' }],
    ['path', { d: 'M9 17h6' }],
  ],
  messages: [
    ['path', { d: 'M16 10a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 14.286V4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z' }],
    ['path', { d: 'M20 9a2 2 0 0 1 2 2v10.286a.71.71 0 0 1-1.212.502l-2.202-2.202A2 2 0 0 0 17.172 19H10a2 2 0 0 1-2-2v-1' }],
  ],
  todo: [
    ['path', { d: 'M13 5h8' }],
    ['path', { d: 'M13 12h8' }],
    ['path', { d: 'M13 19h8' }],
    ['path', { d: 'm3 17 2 2 4-4' }],
    ['rect', { x: 3, y: 4, width: 6, height: 6, rx: 1 }],
  ],
  folderOpen: [
    ['path', { d: 'm6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2' }],
  ],
  gift: [
    ['path', { d: 'M12 7v14' }],
    ['path', { d: 'M20 11v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8' }],
    ['path', { d: 'M7.5 7a1 1 0 0 1 0-5A4.8 8 0 0 1 12 7a4.8 8 0 0 1 4.5-5 1 1 0 0 1 0 5' }],
    ['rect', { x: 3, y: 7, width: 18, height: 4, rx: 1 }],
  ],
  chevronDown: [['path', { d: 'm6 9 6 6 6-6' }]],
  chevronUp: [['path', { d: 'm18 15-6-6-6 6' }]],
  chevronLeft: [['path', { d: 'm15 18-6-6 6-6' }]],
  plus: [
    ['path', { d: 'M5 12h14' }],
    ['path', { d: 'M12 5v14' }],
  ],
  search: [
    ['path', { d: 'm21 21-4.34-4.34' }],
    ['circle', { cx: 11, cy: 11, r: 8 }],
  ],
  trash: [
    ['path', { d: 'M3 6h18' }],
    ['path', { d: 'M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' }],
    ['path', { d: 'M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' }],
    ['path', { d: 'M10 11v6' }],
    ['path', { d: 'M14 11v6' }],
  ],
  flame: [['path', { d: 'M12 3q1 4 4 6.5t3 5.5a7 7 0 1 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4' }]],
  zap: [['path', { d: 'M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z' }]],
  compass: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['path', { d: 'm16.24 7.76-1.804 5.411a2 2 0 0 1-1.265 1.265L7.76 16.24l1.804-5.411a2 2 0 0 1 1.265-1.265z' }],
  ],
  film: [
    ['rect', { width: 18, height: 18, x: 3, y: 3, rx: 2 }],
    ['path', { d: 'M7 3v18' }],
    ['path', { d: 'M3 7.5h4' }],
    ['path', { d: 'M3 12h18' }],
    ['path', { d: 'M3 16.5h4' }],
    ['path', { d: 'M17 3v18' }],
    ['path', { d: 'M17 7.5h4' }],
    ['path', { d: 'M17 16.5h4' }],
  ],
  crosshair: [
    ['circle', { cx: 12, cy: 12, r: 10 }],
    ['line', { x1: 22, x2: 18, y1: 12, y2: 12 }],
    ['line', { x1: 6, x2: 2, y1: 12, y2: 12 }],
    ['line', { x1: 12, x2: 12, y1: 6, y2: 2 }],
    ['line', { x1: 12, x2: 12, y1: 22, y2: 18 }],
  ],
  scanSearch: [
    ['path', { d: 'M3 7V5a2 2 0 0 1 2-2h2' }],
    ['path', { d: 'M17 3h2a2 2 0 0 1 2 2v2' }],
    ['path', { d: 'M21 17v2a2 2 0 0 1-2 2h-2' }],
    ['path', { d: 'M7 21H5a2 2 0 0 1-2-2v-2' }],
    ['circle', { cx: 12, cy: 12, r: 3 }],
    ['path', { d: 'm16 16-1.9-1.9' }],
  ],
  video: [
    ['path', { d: 'm16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5' }],
    ['rect', { x: 2, y: 6, width: 14, height: 12, rx: 2 }],
  ],
  image: [
    ['rect', { width: 18, height: 18, x: 3, y: 3, rx: 2, ry: 2 }],
    ['circle', { cx: 9, cy: 9, r: 2 }],
    ['path', { d: 'm21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21' }],
  ],
  penLine: [
    ['path', { d: 'M13 21h8' }],
    ['path', { d: 'M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z' }],
  ],
  layers: [
    ['path', { d: 'M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z' }],
    ['path', { d: 'M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12' }],
    ['path', { d: 'M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17' }],
  ],
  store: [
    ['path', { d: 'M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5' }],
    ['path', { d: 'M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244' }],
    ['path', { d: 'M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05' }],
  ],
  package: [
    ['path', { d: 'M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z' }],
    ['path', { d: 'M12 22V12' }],
    ['polyline', { points: '3.29 7 12 12 20.71 7' }],
    ['path', { d: 'm7.5 4.27 9 5.15' }],
  ],
  userRound: [
    ['path', { d: 'M18 20a6 6 0 0 0-12 0' }],
    ['circle', { cx: 12, cy: 10, r: 4 }],
    ['circle', { cx: 12, cy: 12, r: 10 }],
  ],
  fileText: [
    ['path', { d: 'M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z' }],
    ['path', { d: 'M14 2v4a2 2 0 0 0 2 2h4' }],
    ['path', { d: 'M10 9H8' }],
    ['path', { d: 'M16 13H8' }],
    ['path', { d: 'M16 17H8' }],
  ],
  calendar: [
    ['path', { d: 'M8 2v4' }],
    ['path', { d: 'M16 2v4' }],
    ['rect', { width: 18, height: 18, x: 3, y: 4, rx: 2 }],
    ['path', { d: 'M3 10h18' }],
  ],
  chart: [
    ['path', { d: 'M3 3v18h18' }],
    ['path', { d: 'M18 17V9' }],
    ['path', { d: 'M13 17V5' }],
    ['path', { d: 'M8 17v-3' }],
  ],
  messageSquare: [['path', { d: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' }]],
  mail: [
    ['rect', { width: 20, height: 16, x: 2, y: 4, rx: 2 }],
    ['path', { d: 'm22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7' }],
  ],
  broadcast: [
    ['path', { d: 'M4.9 19.1C1 15.2 1 8.8 4.9 4.9' }],
    ['path', { d: 'M7.8 16.2a6 6 0 0 1 0-8.5' }],
    ['circle', { cx: 12, cy: 12, r: 2 }],
    ['path', { d: 'M16.2 7.8a6 6 0 0 1 0 8.5' }],
    ['path', { d: 'M19.1 4.9C23 8.8 23 15.1 19.1 19' }],
  ],
  trend: [
    ['path', { d: 'M5 16l5-5 3 3 6-7' }],
    ['path', { d: 'M15 7h4v4' }],
  ],
  send: [
    ['path', { d: 'M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z' }],
    ['path', { d: 'm21.854 2.147-10.94 10.939' }],
  ],
  panelExpand: [
    ['path', { d: 'M15 3h6v6' }],
    ['path', { d: 'm21 3-7 7' }],
    ['path', { d: 'M9 21H3v-6' }],
    ['path', { d: 'm3 21 7-7' }],
  ],
  panelRestore: [
    ['path', { d: 'M8 3v3a2 2 0 0 1-2 2H3' }],
    ['path', { d: 'M21 8h-3a2 2 0 0 1-2-2V3' }],
    ['path', { d: 'M3 16h3a2 2 0 0 1 2 2v3' }],
    ['path', { d: 'M16 21v-3a2 2 0 0 1 2-2h3' }],
  ],
}

const shapes = computed(() => iconShapes[props.name] || iconShapes.dashboard)
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : 'true'"
    :role="label ? 'img' : undefined"
  >
    <title v-if="label">{{ label }}</title>
    <component
      :is="shape[0]"
      v-for="(shape, index) in shapes"
      :key="`${shape[0]}-${index}`"
      v-bind="shape[1]"
    />
  </svg>
</template>

<style scoped>
.app-icon {
  display: inline-block;
  flex-shrink: 0;
  overflow: visible;
  vertical-align: middle;
}
</style>
