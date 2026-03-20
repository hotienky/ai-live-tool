<template>
  <div class="sys-config">
    <h3 class="section-title"><Cog :size="16" /> {{ t('admin.msg_31f9476f', 'Cấu hình hệ thống') }}</h3>

    <!-- Group tabs -->
    <div class="config-groups">
      <button
        v-for="(schema, groupKey) in CONFIG_SCHEMA"
        :key="groupKey"
        class="config-group-btn"
        :class="{ active: activeGroup === groupKey }"
        @click="switchGroup(groupKey)"
      >
        <component :is="groupIcons[groupKey]" :size="14" />
        {{ schema.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> {{ t('admin.msg_d5fe42f6', 'Đang tải...') }}
    </div>

    <template v-else>
      <!-- Cảnh báo chưa cấu hình -->
      <div v-if="isUnconfigured" class="config-warning">
        <AlertTriangle :size="15" />
        <span>{{ t('admin.msg_1578dded', 'Nhóm') }}<strong>{{ currentSchema.label }}</strong> {{ t('admin.msg_not_configured', 'chưa được cấu hình') }}.
          {{ t('admin.msg_using_defaults', 'Hệ thống đang dùng giá trị mặc định từ server') }} (<code>.env</code>).
          {{ t('admin.msg_select_service', 'Hãy chọn dịch vụ và điền thông tin để áp dụng cho tenant này') }}.
        </span>
      </div>

      <!-- Group description -->
      <p class="group-desc">{{ currentSchema.description }}</p>

      <!-- Service selector -->
      <div class="service-grid">
        <button
          v-for="(svc, svcKey) in currentSchema.services"
          :key="svcKey"
          class="service-card"
          :class="{ active: selectedService === svcKey }"
          @click="selectService(svcKey)"
        >
          <span class="service-card__name">{{ svc.label }}</span>
          <span class="service-card__desc">{{ svc.desc ?? svc.description }}</span>
          <span v-if="selectedService === svcKey" class="service-card__check">
            <CheckCircle2 :size="16" />
          </span>
        </button>
      </div>

      <!-- Fields form -->
      <div v-if="currentFields.length > 0" class="config-form">
        <div
          v-for="field in currentFields"
          :key="field.key"
          class="config-field"
        >
          <div class="config-field__label-row">
            <label class="config-field__label">
              {{ field.label }}
              <span v-if="field.required" class="badge-required">{{ t('admin.required', 'Bắt buộc') }}</span>
              <span v-else class="badge-optional">{{ t('admin.msg_optional', 'Tuỳ chọn') }}</span>
            </label>
            <code class="config-field__key">{{ field.key }}</code>
          </div>
          <p class="config-field__desc">{{ field.description }}</p>

          <!-- Select -->
          <select
            v-if="field.type === 'select'"
            class="cfg-input cfg-input--select"
            :value="formValues[field.key] ?? ''"
            @change="setValue(field.key, $event.target.value)"
          >
            <option value="" disabled>{{ t('admin.msg_d5555988', '-- Chọn --') }}</option>
            <option v-for="opt in field.options" :key="opt" :value="opt">{{ opt }}</option>
          </select>

          <!-- Password -->
          <div v-else-if="field.type === 'password'" class="input-wrap">
            <input
              :type="showPassword[field.key] ? 'text' : 'password'"
              class="cfg-input"
              :value="formValues[field.key] ?? ''"
              :placeholder="field.placeholder"
              @input="setValue(field.key, $event.target.value)"
            />
            <button class="toggle-pw" @click="togglePassword(field.key)" type="button">
              <Eye v-if="!showPassword[field.key]" :size="14" />
              <EyeOff v-else :size="14" />
            </button>
          </div>

          <!-- Number / Text -->
          <input
            v-else
            :type="field.type"
            class="cfg-input"
            :value="formValues[field.key] ?? ''"
            :placeholder="field.placeholder"
            @input="setValue(field.key, $event.target.value)"
          />
        </div>
      </div>

      <!-- No fields needed -->
      <div v-else class="no-fields-note">
        <CheckCircle2 :size="20" />
        <span>{{ t('admin.msg_no_config_needed', 'Không cần cấu hình thêm') }} — chọn <strong>{{ t('admin.save', 'Lưu') }}</strong> {{ t('admin.msg_to_apply', 'để áp dụng') }}</span>
      </div>

      <!-- Actions -->
      <div class="config-actions">
        <button class="cfg-save-btn" @click="saveAll" :disabled="saving || !hasChanges">
          <Save :size="14" />
          {{ saving ? t('admin.saving', 'Đang lưu...') : t('admin.save_config', 'Lưu cấu hình') }}
        </button>

        <!-- Test mail button — chỉ hiện với mail drivers có thể test -->
        <button
          v-if="activeGroup === 'mail' && canTestMail"
          class="cfg-test-btn"
          @click="openTestMailModal"
          :disabled="testing"
        >
          <FlaskConical :size="14" />
          {{ testing ? t('admin.msg_testing', 'Đang test...') : t('admin.msg_test_conn', 'Test kết nối') }}
        </button>


        <span v-if="hasChanges" class="unsaved-hint">{{ t('admin.msg_unsaved', 'Có thay đổi chưa lưu') }}</span>
      </div>

      <!-- Kết quả test -->
      <div v-if="testResult" class="test-result" :class="testResult.ok ? 'test-result--ok' : 'test-result--err'">
        <component :is="testResult.ok ? CheckCircle2 : XCircle" :size="15" />
        {{ testResult.message }}
      </div>
    </template>

    <!-- Modal nhập email nhận thử -->
    <div v-if="showTestModal" class="modal-overlay" @click.self="showTestModal = false">
      <div class="modal-box">
        <h4 class="modal-title"><FlaskConical :size="15" /> {{ t('admin.msg_send_test_email', 'Gửi email thử') }}</h4>
        <p class="modal-desc">Hệ thống sẽ dùng thông tin bạn đã nhập để gửi một email tới địa chỉ dưới đây.</p>
        <input
          v-model="testEmail"
          type="email"
          class="cfg-input"
          placeholder="email@example.com"
          @keydown.enter="confirmTestMail"
        />
        <div class="modal-actions">
          <button class="cfg-save-btn" @click="confirmTestMail" :disabled="!testEmail || testing">
            <Send :size="14" /> {{ testing ? t('admin.msg_sending', 'Đang gửi...') : t('admin.msg_send_test_email', 'Gửi email thử') }}
          </button>
          <button class="cfg-cancel-btn" @click="showTestModal = false">{{ t('admin.msg_9daba04f', 'Huỷ') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'
import {
  CONFIG_SCHEMA,
  detectCurrentService,
  getFieldKeys,
} from '../composables/useSystemConfigSchema.js'
import {
  Cog, Save, Loader2, Mail, MessageSquare,
  CheckCircle2, XCircle, Eye, EyeOff, FlaskConical, Send, AlertTriangle,
} from 'lucide-vue-next'

const { t, formatCurrency } = useI18n()
const { showToast } = useToast()

// ─── Icon map per group ───────────────────────────────────────────────────────
const groupIcons = { mail: Mail, sms: MessageSquare }

// ─── State ────────────────────────────────────────────────────────────────────
const activeGroup    = ref('mail')
const selectedService = ref(null)
const formValues     = ref({})       // { [key]: value }  — tất cả values đang edit
const dbValues       = ref({})       // { [key]: value }  — values gốc từ DB
const showPassword   = ref({})       // { [key]: bool }   — toggle hiện password
const loading        = ref(false)
const saving         = ref(false)
const testing        = ref(false)
const hasChanges     = ref(false)
const testResult     = ref(null)    // { ok: bool, message: string }
const showTestModal  = ref(false)
const testEmail      = ref('')

// ─── Computed ─────────────────────────────────────────────────────────────────
const currentSchema  = computed(() => CONFIG_SCHEMA[activeGroup.value])
const currentService = computed(() => currentSchema.value?.services[selectedService.value])
const currentFields  = computed(() => currentService.value?.fields ?? [])

// Mail drivers có thể gửi test (trừ 'log' vì không thật)
const TESTABLE_MAIL_DRIVERS = ['smtp', 'ses', 'mailgun', 'sendgrid']
const canTestMail = computed(() => TESTABLE_MAIL_DRIVERS.includes(selectedService.value))

// Cảnh báo: group chưa có driver key nào trong DB (chưa từng lưu config)
const isUnconfigured = computed(() => {
  const driverKey = currentSchema.value?.driverKey
  return !driverKey || !dbValues.value[driverKey]
})

// ─── Load configs từ API ──────────────────────────────────────────────────────
async function loadGroup(group) {
  loading.value = true
  try {
    const res  = await apiFetch(`/system-config/group/${group}`)
    const data = await res.json()
    const rows = Array.isArray(data) ? data : (data?.data ?? [])

    // Chuyển array [{key, value}] → object { key: value }
    const values = {}
    rows.forEach(r => { values[r.key] = r.value })
    dbValues.value  = values
    formValues.value = { ...values }
    hasChanges.value = false

    // Tự nhận diện service đang dùng
    const detected = detectCurrentService(group, values)
    selectedService.value = detected
  } catch (e) {
    console.error('Load config error:', e)
  } finally {
    loading.value = false
  }
}

// ─── Đổi group tab ────────────────────────────────────────────────────────────
function switchGroup(group) {
  if (activeGroup.value === group) return
  activeGroup.value = group
  testResult.value  = null
  loadGroup(group)
}

// ─── Chọn service ─────────────────────────────────────────────────────────────
function selectService(svcKey) {
  selectedService.value = svcKey
  // Ghi driver key vào formValues
  const driverKey = currentSchema.value.driverKey
  setValue(driverKey, svcKey)
}

// ─── Cập nhật giá trị field ───────────────────────────────────────────────────
function setValue(key, value) {
  formValues.value[key] = value
  hasChanges.value = true
}

// ─── Toggle hiện/ẩn password ─────────────────────────────────────────────────
function togglePassword(key) {
  showPassword.value[key] = !showPassword.value[key]
}

// ─── Lưu ─────────────────────────────────────────────────────────────────────
async function saveAll() {
  saving.value = true
  try {
    const schema    = currentSchema.value
    const driverKey = schema.driverKey
    const fields    = currentFields.value

    // Tập hợp keys cần lưu: driver key + tất cả fields của service đang chọn
    const keysToSave = [driverKey, ...fields.map(f => f.key)]
    const items = keysToSave
      .filter(k => k && formValues.value[k] !== undefined)
      .map(k => ({ key: k, value: String(formValues.value[k] ?? '') }))

    const res = await apiFetch(`/system-config/group/${activeGroup.value}`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })

    if (!res.ok) throw new Error('Save failed')

    // Cập nhật dbValues để track changes tiếp theo
    items.forEach(i => { dbValues.value[i.key] = i.value })
    hasChanges.value = false
    showToast('Đã lưu cấu hình', 'success')
  } catch (e) {
    showToast(t('admin.msg_aaf377aa', 'Lỗi') + ' ' + t('admin.msg_d6a0f5f4', 'khi lưu cấu hình'), 'error')
  } finally {
    saving.value = false
  }
}

// ─── Test mail ────────────────────────────────────────────────────────────────
function openTestMailModal() {
  testResult.value = null
  showTestModal.value = true
}

async function confirmTestMail() {
  if (!testEmail.value) return
  showTestModal.value = false
  testing.value = true
  testResult.value = null
  try {
    const payload = {
      mail_driver: selectedService.value,
      test_email:  testEmail.value,
      ...formValues.value,
    }
    const res  = await apiFetch('/system-config/test-mail', { method: 'POST', body: JSON.stringify(payload) })
    const data = await res.json()
    testResult.value = { ok: res.ok, message: data.message ?? (res.ok ? t('admin.success', 'Thành công') : t('admin.msg_failed', 'Thất bại')) }
  } catch (e) {
    testResult.value = { ok: false, message: t('admin.msg_conn_error', 'Lỗi kết nối tới server') }
  } finally {
    testing.value = false
  }
}


// ─── Init ─────────────────────────────────────────────────────────────────────
onMounted(() => loadGroup(activeGroup.value))
</script>

<style scoped>
.sys-config { margin-top: 0; }

/* ── Title ── */
.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; margin: 0 0 16px; color: var(--color-text-primary);
}

/* ── Group tabs ── */
.config-groups {
  display: flex; gap: 6px; margin-bottom: 12px; flex-wrap: wrap;
}
.config-group-btn {
  display: flex; align-items: center; gap: 6px;
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 8px; padding: 8px 16px; color: var(--color-text-muted);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.config-group-btn:hover { background: var(--color-bg-card-hover); }
.config-group-btn.active {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
  background: var(--color-accent-glow);
}

/* ── Warning banner ── */
.config-warning {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 12px 16px; border-radius: 8px; margin-bottom: 14px;
  background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.35);
  color: #d97706; font-size: 13px; line-height: 1.5;
}
.config-warning code {
  background: rgba(245,158,11,0.15); padding: 1px 5px;
  border-radius: 4px; font-size: 11px; font-family: monospace;
}

/* ── Group description ── */
.group-desc {
  font-size: 13px; color: var(--color-text-muted);
  margin: 0 0 16px; line-height: 1.5;
}

/* ── Service cards ── */
.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  margin-bottom: 24px;
}
.service-card {
  position: relative;
  display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
  padding: 14px 16px; border-radius: 10px; text-align: left; cursor: pointer;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  transition: all 0.18s;
}
.service-card:hover {
  border-color: var(--color-border-hover);
  background: var(--color-bg-card-hover);
}
.service-card.active {
  border-color: var(--color-accent-primary);
  background: var(--color-accent-glow);
}
.service-card__name {
  font-size: 13px; font-weight: 700; color: var(--color-text-primary);
}
.service-card__desc {
  font-size: 11px; color: var(--color-text-muted); line-height: 1.4;
}
.service-card__check {
  position: absolute; top: 10px; right: 10px;
  color: var(--color-accent-primary);
}

/* ── Config form ── */
.config-form {
  display: flex; flex-direction: column; gap: 20px;
  padding: 20px; border-radius: 12px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  margin-bottom: 16px;
}

.config-field__label-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 4px;
}
.config-field__label {
  font-size: 13px; font-weight: 700; color: var(--color-text-primary);
  display: flex; align-items: center; gap: 6px;
}
.config-field__key {
  font-size: 10px; color: var(--color-text-muted);
  background: var(--color-bg-card-solid); padding: 2px 6px;
  border-radius: 4px; font-family: monospace;
}
.config-field__desc {
  font-size: 12px; color: var(--color-text-muted);
  margin: 0 0 8px; line-height: 1.5;
}

