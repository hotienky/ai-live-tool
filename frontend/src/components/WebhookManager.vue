<template>
  <div class="webhook-manager">
    <h3 class="section-title"><Webhook :size="16" /> Webhooks ({{ webhooks.length }})</h3>

    <!-- Add form -->
    <div class="webhook-add-row">
      <input v-model="newUrl" placeholder="https://your-server.com/webhook" class="wh-input wh-input--flex" />
      <select v-model="newEvent" class="wh-input wh-input--sm">
        <option value="hot_lead">Hot Lead</option>
        <option value="session.started">Session Started</option>
        <option value="session.ended">Session Ended</option>
        <option value="order.created">Order Created</option>
      </select>
      <button class="wh-add-btn" @click="addWebhook" :disabled="!newUrl">
        <Plus :size="14" /> Thêm
      </button>
    </div>

    <!-- List -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> Đang tải...
    </div>

    <div v-else-if="webhooks.length === 0" class="empty-state">
      <Globe :size="36" />
      <p>Chưa có webhook nào</p>
      <small>Webhook sẽ gửi POST request khi có sự kiện mới</small>
    </div>

    <div v-else class="webhook-list">
      <div v-for="wh in webhooks" :key="wh.id" class="webhook-item" :class="{ inactive: !wh.isActive && !wh.is_active }">
        <div class="webhook-info">
          <div class="webhook-url">
            <Globe :size="14" />
            <span>{{ wh.url }}</span>
          </div>
          <div class="webhook-meta">
            <span class="webhook-events">
              {{ formatEvents(wh.events) }}
            </span>
            <span v-if="wh.lastStatus || wh.last_status" class="webhook-status" :class="statusClass(wh.lastStatus || wh.last_status)">
              {{ wh.lastStatus || wh.last_status }}
            </span>
            <span v-if="wh.lastTriggeredAt || wh.last_triggered_at" class="webhook-time">
              <Clock :size="11" /> {{ formatTime(wh.lastTriggeredAt || wh.last_triggered_at) }}
            </span>
          </div>
        </div>
        <div class="webhook-actions">
          <label class="toggle-switch">
            <input type="checkbox" :checked="wh.isActive ?? wh.is_active" @change="toggleWebhook(wh)" />
            <span class="toggle-slider"></span>
          </label>
          <button class="wh-del-btn" @click="removeWebhook(wh.id)">
            <Trash2 :size="12" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { Webhook, Plus, Trash2, Globe, Clock, Loader2 } from 'lucide-vue-next'

const props = defineProps({
  shopId: { type: [Number, String], default: null }
})

const { showToast } = useToast()
const webhooks = ref([])
const loading = ref(false)
const newUrl = ref('')
const newEvent = ref('hot_lead')

async function loadWebhooks() {
  if (!props.shopId) return
  loading.value = true
  try {
    const res = await apiFetch(`/api/webhooks?shopId=${props.shopId}`)
    if (Array.isArray(res)) webhooks.value = res
  } catch (e) {
    console.error('Load webhooks error:', e)
  } finally {
    loading.value = false
  }
}

async function addWebhook() {
  if (!newUrl.value || !props.shopId) return
  try {
    const wh = await apiFetch('/api/webhooks', {
      method: 'POST',
      body: JSON.stringify({ shopId: props.shopId, url: newUrl.value, events: [newEvent.value] })
    })
    if (wh) {
      webhooks.value.unshift(wh)
      newUrl.value = ''
      showToast('Đã thêm webhook', 'success')
    }
  } catch (e) {
    showToast('Lỗi thêm webhook', 'error')
  }
}

async function toggleWebhook(wh) {
  try {
    const active = !(wh.isActive ?? wh.is_active)
    await apiFetch(`/api/webhooks/${wh.id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive: active })
    })
    wh.isActive = active
    wh.is_active = active
  } catch (e) {
    showToast('Lỗi cập nhật', 'error')
  }
}

async function removeWebhook(id) {
  if (!confirm('Xóa webhook này?')) return
  try {
    await apiFetch(`/api/webhooks/${id}`, { method: 'DELETE' })
    webhooks.value = webhooks.value.filter(w => w.id !== id)
    showToast('Đã xóa webhook', 'success')
  } catch (e) {
    showToast('Lỗi xóa', 'error')
  }
}

function formatEvents(events) {
  if (typeof events === 'string') {
    try { events = JSON.parse(events) } catch { return events }
  }
  if (Array.isArray(events)) return events.join(', ')
  return String(events)
}

function statusClass(status) {
  if (!status) return ''
  if (status >= 200 && status < 300) return 'status-ok'
  return 'status-err'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

watch(() => props.shopId, () => loadWebhooks())
onMounted(() => loadWebhooks())
</script>

<style scoped>
.webhook-manager { margin-top: 0; }

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  margin: 0 0 16px;
  color: var(--color-text-primary);
}

.webhook-add-row {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  align-items: center;
}

.wh-input {
  background: var(--color-bg-card-solid);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 8px);
  color: var(--color-text-primary);
  padding: 9px 14px;
  font-size: 13px;
  transition: border-color 0.2s;
}

.wh-input:focus {
  outline: none;
  border-color: var(--color-accent-primary);
}

.wh-input::placeholder {
  color: var(--color-text-muted);
}

.wh-input option {
  background: var(--color-bg-card-solid);
  color: var(--color-text-primary);
}

.wh-input--flex { flex: 1; }
.wh-input--sm { width: 160px; }

.wh-add-btn {
  background: var(--accent-gradient);
  color: #fff;
  border: none;
  padding: 9px 18px;
  border-radius: var(--radius-sm, 8px);
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  box-shadow: var(--accent-shadow);
  transition: all 0.2s;
}

.wh-add-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.35);
}

.wh-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.wh-del-btn {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm, 8px);
  padding: 4px 6px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.15s;
}

.wh-del-btn:hover {
  color: var(--color-accent-hot);
  border-color: var(--color-accent-hot);
  background: var(--color-accent-hot-glow);
}

.loading-state, .empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 40px 20px;
  color: var(--color-text-muted);
  text-align: center;
}

.empty-state p { font-size: 14px; font-weight: 600; color: var(--color-text-secondary); margin: 0; }
.empty-state small { font-size: 12px; }

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.webhook-list { display: flex; flex-direction: column; gap: 8px; }

.webhook-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-radius: var(--radius-md, 12px);
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  transition: all 0.2s;
}

.webhook-item:hover {
  border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}

.webhook-item.inactive { opacity: 0.45; }

.webhook-info { flex: 1; min-width: 0; }

.webhook-url {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.webhook-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 4px;
  font-size: 11px;
  color: var(--color-text-muted);
}

.webhook-events {
  background: rgba(124, 58, 237, 0.12);
  color: var(--accent-light, #a78bfa);
  padding: 2px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
}

.webhook-status {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 700;
}

.status-ok { background: var(--color-success-glow); color: var(--color-success); }
.status-err { background: var(--color-accent-hot-glow); color: var(--color-accent-hot); }

.webhook-time {
  display: flex;
  align-items: center;
  gap: 3px;
}

.webhook-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  width: 36px;
  height: 20px;
  cursor: pointer;
}

.toggle-switch input { display: none; }

.toggle-slider {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: var(--color-border);
  border-radius: 20px;
  transition: 0.25s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  left: 2px;
  bottom: 2px;
  background: var(--color-text-secondary);
  border-radius: 50%;
  transition: 0.25s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-accent-primary, #7c3aed);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(16px);
  background: white;
}
</style>
