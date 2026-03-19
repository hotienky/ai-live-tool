<template>
  <div class="sf-page">
    <div class="sf-header">
      <button class="btn-back" @click="emit('back')"><ChevronLeft :size="15" /> Quay lại</button>
      <div class="sf-header__center">
        <div class="sf-header__icon"><Briefcase :size="15" /></div>
        <h3>{{ props.editId ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp' }}</h3>
      </div>
      <button class="btn-save" @click="handleSave" :disabled="saving">
        <Loader2 v-if="saving" :size="13" class="spin" />
        {{ saving ? 'Đang lưu...' : (props.editId ? 'Cập nhật' : 'Thêm') }}
      </button>
    </div>

    <div class="sf-body">
      <div class="sf-col sf-col--main">
        <div class="sf-card">
          <h4><Briefcase :size="13" /> Thông tin nhà cung cấp</h4>
          <div class="form-group">
            <label>Tên NCC <span class="req">*</span></label>
            <input v-model="form.name" class="form-input" placeholder="Công ty ABC" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>{{ t('admin.phone_short', 'SĐT') }}</label>
              <input v-model="form.phone" class="form-input" placeholder="0912..." />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input v-model="form.email" class="form-input" placeholder="abc@..." />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.address', 'Địa chỉ') }}</label>
            <input v-model="form.address" class="form-input" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Mã số thuế</label>
              <input v-model="form.tax_id" class="form-input" />
            </div>
            <div class="form-group">
              <label>Người liên hệ</label>
              <input v-model="form.contact_person" class="form-input" />
            </div>
          </div>
          <div class="form-group">
            <label>{{ t('admin.notes', 'Ghi chú') }}</label>
            <textarea v-model="form.notes" class="form-input" rows="3"></textarea>
          </div>
        </div>
      </div>
      <div class="sf-col sf-col--side">
        <div class="sf-card">
          <h4>Trạng thái</h4>
          <div class="form-group form-group--inline">
            <span>Đang hoạt động</span>
            <label class="toggle">
              <input type="checkbox" v-model="form.is_active" />
              <span class="toggle__slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, Briefcase, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../helpers.js'
import { useToast } from '../helpers.js'
import { useI18n } from '../helpers.js'

const { t } = useI18n()
const { showToast } = useToast()
const props = defineProps({ editId: { type: [String, Number], default: null } })
const emit = defineEmits(['saved', 'back'])

const saving = ref(false)
const form = ref({ name: '', phone: '', email: '', address: '', tax_id: '', contact_person: '', notes: '', is_active: true })

onMounted(async () => {
  if (!props.editId) return
  try {
    const res = await apiFetch(`/suppliers/${props.editId}`)
    const data = await res.json()
    const s = data?.data || data
    form.value = { name: s.name || '', phone: s.phone || '', email: s.email || '', address: s.address || '', tax_id: s.tax_id || '', contact_person: s.contact_person || '', notes: s.notes || '', is_active: s.is_active ?? true }
  } catch { showToast('Không tải được thông tin NCC', 'error') }
})

async function handleSave() {
  if (!form.value.name) return showToast('Tên NCC là bắt buộc', 'error')
  saving.value = true
  try {
    if (props.editId) {
      await apiFetch(`/suppliers/${props.editId}`, { method: 'PUT', body: JSON.stringify(form.value) })
      showToast(t('admin.updated', 'Đã cập nhật'), 'success')
    } else {
      await apiFetch('/suppliers', { method: 'POST', body: JSON.stringify(form.value) })
      showToast('Đã thêm NCC', 'success')
    }
    emit('saved')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
  saving.value = false
}
</script>

<style scoped>
.sf-page { animation: fadeUp .2s ease; }
@keyframes fadeUp { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.sf-header {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 0; margin-bottom: 20px; border-bottom: 1px solid var(--color-border);
}
.sf-header__center { display: flex; align-items: center; gap: 8px; flex: 1; justify-content: center; }
.sf-header__icon { width: 28px; height: 28px; border-radius: 8px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }
.sf-header h3 { margin: 0; font-size: 16px; font-weight: 700; }
.btn-back { display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px; border: 1px solid var(--color-border); background: var(--color-bg-card); color: var(--color-text-secondary); font-size: 13px; font-weight: 600; cursor: pointer; transition: all .2s; }
.btn-back:hover { border-color: var(--accent); color: var(--accent); }
.btn-save { display: flex; align-items: center; gap: 6px; padding: 8px 20px; border-radius: 8px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.btn-save:disabled { opacity: .5; cursor: not-allowed; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.sf-body { display: flex; gap: 20px; align-items: flex-start; }
.sf-col--main { flex: 7; min-width: 0; }
.sf-col--side { flex: 3; min-width: 200px; position: sticky; top: 16px; }
.sf-card { background: var(--color-bg-card); border: 1px solid var(--color-border); border-radius: 12px; padding: 20px; }
.sf-card h4 { font-size: 13px; font-weight: 700; margin: 0 0 14px; display: flex; align-items: center; gap: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; font-weight: 600; color: var(--color-text-muted); margin-bottom: 4px; }
.req { color: #ef4444; }
.form-input { width: 100%; padding: 8px 12px; border-radius: 8px; font-size: 13px; border: 1px solid var(--color-border); background: var(--color-bg-primary); color: var(--color-text-primary); outline: none; box-sizing: border-box; transition: border-color .2s; }
.form-input:focus { border-color: var(--accent); }
.form-group--inline { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; background: var(--color-bg-secondary); border-radius: 8px; border: 1px solid var(--color-border); font-size: 13px; }
.toggle { position: relative; display: inline-block; width: 34px; height: 20px; cursor: pointer; }
.toggle input { opacity: 0; width: 0; height: 0; }
.toggle__slider { position: absolute; inset: 0; border-radius: 20px; background: var(--color-border); transition: background .2s; }
.toggle__slider::before { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: #fff; left: 3px; top: 3px; transition: transform .2s; }
.toggle input:checked + .toggle__slider { background: var(--accent); }
.toggle input:checked + .toggle__slider::before { transform: translateX(14px); }
@media (max-width: 768px) { .sf-body { flex-direction: column; } .sf-col--side { position: static; width: 100%; } }
</style>
