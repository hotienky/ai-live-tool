<template>
  <div class="p-6 lg:p-8">
    <!-- Back -->
    <router-link to="/tenants" class="mp-link mb-4 inline-block">← Quay lại danh sách</router-link>

    <div v-if="loading" class="text-center py-16 mp-text-muted">Đang tải...</div>

    <template v-else-if="tenant">
      <!-- Tenant Header -->
      <div class="card p-6 mb-6">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-primary-700/20 flex items-center justify-center border border-primary-500/20">
              <Building2 :size="28" class="text-primary-400" />
            </div>
            <div>
              <h1 class="text-xl font-bold mp-text-primary">{{ tenant.name }}</h1>
              <p class="text-sm mp-text-muted">{{ tenant.slug }}.domain.com</p>
            </div>
          </div>
          <span :class="statusClass(tenant.status)" class="text-sm">{{ tenant.status }}</span>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex items-center gap-6 border-b mb-6" style="border-color: var(--mp-border)">
        <button
          v-for="tab in ['overview', 'ai']"
          :key="tab"
          @click="activeTab = tab"
          class="pb-3 text-sm font-medium transition-colors relative"
          :class="activeTab === tab ? 'text-primary-500' : 'mp-text-muted hover:text-primary-400'"
        >
          {{ tab === 'overview' ? 'Tổng quan' : 'Dịch vụ AI' }}
          <div v-if="activeTab === tab" class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-t-full shadow-[0_-2px_8px_rgba(59,130,246,0.5)]"></div>
        </button>
      </div>

      <!-- TAB: OVERVIEW -->
      <div v-show="activeTab === 'overview'">
      <!-- Info Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- Details (read-only) -->
        <div class="card p-5">
          <h3 class="mp-section-title">Thông tin</h3>
          <dl class="space-y-3">
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Database</dt>
              <dd class="text-sm mp-text-primary font-mono">{{ tenant.db_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Owner</dt>
              <dd class="text-sm mp-text-primary">{{ tenant.owner_email }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Gói hiện tại</dt>
              <dd class="text-sm mp-text-primary capitalize">
                <span :class="planBadgeClass(tenant.plan)">{{ tenant.plan }}</span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-sm mp-text-muted">Ngày tạo</dt>
              <dd class="text-sm mp-text-primary">{{ formatDate(tenant.created_at) }}</dd>
            </div>
          </dl>
        </div>

        <!-- Stats -->
        <div class="card p-5">
          <h3 class="mp-section-title">Thống kê</h3>
          <div v-if="tenant.stats" class="grid grid-cols-3 gap-3">
            <div class="text-center p-3 rounded-lg mp-stat-card">
              <p class="text-xl font-bold mp-text-primary">{{ tenant.stats.users }}</p>
              <p class="text-xs mp-text-muted mt-1">Users</p>
            </div>
            <div class="text-center p-3 rounded-lg mp-stat-card">
              <p class="text-xl font-bold mp-text-primary">{{ tenant.stats.products }}</p>
              <p class="text-xs mp-text-muted mt-1">Products</p>
            </div>
            <div class="text-center p-3 rounded-lg mp-stat-card">
              <p class="text-xl font-bold mp-text-primary">{{ tenant.stats.orders }}</p>
              <p class="text-xs mp-text-muted mt-1">Orders</p>
            </div>
          </div>
          <p v-else class="text-sm mp-text-muted">Không có dữ liệu thống kê</p>
        </div>
      </div>

      <!-- AI Usage (Tháng này) -->
      <div class="card p-5 mb-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="mp-section-title !mb-0 flex items-center gap-2">
            <Sparkles :size="16" class="text-sky-500" /> Sử dụng AI (Tháng này)
          </h3>
          <button @click="loadAiUsage" class="text-xs btn-ghost border border-gray-300 dark:border-gray-600 py-1 px-3 rounded-lg" :disabled="aiUsageLoading">
            {{ aiUsageLoading ? 'Đang tải...' : 'Làm mới' }}
          </button>
        </div>

        <div v-if="aiUsageLoading" class="text-center py-6 mp-text-muted text-sm">Đang tải dữ liệu AI...</div>
        <div v-else-if="aiUsage && aiUsage.stats" class="space-y-4">
          <!-- Quick Stats -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
              <span class="text-[10px] uppercase font-semibold mp-text-muted block mb-1">Requests</span>
              <span class="text-lg font-bold mp-text-primary">{{ aiUsage.stats.totals?.total_requests || 0 }}</span>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
              <span class="text-[10px] uppercase font-semibold mp-text-muted block mb-1">Tokens</span>
              <span class="text-lg font-bold text-sky-500">{{ formatTokens(aiUsage.stats.totals?.total_tokens) }}</span>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
              <span class="text-[10px] uppercase font-semibold mp-text-muted block mb-1">Chi phí ước tính</span>
              <span class="text-lg font-bold text-red-500">{{ formatCost(aiUsage.stats.totals?.total_cost) }}</span>
            </div>
            <div class="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
              <span class="text-[10px] uppercase font-semibold mp-text-muted block mb-1">Dùng Key Chung</span>
              <span class="text-lg font-bold text-emerald-500">{{ getSystemKeyRequests(aiUsage.stats.by_key_mode) }} rq</span>
            </div>
          </div>

          <!-- Recent Logs -->
          <div class="overflow-x-auto border rounded-xl mt-3" style="border-color: var(--mp-border)">
            <table class="w-full text-xs">
              <thead class="bg-gray-50/50 dark:bg-gray-800/50">
                <tr>
                  <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Thời gian</th>
                  <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tác vụ</th>
                  <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Model</th>
                  <th class="text-left py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Mode</th>
                  <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Tokens</th>
                  <th class="text-right py-2 px-3 font-medium mp-text-muted border-b" style="border-color: var(--mp-border)">Chi phí</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="log in (aiUsage.recent || []).slice(0, 10)" :key="log.id" class="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" style="border-color: var(--mp-border)">
                  <td class="py-2 px-3 mp-text-secondary whitespace-nowrap">{{ formatDateTime(log.created_at) }}</td>
                  <td class="py-2 px-3">
                    <span class="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded text-[10px]">{{ log.action }}</span>
                  </td>
                  <td class="py-2 px-3 mp-text-primary">{{ log.model }}</td>
                  <td class="py-2 px-3">
                    <span :class="log.key_mode === 'system' ? 'text-emerald-500 bg-emerald-500/10' : 'text-amber-500 bg-amber-500/10'" class="px-1.5 py-0.5 rounded uppercase font-semibold text-[9px]">
                      {{ log.key_mode }}
                    </span>
                  </td>
                  <td class="py-2 px-3 text-right text-sky-500">{{ log.total_tokens }}</td>
                  <td class="py-2 px-3 text-right font-medium text-red-500">{{ formatCost(log.estimated_cost) }}</td>
                </tr>
                <tr v-if="!aiUsage.recent?.length">
                  <td colspan="6" class="py-6 text-center mp-text-muted text-sm">Chưa có lượt dùng AI nào gần đây.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="aiUsage.recent?.length > 10" class="text-center mt-2">
            <router-link to="/ai-config" class="text-xs text-sky-500 hover:text-sky-600 dark:hover:text-sky-400 hover:underline">Xem tất cả lịch sử trên Cấu hình AI →</router-link>
          </div>
        </div>
        <div v-else class="text-center py-6 mp-text-muted text-sm">Chưa có dữ liệu sử dụng AI trong tháng này</div>
      </div>
      </div> <!-- END TAB OVERVIEW -->

      <!-- TAB: AI SERVICES -->
      <div v-show="activeTab === 'ai'">
        <!-- Master Admin overrides Tenant AI setup -->
        <div class="card p-5 mb-6">
          <h3 class="mp-section-title flex items-center gap-2">
            <Settings :size="16" class="text-sky-500" /> Cấu hình API Key (Riêng cho Tenant này)
          </h3>
          <p class="text-xs mp-text-muted mb-4">Ghi đè cấu hình AI của khách hàng. Khi bật dùng key riêng, các chức năng AI sẽ sử dụng key này và không tính phí vào hệ thống.</p>
          
          <div v-if="aiSettingsLoading" class="text-xs mp-text-muted py-2">Đang tải cấu hình...</div>
          <div v-else class="max-w-xl">
            <div class="mb-4">
              <label class="mp-label">Chế độ Key</label>
              <select v-model="aiForm.key_mode" class="input w-full max-w-xs">
                <option value="system">Dùng chung (System Key)</option>
                <option value="own">Dùng riêng (Tenant Key)</option>
              </select>
            </div>

            <div v-if="aiForm.key_mode === 'own'" class="mb-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <label class="mp-label">API Key (OpenAI / Gemini / Anthropic)</label>
              <input v-model="aiForm.api_key" type="password" class="input w-full font-mono text-sm" :placeholder="aiSettings.has_own_key ? 'Đã cài đặt key (Bỏ trống giữ nguyên)' : 'Nhập API key...'" />
              <p class="text-[10px] mp-text-muted mt-1">Lưu ý: API Key sẽ được mã hóa trước khi lưu vào database của tenant này.</p>
            </div>

            <div class="flex items-center gap-3">
              <button @click="saveAiSettings" :disabled="aiSettingsSaving" class="btn-primary text-sm flex items-center gap-2" :class="{ 'opacity-50': aiSettingsSaving }">
                <Save :size="16" /> {{ aiSettingsSaving ? 'Đang lưu...' : 'Lưu cấu hình AI' }}
              </button>
              <span v-if="aiSettingsMsg" class="text-xs" :class="aiSettingsError ? 'text-red-400' : 'text-emerald-400'">{{ aiSettingsMsg }}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- END TAB AI SERVICES -->

      <!-- Edit Settings -->
      <div class="card p-5 mb-6">
        <h3 class="mp-section-title flex items-center gap-2">
          <Settings :size="16" class="text-primary-400" /> Cài đặt Tenant
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="mp-label">Tên Tenant</label>
            <input v-model="editForm.name" type="text" class="input w-full" />
          </div>
          <div>
            <label class="mp-label">Gói dùng</label>
            <select v-model="editForm.plan" class="input w-full">
              <option value="free">Free</option>
              <option value="starter">Starter</option>
              <option value="premium">Premium</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <div>
            <label class="mp-label flex items-center gap-1"><HardDrive :size="12" /> Storage Driver</label>
            <select v-model="editForm.storage_driver" class="input w-full">
              <option value="local">Local (mặc định)</option>
              <option value="s3">AWS S3</option>
              <option value="firebase">Firebase / Google Cloud Storage</option>
              <option value="vstorage">VNG vStorage</option>
            </select>
            <p class="text-[11px] mp-text-muted mt-1">Dịch vụ lưu trữ media cho tenant này</p>
          </div>
        </div>

        <!-- Cloud Storage Config (show when driver is not local) -->
        <div v-if="editForm.storage_driver && editForm.storage_driver !== 'local'" class="mt-4 p-4 rounded-lg border border-primary-500/20 bg-primary-500/5">
          <h4 class="text-sm font-semibold mb-3 flex items-center gap-1">
            <Settings :size="13" />
            Cấu hình {{ driverLabel(editForm.storage_driver) }}
          </h4>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="mp-label">Access Key</label>
              <input v-model="editForm.storage_config.key" class="input w-full" placeholder="AKIA..." />
            </div>
            <div>
              <label class="mp-label">Secret Key</label>
              <input v-model="editForm.storage_config.secret" type="password" class="input w-full" placeholder="******" />
            </div>
            <div>
              <label class="mp-label">Region</label>
              <input v-model="editForm.storage_config.region" class="input w-full" :placeholder="editForm.storage_driver === 'firebase' ? 'us-central1' : 'ap-southeast-1'" />
            </div>
            <div>
              <label class="mp-label">Bucket</label>
              <input v-model="editForm.storage_config.bucket" class="input w-full" placeholder="my-media-bucket" />
            </div>
            <div v-if="editForm.storage_driver !== 's3'">
              <label class="mp-label">Endpoint</label>
              <input v-model="editForm.storage_config.endpoint" class="input w-full" :placeholder="editForm.storage_driver === 'firebase' ? 'https://storage.googleapis.com' : 'https://hcm01.vstorage.vngcloud.vn'" />
            </div>
            <div>
              <label class="mp-label">CDN URL <span class="mp-text-muted">(tùy chọn)</span></label>
              <input v-model="editForm.storage_config.cdn_url" class="input w-full" placeholder="https://cdn.example.com" />
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3 mt-4">
          <button @click="handleSaveSettings" :disabled="actionLoading || !hasChanges" class="btn-primary text-sm flex items-center gap-2" :class="{ 'opacity-50 cursor-not-allowed': !hasChanges }">
            <Save :size="16" /> Lưu thay đổi
          </button>
          <span v-if="editMsg" class="text-sm" :class="editError ? 'text-red-400' : 'text-emerald-400'">{{ editMsg }}</span>
        </div>
      </div>

      <!-- Domain Management -->
      <div class="card p-5 mb-6">
        <h3 class="mp-section-title flex items-center gap-2">
          <Globe :size="16" class="text-primary-400" /> Quản lý Domain
        </h3>
        <p class="text-xs mp-text-muted mb-4">Gán tên miền riêng cho storefront hoặc CMS của tenant</p>

        <!-- Add Domain Form -->
        <div class="flex gap-2 mb-4">
          <input
            v-model="newDomain"
            type="text"
            class="input flex-1"
            placeholder="Nhập domain (vd: www.fashionvn.com)"
            @keyup.enter="handleAddDomain"
          />
          <select v-model="newDomainType" class="input" style="width: 140px">
            <option value="storefront">Storefront</option>
            <option value="cms">CMS</option>
          </select>
          <button
            @click="handleAddDomain"
            :disabled="!newDomain.trim() || domainLoading"
            class="btn-primary text-sm flex items-center gap-1 whitespace-nowrap"
            :class="{ 'opacity-50 cursor-not-allowed': !newDomain.trim() }"
          >
            <Plus :size="14" /> Thêm
          </button>
        </div>

        <!-- Domain List -->
        <div v-if="domainList.length > 0" class="space-y-2">
          <div
            v-for="d in domainList"
            :key="d.id"
            class="flex items-center justify-between p-3 rounded-lg"
            style="background: var(--mp-bg-input); border: 1px solid var(--mp-border)"
          >
            <div class="flex items-center gap-3">
              <Globe :size="14" class="mp-text-muted" />
              <div>
                <span class="text-sm font-medium mp-text-primary">{{ d.domain }}</span>
                <div class="flex items-center gap-2 mt-0.5">
                  <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                    :class="d.type === 'cms'
                      ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'"
                  >{{ d.type }}</span>
                  <span v-if="d.is_primary" class="text-[10px] text-amber-400">★ Primary</span>
                </div>
              </div>
            </div>
            <button
              @click="handleRemoveDomain(d)"
              :disabled="domainLoading"
              class="btn-icon text-red-400 hover:bg-red-500/10 hover:border-red-500/30 text-xs"
              title="Xóa domain"
            >
              <Trash2 :size="14" />
            </button>
          </div>
        </div>
        <div v-else class="text-center py-6 rounded-lg" style="background: var(--mp-bg-input); border: 1px dashed var(--mp-border)">
          <Globe :size="24" class="mx-auto mb-2 mp-text-muted opacity-40" />
          <p class="text-xs mp-text-muted">Chưa có domain nào được gán</p>
          <p class="text-[11px] mp-text-muted mt-1">Subdomain mặc định: <strong class="mp-text-secondary">{{ tenant?.slug }}.super.vn</strong></p>
        </div>

        <p v-if="domainMsg" class="mt-3 text-sm" :class="domainError ? 'text-red-400' : 'text-emerald-400'">{{ domainMsg }}</p>
      </div>

      <!-- Actions -->
      <div class="card p-5">
        <h3 class="mp-section-title">Thao tác</h3>
        <div class="flex flex-wrap gap-3">
          <button v-if="tenant.status === 'active'" @click="handleSuspend" :disabled="actionLoading" class="btn-ghost text-amber-400 border border-amber-500/20 flex items-center gap-2 text-sm">
            <Pause :size="16" /> Tạm dừng
          </button>
          <button v-else @click="handleActivate" :disabled="actionLoading" class="btn-ghost text-emerald-400 border border-emerald-500/20 flex items-center gap-2 text-sm">
            <Play :size="16" /> Kích hoạt
          </button>
          <button @click="handleMigrate" :disabled="actionLoading" class="btn-ghost text-primary-400 border border-primary-500/20 flex items-center gap-2 text-sm">
            <Database :size="16" /> Chạy Migration
          </button>
          <button @click="handleSeed" :disabled="actionLoading" class="btn-ghost text-cyan-400 border border-cyan-500/20 flex items-center gap-2 text-sm">
            <Sprout :size="16" /> Seed Data
          </button>
          <button @click="handleDelete" :disabled="actionLoading" class="btn-danger text-sm flex items-center gap-2">
            <Trash2 :size="16" /> Xóa vĩnh viễn
          </button>
        </div>
        <p v-if="actionMsg" class="mt-3 text-sm" :class="actionError ? 'text-red-400' : 'text-emerald-400'">{{ actionMsg }}</p>
      </div>
    </template>

    <div v-else class="text-center py-16 mp-text-muted">Không tìm thấy tenant</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Building2, Pause, Play, Database, Sprout, Trash2, Settings, Save, Globe, Plus, HardDrive, Sparkles } from 'lucide-vue-next'
import { api, tenants, domains } from '../services/api.js'

const route = useRoute()
const router = useRouter()
const activeTab = ref('overview')
const tenant = ref(null)
const loading = ref(true)
const actionLoading = ref(false)
const actionMsg = ref('')
const actionError = ref(false)

const editForm = ref({
  name: '', plan: '',
  storage_driver: 'local',
  storage_config: { key: '', secret: '', region: '', bucket: '', endpoint: '', cdn_url: '' },
})
const editMsg = ref('')
const editError = ref(false)

const hasChanges = computed(() => {
  if (!tenant.value) return false
  return editForm.value.name !== tenant.value.name
    || editForm.value.plan !== tenant.value.plan

    || editForm.value.storage_driver !== (tenant.value.storage_driver || 'local')
    || JSON.stringify(editForm.value.storage_config) !== JSON.stringify(tenant.value.storage_config || {})
})

function syncEditForm() {
  if (tenant.value) {
    const sc = tenant.value.storage_config || {}
    editForm.value = {
      name: tenant.value.name || '',
      plan: tenant.value.plan || 'free',

      storage_driver: tenant.value.storage_driver || 'local',
      storage_config: {
        key: sc.key || '',
        secret: sc.secret || '',
        region: sc.region || '',
        bucket: sc.bucket || '',
        endpoint: sc.endpoint || '',
        cdn_url: sc.cdn_url || '',
      },
    }
  }
}

function driverLabel(driver) {
  const labels = { s3: 'AWS S3', firebase: 'Firebase', vstorage: 'VNG vStorage' }
  return labels[driver] || driver
}

watch(tenant, syncEditForm)



function planBadgeClass(plan) {
  const base = 'px-2.5 py-0.5 rounded-full text-xs font-medium'
  if (plan === 'enterprise') return `${base} bg-amber-500/15 text-amber-400 border border-amber-500/20`
  if (plan === 'pro') return `${base} bg-primary-500/15 text-primary-400 border border-primary-500/20`
  if (plan === 'starter') return `${base} bg-cyan-500/15 text-cyan-400 border border-cyan-500/20`
  return `${base} mp-stat-card mp-text-secondary`
}

async function handleSaveSettings() {
  editMsg.value = ''
  editError.value = false
  actionLoading.value = true
  try {
    await tenants.update(route.params.id, editForm.value)
    editMsg.value = 'Đã lưu thành công'
    await load()
  } catch (err) {
    editMsg.value = err.message
    editError.value = true
  } finally {
    actionLoading.value = false
  }
}

function statusClass(status) {
  if (status === 'active') return 'badge-active'
  if (status === 'suspended') return 'badge-suspended'
  return 'badge-trial'
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  try {
    tenant.value = await tenants.get(route.params.id)
    await Promise.all([
      loadDomains(),
      loadAiUsage(),
      loadAiSettings()
    ])
  } catch {
    tenant.value = null
  } finally {
    loading.value = false
  }
}

// ──── AI Usage ────
const aiUsage = ref(null)
const aiUsageLoading = ref(false)

async function loadAiUsage() {
  aiUsageLoading.value = true
  try {
    const res = await api.get(`/ai-config/usage/${route.params.id}`)
    aiUsage.value = res.data ? res.data : res
  } catch (e) {
    aiUsage.value = null
  }
  aiUsageLoading.value = false
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

function getSystemKeyRequests(byKeyModeArr) {
  if (!Array.isArray(byKeyModeArr)) return 0
  const systemRow = byKeyModeArr.find(x => x.key_mode === 'system')
  return systemRow ? systemRow.requests : 0
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric' 
  })
}

// ──── AI Configuration ────
const aiSettings = ref({ key_mode: 'system', has_own_key: false })
const aiForm = ref({ key_mode: 'system', api_key: '' })
const aiSettingsLoading = ref(false)
const aiSettingsSaving = ref(false)
const aiSettingsMsg = ref('')
const aiSettingsError = ref(false)

async function loadAiSettings() {
  aiSettingsLoading.value = true
  try {
    const res = await tenants.getAiSettings(route.params.id)
    aiSettings.value = res.data ? res.data : res
    aiForm.value.key_mode = aiSettings.value.key_mode || 'system'
  } catch (e) {
    if (e.message) console.error(e)
  }
  aiSettingsLoading.value = false
}

async function saveAiSettings() {
  aiSettingsSaving.value = true
  aiSettingsError.value = false
  aiSettingsMsg.value = ''
  try {
    const res = await tenants.updateAiSettings(route.params.id, aiForm.value)
    aiSettingsMsg.value = res.message || 'Đã lưu cấu hình AI'
    await loadAiSettings()
  } catch (e) {
    aiSettingsError.value = true
    aiSettingsMsg.value = e.message
  }
  aiSettingsSaving.value = false
}

// ──── Domain Management ────
const domainList = ref([])
const newDomain = ref('')
const newDomainType = ref('storefront')
const domainLoading = ref(false)
const domainMsg = ref('')
const domainError = ref(false)

async function loadDomains() {
  try {
    const data = await domains.list(route.params.id)
    domainList.value = Array.isArray(data) ? data : []
  } catch { domainList.value = [] }
}

async function handleAddDomain() {
  if (!newDomain.value.trim()) return
  domainLoading.value = true
  domainMsg.value = ''
  domainError.value = false
  try {
    await domains.add(route.params.id, {
      domain: newDomain.value.trim(),
      type: newDomainType.value,
    })
    domainMsg.value = `Đã thêm domain ${newDomain.value}`
    newDomain.value = ''
    await loadDomains()
  } catch (err) {
    domainMsg.value = err.message
    domainError.value = true
  } finally {
    domainLoading.value = false
  }
}

async function handleRemoveDomain(d) {
  if (!confirm(`Xóa domain "${d.domain}"?`)) return
  domainLoading.value = true
  domainMsg.value = ''
  domainError.value = false
  try {
    await domains.remove(route.params.id, d.id)
    domainMsg.value = `Đã xóa domain ${d.domain}`
    await loadDomains()
  } catch (err) {
    domainMsg.value = err.message
    domainError.value = true
  } finally {
    domainLoading.value = false
  }
}

async function doAction(fn, msg) {
  actionLoading.value = true
  actionMsg.value = ''
  actionError.value = false
  try {
    const res = await fn()
    actionMsg.value = res.message || msg
    load()
  } catch (err) {
    actionMsg.value = err.message
    actionError.value = true
  } finally {
    actionLoading.value = false
  }
}

const handleSuspend = () => doAction(() => tenants.suspend(route.params.id), 'Đã tạm dừng')
const handleActivate = () => doAction(() => tenants.activate(route.params.id), 'Đã kích hoạt')
const handleMigrate = () => doAction(() => tenants.migrate(route.params.id), 'Migration hoàn tất')
const handleSeed = () => doAction(() => tenants.seed(route.params.id), 'Seed hoàn tất')

async function handleDelete() {
  if (!confirm(`Xóa vĩnh viễn "${tenant.value.name}" và DROP database "${tenant.value.db_name}"?`)) return
  actionLoading.value = true
  try {
    await tenants.remove(route.params.id)
    router.push('/tenants')
  } catch (err) {
    actionMsg.value = err.message
    actionError.value = true
    actionLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.mp-text-primary { color: var(--mp-text-primary); }
.mp-text-secondary { color: var(--mp-text-secondary); }
.mp-text-muted { color: var(--mp-text-muted); }
.mp-link { font-size: 0.875rem; color: var(--mp-text-muted); transition: color 0.2s; }
.mp-link:hover { color: #3b8bfa; }
.mp-section-title { font-size: 0.75rem; font-weight: 600; color: var(--mp-text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px; }
.mp-label { display: block; font-size: 0.75rem; color: var(--mp-text-muted); margin-bottom: 6px; }
.mp-stat-card { background: var(--mp-bg-input); }
.mp-checkbox {
  width: 18px; height: 18px; accent-color: #3b82f6; cursor: pointer; flex-shrink: 0;
}
</style>
