<template>
  <div class="mod-manager">
    <div class="mod-header">
      <h2><Puzzle :size="20" style="vertical-align:middle" /> {{ t('admin.msg_690deacc', 'Quản Lý Module') }}</h2>
      <p class="mod-subtitle">{{ t('admin.msg_883266f9', 'Cài đặt hoặc gỡ bỏ các tính năng mở rộng cho cửa hàng') }}</p>
    </div>

    <div v-if="loading" class="mod-loading">{{ t('admin.loading', 'Đang tải...') }}</div>

    <div v-else class="mod-grid">
      <div
        v-for="m in modules" :key="m.id"
        class="mod-card" :class="{ 'mod-card--installed': m.is_installed }"
      >
        <div class="mod-card__header">
          <div class="mod-card__icon" :class="m.is_installed ? 'mod-card__icon--active' : ''">
            <component :is="iconMap[m.icon] || Package" :size="24" />
          </div>
          <div class="mod-card__info">
            <h3>{{ m.name }}</h3>
            <span class="mod-card__version">v{{ m.version }}</span>
          </div>
          <span v-if="m.is_installed" class="mod-badge mod-badge--active">{{ t('admin.msg_f6dd9c8a', 'Đã cài') }}</span>
          <span v-else class="mod-badge mod-badge--available">{{ t('admin.msg_c90e2dcc', 'Có sẵn') }}</span>
        </div>

        <p class="mod-card__desc">{{ m.description }}</p>

        <div class="mod-card__price">
          <span v-if="m.price > 0" class="price-tag">{{ formatPrice(m.price) }}</span>
          <span v-else class="price-tag price-tag--free">{{ t('admin.msg_c5918647', 'Miễn phí') }}</span>
        </div>

        <div v-if="m.requires?.length" class="mod-card__deps">
          <span class="dep-label">{{ t('admin.msg_93e018a3', 'Yêu cầu:') }}</span>
          <span
            v-for="dep in m.requires" :key="dep"
            :class="['dep-badge', isDepInstalled(dep) ? 'dep-badge--ok' : 'dep-badge--missing']"
            :title="isDepInstalled(dep) ? t('admin.msg_f6dd9c8a', 'Đã cài') : t('admin.msg_a182d7a9', 'Chưa cài — cần cài trước')"
          >
            <component :is="isDepInstalled(dep) ? CheckCircle2 : AlertCircle" :size="11" />
            {{ getModuleName(dep) }}
          </span>
        </div>
        <div v-if="m.requires?.length && !allDepsInstalled(m)" class="mod-card__dep-warning">
          <AlertTriangle :size="12" /> Cần cài đặt module yêu cầu trước
        </div>

        <div class="mod-card__footer">
          <div class="mod-card__category">
            <component :is="catIcons[m.category] || Package" :size="12" />
            {{ catLabels[m.category] || m.category }}
          </div>

          <!-- Installed → Uninstall -->
          <button
            v-if="m.is_installed"
            class="mod-btn mod-btn--uninstall"
            :disabled="actionLoading === m.id"
            @click="uninstallModule(m.id)"
          >
            <Trash2 :size="13" />
            {{ actionLoading === m.id ? t('admin.msg_0c30f9fb', 'Đang gỡ...') : t('admin.msg_ca016666', 'Gỡ cài đặt') }}
          </button>

          <!-- Pending → Show waiting badge -->
          <span v-else-if="m.status === 'pending'" class="mod-btn mod-btn--pending" disabled>
            <Clock :size="13" />{{ t('admin.msg_acb8dc96', 'Chờ duyệt') }}</span>

          <!-- Rejected → Show rejected badge + retry -->
          <button
            v-else-if="m.status === 'rejected'"
            class="mod-btn mod-btn--rejected"
            :disabled="actionLoading === m.id"
            @click="requestModule(m.id)"
          >
            <AlertCircle :size="13" /> Yêu cầu lại
          </button>

          <!-- Paid + Previously approved → Reinstall directly -->
          <button
            v-else-if="m.price > 0 && m.status === 'active'"
            class="mod-btn mod-btn--install"
            :disabled="actionLoading === m.id || !allDepsInstalled(m)"
            @click="installModule(m.id)"
          >
            <Download :size="13" />
            {{ actionLoading === m.id ? t('admin.msg_95922d51', 'Đang cài...') : t('admin.msg_4d4542e9', 'Cài đặt lại') }}
          </button>

          <!-- Paid + Never approved → Request button -->
          <button
            v-else-if="m.price > 0"
            class="mod-btn mod-btn--request"
            :disabled="actionLoading === m.id || !allDepsInstalled(m)"
            @click="requestModule(m.id)"
          >
            <Send :size="13" />
            {{ actionLoading === m.id ? t('admin.msg_6b22c83e', 'Đang gửi...') : t('admin.msg_3ba3fad4', 'Yêu cầu cài đặt') }}
          </button>

          <!-- Free + Not installed → Install button -->
          <button
            v-else
            class="mod-btn mod-btn--install"
            :disabled="actionLoading === m.id || !allDepsInstalled(m)"
            @click="installModule(m.id)"
          >
            <Download :size="13" />
            {{ actionLoading === m.id ? t('admin.msg_95922d51', 'Đang cài...') : t('admin.msg_1a691070', 'Cài đặt') }}
          </button>
        </div>

        <div v-if="m.installed_at && m.is_installed" class="mod-card__meta">
          Cài lúc: {{ formatDate(m.installed_at) }}
        </div>
      </div>
    </div>

    <div v-if="!loading && modules.length === 0" class="mod-empty">
      <Package :size="48" />
      <p>{{ t('admin.msg_4184d885', 'Chưa có module nào') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import {
  Puzzle, Package, Download, Trash2,
  DollarSign, Tag, Receipt, BookOpen, Users, Mail,
  Warehouse, BarChart2, ShoppingCart, Clock, AlertCircle, Send,
  CheckCircle2, AlertTriangle,
} from 'lucide-vue-next'

const { t, formatCurrency } = useI18n()

const { showToast } = useToast()
const emit = defineEmits(['modulesChanged'])

const modules = ref([])
const loading = ref(true)
const actionLoading = ref(null)

// Icon mapping from manifest string → component
const iconMap = {
  Package, DollarSign, Tag, Receipt, BookOpen, Users, Mail,
  Warehouse, BarChart2, ShoppingCart,
}

const catIcons = {
  operations: Package,
  finance: DollarSign,
  marketing: Tag,
  content: BookOpen,
  sales: Users,
}

const catLabels = {
  operations: t('admin.msg_8ae3233c', 'Vận hành'),
  finance: t('admin.msg_7add65a1', 'Tài chính'),
  marketing: 'Marketing',
  content: t('admin.msg_ee7ca513', 'Nội dung'),
  sales: t('admin.msg_cc0e5c0c', 'Bán hàng'),
}

async function fetchModules() {
  loading.value = true
  try {
    const res = await apiFetch('/modules')
    const data = await res.json()
    modules.value = data?.modules || data || []
  } catch (e) {
    showToast(t('admin.msg_65808f', 'Lỗi tải modules'), 'error')
  } finally {
    loading.value = false
  }
}

// Dependency helpers
function isDepInstalled(depId) {
  const m = modules.value.find(mod => mod.id === depId)
  return m?.is_installed === true
}

function getModuleName(depId) {
  const m = modules.value.find(mod => mod.id === depId)
  return m?.name || depId
}

function allDepsInstalled(mod) {
  if (!mod.requires?.length) return true
  return mod.requires.every(dep => isDepInstalled(dep))
}

async function installModule(moduleId) {
  actionLoading.value = moduleId
  try {
    const res = await apiFetch('/modules/install', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || t('admin.msg_14f0c73d', 'Đã cài đặt'), 'success')
      modules.value = data?.modules || modules.value
      emit('modulesChanged', data?.installed || [])
    } else {
      showToast(data.message || t('admin.msg_a1a3a271', 'Lỗi cài đặt'), 'error')
    }
  } catch (e) {
    showToast(t('admin.msg_7e9f0f', 'Lỗi cài đặt module'), 'error')
  } finally {
    actionLoading.value = null
  }
}

async function requestModule(moduleId) {
  actionLoading.value = moduleId
  try {
    const res = await apiFetch('/modules/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || t('admin.msg_447e9f03', 'Đã gửi yêu cầu'), 'success')
      modules.value = data?.modules || modules.value
    } else {
      showToast(data.message || t('admin.msg_4bd99115', 'Lỗi gửi yêu cầu'), 'error')
    }
  } catch (e) {
    showToast(t('admin.msg_7ec795', 'Lỗi gửi yêu cầu module'), 'error')
  } finally {
    actionLoading.value = null
  }
}

async function uninstallModule(moduleId) {
  if (!confirm(t('admin.msg_0ea1758d', 'Gỡ cài đặt module này? Dữ liệu sẽ được giữ lại.'))) return
  actionLoading.value = moduleId
  try {
    const res = await apiFetch('/modules/uninstall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ module_id: moduleId }),
    })
    const data = await res.json()
    if (res.ok) {
      showToast(data.message || t('admin.msg_e888fab8', 'Đã gỡ'), 'success')
      modules.value = data?.modules || modules.value
      emit('modulesChanged', data?.installed || [])
    } else {
      showToast(data.message || t('admin.msg_8a3ea096', 'Lỗi gỡ cài đặt'), 'error')
    }
  } catch (e) {
    showToast(t('admin.msg_8a3ea0', 'Lỗi gỡ cài đặt'), 'error')
  } finally {
    actionLoading.value = null
  }
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatPrice(p) {
  return new Intl.NumberFormat('vi-VN').format(p) + 'đ'
}

onMounted(fetchModules)
</script>

<style scoped>
.mod-manager { padding: 24px; overflow-y: auto; height: 100%; }
.mod-header { margin-bottom: 28px; }
.mod-header h2 { margin: 0; font-size: 22px; font-weight: 800; }
.mod-subtitle { font-size: 13px; color: var(--color-text-muted); margin: 6px 0 0; }

.mod-loading { text-align: center; padding: 60px; color: var(--color-text-muted); font-size: 14px; }
.mod-empty { text-align: center; padding: 80px 20px; color: var(--color-text-muted); }
.mod-empty p { margin-top: 12px; font-size: 14px; }

.mod-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 18px;
}

