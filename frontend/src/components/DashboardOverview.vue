<template>
  <div class="dashboard">
    <!-- Welcome -->
    <div class="dashboard__welcome">
      <h1 class="dashboard__title">
        <LayoutDashboard :size="24" />
        {{ greeting }}, {{ userName }}
      </h1>
      <p class="dashboard__subtitle">Quản lý hệ thống website của bạn</p>
    </div>

    <!-- Stats Cards -->
    <div class="dashboard__cards">
      <div class="dashboard__card" v-for="stat in stats" :key="stat.label" @click="stat.action?.()" :class="{ 'dashboard__card--clickable': stat.action }">
        <div class="dashboard__card-icon" :style="{ background: stat.iconBg, color: stat.iconColor }">
          <component :is="stat.icon" :size="22" />
        </div>
        <div class="dashboard__card-body">
          <p class="dashboard__card-value">{{ stat.value }}</p>
          <p class="dashboard__card-label">{{ stat.label }}</p>
        </div>
        <div class="dashboard__card-accent" :style="{ background: stat.accent }"></div>
      </div>
    </div>

    <div class="dashboard__grid">
      <!-- Installed Modules -->
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">
          <Package :size="16" /> Modules đã cài đặt
        </h3>
        <div v-if="installedModules.length === 0" class="dashboard__empty">
          <Package :size="32" class="dashboard__empty-icon" />
          <span>Chưa cài module nào</span>
          <button class="dashboard__link-btn" @click="$emit('navigate', 'system/modules')">
            Đi tới Module Store →
          </button>
        </div>
        <div v-else class="dashboard__module-list">
          <div v-for="mod in installedModules" :key="mod.id" class="dashboard__module-item">
            <div class="dashboard__module-icon">
              <component :is="moduleIcon(mod.id)" :size="16" />
            </div>
            <div class="dashboard__module-info">
              <span class="dashboard__module-name">{{ mod.name }}</span>
              <span class="dashboard__module-desc">{{ mod.description }}</span>
            </div>
            <span class="dashboard__module-badge">Đã cài</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="dashboard__section">
        <h3 class="dashboard__section-title">
          <Zap :size="16" /> Thao tác nhanh
        </h3>
        <div class="dashboard__quick-actions">
          <button class="dashboard__action" @click="$emit('navigate', 'shop/info')">
            <Store :size="18" />
            <span>Cập nhật thông tin</span>
          </button>
          <button class="dashboard__action" @click="$emit('navigate', 'shop/config')">
            <Settings2 :size="18" />
            <span>Cấu hình hệ thống</span>
          </button>
          <button class="dashboard__action" @click="$emit('navigate', 'system/modules')">
            <Package :size="18" />
            <span>Module Store</span>
          </button>
          <button class="dashboard__action" @click="$emit('navigate', 'system/roles')">
            <Shield :size="18" />
            <span>Phân quyền</span>
          </button>
          <button class="dashboard__action" v-if="storefrontUrl" @click="openStorefront">
            <Globe :size="18" />
            <span>Xem Storefront</span>
          </button>
          <button class="dashboard__action" @click="$emit('navigate', 'shop/languages')">
            <Languages :size="18" />
            <span>Ngôn ngữ</span>
          </button>
        </div>
      </div>
    </div>

    <!-- System Info -->
    <div class="dashboard__section dashboard__section--full">
      <h3 class="dashboard__section-title">
        <Server :size="16" /> Thông tin hệ thống
      </h3>
      <div class="dashboard__sys-grid">
        <div class="dashboard__sys-item">
          <span class="dashboard__sys-label">Tên cửa hàng</span>
          <span class="dashboard__sys-value">{{ shopName || '—' }}</span>
        </div>
        <div class="dashboard__sys-item">
          <span class="dashboard__sys-label">Domain</span>
          <span class="dashboard__sys-value">{{ domain || '—' }}</span>
        </div>
        <div class="dashboard__sys-item">
          <span class="dashboard__sys-label">Modules</span>
          <span class="dashboard__sys-value">{{ installedModules.length }} đã cài</span>
        </div>
        <div class="dashboard__sys-item">
          <span class="dashboard__sys-label">Phiên bản</span>
          <span class="dashboard__sys-value">v1.0.0</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import {
  LayoutDashboard, Package, Zap, Store, Settings2, Shield, Globe, Languages, Server,
  ShoppingBag, FileText, Image, Radio, BookOpen, Truck, DollarSign, Tag, Receipt
} from 'lucide-vue-next'

const emit = defineEmits(['navigate'])

const storeInfo = inject('storeInfo', ref(null))

const shopName = computed(() => storeInfo.value?.shop_name || '')
const domain = computed(() => window.location.hostname)
const storefrontUrl = computed(() => storeInfo.value?.storefront_url || '')

const userName = computed(() => {
  try {
    const u = JSON.parse(localStorage.getItem('auth_user') || '{}')
    return u.name || u.email || 'Admin'
  } catch { return 'Admin' }
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
})

// Installed modules
const installedModules = ref([])
const moduleCount = computed(() => installedModules.value.length)

const stats = computed(() => [
  { label: 'Modules đã cài', value: moduleCount.value, icon: Package, iconBg: 'rgba(139,92,246,0.12)', iconColor: '#a78bfa', accent: 'linear-gradient(180deg, #8b5cf6, #6d28d9)' },
  { label: 'Cửa hàng', value: shopName.value || '—', icon: Store, iconBg: 'rgba(59,130,246,0.12)', iconColor: '#60a5fa', accent: 'linear-gradient(180deg, #3b82f6, #2563eb)', action: () => emit('navigate', 'shop/info') },
  { label: 'Domain', value: domain.value, icon: Globe, iconBg: 'rgba(16,185,129,0.12)', iconColor: '#34d399', accent: 'linear-gradient(180deg, #10b981, #059669)' },
])

