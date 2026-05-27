<script setup>
// Renders one data-driven "今日表现" card.
import { computed } from 'vue'

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
})

const toneMap = {
  sky: {
    card: 'border-sky-100 bg-gradient-to-br from-white to-sky-50/40',
    border: 'border-sky-100',
    title: 'text-sky-700',
    line: '#60a5fa',
    fillStart: 'rgba(96, 165, 250, 0.18)',
    fillEnd: 'rgba(96, 165, 250, 0.02)',
    placeholder: 'bg-indigo-200/60',
  },
  violet: {
    card: 'border-violet-100 bg-gradient-to-br from-white to-violet-50/30',
    border: 'border-violet-100',
    title: 'text-violet-700',
    line: '#8b5cf6',
    fillStart: 'rgba(139, 92, 246, 0.16)',
    fillEnd: 'rgba(139, 92, 246, 0.02)',
    placeholder: 'bg-violet-200/60',
  },
  orange: {
    card: 'border-orange-100 bg-gradient-to-br from-white to-orange-50/20',
    border: 'border-orange-100',
    title: 'text-orange-700',
    line: '#f97316',
    fillStart: 'rgba(249, 115, 22, 0.16)',
    fillEnd: 'rgba(249, 115, 22, 0.02)',
    placeholder: 'bg-orange-200/60',
  },
}

const tone = computed(() => toneMap[props.card.tone] || toneMap.sky)
const gradientId = computed(() => `workspace-chart-${props.card.id}`)

const buildPath = (values, width = 100, height = 40) => {
  if (!Array.isArray(values) || values.length === 0) return `M 0 ${height}`
  if (values.length === 1) return `M 0 ${height / 2} L ${width} ${height / 2}`

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const step = width / (values.length - 1)
  const points = values.map((value, index) => {
    const x = index * step
    const y = height - 4 - ((value - min) / range) * (height - 8)
    return { x, y }
  })

  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const controlX = (current.x + next.x) / 2
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

const buildAreaPath = (values, width = 100, height = 40) => {
  const linePath = buildPath(values, width, height)
  return `${linePath} L ${width} ${height} L 0 ${height} Z`
}
</script>

<template>
  <article
    class="rounded-2xl border shadow-sm p-4 2xl:p-5 4xl:p-6 flex flex-col"
    :class="tone.card"
  >
    <div class="flex items-center justify-between self-stretch pb-2 mb-2" :class="tone.border">
      <a :href="`#${card.href}`" class="flex items-center gap-0.5 group">
        <span class="text-[13px] font-semibold transition-opacity" :class="tone.title">{{ card.title }}</span>
        <span class="text-sm leading-none ml-0.5">{{ card.locale }}</span>
        <span class="relative w-3.5 h-3.5" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="absolute inset-0 w-3.5 h-3.5 opacity-40 group-hover:opacity-0 group-hover:translate-x-1 transition-all duration-300"
            :class="tone.title"
          >
            <path d="m9 18 6-6-6-6"></path>
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="absolute inset-0 w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-70 group-hover:translate-x-0 group-hover:animate-[arrow-bounce_0.6s_ease-in-out_infinite] transition-all duration-300"
            :class="tone.title"
          >
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </span>
      </a>
    </div>

    <div class="flex-1 space-y-0 mb-2">
      <div class="relative select-none cursor-default" style="height: 72px;">
        <svg
          class="absolute left-0 right-0"
          width="100%"
          height="40"
          viewBox="0 0 100 40"
          preserveAspectRatio="none"
          aria-hidden="true"
          style="top: 14px; height: 40px;"
        >
          <defs>
            <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="tone.fillStart"></stop>
              <stop offset="100%" :stop-color="tone.fillEnd"></stop>
            </linearGradient>
          </defs>
          <path
            :d="buildAreaPath(card.chart.values)"
            :fill="`url(#${gradientId})`"
          ></path>
          <path
            :d="buildPath(card.chart.values)"
            fill="none"
            :stroke="tone.line"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          ></path>
        </svg>

        <span
          class="absolute pointer-events-none tabular-nums leading-none whitespace-nowrap"
          style="left: 0%; top: 39px; transform: translateX(0px); font-size: 8px; font-weight: 400; color: rgb(163, 163, 163);"
        >
          {{ card.chart.minLabel }}
        </span>
        <span
          class="absolute pointer-events-none tabular-nums leading-none whitespace-nowrap"
          style="left: 100%; top: 34px; transform: translateX(-100%); font-size: 10px; font-weight: 700;"
          :style="{ color: tone.line }"
        >
          {{ card.chart.maxLabel }}
        </span>
      </div>

      <div class="space-y-0">
        <a
          v-for="metric in card.metrics"
          :key="metric.label"
          :href="`#${metric.href || card.href}`"
          class="flex items-center justify-between py-2 -mx-1.5 px-1.5 rounded-lg hover:bg-gray-50/70 transition-colors"
        >
          <span class="text-[11px] text-gray-500">{{ metric.label }}</span>
          <span class="flex items-center gap-1.5">
            <span class="text-[12px] font-semibold text-gray-800 tabular-nums">{{ metric.value }}</span>
            <span class="text-[10px] font-semibold tabular-nums" :class="metric.deltaClass || 'text-emerald-600'">
              {{ metric.delta }}
            </span> 
          </span>
        </a>
      </div>
    </div>
  </article>
</template>
