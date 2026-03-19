<template>
  <div class="sys-config">
    <h3 class="section-title"><Cog :size="16" /> Cấu hình hệ thống</h3>

    <!-- Group selector -->
    <div class="config-groups">
      <button
        v-for="g in groups"
        :key="g.key"
        class="config-group-btn"
        :class="{ active: activeGroup === g.key }"
        @click="activeGroup = g.key"
      >
        <component :is="g.icon" :size="14" />
        {{ g.label }}
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> Đang tải...
    </div>

    <!-- Config items -->
    <div v-else class="config-list">
      <div v-if="configs.length === 0" class="empty-state">
        <Database :size="36" />
        <p>Chưa có cấu hình nào</p>
        <small>Thêm cấu hình mới bên dưới</small>
      </div>

      <div v-for="item in configs" :key="item.key" class="config-item">
        <div class="config-item__info">
          <label class="config-item__key">{{ item.key }}</label>
          <small class="config-item__desc" v-if="configDescriptions[item.key]">{{ configDescriptions[item.key] }}</small>
        </div>
        <div class="config-item__value">
          <select
            v-if="configOptions[item.key]"
            :value="item.value"
            @change="updateConfig(item.key, $event.target.value)"
            class="cfg-input cfg-input--select"
          >
            <option v-for="opt in configOptions[item.key]" :key="opt" :value="opt">{{ opt }}</option>
          </select>
          <input
            v-else
            :value="item.value"
            @change="updateConfig(item.key, $event.target.value)"
            class="cfg-input"
            :type="isNumber(item.value) ? 'number' : 'text'"
          />
        </div>
      </div>

      <!-- Add new config -->
      <div class="config-add-row">
        <input v-model="newKey" placeholder="config_key" class="cfg-input cfg-input--key" />
        <input v-model="newValue" placeholder="value" class="cfg-input cfg-input--val" />
        <button class="cfg-add-btn" @click="addConfig" :disabled="!newKey">
          <Plus :size="14" /> Thêm
        </button>
      </div>
    </div>

    <!-- Save All -->
    <div class="config-actions" v-if="hasChanges">
      <button class="cfg-save-btn" @click="saveAll" :disabled="saving">
        <Save :size="14" /> {{ saving ? t('admin.saving', 'Đang lưu...') : 'Lưu thay đổi' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Cog, Database, Plus, Save, Loader2, Server, Mail, ListTodo, Settings } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()

const { showToast } = useToast()

const groups = [
  { key: 'general', label: 'Chung', icon: Settings },
  { key: 'cache', label: 'Cache', icon: Database },
  { key: 'mail', label: 'Mail', icon: Mail },
  { key: 'queue', label: 'Queue', icon: ListTodo },
]

const activeGroup = ref('general')
const configs = ref([])
const loading = ref(false)
const saving = ref(false)
const hasChanges = ref(false)
const newKey = ref('')
const newValue = ref('')
const pendingChanges = ref({})

// Descriptions for common config keys
const configDescriptions = {
  site_name: 'Tên website hiển thị',
  site_email: 'Email liên hệ chính',
  timezone: 'Múi giờ hệ thống',
  cache_driver: 'Driver lưu cache (database, redis, file)',
  cache_ttl: 'Thời gian cache tồn tại (giây)',
  mail_driver: 'Phương thức gửi mail (smtp, ses, log)',
  mail_host: 'SMTP host',
  mail_port: 'SMTP port',
  mail_from: 'Email gửi mặc định',
  queue_driver: 'Driver xử lý queue (database, redis, sync)',
  queue_retry_after: 'Thời gian retry (giây)',
}

const configOptions = {
  cache_driver: ['database', 'redis', 'file', 'array'],
  mail_driver: ['smtp', 'ses', 'mailgun', 'log', 'array'],
  queue_driver: ['database', 'redis', 'sync', 'sqs'],
}

async function loadConfigs() {
  loading.value = true
  try {
    const res = await apiFetch(`/system-config/group/${activeGroup.value}`)
    const data = await res.json()  // [{id, key, group_name, value}, ...]
    configs.value = Array.isArray(data) ? data : (data?.data || [])
    pendingChanges.value = {}
    hasChanges.value = false
  } catch (e) {
    console.error('Load config error:', e)
    configs.value = []
  } finally {
    loading.value = false
  }
}

function updateConfig(key, value) {
  const item = configs.value.find(c => c.key === key)
  if (item) item.value = value
  pendingChanges.value[key] = value
  hasChanges.value = true
}

async function saveAll() {
  saving.value = true
  try {
    // Backend updateGroup expects: {items: [{key, value}, ...]}
    const items = Object.entries(pendingChanges.value).map(([key, value]) => ({ key, value: String(value ?? '') }))
    const res = await apiFetch(`/system-config/group/${activeGroup.value}`, {
      method: 'PUT',
      body: JSON.stringify({ items }),
    })
    if (!res.ok) throw new Error('Save failed')
    showToast('Đã lưu cấu hình', 'success')
    hasChanges.value = false
    pendingChanges.value = {}
  } catch (e) {
    showToast('Lỗi lưu cấu hình', 'error')
  } finally {
    saving.value = false
  }
}

async function addConfig() {
  if (!newKey.value) return
  try {
    // Backend store expects: {items: [{key, value, group_name}]}
    const res = await apiFetch('/system-config', {
      method: 'POST',
      body: JSON.stringify({ items: [{ key: newKey.value, value: newValue.value, group_name: activeGroup.value }] }),
    })
    if (!res.ok) throw new Error('Add failed')
    showToast('Đã thêm cấu hình', 'success')
    newKey.value = ''
    newValue.value = ''
    loadConfigs()
  } catch (e) {
    showToast('Lỗi thêm cấu hình', 'error')
  }
}

function isNumber(val) {
  return !isNaN(val) && val !== '' && val !== null
}

watch(activeGroup, () => loadConfigs())
onMounted(() => loadConfigs())
</script>

<style scoped>
.sys-config { margin-top: 0; }

.section-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 15px; margin: 0 0 16px; color: var(--color-text-primary);
}

