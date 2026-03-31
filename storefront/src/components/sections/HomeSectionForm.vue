<template>
  <div class="sf-section-form">
    <div class="form-container">
      <div v-if="params.title || params.subtitle" class="form-header">
        <h2 v-if="params.title" class="form-title">{{ params.title }}</h2>
        <p v-if="params.subtitle" class="form-subtitle">{{ params.subtitle }}</p>
      </div>

      <div v-if="isSuccess" class="form-success">
        <CheckCircle :size="48" class="success-icon" />
        <h3>Thành công!</h3>
        <p>{{ params.successMsg || 'Cảm ơn bạn đã gửi thông tin. Chúng tôi sẽ liên hệ lại sớm nhất.' }}</p>
        <button class="sf-btn btn-outline" @click="isSuccess = false">Gửi thêm</button>
      </div>

      <form v-else-if="formData" @submit.prevent="handleSubmit" class="dynamic-form">
        <div v-for="field in formData.fields" :key="field.name" class="form-group">
          <label :for="field.name">{{ field.label }} <span v-if="field.required" class="required">*</span></label>
          
          <!-- Textarea -->
          <textarea 
            v-if="field.type === 'textarea'"
            :id="field.name"
            v-model="payload[field.name]"
            :placeholder="field.placeholder"
            :required="field.required"
            rows="4"
            class="sf-input"
          ></textarea>

          <!-- Select -->
          <select 
            v-else-if="field.type === 'select'"
            :id="field.name"
            v-model="payload[field.name]"
            :required="field.required"
            class="sf-select"
          >
            <option value="" disabled selected>{{ field.placeholder || 'Chọn...' }}</option>
            <option v-for="opt in getOptions(field.options)" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <!-- Standard Input -->
          <input 
            v-else
            :type="field.type"
            :id="field.name"
            v-model="payload[field.name]"
            :placeholder="field.placeholder"
            :required="field.required"
            class="sf-input"
          >
        </div>

        <button type="submit" class="sf-btn btn-primary" :disabled="isSubmitting">
          <Loader2 v-if="isSubmitting" class="spin-icon" :size="16" />
          <span v-else>{{ params.submitText || 'Gửi ngay' }}</span>
        </button>
      </form>

      <div v-else class="form-fallback">
        <AlertCircle :size="24" />
        <p>Biểu mẫu chưa được định cấu hình hoặc không tồn tại.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  params: Object,
  section: Object
})

const formData = ref(null)
const payload = ref({})
const isSubmitting = ref(false)
const isSuccess = ref(false)

onMounted(async () => {
  await loadFormSchema()
})

watch(() => props.params.formId, async () => {
  await loadFormSchema()
})

async function loadFormSchema() {
  if (!props.params.formId) return
  try {
    // Dynamic import to fallback to LocalStorage mock from 'useForms' 
    // Usually in real prod, Storefront would hit an API: apiFetch(`/api/forms/${props.params.formId}`)
    const { useForms } = await import('../../../../frontend/src/composables/useForms.js')
    const { forms, fetchForms } = useForms()
    await fetchForms()
    formData.value = forms.value.find(f => f.id === props.params.formId)

    // Init payload
    if (formData.value && formData.value.fields) {
      formData.value.fields.forEach(f => {
        payload.value[f.name] = ''
      })
    }
  } catch (e) {
    console.error('Failed to load form', e)
    formData.value = null
  }
}

function getOptions(optStr) {
  if (!optStr) return []
  return optStr.split(',').map(s => s.trim()).filter(Boolean)
}

async function handleSubmit() {
  if (!formData.value) return
  isSubmitting.value = true
  try {
    const { useForms } = await import('../../../../frontend/src/composables/useForms.js')
    const { submitForm } = useForms()
    
    // Simulate network delay
    await new Promise(r => setTimeout(r, 600))
    await submitForm(formData.value.id, { ...payload.value })
    
    isSuccess.value = true
  } catch(e) {
    alert('Có lỗi xảy ra khi gửi. Vui lòng thử lại.')
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.sf-section-form {
  padding: 40px 20px;
  display: flex;
  justify-content: center;
}
.form-container {
  max-width: 600px;
  width: 100%;
  background: var(--bg-card, #ffffff);
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.form-header {
  text-align: center;
  margin-bottom: 24px;
}
.form-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: var(--text-dark, #111827);
}
.form-subtitle {
  font-size: 1rem;
  color: var(--text-medium, #4b5563);
  margin: 0;
}

.dynamic-form { display: flex; flex-direction: column; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-dark, #374151);
}
.required { color: #ef4444; }

.sf-input, .sf-select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border-light, #d1d5db);
  border-radius: 8px;
  font-size: 0.95rem;
  color: var(--text-dark, #1f2937);
  background: #f9fafb;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.sf-input:focus, .sf-select:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  background: #fff;
}

.sf-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  margin-top: 8px;
}
.btn-primary {
  background: var(--primary-color, #6366f1);
  color: #fff;
}
.btn-primary:hover {
  background: var(--primary-hover, #4f46e5);
}
.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-outline {
  background: transparent;
  border: 1px solid var(--border-light, #d1d5db);
  color: var(--text-dark, #374151);
}

.spin-icon { animation: spin 1s linear infinite; }
@keyframes spin { 100% { transform: rotate(360deg); } }

.form-success {
  text-align: center;
  padding: 40px 20px;
}
.success-icon {
  color: #10b981;
  margin-bottom: 16px;
}
.form-success h3 {
  font-size: 1.5rem;
  color: #111827;
  margin: 0 0 8px 0;
}
.form-success p {
  color: #4b5563;
  margin: 0 0 24px 0;
}

.form-fallback {
  text-align: center;
  color: #6b7280;
  padding: 40px;
  background: #f3f4f6;
  border-radius: 8px;
}
</style>