.mod-card {
  background: var(--glass-bg);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  padding: 22px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.mod-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--glass-border);
  transition: background 0.3s;
}
.mod-card--installed::before {
  background: var(--accent-gradient);
}
.mod-card:hover {
  transform: translateY(-2px);
  border-color: var(--color-border-hover);
  box-shadow: 0 8px 30px rgba(0,0,0,0.12);
}

.mod-card__header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 14px;
}

.mod-card__icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
  transition: all 0.3s;
}
.mod-card__icon--active {
  background: var(--color-accent-glow);
  color: var(--accent-light);
}

.mod-card__info { flex: 1; }
.mod-card__info h3 { margin: 0; font-size: 16px; font-weight: 700; }
.mod-card__version { font-size: 11px; color: var(--color-text-muted); }

.mod-badge {
  font-size: 10px; font-weight: 700;
  padding: 4px 10px; border-radius: 20px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.mod-badge--active {
  background: rgba(52,211,153,0.12); color: #34d399;
}
.mod-badge--available {
  background: rgba(96,165,250,0.1); color: #60a5fa;
}

.mod-card__desc {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin: 0 0 10px;
}

.mod-card__price {
  margin-bottom: 14px;
}
.price-tag {
  font-size: 16px;
  font-weight: 800;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.price-tag--free {
  font-size: 13px;
  font-weight: 700;
  background: linear-gradient(135deg, #34d399, #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.mod-card__deps {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 8px; font-size: 11px; flex-wrap: wrap;
}
.dep-label { color: var(--color-text-muted); font-weight: 600; }
.dep-badge {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 2px 8px; border-radius: 6px; font-weight: 600;
}
.dep-badge--ok {
  background: rgba(34,197,94,0.1); color: #22c55e;
}
.dep-badge--missing {
  background: rgba(248,113,113,0.1); color: #f87171;
}
.mod-card__dep-warning {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #f59e0b; font-weight: 600;
  margin-bottom: 12px; padding: 6px 10px;
  background: rgba(245,158,11,0.08); border-radius: 6px;
  border: 1px solid rgba(245,158,11,0.2);
}

.mod-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mod-card__category {
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex; align-items: center; gap: 4px;
  font-weight: 600;
}

.mod-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 10px;
  font-size: 12px; font-weight: 700;
  border: none; cursor: pointer;
  transition: all 0.2s;
}
.mod-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.mod-btn--install {
  background: var(--accent-gradient); color: #fff;
  box-shadow: var(--accent-shadow);
}
.mod-btn--install:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(139,92,246,0.4);
}

.mod-btn--uninstall {
  background: transparent;
  border: 1px solid rgba(248,113,113,0.3);
  color: #f87171;
}
.mod-btn--uninstall:hover:not(:disabled) {
  background: rgba(248,113,113,0.08);
}

.mod-btn--pending {
  background: rgba(251,191,36,0.12);
  border: 1px solid rgba(251,191,36,0.3);
  color: #fbbf24;
  cursor: default;
}

.mod-btn--rejected {
  background: transparent;
  border: 1px solid rgba(248,113,113,0.3);
  color: #f87171;
}
.mod-btn--rejected:hover:not(:disabled) {
  background: rgba(248,113,113,0.08);
}

.mod-btn--request {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  color: #fff;
  box-shadow: 0 2px 12px rgba(59,130,246,0.3);
}
.mod-btn--request:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(59,130,246,0.4);
}

.mod-card__meta {
  margin-top: 12px;
  font-size: 11px;
  color: var(--color-text-muted);
  padding-top: 10px;
  border-top: 1px solid var(--glass-border);
}
</style>
