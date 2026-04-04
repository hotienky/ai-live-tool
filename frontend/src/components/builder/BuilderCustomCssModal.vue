<template>
  <div class="media-modal-overlay" v-if="modelValue" @click.self="$emit('update:modelValue', false)">
    <div class="media-modal" style="width: 600px; height: 400px; border-radius: 8px;">
      <div class="media-modal-header">
        <h3><Code :size="16" /> CSS tùy chỉnh</h3>
        <button @click="$emit('update:modelValue', false)" title="Đóng"><X :size="20" /></button>
      </div>
      <div style="padding: 16px; flex: 1; display:flex">
        <textarea
          :value="customCss"
          @input="$emit('update:customCss', $event.target.value)"
          style="flex:1; width: 100%; border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: monospace; font-size: 13px;"
          placeholder="/* Custom CSS cho layout này */&#10;.my-class { }"
        ></textarea>
      </div>
      <div style="padding: 12px 16px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end;">
        <button class="cpb-btn-save" @click="$emit('update:modelValue', false)">Xong</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Code, X } from 'lucide-vue-next'

defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  customCss: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue', 'update:customCss'])
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
.cpb-btn-save {
  background: var(--accent, #7c3aed); color: #fff; border: none;
  padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: 0.2s; display: flex; align-items: center;
  gap: 6px; white-space: nowrap; flex-shrink: 0;
}
.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }
</style>
