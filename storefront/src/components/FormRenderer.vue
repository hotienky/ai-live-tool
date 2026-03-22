<template>
  <div class="custom-form-renderer">
    <div v-if="loading" class="form-loading">
      Đang tải biểu mẫu...
    </div>
    
    <div v-else-if="error" class="form-error">
      {{ error }}
    </div>
    
    <div v-else-if="success" class="form-success">
      <div class="success-icon">✓</div>
      <p>{{ successMessage }}</p>
    </div>
    
    <form v-else-if="form" @submit.prevent="submitForm" class="rendered-form">
      <h3 v-if="form.title" class="form-title">{{ form.title }}</h3>
      
      <div v-for="field in form.fields" :key="field.id" class="form-group" :class="{'form-group--half': field.width === 'half'}">
        
        <!-- Heading -->
        <h4 v-if="field.type === 'heading'" class="form-heading">{{ field.label }}</h4>
        
        <!-- Divider -->
        <hr v-else-if="field.type === 'divider'" class="form-divider" />
        
        <!-- Inputs -->
        <template v-else>
          <label :for="field.id" class="form-label">
            {{ field.label }} <span v-if="field.required" class="required">*</span>
          </label>
          
          <input
            v-if="['text', 'email', 'phone', 'number', 'date', 'file'].includes(field.type)"
            :id="field.id"
            :type="field.type"
            v-model="formData[field.id]"
            :placeholder="field.placeholder"
            :required="field.required"
            class="form-control"
          />
          
          <textarea
            v-else-if="field.type === 'textarea'"
            :id="field.id"
            v-model="formData[field.id]"
            :placeholder="field.placeholder"
            :required="field.required"
            class="form-control"
            rows="4"
          ></textarea>
          
          <select
            v-else-if="field.type === 'select'"
            :id="field.id"
            v-model="formData[field.id]"
            :required="field.required"
            class="form-control"
          >
            <option value="" disabled selected>Chọn...</option>
            <option v-for="(opt, idx) in optionsList(field.options)" :key="idx" :value="opt">
              {{ opt }}
            </option>
          </select>
          
          <div v-else-if="field.type === 'radio'" class="radio-group">
            <label v-for="(opt, idx) in optionsList(field.options)" :key="idx" class="radio-label">
              <input type="radio" :name="field.id" :value="opt" v-model="formData[field.id]" :required="field.required" />
              {{ opt }}
            </label>
          </div>
          
          <div v-else-if="field.type === 'checkbox'" class="checkbox-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData[field.id]" :required="field.required" />
              {{ field.placeholder || 'Đồng ý' }}
            </label>
          </div>
        </template>
        
      </div>
      
      <div class="form-actions">
        <button type="submit" class="btn btn--primary" :disabled="submitting">
          {{ submitting ? 'Đang gửi...' : 'Gửi biểu mẫu' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch, apiPost } from '../api.js'

const props = defineProps({
  slug: { type: String, required: true }
})

const loading = ref(true)
const submitting = ref(false)
const error = ref('')
const success = ref(false)
const successMessage = ref('')

const form = ref(null)
const formData = ref({})

onMounted(async () => {
  try {
    const res = await apiFetch(`/forms/${props.slug}`)
    form.value = res.data || res
    
    // Auto-init boolean for checkbox to false
    if (form.value && form.value.fields) {
      form.value.fields.forEach(f => {
        if (f.type === 'checkbox') {
          formData.value[f.id] = false
        }
      })
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      error.value = 'Biểu mẫu không tồn tại hoặc đã bị ẩn.'
    } else {
      error.value = 'Lỗi tải biểu mẫu: ' + err.message
    }
  } finally {
    loading.value = false
  }
})

function optionsList(options) {
  if (Array.isArray(options)) return options
  if (typeof options === 'string') return options.split('\n').map(s => s.trim()).filter(Boolean)
  return []
}

async function submitForm() {
  submitting.value = true
  try {
    const payload = {}
    form.value.fields.forEach(f => {
      if (['heading', 'divider'].includes(f.type)) return
      const val = formData.value[f.id]
      if (val !== undefined && val !== '') {
        payload[f.label] = val
      }
    })

    const res = await apiPost(`/forms/${props.slug}/submit`, { data: payload })
    
    success.value = true
    successMessage.value = form.value.settings?.success_message || res.message || 'Cảm ơn bạn đã gửi!'
  } catch (err) {
    alert('Lỗi: ' + (err.message || 'Không thể gửi form lúc này'))
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.custom-form-renderer {
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-lg);
  padding: 24px;
  margin: 24px 0;
  box-shadow: var(--sf-shadow-sm);
}

.form-loading, .form-error {
  text-align: center;
  padding: 20px;
  color: var(--sf-text-muted);
}
.form-error { color: var(--sf-danger); }

.form-success {
  text-align: center;
  padding: 40px 20px;
}
.success-icon {
  font-size: 48px;
  color: var(--sf-success);
  margin-bottom: 16px;
}
.form-success p {
  font-size: 18px;
  font-weight: 500;
  color: var(--sf-text-primary);
}

.rendered-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.form-title {
  width: 100%;
  margin: 0 0 16px;
  font-size: 20px;
  color: var(--sf-text-primary);
}

.form-heading { width: 100%; margin: 16px 0 8px; font-size: 18px; }
.form-divider { width: 100%; border: none; border-top: 1px solid var(--sf-border); margin: 16px 0; }

.form-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.form-group.form-group--half {
  width: calc(50% - 8px);
}
@media (max-width: 600px) {
  .form-group.form-group--half { width: 100%; }
}

.form-label {
  font-weight: 600;
  font-size: 14px;
  color: var(--sf-text-secondary);
}
.required { color: var(--sf-danger); margin-left: 2px; }

.form-control {
  padding: 10px 14px;
  border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-md);
  font-size: 15px;
  background: var(--sf-bg-surface);
  color: var(--sf-text-primary);
  transition: all var(--sf-transition);
}
.form-control:focus {
  border-color: var(--sf-accent);
  outline: none;
  box-shadow: 0 0 0 2px var(--sf-accent-glow);
}

.radio-group, .checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 4px;
}
.radio-label, .checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  cursor: pointer;
}

.form-actions {
  width: 100%;
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
