<template>
  <div class="api-key-mgr">
    <h3 class="section-title"><KeyRound :size="16" /> API Keys ({{ apiKeys.length }})</h3>

    <!-- Generate new key -->
    <div class="key-add-row">
      <input v-model="newName" placeholder="Tên API key (ví dụ: Mobile App)" class="key-input key-input--flex" />
      <button class="key-gen-btn" @click="generateKey" :disabled="!newName || generating">
        <Plus :size="14" /> {{ generating ? 'Đang tạo...' : 'Tạo key' }}
      </button>
    </div>

    <!-- Newly generated key (show once) -->
    <div v-if="newlyGenerated" class="key-reveal">
      <div class="key-reveal__header">
        <ShieldCheck :size="16" /> API Key đã tạo — <strong>Lưu lại ngay, sẽ không hiển thị lại!</strong>
      </div>
      <div class="key-reveal__token">
        <code>{{ newlyGenerated }}</code>
        <button class="key-copy-btn" @click="copyKey(newlyGenerated)">
          <Copy :size="12" /> Copy
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <Loader2 :size="20" class="spin" /> Đang tải...
    </div>

    <!-- Empty -->
    <div v-else-if="apiKeys.length === 0" class="empty-state">
      <KeyRound :size="36" />
      <p>Chưa có API key nào</p>
      <small>Tạo API key để tích hợp với hệ thống bên ngoài</small>
    </div>

    <!-- List -->
    <div v-else class="key-list">
      <div v-for="key in apiKeys" :key="key.id" class="key-item" :class="{ revoked: key.status === 'revoked' }">
        <div class="key-item__info">
          <div class="key-item__name">
            <KeyRound :size="13" />
            <span>{{ key.name }}</span>
            <span class="key-item__status" :class="'status--' + key.status">{{ key.status }}</span>
          </div>
          <div class="key-item__meta">
            <code class="key-item__preview">{{ key.keyPreview || key.key_preview || '••••••••' }}</code>
            <span class="key-item__date">
              <Clock :size="11" /> {{ formatDate(key.createdAt || key.created_at) }}
            </span>
            <span v-if="key.lastUsedAt || key.last_used_at" class="key-item__used">
              Dùng lần cuối: {{ formatDate(key.lastUsedAt || key.last_used_at) }}
            </span>
          </div>
        </div>
        <div class="key-item__actions">
          <button
            v-if="key.status === 'active'"
            class="key-action-btn key-action-btn--revoke"
            @click="revokeKey(key.id)"
            title="Thu hồi"
          >
            <Ban :size="13" /> Thu hồi
          </button>
          <button class="key-action-btn key-action-btn--delete" @click="deleteKey(key.id)" title="Xóa">
            <Trash2 :size="13" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { KeyRound, Plus, Copy, ShieldCheck, Clock, Ban, Trash2, Loader2 } from 'lucide-vue-next'

const { showToast } = useToast()
const apiKeys = ref([])
const loading = ref(false)
const generating = ref(false)
const newName = ref('')
const newlyGenerated = ref('')

async function loadKeys() {
  loading.value = true
  try {
    const res = await apiFetch('/api-keys')
    apiKeys.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    console.error('Load API keys error:', e)
  } finally {
    loading.value = false
  }
}

async function generateKey() {
  if (!newName.value) return
  generating.value = true
  try {
    const res = await apiFetch('/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: newName.value }),
    })
    if (res?.key) {
      newlyGenerated.value = res.key
      showToast('API key đã tạo thành công', 'success')
      newName.value = ''
      loadKeys()
    }
  } catch (e) {
    showToast('Lỗi tạo API key', 'error')
  } finally {
    generating.value = false
  }
}

async function revokeKey(id) {
  if (!confirm('Thu hồi API key này? Key sẽ không thể sử dụng nữa.')) return
  try {
    await apiFetch(`/api-keys/${id}/revoke`, { method: 'PUT' })
    const key = apiKeys.value.find(k => k.id === id)
    if (key) key.status = 'revoked'
    showToast('Đã thu hồi API key', 'success')
  } catch (e) {
    showToast('Lỗi thu hồi', 'error')
  }
}

async function deleteKey(id) {
  if (!confirm('Xóa API key này vĩnh viễn?')) return
  try {
    await apiFetch(`/api-keys/${id}`, { method: 'DELETE' })
    apiKeys.value = apiKeys.value.filter(k => k.id !== id)
    showToast('Đã xóa API key', 'success')
  } catch (e) {
    showToast('Lỗi xóa', 'error')
  }
}

function copyKey(key) {
  navigator.clipboard.writeText(key)
  showToast('Đã copy API key', 'success')
}

