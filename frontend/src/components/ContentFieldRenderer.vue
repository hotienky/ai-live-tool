<template>
  <div class="content-field">
    <label v-if="field.label" class="content-field__label">
      {{ field.label }}
      <span v-if="field.required" class="content-field__required">*</span>
    </label>

    <!-- Text -->
    <input
      v-if="field.type === 'text'"
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="field.placeholder || ''"
      class="content-field__input"
    />

    <!-- Number -->
    <input
      v-else-if="field.type === 'number'"
      type="number"
      :value="modelValue"
      @input="$emit('update:modelValue', Number($event.target.value))"
      :placeholder="field.placeholder || ''"
      :min="field.min"
      :max="field.max"
      class="content-field__input"
    />

    <!-- Textarea -->
    <textarea
      v-else-if="field.type === 'textarea'"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="field.placeholder || ''"
      :rows="field.rows || 3"
      class="content-field__textarea"
    ></textarea>

    <!-- Rich Text -->
    <div v-else-if="field.type === 'richtext'" class="content-field__richtext">
      <textarea
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        :placeholder="field.placeholder || 'Nội dung...'"
        rows="10"
        class="content-field__textarea content-field__textarea--rich"
      ></textarea>
    </div>

    <!-- Date -->
    <input
      v-else-if="field.type === 'date'"
      type="date"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="content-field__input"
    />

    <!-- DateTime -->
    <input
      v-else-if="field.type === 'datetime'"
      type="datetime-local"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      class="content-field__input"
    />

    <!-- Select -->
    <select
      v-else-if="field.type === 'select'"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="content-field__select"
    >
      <option value="">-- {{ field.placeholder || 'Chọn...' }} --</option>
      <option v-for="opt in field.options || []" :key="opt.value" :value="opt.value">
        {{ opt.label }}
      </option>
    </select>

    <!-- Checkbox -->
    <label v-else-if="field.type === 'checkbox'" class="content-field__checkbox-label">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      {{ field.checkboxLabel || field.label }}
    </label>

    <!-- Media (image picker) -->
    <div v-else-if="field.type === 'media'" class="content-field__media">
      <div v-if="modelValue" class="content-field__media-preview">
        <img :src="modelValue" alt="" />
        <button @click="$emit('update:modelValue', '')" class="content-field__media-remove" title="Xoá">✕</button>
      </div>
      <input
        type="text"
        :value="modelValue"
        @input="$emit('update:modelValue', $event.target.value)"
        placeholder="URL hình ảnh"
        class="content-field__input"
      />
    </div>

    <!-- Fallback: text input -->
    <input
      v-else
      type="text"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :placeholder="field.placeholder || ''"
      class="content-field__input"
    />

    <p v-if="field.help" class="content-field__help">{{ field.help }}</p>
  </div>
</template>

<script setup>
defineProps({
  field: { type: Object, required: true },
  modelValue: { default: '' },
})
defineEmits(['update:modelValue'])
</script>

<style scoped>
.content-field { margin-bottom: 16px; }
.content-field__label {
  display: block; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary, #666); margin-bottom: 6px;
}
.content-field__required { color: #ef4444; }
.content-field__input, .content-field__textarea, .content-field__select {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--glass-border, #e0e0e0);
  background: var(--glass-bg, rgba(255,255,255,0.06));
  color: var(--color-text, #333); font-size: 14px;
  transition: border-color 0.2s;
}
.content-field__input:focus, .content-field__textarea:focus, .content-field__select:focus {
  border-color: var(--accent-light, #6366f1); outline: none;
}
.content-field__textarea { resize: vertical; min-height: 80px; }
.content-field__textarea--rich { min-height: 200px; font-family: monospace; }
.content-field__checkbox-label {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; cursor: pointer;
}
.content-field__media-preview {
  position: relative; display: inline-block; margin-bottom: 8px;
}
.content-field__media-preview img {
  max-width: 200px; max-height: 120px; border-radius: 8px;
  object-fit: cover; border: 1px solid var(--glass-border);
}
.content-field__media-remove {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: white; border: none;
  cursor: pointer; font-size: 12px; display: flex; align-items: center; justify-content: center;
}
.content-field__help {
  font-size: 12px; color: var(--color-text-muted, #999); margin-top: 4px;
}
</style>
