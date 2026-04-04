<template>
  <div>
    <label class="toggle-row">
      <input type="checkbox" :checked="modelValue.enabled" @change="update('enabled', $event.target.checked)" />
      <span>Hiển thị thanh thông báo (Promo Bar)</span>
    </label>
    <template v-if="modelValue.enabled">
      <div class="form-group" style="margin-top: 12px">
        <label>Nội dung</label>
        <input :value="modelValue.text" @input="update('text', $event.target.value)" class="param-input" placeholder="Miễn phí vận chuyển..." />
      </div>
      <div class="form-group" style="margin-top: 12px">
        <label>Link trỏ tới</label>
        <input :value="modelValue.link" @input="update('link', $event.target.value)" class="param-input" placeholder="/products" />
      </div>
      <div class="form-group" style="margin-top: 12px">
        <label>Tên Nút (CTA Text)</label>
        <input :value="modelValue.ctaText" @input="update('ctaText', $event.target.value)" class="param-input" placeholder="Mua ngay" />
      </div>
      <div class="param-divider"></div>
      <div class="form-group">
        <label>Màu nền</label>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="color" :value="modelValue.bgColor" @input="update('bgColor', $event.target.value)" class="param-color" />
          <input :value="modelValue.bgColor" @input="update('bgColor', $event.target.value)" class="param-input" placeholder="#7c3aed" />
        </div>
      </div>
      <div class="form-group">
        <label>Màu chữ</label>
        <div style="display:flex;gap:6px;align-items:center">
          <input type="color" :value="modelValue.textColor" @input="update('textColor', $event.target.value)" class="param-color" />
          <input :value="modelValue.textColor" @input="update('textColor', $event.target.value)" class="param-input" placeholder="#ffffff" />
        </div>
      </div>
      <div class="form-group">
        <label>Cỡ chữ</label>
        <select :value="modelValue.fontSize" @change="update('fontSize', $event.target.value)" class="param-select">
          <option value="12px">Nhỏ (12px)</option>
          <option value="13px">Vừa (13px)</option>
          <option value="14px">Lớn (14px)</option>
          <option value="15px">Rất lớn (15px)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Có thể đóng</label>
        <label class="toggle-switch toggle-switch--sm" @click.stop>
          <input type="checkbox" :checked="modelValue.dismissible" @change="update('dismissible', $event.target.checked)" />
          <span class="toggle-slider"></span>
        </label>
      </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:modelValue'])

function update(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}
</script>

<style scoped>
.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.form-group label { font-size: 13px; font-weight: 600; color: var(--text-2); }
.toggle-row { display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 13px; font-weight: 500; color: var(--text-1); }
</style>