function formatDate(ts) {
  if (!ts) return ''
  return new Date(ts).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

onMounted(() => loadKeys())
</script>

<style scoped>
.api-key-mgr { margin-top: 0; }
.section-title { display:flex; align-items:center; gap:8px; font-size:15px; margin:0 0 16px; color:var(--color-text-primary); }

.key-add-row { display:flex; gap:8px; margin-bottom:16px; }
.key-input {
  background:var(--color-bg-card-solid); border:1px solid var(--color-border);
  border-radius:8px; color:var(--color-text-primary); padding:9px 14px; font-size:13px;
  transition:border-color 0.2s;
}
.key-input:focus { outline:none; border-color:var(--color-accent-primary); }
.key-input::placeholder { color:var(--color-text-muted); }
.key-input--flex { flex:1; }

.key-gen-btn {
  background:var(--accent-gradient); color:#fff; border:none;
  padding:9px 18px; border-radius:8px; font-weight:700; font-size:13px;
  cursor:pointer; display:inline-flex; align-items:center; gap:6px;
  white-space:nowrap; box-shadow:var(--accent-shadow); transition:all 0.2s;
}
.key-gen-btn:hover { transform:translateY(-1px); }
.key-gen-btn:disabled { opacity:0.5; cursor:not-allowed; transform:none; }

/* Reveal banner */
.key-reveal {
  margin-bottom:16px; padding:14px 16px; border-radius:10px;
  background:rgba(16,185,129,0.08); border:1px solid rgba(16,185,129,0.3);
  animation:slideDown 0.3s ease;
}
.key-reveal__header {
  display:flex; align-items:center; gap:6px; font-size:13px;
  color:var(--color-success,#10b981); margin-bottom:8px; font-weight:600;
}
.key-reveal__token {
  display:flex; align-items:center; gap:8px;
  background:var(--color-bg-card-solid); border-radius:6px; padding:8px 12px;
}
.key-reveal__token code {
  flex:1; font-size:12px; color:var(--color-text-primary); word-break:break-all;
}
.key-copy-btn {
  background:none; border:1px solid var(--color-border); border-radius:6px;
  padding:4px 10px; font-size:11px; font-weight:600; cursor:pointer;
  color:var(--color-text-muted); display:flex; align-items:center; gap:4px;
  transition:all 0.15s;
}
.key-copy-btn:hover { border-color:var(--color-accent-primary); color:var(--color-accent-primary); }

/* List */
.key-list { display:flex; flex-direction:column; gap:8px; }
.key-item {
  display:flex; align-items:center; justify-content:space-between; gap:12px;
  padding:14px 16px; border-radius:10px;
  background:var(--glass-bg); border:1px solid var(--glass-border);
  transition:all 0.2s;
}
.key-item:hover { border-color:var(--color-border-hover); box-shadow:var(--shadow-card); }
.key-item.revoked { opacity:0.45; }

.key-item__info { flex:1; min-width:0; }
.key-item__name { display:flex; align-items:center; gap:6px; font-size:13px; font-weight:700; color:var(--color-text-primary); }
.key-item__status {
  font-size:10px; padding:2px 8px; border-radius:6px; font-weight:700; text-transform:uppercase;
}
.status--active { background:rgba(16,185,129,0.12); color:#10b981; }
.status--revoked { background:rgba(239,68,68,0.12); color:#ef4444; }

.key-item__meta { display:flex; align-items:center; gap:10px; margin-top:4px; font-size:11px; color:var(--color-text-muted); flex-wrap:wrap; }
.key-item__preview {
  background:var(--color-bg-card-solid); padding:2px 8px; border-radius:4px;
  font-size:11px; font-family:monospace;
}
.key-item__date { display:flex; align-items:center; gap:3px; }

.key-item__actions { display:flex; gap:6px; }
.key-action-btn {
  background:none; border:1px solid var(--color-border); border-radius:8px;
  padding:6px 12px; font-size:11px; font-weight:600; cursor:pointer;
  display:flex; align-items:center; gap:4px; transition:all 0.15s;
  color:var(--color-text-muted);
}
.key-action-btn--revoke:hover { border-color:#f59e0b; color:#f59e0b; background:rgba(245,158,11,0.08); }
.key-action-btn--delete:hover { border-color:#ef4444; color:#ef4444; background:rgba(239,68,68,0.08); }

.loading-state,.empty-state {
  display:flex; flex-direction:column; align-items:center; gap:8px;
  padding:40px 20px; color:var(--color-text-muted); text-align:center;
}
.empty-state p { font-size:14px; font-weight:600; color:var(--color-text-secondary); margin:0; }
.empty-state small { font-size:12px; }
.spin { animation:spin 1s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes slideDown { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
</style>
