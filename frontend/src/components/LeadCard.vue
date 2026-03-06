<template>
  <div
    class="lead-card"
    :class="{
      'lead-card--hot': label === '[HOT]',
      'lead-card--warm': label === '[WARM]',
    }"
  >
    <!-- Label Badge -->
    <div class="lead-card__badge" :class="badgeClass">
      {{ label === '[HOT]' ? '🔥 HOT' : '🟠 WARM' }}
    </div>

    <!-- Header: Avatar + Name + Time -->
    <div class="lead-card__header">
      <img
        :src="profilePictureUrl || defaultAvatar"
        :alt="nickname"
        class="lead-card__avatar"
        @error="onAvatarError"
      />
      <div class="lead-card__info">
        <span class="lead-card__name">{{ nickname }}</span>
        <span class="lead-card__uid">@{{ uniqueId }}</span>
      </div>
      <span class="lead-card__time">{{ timeAgo }}</span>
    </div>

    <!-- Comment Body -->
    <div class="lead-card__body">
      <p class="lead-card__comment">{{ comment }}</p>
    </div>

    <!-- CTA Button -->
    <div class="lead-card__actions">
      <a
        :href="profileLink"
        target="_blank"
        rel="noopener noreferrer"
        class="lead-card__cta"
        :class="label === '[HOT]' ? 'lead-card__cta--hot' : 'lead-card__cta--warm'"
      >
        👉 Nhắn tin ngay
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  nickname: String,
  uniqueId: String,
  comment: String,
  label: String,
  profileLink: String,
  profilePictureUrl: String,
  timestamp: String,
})

const defaultAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
const avatarSrc = ref(props.profilePictureUrl || defaultAvatar)

function onAvatarError() {
  avatarSrc.value = defaultAvatar
}

const badgeClass = computed(() => ({
  'lead-card__badge--hot': props.label === '[HOT]',
  'lead-card__badge--warm': props.label === '[WARM]',
}))

const timeAgo = computed(() => {
  if (!props.timestamp) return ''
  const diff = Date.now() - new Date(props.timestamp).getTime()
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h`
})
</script>

<style scoped>
.lead-card {
  background: var(--color-bg-card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid transparent;
  position: relative;
  animation: fadeSlideIn 0.4s ease-out;
  transition: transform 0.2s, background 0.2s;
}
.lead-card:hover {
  transform: translateX(4px);
  background: var(--color-bg-card-hover);
}

/* HOT variant */
.lead-card--hot {
  border-left-color: var(--color-accent-hot);
  animation: fadeSlideIn 0.4s ease-out, hotPulse 2s ease-in-out infinite;
}

/* WARM variant */
.lead-card--warm {
  border-left-color: var(--color-accent-warm);
}

/* Badge */
.lead-card__badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.5px;
}
.lead-card__badge--hot {
  background: rgba(255, 59, 92, 0.15);
  color: var(--color-accent-hot);
  border: 1px solid rgba(255, 59, 92, 0.3);
}
.lead-card__badge--warm {
  background: rgba(255, 140, 66, 0.15);
  color: var(--color-accent-warm);
  border: 1px solid rgba(255, 140, 66, 0.3);
}

/* Header */
.lead-card__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.lead-card__avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--color-border);
}
.lead-card__info {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.lead-card__name {
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.lead-card__uid {
  font-size: 12px;
  color: var(--color-text-muted);
}
.lead-card__time {
  font-size: 11px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

/* Body */
.lead-card__body {
  margin-bottom: 12px;
}
.lead-card__comment {
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  word-break: break-word;
}

/* CTA */
.lead-card__actions {
  display: flex;
}
.lead-card__cta {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}
.lead-card__cta--hot {
  background: var(--color-accent-hot);
  color: white;
}
.lead-card__cta--hot:hover {
  background: #e63350;
  transform: scale(1.03);
  box-shadow: 0 4px 15px var(--color-accent-hot-glow);
}
.lead-card__cta--warm {
  background: var(--color-accent-warm);
  color: white;
}
.lead-card__cta--warm:hover {
  background: #e67a35;
  transform: scale(1.03);
  box-shadow: 0 4px 15px var(--color-accent-warm-glow);
}
</style>