/* badges */
.badge-required {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px;
  background: rgba(239,68,68,0.12); color: #ef4444;
}
.badge-optional {
  font-size: 10px; font-weight: 600; padding: 2px 7px; border-radius: 20px;
  background: var(--color-bg-card-solid); color: var(--color-text-muted);
}

/* ── Inputs ── */
.cfg-input {
  width: 100%; background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 8px; color: var(--color-text-primary); padding: 9px 12px; font-size: 13px;
  transition: border-color 0.2s; box-sizing: border-box;
}
.cfg-input:focus { outline: none; border-color: var(--color-accent-primary); }
.cfg-input::placeholder { color: var(--color-text-muted); }
.cfg-input--select { cursor: pointer; }
.cfg-input option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }

/* password wrapper */
.input-wrap { position: relative; }
.input-wrap .cfg-input { padding-right: 40px; }
.toggle-pw {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  background: none; border: none; cursor: pointer; color: var(--color-text-muted);
  padding: 0; display: flex; align-items: center;
}
.toggle-pw:hover { color: var(--color-text-primary); }

/* ── No-fields note ── */
.no-fields-note {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-radius: 10px; margin-bottom: 16px;
  background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.25);
  color: #10b981; font-size: 13px;
}

/* ── Actions ── */
.config-actions {
  display: flex; align-items: center; gap: 12px;
  padding-top: 4px;
}
.cfg-save-btn {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  box-shadow: var(--accent-shadow); transition: all 0.2s;
}
.cfg-save-btn:hover:not(:disabled) { transform: translateY(-1px); }
.cfg-save-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.unsaved-hint {
  font-size: 12px; color: var(--color-text-muted); font-style: italic;
}

