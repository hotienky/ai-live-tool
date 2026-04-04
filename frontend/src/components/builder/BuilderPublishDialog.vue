<template>
  <div v-if="modelValue" class="media-modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="media-modal" style="width: 440px; border-radius: 12px;">
      <div class="media-modal-header">
        <h3><Package :size="16" /> {{ t('admin.msg_publish_layout', 'Xuất bản layout') }}</h3>
        <button @click="$emit('update:modelValue', false)" :title="t('admin.msg_close', 'Đóng')"><X :size="20" /></button>
      </div>
      <div style="padding: 20px;">
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 6px; font-size: 13px; color: var(--text-2); font-weight: 600;">{{ t('admin.msg_version_note_optional', 'Ghi chú phiên bản (tuỳ chọn)') }}</p>
          <input
            :value="publishNote"
            @input="$emit('update:publishNote', $event.target.value)"
            class="param-input"
            :placeholder="t('admin.msg_version_note_placeholder', 'VD: Cập nhật banner Tết, thêm section FAQ...')"
            @keyup.enter="$emit('confirm')"
          />
        </div>
        <div>
          <p style="margin: 0 0 6px; font-size: 13px; color: var(--text-2); font-weight: 600;">{{ t('admin.msg_schedule_publish_optional', 'Lên lịch xuất bản (tuỳ chọn)') }}</p>
          <input
            type="datetime-local"
            :value="publishSchedule"
            @input="$emit('update:publishSchedule', $event.target.value)"
            class="param-input"
          />
          <p style="margin: 4px 0 0; font-size: 11px; color: var(--text-3);">{{ t('admin.msg_leave_blank_publish_now', 'Nếu bỏ trống, layout sẽ được xuất bản ngay lập tức.') }}</p>
        </div>
      </div>
      <div style="padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px;">
        <button class="cpb-btn-secondary" @click="$emit('update:modelValue', false)">{{ t('admin.msg_cancel', 'Huỷ') }}</button>
        <button class="cpb-btn-save" @click="$emit('confirm')" :disabled="saving">
          <Save :size="14" /> {{ saving ? t('admin.msg_saving', 'Đang lưu...') : t('admin.msg_publish', 'Xuất bản') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Package, X, Save } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  publishNote: {
    type: String,
    default: '',
  },
  publishSchedule: {
    type: String,
    default: '',
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue', 'update:publishNote', 'update:publishSchedule', 'confirm'])
</script>

<style scoped>
.media-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; backdrop-filter: blur(2px);
}
.media-modal {
  background: #fff; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}
.media-modal-header {
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.media-modal-header h3 {
  margin: 0; font-size: 16px; display: flex; align-items: center;
  gap: 8px; font-weight: 700; color: var(--text-1);
}
.media-modal-header button { background: none; border: none; cursor: pointer; color: var(--text-3); }
.media-modal-header button:hover { color: var(--text-1); }
.cpb-btn-secondary {
  background: var(--bg-2); border: 1px solid var(--border); padding: 6px 12px;
  border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer;
  color: var(--text-2); display: flex; align-items: center; gap: 6px;
  transition: 0.2s; white-space: nowrap; flex-shrink: 0;
}
.cpb-btn-secondary:hover:not(:disabled) { background: #fff; color: var(--text-1); border-color: var(--text-3); box-shadow: 0 2px 4px rgba(0,0,0,0.02); }
.cpb-btn-save {
  background: var(--accent, #7c3aed); color: #fff; border: none;
  padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: 0.2s; display: flex; align-items: center;
  gap: 6px; white-space: nowrap; flex-shrink: 0;
}
.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }
</style>
