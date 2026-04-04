<template>
  <div class="zen-floating-bar" :class="{ 'zen-floating-bar--visible': visible }">
    <div class="zen-actions">
      <button class="zen-btn" @click="$emit('toggle-zen')" :title="t('admin.msg_exit_zen_mode', 'Thoát chế độ tập trung (F)')"><Focus :size="16" /></button>
      <div class="zen-divider"></div>
      <button class="zen-btn" @click="$emit('update:previewWidth', '100%')" :class="{ active: previewWidth === '100%' }" :title="t('admin.msg_preview_desktop', 'Xem trước trên Desktop')"><Monitor :size="16" /></button>
      <button class="zen-btn" @click="$emit('update:previewWidth', '768px')" :class="{ active: previewWidth === '768px' }" :title="t('admin.msg_preview_tablet', 'Xem trước trên Tablet')"><Tablet :size="16" /></button>
      <button class="zen-btn" @click="$emit('update:previewWidth', '375px')" :class="{ active: previewWidth === '375px' }" :title="t('admin.msg_preview_mobile', 'Xem trước trên Mobile')"><Smartphone :size="16" /></button>
      <div class="zen-divider"></div>
      <button class="zen-btn" @click="$emit('undo')" :disabled="undoStack.length <= 1" :title="t('admin.msg_undo', 'Hoàn tác')"><Undo2 :size="16" /></button>
      <button class="zen-btn" @click="$emit('redo')" :disabled="redoStack.length === 0" :title="t('admin.msg_redo', 'Làm lại')"><Redo2 :size="16" /></button>
      <div class="zen-divider"></div>
      <button class="zen-btn zen-btn--publish" @click="$emit('publish')" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin"/>
        <Save v-else :size="14"/> {{ saving ? t('admin.msg_saving', 'Đang lưu...') : t('admin.msg_publish', 'Xuất bản') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { Focus, Monitor, Tablet, Smartphone, Undo2, Redo2, Loader2, Save } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  previewWidth: {
    type: String,
    default: '100%',
  },
  saving: {
    type: Boolean,
    default: false,
  },
  undoStack: {
    type: Array,
    default: () => [],
  },
  redoStack: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['update:previewWidth', 'undo', 'redo', 'publish', 'toggle-zen'])
</script>

<style scoped>
.zen-floating-bar {
  position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%) translateY(100px);
  z-index: 100001; opacity: 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}
.zen-floating-bar--visible {
  transform: translateX(-50%) translateY(0); opacity: 1; pointer-events: auto;
}
.zen-actions {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5); border-radius: 100px;
  box-shadow: 0 20px 40px -15px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05);
}
.zen-btn {
  width: 36px; height: 36px; border-radius: 50%; border: none; background: transparent;
  color: var(--text-2); display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.zen-btn:hover:not(:disabled) { background: #fff; color: var(--text-1); box-shadow: 0 8px 16px rgba(0,0,0,0.08); transform: translateY(-2px); }
.zen-btn.active { background: #fff; color: var(--accent); box-shadow: 0 4px 12px rgba(124,58,237,0.15); }
.zen-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.zen-divider { width: 1px; height: 20px; background: rgba(0,0,0,0.1); margin: 0 4px; }
.zen-btn--publish {
  width: auto; padding: 0 16px; border-radius: 100px; gap: 6px; font-weight: 600; font-size: 13px;
  background: var(--accent); color: #fff; box-shadow: 0 4px 12px rgba(124,58,237,0.3);
}
.zen-btn--publish:hover:not(:disabled) { background: var(--accent); filter: brightness(1.1); color: #fff; transform: translateY(-2px); box-shadow: 0 8px 16px rgba(124,58,237,0.4); }
.spin { animation: spin 1s linear infinite; }
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