.config-groups {
  display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap;
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

.config-list { display: flex; flex-direction: column; gap: 8px; }

.config-item {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 12px 16px; border-radius: 10px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  transition: all 0.2s;
}
.config-item:hover { border-color: var(--color-border-hover); }

.config-item__info { flex: 1; min-width: 0; }

.config-item__key {
  font-size: 13px; font-weight: 700;
  color: var(--color-text-primary); font-family: monospace;
}

.config-item__desc {
  display: block; font-size: 11px; color: var(--color-text-muted); margin-top: 2px;
}

.config-item__value { flex: 0 0 280px; }

.cfg-input {
  width: 100%; background: var(--color-bg-card-solid); border: 1px solid var(--color-border);
  border-radius: 8px; color: var(--color-text-primary); padding: 8px 12px; font-size: 13px;
  transition: border-color 0.2s;
}
.cfg-input:focus { outline: none; border-color: var(--color-accent-primary); }
.cfg-input::placeholder { color: var(--color-text-muted); }
.cfg-input option { background: var(--color-bg-card-solid); color: var(--color-text-primary); }
.cfg-input--select { cursor: pointer; }

.config-add-row {
  display: flex; gap: 8px; margin-top: 12px; padding-top: 12px;
  border-top: 1px solid var(--color-border);
}
.cfg-input--key { flex: 0 0 200px; }
.cfg-input--val { flex: 1; }

.cfg-add-btn {
  background: var(--accent-gradient); color: #fff; border: none;
  padding: 8px 18px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  white-space: nowrap; box-shadow: var(--accent-shadow); transition: all 0.2s;
}
.cfg-add-btn:hover { transform: translateY(-1px); }
.cfg-add-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

.config-actions {
  margin-top: 16px; padding-top: 16px;
  border-top: 1px solid var(--color-border);
  display: flex; justify-content: flex-end;
}

.cfg-save-btn {
  background: var(--color-success, #10b981); color: #fff; border: none;
  padding: 10px 24px; border-radius: 8px; font-weight: 700; font-size: 13px;
  cursor: pointer; display: inline-flex; align-items: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}
.cfg-save-btn:hover { transform: translateY(-1px); }
.cfg-save-btn:disabled { opacity: 0.6; cursor: wait; }

.loading-state, .empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px 20px; color: var(--color-text-muted); text-align: center;
}
.empty-state p { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state small { font-size: 12px; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
