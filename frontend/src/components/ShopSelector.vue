<template>
  <div class="shop-selector">
    <!-- Current Shop Display -->
    <div class="shop-selector__current" @click="toggleDropdown">
      <span class="shop-selector__icon"><Store :size="16" /></span>
      <span class="shop-selector__name" v-if="currentShop">
        {{ currentShop.shop_name }}
      </span>
      <span class="shop-selector__name shop-selector__name--empty" v-else>
        Chọn Shop...
      </span>
      <span class="shop-selector__status" v-if="currentShop?.connectionStatus">
        <span class="shop-selector__dot" :class="dotClass"></span>
      </span>
      <span class="shop-selector__arrow"><ChevronDown :size="14" /></span>
    </div>

    <!-- Dropdown -->
    <div class="shop-selector__dropdown" v-if="isOpen">
      <!-- Shop List -->
      <div
        v-for="shop in shops"
        :key="shop.id"
        class="shop-selector__item"
        :class="{ 'shop-selector__item--active': currentShop?.id === shop.id }"
        @click="onSelectShop(shop)"
      >
        <div class="shop-selector__item-info">
          <span class="shop-selector__item-name">{{ shop.shop_name }}</span>
          <span class="shop-selector__item-tiktok" v-if="shop.tiktok_username">
            @{{ shop.tiktok_username }}
          </span>
          <span class="shop-selector__item-tiktok shop-selector__item-tiktok--none" v-else>
            Chưa cấu hình TikTok
          </span>
        </div>
        <span
          class="shop-selector__item-status"
          :class="'shop-selector__item-status--' + (shop.connectionStatus || 'offline')"
        >
          {{ statusLabel(shop.connectionStatus) }}
        </span>
      </div>

      <!-- Divider -->
      <div class="shop-selector__divider"></div>

      <!-- Manage hint -->
      <div class="shop-selector__hint">
        Nhấn <strong>Phiên Live</strong> để bắt đầu phiên mới
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Store, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  shops: { type: Array, default: () => [] },
  currentShop: { type: Object, default: null },
})

const emit = defineEmits(['select'])

const isOpen = ref(false)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function onSelectShop(shop) {
  emit('select', shop)
  isOpen.value = false
}

function statusLabel(status) {
  if (status === 'connected') return '🟢 Live'
  if (status === 'mock') return '🎭 Mock'
  if (status === 'connecting') return '🟡 ...'
  return '⚫ Off'
}

const dotClass = computed(() => {
  const s = props.currentShop?.connectionStatus
  if (s === 'connected' || s === 'mock') return 'shop-selector__dot--live'
  if (s === 'connecting') return 'shop-selector__dot--waiting'
  return 'shop-selector__dot--offline'
})

// Close dropdown on outside click
function onClickOutside(e) {
  if (!e.target.closest('.shop-selector')) {
    isOpen.value = false
  }
}

function open() { isOpen.value = true }
defineExpose({ open })

onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.shop-selector {
  position: relative;
  z-index: 50;
}

.shop-selector__current {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-primary);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 180px;
}

.shop-selector__current:hover {
  border-color: var(--color-accent-warm);
  background: var(--color-bg-card);
}

.shop-selector__icon {
  font-size: 14px;
}

.shop-selector__name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.shop-selector__name--empty {
  color: var(--color-text-muted);
  font-weight: 400;
}

.shop-selector__status {
  display: flex;
  align-items: center;
}

.shop-selector__dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}

.shop-selector__dot--live {
  background: var(--color-success);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.5);
}

.shop-selector__dot--waiting {
  background: #f59e0b;
}

.shop-selector__dot--offline {
  background: #6b7280;
}

.shop-selector__arrow {
  font-size: 10px;
  color: var(--color-text-muted);
}

/* Dropdown */
.shop-selector__dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 280px;
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  z-index: 100;
  padding: 6px 0;
  animation: fadeSlideIn 0.2s ease-out;
}

.shop-selector__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  cursor: pointer;
  transition: background 0.15s;
}

.shop-selector__item:hover {
  background: var(--color-bg-card);
}

.shop-selector__item--active {
  background: var(--color-bg-card);
  border-left: 3px solid var(--color-accent-warm);
}

.shop-selector__item-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.shop-selector__item-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.shop-selector__item-tiktok {
  font-size: 11px;
  color: var(--color-text-muted);
}

.shop-selector__item-tiktok--none {
  color: var(--color-accent-hot);
  opacity: 0.7;
}

.shop-selector__item-status {
  font-size: 11px;
  white-space: nowrap;
}

.shop-selector__divider {
  height: 1px;
  background: var(--color-border);
  margin: 4px 0;
}

/* Hint */
.shop-selector__hint {
  padding: 8px 14px;
  font-size: 11px;
  color: var(--color-text-muted);
  text-align: center;
}
.shop-selector__hint strong {
  color: var(--color-accent-warm);
}
</style>