/* ── Test button ── */
.cfg-test-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; transition: all 0.2s;
  background: transparent; border: 1px solid var(--color-accent-primary);
  color: var(--color-accent-primary);
}
.cfg-test-btn:hover:not(:disabled) {
  background: var(--color-accent-glow); transform: translateY(-1px);
}
.cfg-test-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Test result ── */
.test-result {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-top: 12px;
  line-height: 1.5;
}
.test-result--ok {
  background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.3);
  color: #10b981;
}
.test-result--err {
  background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3);
  color: #ef4444;
}

/* ── Modal ── */
.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 1000;
}
.modal-box {
  background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 14px; padding: 28px; width: 420px; max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}
.modal-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; font-weight: 700; color: var(--color-text-primary);
  margin: 0 0 8px;
}
.modal-desc {
  font-size: 13px; color: var(--color-text-muted); margin: 0 0 16px; line-height: 1.5;
}
.modal-actions {
  display: flex; gap: 10px; margin-top: 16px;
}
.cfg-cancel-btn {
  padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600;
  cursor: pointer; background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border); color: var(--color-text-muted);
  transition: all 0.2s;
}
.cfg-cancel-btn:hover { border-color: var(--color-border-hover); color: var(--color-text-primary); }

/* ── Loading ── */
.loading-state {
  display: flex; align-items: center; gap: 8px;
  padding: 40px 20px; color: var(--color-text-muted);
  justify-content: center;
}
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