const moduleIconMap = {
  ecom: ShoppingBag, cms: FileText, blog: BookOpen, media: Image,
  livestream: Radio, shipping: Truck, accounting: DollarSign,
  marketing: Tag, tax: Receipt,
}
function moduleIcon(id) { return moduleIconMap[id] || Package }

async function fetchModules() {
  try {
    const res = await apiFetch('/modules/sidebar')
    const data = await res.json()
    const ids = data?.installed || []
    // Get module details
    const res2 = await apiFetch('/modules')
    const data2 = await res2.json()
    const allModules = data2?.modules || []
    installedModules.value = allModules.filter(m => ids.includes(m.id) && m.is_installed)
  } catch (e) {
    console.warn('[Dashboard] Failed to fetch modules:', e.message)
  }
}

function openStorefront() {
  if (storefrontUrl.value) window.open(storefrontUrl.value, '_blank')
}

onMounted(fetchModules)
</script>

<style scoped>
.dashboard { padding: 32px; overflow-y: auto; height: 100%; }

/* ── Welcome ── */
.dashboard__welcome { margin-bottom: 28px; }
.dashboard__title {
  font-size: 24px; font-weight: 800; color: var(--color-text-primary);
  display: flex; align-items: center; gap: 12px; margin: 0 0 6px;
}
.dashboard__subtitle { font-size: 14px; color: var(--color-text-muted); margin: 0; }

/* ── Stats Cards ── */
.dashboard__cards {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px;
}
.dashboard__card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 22px; border-radius: 16px;
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  position: relative; overflow: hidden; transition: all 0.3s;
}
.dashboard__card--clickable { cursor: pointer; }
.dashboard__card:hover {
  transform: translateY(-3px); border-color: var(--color-border-hover);
  box-shadow: var(--shadow-card);
}
.dashboard__card-accent {
  position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  border-radius: 16px 0 0 16px;
}
.dashboard__card-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.dashboard__card-body { flex: 1; }
.dashboard__card-value {
  font-size: 22px; font-weight: 800; line-height: 1;
  color: var(--color-text-primary); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis; max-width: 180px;
}
.dashboard__card-label { font-size: 12px; color: var(--color-text-muted); margin-top: 4px; font-weight: 500; }

/* ── Grid ── */
.dashboard__grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.dashboard__section {
  background: var(--glass-bg); border: 1px solid var(--glass-border);
  border-radius: 16px; padding: 20px; transition: all 0.3s;
}
.dashboard__section:hover { border-color: var(--color-border-hover); }
.dashboard__section--full { grid-column: 1 / -1; }
.dashboard__section-title {
  font-size: 14px; font-weight: 800; margin-bottom: 16px;
  display: flex; align-items: center; gap: 8px; color: var(--color-text-primary);
}

/* ── Empty ── */
.dashboard__empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 30px; color: var(--color-text-muted); font-size: 13px; gap: 8px;
}
.dashboard__empty-icon { opacity: 0.2; }
.dashboard__link-btn {
  background: none; border: none; color: var(--color-accent-primary);
  font-size: 13px; font-weight: 600; cursor: pointer; padding: 4px 0;
}
.dashboard__link-btn:hover { text-decoration: underline; }

/* ── Module List ── */
.dashboard__module-list { display: flex; flex-direction: column; gap: 4px; }
.dashboard__module-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px; transition: background 0.15s;
}
.dashboard__module-item:hover { background: var(--color-bg-card); }
.dashboard__module-icon {
  width: 36px; height: 36px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(139,92,246,0.1); color: #a78bfa; flex-shrink: 0;
}
.dashboard__module-info { flex: 1; min-width: 0; }
.dashboard__module-name { display: block; font-size: 13px; font-weight: 700; color: var(--color-text-primary); }
.dashboard__module-desc {
  display: block; font-size: 11px; color: var(--color-text-muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.dashboard__module-badge {
  font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
  background: rgba(16,185,129,0.12); color: #10b981; white-space: nowrap;
}

/* ── Quick Actions ── */
.dashboard__quick-actions {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
}
.dashboard__action {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-radius: 12px;
  background: var(--color-bg-card); border: 1px solid var(--glass-border);
  color: var(--color-text-secondary); font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.2s; text-align: left;
}
.dashboard__action:hover {
  border-color: var(--color-accent-primary);
  color: var(--color-accent-primary);
  transform: translateY(-1px);
}

/* ── System Info ── */
.dashboard__sys-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px;
}
.dashboard__sys-item {
  display: flex; flex-direction: column; gap: 4px;
  padding: 12px 16px; border-radius: 10px; background: var(--color-bg-card);
}
.dashboard__sys-label { font-size: 11px; color: var(--color-text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.dashboard__sys-value { font-size: 14px; font-weight: 700; color: var(--color-text-primary); }

@media (max-width: 768px) {
  .dashboard__cards { grid-template-columns: 1fr; }
  .dashboard__grid { grid-template-columns: 1fr; }
  .dashboard__quick-actions { grid-template-columns: 1fr; }
  .dashboard__sys-grid { grid-template-columns: 1fr 1fr; }
}
</style>
