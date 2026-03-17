<template>
  <teleport to="body">
    <transition-group name="sf-toast" tag="div" class="sf-toast-container">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="sf-toast"
        :class="`sf-toast--${toast.type}`"
        @click="removeToast(toast.id)"
      >
        <CheckCircle v-if="toast.type === 'success'" :size="16" class="sf-toast__icon" />
        <AlertCircle v-else-if="toast.type === 'error'" :size="16" class="sf-toast__icon" />
        <Info v-else :size="16" class="sf-toast__icon" />
        <span class="sf-toast__msg">{{ toast.message }}</span>
      </div>
    </transition-group>
  </teleport>
</template>

<script setup>
import { CheckCircle, AlertCircle, Info } from 'lucide-vue-next'
import { useToast } from '../composables/useToast.js'

const { toasts, removeToast } = useToast()
</script>

<style>
.sf-toast-container {
  position: fixed;
  top: 80px;
  right: 24px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  z-index: 9999;
  pointer-events: none;
}
.sf-toast {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
  box-shadow: 0 8px 30px rgba(0,0,0,0.18);
  cursor: pointer;
  pointer-events: all;
  min-width: 240px;
  max-width: 420px;
  transition: transform 0.2s, box-shadow 0.2s;
}
.sf-toast:hover {
  transform: translateX(-3px);
  box-shadow: 0 10px 36px rgba(0,0,0,0.25);
}

/* Colored backgrounds per type */
.sf-toast--success { background: linear-gradient(135deg, #059669, #10b981); }
.sf-toast--error   { background: linear-gradient(135deg, #dc2626, #ef4444); }
.sf-toast--info    { background: linear-gradient(135deg, #7c3aed, #a855f7); }
.sf-toast--warning { background: linear-gradient(135deg, #d97706, #f59e0b); }

.sf-toast__icon { flex-shrink: 0; }
.sf-toast__msg  { flex: 1; }

/* Transition */
.sf-toast-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.sf-toast-leave-active { transition: all 0.25s ease-in; }
.sf-toast-enter-from   { opacity: 0; transform: translateX(60px) scale(0.95); }
.sf-toast-leave-to     { opacity: 0; transform: translateX(60px) scale(0.95); }
</style>
