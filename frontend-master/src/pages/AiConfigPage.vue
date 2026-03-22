<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">Cấu hình AI Toàn Hệ Thống</h1>
        <p class="page-subtitle">Quản lý API Key, Provider mặc định và theo dõi chi phí AI của các Tenant</p>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Đang tải dữ liệu...</p>
    </div>

    <div v-else class="content-grid">
      <!-- Cấu hình Provider & Model -->
      <div class="card config-card">
        <h2 class="card-title">Cấu hình Provider Mặc Định</h2>
        <form @submit.prevent="saveConfig" class="form-grid">
          
          <div class="form-group row-full">
            <label>AI Provider</label>
            <div class="provider-cards">
              <label 
                v-for="(provData, provKey) in availableModels" 
                :key="provKey"
                class="provider-card"
                :class="{ active: config.provider === provKey }"
              >
                <input type="radio" :value="provKey" v-model="config.provider" class="sr-only">
                <span class="provider-name">{{ provData.name }}</span>
                <span class="status-badge" :class="config.keys_configured[provKey] ? 'status-active' : 'status-inactive'">
                  {{ config.keys_configured[provKey] ? 'Đã có Key' : 'Chưa có Key' }}
                </span>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>Model (Mô hình)</label>
            <select v-model="config.model" class="form-input">
              <template v-if="currentProviderData">
                <option v-for="(modData, modKey) in currentProviderData.models" :key="modKey" :value="modKey">
                  {{ modData.label }} ({{ modData.cost }})
                </option>
              </template>
            </select>
          </div>

          <div class="form-group">
            <label>{{ currentProviderData?.key_label || 'API Key' }}</label>
            <div class="input-with-button">
              <input 
                v-model="apiKeyInput" 
                type="password" 
                class="form-input" 
                :placeholder="config.keys_configured[config.provider] ? 'Đã cấu hình (Nhập để đổi)' : 'Nhập API key...'" 
              />
              <a v-if="currentProviderData?.key_url" :href="currentProviderData.key_url" target="_blank" class="btn btn-outline btn-sm">Lấy Key</a>
            </div>
          </div>

          <div class="form-actions row-full">
            <button type="submit" class="btn btn-primary" :disabled="saving">
              {{ saving ? 'Đang lưu...' : 'Lưu Cấu Hình' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Thống kê tổng quan -->
      <div class="card stats-card">
        <div class="card-header">
          <h2 class="card-title">Sử dụng AI (Tháng này)</h2>
          <button @click="loadUsage" class="btn btn-sm btn-outline" :disabled="usageLoading">Làm mới</button>
        </div>
        
        <div v-if="usageLoading" class="min-loading">Đang tải...</div>
        <div v-else-if="usage">
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-label">Tổng Requests</span>
              <span class="stat-value">{{ usage.totals?.total_requests || 0 }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Tổng Tokens</span>
              <span class="stat-value text-primary">{{ formatTokens(usage.totals?.total_tokens) }}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">Ước tính Chi phí</span>
              <span class="stat-value text-danger">{{ formatCost(usage.totals?.total_cost) }}</span>
            </div>
          </div>

          <div class="usage-tables">
            <div class="usage-table-wrapper">
              <h3 class="table-title">Theo Tenant (Top 5)</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tenant ID</th>
                    <th class="text-right">Requests</th>
                    <th class="text-right">Tokens</th>
                    <th class="text-right">Chi phí</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="t in (usage.by_tenant || []).slice(0, 5)" :key="t.tenant_id">
                    <td><code>{{ t.tenant_id }}</code></td>
                    <td class="text-right">{{ t.requests }}</td>
                    <td class="text-right">{{ formatTokens(t.tokens) }}</td>
                    <td class="text-right text-danger">{{ formatCost(t.cost) }}</td>
                  </tr>
                  <tr v-if="!usage.by_tenant?.length">
                    <td colspan="4" class="text-center text-muted">Chưa có dữ liệu</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="usage-table-wrapper mt-4">
              <h3 class="table-title">Theo Chức năng</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Tác vụ</th>
                    <th class="text-right">Requests</th>
                    <th class="text-right">Tokens</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="a in usage.by_action || []" :key="a.action">
                    <td><span class="badge">{{ a.action }}</span></td>
                    <td class="text-right">{{ a.requests }}</td>
                    <td class="text-right">{{ formatTokens(a.tokens) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { api } from '../services/api'

const loading = ref(true)
const saving = ref(false)
const usageLoading = ref(false)

const config = ref({
  provider: 'gemini',
  model: 'gemini-2.0-flash',
  keys_configured: {}
})
const availableModels = ref({})
const apiKeyInput = ref('')
const usage = ref(null)

const currentProviderData = computed(() => {
  return availableModels.value[config.value.provider] || null
})

// Tự động đổi model mặc định khi đổi provider
watch(() => config.value.provider, (newProv) => {
  if (availableModels.value[newProv]) {
    const models = Object.keys(availableModels.value[newProv].models)
    if (!models.includes(config.value.model)) {
      config.value.model = models[0]
    }
  }
})

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/ai-config')
    config.value = {
      provider: res.provider,
      model: res.model,
      keys_configured: res.keys_configured || {}
    }
    availableModels.value = res.available_models
    await loadUsage()
  } catch (e) {
    alert('Lỗi tải cấu hình AI: ' + e.message)
  }
  loading.value = false
}

async function loadUsage() {
  usageLoading.value = true
  try {
    usage.value = await api.get('/ai-config/usage')
  } catch (e) {
    console.error('Lỗi tải thống kê', e)
  }
  usageLoading.value = false
}

async function saveConfig() {
  saving.value = true
  try {
    const payload = {
      provider: config.value.provider,
      model: config.value.model,
    }
    if (apiKeyInput.value) {
      payload.api_key = apiKeyInput.value
    }
    
    await api.put('/ai-config', payload)
    apiKeyInput.value = ''
    alert('Lưu cấu hình thành công!')
    await loadData()
  } catch (e) {
    alert('Lỗi lưu cấu hình: ' + e.message)
  }
  saving.value = false
}

function formatTokens(t) {
  if (!t) return '0'
  if (t > 1000000) return (t/1000000).toFixed(2) + 'M'
  if (t > 1000) return (t/1000).toFixed(1) + 'K'
  return t
}

function formatCost(c) {
  if (!c) return '$0.00'
  return '$' + Number(c).toFixed(4)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 1024px) {
  .content-grid { grid-template-columns: 1fr; }
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.row-full { grid-column: 1 / -1; }

.provider-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.provider-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}
.provider-card:hover { border-color: var(--primary-light); }
.provider-card.active {
  border-color: var(--primary-color);
  background: var(--bg-soft);
}
.provider-name { font-weight: 600; font-size: 15px; }
.status-badge { font-size: 11px; padding: 3px 8px; border-radius: 12px; display: inline-block; width: fit-content; }
.status-active { background: #dcfce7; color: #166534; }
.status-inactive { background: #fee2e2; color: #991b1b; }

.input-with-button { display: flex; gap: 8px; }

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}
.stat-box {
  background: var(--bg-soft);
  padding: 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.stat-label { font-size: 12px; color: var(--text-muted); text-transform: uppercase; font-weight: 600; }
.stat-value { font-size: 24px; font-weight: 800; }
.text-primary { color: var(--primary-color); }
.text-danger { color: #dc2626; }

/* Tables */
.table-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: var(--text-secondary); }
.badge { background: #f3f4f6; padding: 3px 8px; border-radius: 4px; font-size: 12px; color: #4b5563; }
.mt-4 { margin-top: 24px; }
.min-loading { padding: 40px; text-align: center; color: var(--text-muted); }
</style>
