<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast-item"
          :class="`toast--${toast.type}`"
          @click="removeToast(toast.id)"
        >
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
          <button class="toast-close">&times;</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../composables/useToast.js'

const { toasts, removeToast } = useToast()

const icons = {
  success: '✓',
  error: '✗',
  warning: '!',
  info: 'ℹ️',
}
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 380px;
  min-width: 280px;
}

.toast-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 16px;
  border-radius: 12px;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
  background: #1e1e2e;
  color: #ffffff;
  border-left: 4px solid transparent;
}
.toast-item:hover {
  transform: translateX(-3px);
  box-shadow: 0 10px 36px rgba(0, 0, 0, 0.3);
}

.toast--success { border-left-color: #10b981; }
.toast--error   { border-left-color: #ef4444; }
.toast--warning { border-left-color: #f59e0b; }
.toast--info    { border-left-color: #7c3aed; }

.toast-icon {
  font-size: 15px;
  flex-shrink: 0;
  width: 20px;
  text-align: center;
}
.toast--success .toast-icon { color: #10b981; }
.toast--error   .toast-icon { color: #ef4444; }
.toast--warning .toast-icon { color: #f59e0b; }
.toast--info    .toast-icon { color: #a78bfa; }

.toast-msg {
  flex: 1;
  line-height: 1.4;
  color: #f4f4f5;
}
.toast-close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.5);
  font-size: 18px;
  cursor: pointer;
  padding: 0 2px;
  line-height: 1;
  flex-shrink: 0;
  transition: color 0.15s;
}
.toast-close:hover { color: #fff; }

/* Transition */
.toast-enter-active { animation: slideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.toast-leave-active { animation: slideOut 0.25s ease-in; }
@keyframes slideIn {
  from { opacity: 0; transform: translateX(80px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes slideOut {
  from { opacity: 1; transform: translateX(0); }
  to   { opacity: 0; transform: translateX(80px); }
}
</style>
