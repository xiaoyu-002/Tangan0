<script setup>
import { ref } from 'vue'

defineProps({
  video: {
    type: Object,
    required: true,
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const coverFailed = ref(false)
const avatarFailed = ref(false)
</script>

<template>
  <a
    class="video-card"
    :class="{ compact }"
    :href="video.videoUri || '#'"
    target="_blank"
    rel="noreferrer"
  >
    <div class="poster">
      <img v-if="video.cover && !coverFailed" :src="video.cover" :alt="video.description" @error="coverFailed = true">
      <div v-else class="poster-fallback">
        <span>{{ video.countryCode || 'US' }}</span>
        <strong>{{ video.gmv30d }}</strong>
      </div>
      <span class="country">{{ video.countryCode || 'US' }}</span>
      <span v-if="video.duration" class="duration">{{ video.duration }}</span>
      <span v-if="video.isAiVideo" class="ai-badge">AI</span>
      <div class="poster-metrics">
        <span>{{ video.playCount }} 播放</span>
        <span>{{ video.gmv30d }} GMV</span>
      </div>
    </div>

    <div class="video-body">
      <div class="creator">
        <img
          v-if="video.creatorAvatar && !avatarFailed"
          :src="video.creatorAvatar"
          :alt="video.creatorName"
          @error="avatarFailed = true"
        >
        <span v-else class="avatar-fallback">{{ video.creatorName?.slice(0, 1) || 'T' }}</span>
        <div>
          <strong>{{ video.creatorName }}</strong>
          <small>@{{ video.creatorUid || 'creator' }} · {{ video.followers }} 粉丝</small>
        </div>
      </div>

      <p>{{ video.description }}</p>

      <div class="stats">
        <span>赞 {{ video.likeCount }}</span>
        <span>评 {{ video.commentCount }}</span>
        <span>转 {{ video.shareCount }}</span>
      </div>
    </div>
  </a>
</template>

<style scoped>
.video-card {
  display: block;
  min-width: 0;
  overflow: hidden;
  border: 1px solid rgba(229, 231, 235, 0.9);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  color: inherit;
  text-decoration: none;
  box-shadow: 0 14px 34px rgba(17, 24, 39, 0.08);
  transition: transform 220ms cubic-bezier(0.16, 1, 0.3, 1), box-shadow 220ms ease, border-color 220ms ease;
}

.video-card:hover {
  transform: translateY(-4px);
  border-color: rgba(76, 83, 245, 0.28);
  box-shadow: 0 20px 44px rgba(17, 24, 39, 0.13);
}

.poster {
  position: relative;
  aspect-ratio: 9 / 16;
  overflow: hidden;
  background: linear-gradient(135deg, #ebeefd, #f7edff);
}

.poster img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 360ms ease;
}

.video-card:hover .poster img {
  transform: scale(1.045);
}

.poster-fallback {
  height: 100%;
  display: grid;
  place-items: center;
  align-content: center;
  gap: 6px;
  color: rgba(76, 83, 245, 0.45);
  font-weight: 900;
}

.poster-fallback span {
  color: rgba(76, 83, 245, 0.6);
  font-size: 12px;
}

.poster-fallback strong {
  color: #4c53f5;
  font-size: 22px;
}

.country,
.duration,
.ai-badge {
  position: absolute;
  top: 10px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.72);
  color: white;
  font-size: 11px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.country {
  left: 10px;
}

.duration {
  right: 10px;
}

.ai-badge {
  left: 10px;
  top: 38px;
  background: rgba(124, 58, 237, 0.82);
}

.poster-metrics {
  position: absolute;
  inset: auto 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 42px 10px 10px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.72), transparent);
}

.poster-metrics span {
  height: 22px;
  display: inline-flex;
  align-items: center;
  padding: 0 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  color: white;
  font-size: 11px;
  font-weight: 800;
  backdrop-filter: blur(10px);
}

.video-body {
  padding: 12px;
}

.creator {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
}

.creator img,
.avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 999px;
  flex: 0 0 auto;
  object-fit: cover;
  background: #eef2ff;
}

.avatar-fallback {
  display: grid;
  place-items: center;
  color: #4c53f5;
  font-size: 13px;
  font-weight: 900;
}

.creator div {
  min-width: 0;
}

.creator strong,
.creator small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.creator strong {
  color: #111827;
  font-size: 13px;
}

.creator small {
  margin-top: 1px;
  color: #9ca3af;
  font-size: 11px;
}

.video-body p {
  height: 44px;
  margin: 10px 0 9px;
  overflow: hidden;
  color: #4b5563;
  font-size: 12px;
  line-height: 1.55;
}

.stats {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
}

.compact {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
}

.compact .poster {
  aspect-ratio: 3 / 4;
}

.compact .video-body p {
  height: 38px;
}

.compact .poster-metrics,
.compact .duration {
  display: none;
}
</style>
