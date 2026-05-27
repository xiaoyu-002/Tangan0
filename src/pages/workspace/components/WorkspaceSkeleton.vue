<script setup>
const metricCards = ['from-sky-50/70 to-white', 'from-violet-50/70 to-white', 'from-orange-50/60 to-white']
const opportunityCards = ['sky', 'orange']
const rows = Array.from({ length: 5 }, (_, index) => index)
</script>

<template>
  <div class="workspace-skeleton pt-6 3xl:pt-8 4xl:pt-10 pb-4" aria-busy="true" aria-label="工作台数据加载中">
    <div class="mb-5 3xl:mb-6 4xl:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div class="min-w-0 space-y-2">
        <div class="skeleton-line h-7 w-36"></div>
        <div class="skeleton-line h-3 w-[min(78vw,430px)]"></div>
      </div>
      <div class="flex min-w-0 items-center gap-2">
        <div class="skeleton-line h-5 w-16 rounded"></div>
        <div class="skeleton-line h-7 w-[min(58vw,360px)] rounded-full"></div>
      </div>
    </div>

    <section class="mb-8 3xl:mb-10 4xl:mb-12">
      <div class="mb-3 3xl:mb-4 flex items-center justify-between">
        <div class="skeleton-line h-5 w-24"></div>
        <div class="skeleton-line h-7 w-24 rounded-full"></div>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-3 2xl:gap-4 4xl:gap-5">
        <article
          v-for="(cardTone, index) in metricCards"
          :key="cardTone"
          class="rounded-2xl border border-white/80 bg-gradient-to-br p-4 shadow-sm 2xl:p-5 4xl:p-6"
          :class="cardTone"
          :style="{ animationDelay: `${index * 90}ms` }"
        >
          <div class="mb-3 flex items-center justify-between">
            <div class="skeleton-line h-4 w-20"></div>
            <div class="skeleton-line h-4 w-8 rounded"></div>
          </div>
          <div class="relative mb-4 h-[72px] overflow-hidden rounded-xl bg-white/45">
            <div class="skeleton-grid"></div>
            <svg class="absolute inset-x-3 top-5 h-9 text-slate-200/90" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0 31 C13 22 21 26 32 18 C45 8 54 12 65 19 C76 27 86 15 100 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"></path>
            </svg>
          </div>
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <div class="skeleton-line h-3 w-20"></div>
              <div class="skeleton-line h-3 w-24"></div>
            </div>
            <div class="flex items-center justify-between">
              <div class="skeleton-line h-3 w-16"></div>
              <div class="skeleton-line h-3 w-20"></div>
            </div>
          </div>
        </article>
      </div>
    </section>

    <section class="mb-8 3xl:mb-10 4xl:mb-12">
      <div class="mb-3 3xl:mb-4 flex items-center gap-2">
        <div class="skeleton-line h-5 w-24"></div>
        <div class="skeleton-line h-4 w-14 rounded-full"></div>
      </div>
      <div class="grid grid-cols-1 gap-3 md:grid-cols-2 md:[grid-auto-rows:minmax(520px,auto)] 2xl:gap-4 4xl:gap-5">
        <article
          v-for="(tone, index) in opportunityCards"
          :key="tone"
          class="overflow-hidden rounded-2xl border border-gray-100 bg-white/86 shadow-sm"
          :style="{ animationDelay: `${220 + index * 110}ms` }"
        >
          <div class="flex items-center gap-2.5 px-4 py-3">
            <div class="skeleton-line h-7 w-7 rounded-full"></div>
            <div class="min-w-0 flex-1 space-y-2">
              <div class="skeleton-line h-4 w-28"></div>
              <div class="skeleton-line h-3 w-44 max-w-full"></div>
            </div>
            <div class="skeleton-dot" :class="tone === 'sky' ? 'bg-sky-300' : 'bg-orange-300'"></div>
          </div>
          <div class="border-y border-gray-100 px-3 py-2">
            <div class="flex gap-2 overflow-hidden">
              <div class="skeleton-line h-7 w-20 rounded-lg"></div>
              <div class="skeleton-line h-7 w-24 rounded-lg"></div>
              <div class="skeleton-line h-7 w-16 rounded-lg"></div>
            </div>
          </div>
          <div class="space-y-3 px-4 py-4">
            <div class="skeleton-line h-3 w-11/12"></div>
            <div class="skeleton-line h-3 w-3/4"></div>
            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div v-for="row in rows.slice(0, 4)" :key="row" class="rounded-xl border border-gray-100 bg-white p-3 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
                <div class="mb-3 flex items-start justify-between gap-2">
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="skeleton-line h-4 w-4/5"></div>
                    <div class="skeleton-line h-3 w-2/3"></div>
                  </div>
                  <div class="skeleton-line h-5 w-11 rounded-full"></div>
                </div>
                <div class="skeleton-line h-3 w-24"></div>
              </div>
            </div>
            <div class="space-y-2 pt-1">
              <div v-for="row in rows.slice(0, 3)" :key="`list-${row}`" class="flex gap-3 rounded-xl border border-gray-100 bg-white p-3">
                <div class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="tone === 'sky' ? 'bg-sky-300' : 'bg-orange-300'"></div>
                <div class="min-w-0 flex-1 space-y-2">
                  <div class="skeleton-line h-4 w-2/5"></div>
                  <div class="skeleton-line h-3 w-full"></div>
                  <div class="skeleton-line h-3 w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
          <div class="border-t border-gray-100 px-4 py-3">
            <div class="skeleton-line mx-auto h-7 w-28 rounded-full"></div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.workspace-skeleton > * {
  animation: workspace-skeleton-rise 520ms ease both;
}

.skeleton-line {
  position: relative;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(226, 232, 240, 0.78), rgba(248, 250, 252, 0.94), rgba(226, 232, 240, 0.78));
  background-size: 220% 100%;
  animation: workspace-skeleton-shimmer 1.45s ease-in-out infinite;
}

.skeleton-dot {
  width: 8px;
  height: 8px;
  flex: 0 0 auto;
  border-radius: 999px;
  animation: workspace-skeleton-pulse 1.3s ease-in-out infinite;
}

.skeleton-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.1) 1px, transparent 1px);
  background-size: 24px 18px;
  mask-image: linear-gradient(to bottom, transparent, black 18%, black 82%, transparent);
}

@keyframes workspace-skeleton-shimmer {
  0% {
    background-position: 120% 0;
  }

  100% {
    background-position: -120% 0;
  }
}

@keyframes workspace-skeleton-pulse {
  0%,
  100% {
    opacity: 0.45;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes workspace-skeleton-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .workspace-skeleton > *,
  .skeleton-line,
  .skeleton-dot {
    animation: none;
  }
}
</style>
