<template>
  <div class="form-block">
    <!-- Builder Mode -->
    <template v-if="editable">
      <div class="fb-header">
        <h4 class="fb-title"><FileText :size="14" /> {{ form.title || 'Contact Form' }}</h4>
        <button class="fb-add-field" @click="addField"><Plus :size="12" /> Add Field</button>
      </div>

      <div v-for="(field, idx) in form.fields" :key="field.id" class="fb-field-edit">
        <div class="fb-field-edit__header">
          <GripVertical :size="12" class="fb-drag" />
          <select v-model="field.type" class="fb-field-type" @change="emitChange">
            <option v-for="ft in fieldTypes" :key="ft.value" :value="ft.value">{{ ft.label }}</option>
          </select>
          <input v-model="field.label" class="fb-field-label-input" placeholder="Field label" @input="emitChange" />
          <label class="fb-required-toggle"><input type="checkbox" v-model="field.required" @change="emitChange" /> Required</label>
          <button class="fb-field-del" @click="removeField(idx)"><Trash2 :size="12" /></button>
        </div>
        <div v-if="field.type === 'select'" class="fb-field-options">
          <input v-model="field.options" class="fb-input" placeholder="Options: Option 1, Option 2, Option 3" @input="emitChange" />
        </div>
      </div>

      <!-- Form Settings -->
      <div class="fb-settings">
        <div class="fb-row">
          <label>Submit Label</label>
          <input v-model="form.submitText" class="fb-input" @input="emitChange" />
        </div>
        <div class="fb-row">
          <label>Success Message</label>
          <input v-model="form.successMessage" class="fb-input" @input="emitChange" />
        </div>
      </div>
    </template>

    <!-- Preview / Render Mode -->
    <template v-else>
      <form class="fb-form" @submit.prevent="onSubmit">
        <h4 v-if="form.title" class="fb-form__title">{{ form.title }}</h4>
        <div v-for="field in form.fields" :key="field.id" class="fb-form-field">
          <label class="fb-form-label">{{ field.label }} <span v-if="field.required" class="fb-req">*</span></label>
          <input v-if="['text','email','phone','number'].includes(field.type)" :type="field.type === 'phone' ? 'tel' : field.type" v-model="formData[field.id]" class="fb-form-input" :required="field.required" :placeholder="field.placeholder" />
          <textarea v-else-if="field.type === 'textarea'" v-model="formData[field.id]" class="fb-form-textarea" rows="4" :required="field.required"></textarea>
          <select v-else-if="field.type === 'select'" v-model="formData[field.id]" class="fb-form-select" :required="field.required">
            <option value="">-- Select --</option>
            <option v-for="opt in (field.options || '').split(',')" :key="opt.trim()" :value="opt.trim()">{{ opt.trim() }}</option>
          </select>
          <label v-else-if="field.type === 'checkbox'" class="fb-form-check">
            <input type="checkbox" v-model="formData[field.id]" /> {{ field.label }}
          </label>
        </div>
        <button type="submit" class="fb-form-submit" :disabled="submitting">
          {{ submitting ? 'Sending...' : (form.submitText || 'Submit') }}
        </button>
        <p v-if="submitted" class="fb-form-success">{{ form.successMessage || 'Thank you!' }}</p>
      </form>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'
import { FileText, Plus, GripVertical, Trash2 } from 'lucide-vue-next'

const props = defineProps({
  content: { type: Object, default: () => ({}) },
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['update'])

const form = reactive({
  title: props.content.title || '',
  submitText: props.content.submitText || 'Submit',
  successMessage: props.content.successMessage || 'Thank you for your submission!',
  fields: props.content.fields || [],
})

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
]

const formData = reactive({})
const submitting = ref(false)
const submitted = ref(false)

function addField() {
  form.fields.push({
    id: `f_${Date.now().toString(36)}`,
    type: 'text',
    label: 'New Field',
    placeholder: '',
    required: false,
    options: '',
  })
  emitChange()
}

function removeField(idx) {
  form.fields.splice(idx, 1)
  emitChange()
}

function emitChange() {
  emit('update', { ...form, fields: [...form.fields] })
}

async function onSubmit() {
  submitting.value = true
  try {
    // Submit form data to backend
    const payload = { ...formData, _form_title: form.title }
    await fetch('/api/storefront/forms/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    submitted.value = true
  } catch (e) {
    console.error('Form submit error:', e)
  }
  submitting.value = false
}

watch(() => props.content, (val) => {
  if (val.title) form.title = val.title
  if (val.fields) form.fields = val.fields
  if (val.submitText) form.submitText = val.submitText
  if (val.successMessage) form.successMessage = val.successMessage
}, { deep: true })
</script>

<style scoped>
.form-block { width: 100%; }

/* Builder mode */
.fb-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px;
}
.fb-title { font-size: 15px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px; }
.fb-add-field {
  display: flex; align-items: center; gap: 4px; padding: 6px 12px;
  border-radius: 6px; font-size: 11px; font-weight: 700;
  border: 1px solid var(--accent); background: transparent;
  color: var(--accent); cursor: pointer;
}

.fb-field-edit {
  padding: 10px 14px; margin-bottom: 8px; border-radius: 8px;
  border: 1px solid var(--color-border); background: var(--bg-2);
}
.fb-field-edit__header {
  display: flex; align-items: center; gap: 8px;
}
.fb-drag { color: var(--text-3); cursor: grab; }
.fb-field-type {
  padding: 4px 8px; border-radius: 4px; font-size: 11px;
  border: 1px solid var(--color-border); background: var(--bg-1); color: var(--text-1);
}
.fb-field-label-input {
  flex: 1; padding: 4px 8px; border-radius: 4px; font-size: 12px;
  border: 1px solid var(--color-border); background: transparent; color: var(--text-1);
}
.fb-required-toggle { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-3); white-space: nowrap; }
.fb-field-del { background: none; border: none; color: var(--text-3); cursor: pointer; padding: 4px; }
.fb-field-del:hover { color: #ef4444; }
.fb-field-options { margin-top: 6px; }

.fb-settings { margin-top: 16px; padding-top: 12px; border-top: 1px dashed var(--color-border); }
.fb-row {
  display: flex; align-items: center; gap: 10px; margin-bottom: 8px;
  font-size: 12px; color: var(--text-2);
}
.fb-row label { min-width: 100px; font-weight: 600; }
.fb-input {
  flex: 1; padding: 6px 10px; border-radius: 6px;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 12px; color: var(--text-1);
}

/* Render mode */
.fb-form { max-width: 500px; }
.fb-form__title { font-size: 18px; font-weight: 700; margin: 0 0 16px; }
.fb-form-field { margin-bottom: 14px; }
.fb-form-label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
.fb-req { color: #ef4444; }
.fb-form-input, .fb-form-textarea, .fb-form-select {
  width: 100%; padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--color-border, #e5e7eb);
  font-size: 14px; background: var(--bg-2, #fff); color: var(--text-1, #111);
}
.fb-form-textarea { resize: vertical; }
.fb-form-check { display: flex; align-items: center; gap: 8px; font-size: 14px; cursor: pointer; }
.fb-form-submit {
  padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;
  background: var(--accent, #7c3aed); color: #fff; border: none; cursor: pointer;
  transition: all 0.2s;
}
.fb-form-submit:hover { transform: translateY(-1px); }
.fb-form-submit:disabled { opacity: 0.5; }
.fb-form-success { color: #10b981; font-size: 14px; font-weight: 600; margin-top: 12px; }
</style>
