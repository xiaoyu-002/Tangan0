<script setup>
import { onBeforeUnmount, ref } from 'vue'
import { CREATE_REFRESH_COOLDOWN_SECONDS, createCountries, createTimeRanges } from '../createApi'

defineProps({
  timeRange: {
    type: String,
    default: '7d',
  },
  countryCode: {
    type: String,
    default: 'US',
  },
  keyword: {
    type: String,
    default: '',
  },
  aiOnly: {
    type: Boolean,
    default: false,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  showAiToggle: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:timeRange',
  'update:countryCode',
  'update:keyword',
  'update:aiOnly',
  'refresh',
])

const refreshCooldown = ref(0)
let refreshTimer

const startRefreshCooldown = () => {
  refreshCooldown.value = CREATE_REFRESH_COOLDOWN_SECONDS
  window.clearInterval(refreshTimer)
  refreshTimer = window.setInterval(() => {
    refreshCooldown.value -= 1
    if (refreshCooldown.value <= 0) {
      refreshCooldown.value = 0
      window.clearInterval(refreshTimer)
    }
  }, 1000)
}

const handleRefresh = () => {
  if (refreshCooldown.value > 0) return
  emit('refresh')
  startRefreshCooldown()
}

onBeforeUnmount(() => window.clearInterval(refreshTimer))
</script>

<template>
  <div class="filter-card">
    <label v-if="showSearch" class="search-box">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m21 21-4.34-4.34"></path>
        <circle cx="11" cy="11" r="8"></circle>
      </svg>
      <input
        :value="keyword"
        placeholder="搜索视频、创作者..."
        @input="emit('update:keyword', $event.target.value)"
      >
    </label>

    <div class="segmented" aria-label="时间范围">
      <button
        v-for="item in createTimeRanges"
        :key="item.value"
        type="button"
        :class="{ active: timeRange === item.value }"
        @click="emit('update:timeRange', item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <label v-if="showAiToggle" class="ai-toggle" :class="{ active: aiOnly }">
      <span>AI 视频</span>
      <input
        type="checkbox"
        :checked="aiOnly"
        @change="emit('update:aiOnly', $event.target.checked)"
      >
      <i aria-hidden="true"></i>
    </label>

    <select
      class="country-select"
      :value="countryCode"
      aria-label="选择国家"
      @change="emit('update:countryCode', $event.target.value)"
    >
      <option v-for="country in createCountries" :key="country.code" :value="country.code">
        {{ country.flag }} {{ country.label }}
      </option>
    </select>

    <button
      type="button"
      class="refresh-button"
      :disabled="refreshCooldown > 0"
      @click="handleRefresh"
    >
      {{ refreshCooldown > 0 ? `${refreshCooldown}s 后刷新` : '刷新' }}
    </button>
  </div>
</template>

<style scoped>
.filter-card {
  position: sticky;
  top: var(--header-height, 56px);
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin: 0 -4px 18px;
  padding: 12px 4px;
  background: rgba(246, 245, 252, 0.88);
  backdrop-filter: blur(14px);
}

.search-box {
  width: min(260px, 100%);
  height: 36px;
  position: relative;
  display: flex;
  align-items: center;
}

.search-box svg {
  position: absolute;
  left: 11px;
  width: 15px;
  height: 15px;
  fill: none;
  stroke: #9ca3af;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.search-box input {
  width: 100%;
  height: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #111827;
  font-size: 13px;
  outline: none;
  padding: 0 12px 0 34px;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}

.search-box input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.12);
}

.segmented {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
}

.segmented button,
.refresh-button {
  border: 0;
  cursor: pointer;
  font: inherit;
}

.segmented button {
  height: 28px;
  padding: 0 10px;
  border-radius: 8px;
  background: transparent;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
}

.segmented button.active {
  background: #4c53f5;
  color: white;
  box-shadow: 0 8px 18px rgba(76, 83, 245, 0.18);
}

.ai-toggle {
  height: 36px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.ai-toggle input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.ai-toggle i {
  width: 30px;
  height: 17px;
  position: relative;
  border-radius: 999px;
  background: #d1d5db;
  transition: background 180ms ease;
}

.ai-toggle i::after {
  content: "";
  position: absolute;
  width: 13px;
  height: 13px;
  top: 2px;
  left: 2px;
  border-radius: 999px;
  background: white;
  transition: transform 180ms ease;
}

.ai-toggle.active {
  color: #4c53f5;
}

.ai-toggle.active i {
  background: #4c53f5;
}

.ai-toggle.active i::after {
  transform: translateX(13px);
}

.country-select {
  height: 36px;
  margin-left: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  color: #374151;
  font-size: 12px;
  font-weight: 700;
  outline: none;
  padding: 0 10px;
  cursor: pointer;
}

.refresh-button {
  height: 36px;
  padding: 0 14px;
  border-radius: 10px;
  background: rgba(76, 83, 245, 0.08);
  color: #4c53f5;
  font-size: 12px;
  font-weight: 800;
}

.refresh-button:hover {
  background: rgba(76, 83, 245, 0.14);
}

.refresh-button:disabled {
  cursor: not-allowed;
  opacity: 0.64;
}

@media (max-width: 720px) {
  .filter-card {
    position: static;
  }

  .search-box {
    width: 100%;
  }

  .country-select {
    margin-left: 0;
  }
}
</style>
