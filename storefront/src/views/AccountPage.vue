<template>
  <div class="account-page">
    <div class="account-container">
      <!-- Sidebar -->
      <aside class="account-sidebar">
        <div class="account-avatar">
          <div class="avatar-circle">{{ initials }}</div>
          <div class="avatar-info">
            <h3>{{ customer?.first_name }} {{ customer?.last_name }}</h3>
            <p>{{ customer?.email }}</p>
          </div>
        </div>
        <nav class="account-nav">
          <button :class="{ active: tab === 'profile' }" @click="tab = 'profile'">
            <span class="nav-icon"><User :size="16" /></span> Thông tin cá nhân
          </button>
          <button :class="{ active: tab === 'orders' }" @click="tab = 'orders'; loadOrders()">
            <span class="nav-icon"><Package :size="16" /></span> Đơn hàng
            <span v-if="orders.length" class="nav-badge">{{ orders.length }}</span>
          </button>
          <button :class="{ active: tab === 'addresses' }" @click="tab = 'addresses'; loadAddresses()">
            <span class="nav-icon"><MapPin :size="16" /></span> Địa chỉ giao hàng
          </button>
          <button :class="{ active: tab === 'password' }" @click="tab = 'password'">
            <span class="nav-icon"><Lock :size="16" /></span> Đổi mật khẩu
          </button>
          <div class="nav-divider"></div>
          <button class="logout-btn" @click="onLogout">
            <span class="nav-icon"><LogOut :size="16" /></span> Đăng xuất
          </button>
        </nav>
      </aside>

      <!-- Content -->
      <main class="account-content">
        <!-- Profile Tab -->
        <div v-if="tab === 'profile'" class="tab-content">
          <div class="tab-title">
            <h2>Thông tin cá nhân</h2>
            <p class="tab-desc">Quản lý thông tin cá nhân để bảo mật tài khoản</p>
          </div>
          <form @submit.prevent="onUpdateProfile" class="profile-form">
            <div class="field-row">
              <div class="field">
                <label>Họ</label>
                <input v-model="profileForm.last_name" placeholder="Nhập họ" />
              </div>
              <div class="field">
                <label>Tên</label>
                <input v-model="profileForm.first_name" placeholder="Nhập tên" />
              </div>
            </div>
            <div class="field">
              <label>Email</label>
              <input :value="customer?.email" disabled class="disabled" />
            </div>
            <div class="field">
              <label>Số điện thoại</label>
              <input v-model="profileForm.phone" placeholder="0901234567" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="saving">
                <Save :size="14" v-if="!saving" /> {{ saving ? 'Đang lưu...' : 'Cập nhật thông tin' }}
              </button>
              <span class="save-msg success" v-if="saveMsg"><Check :size="14" /> {{ saveMsg }}</span>
            </div>
          </form>
        </div>

        <!-- Orders Tab -->
        <div v-if="tab === 'orders'" class="tab-content">
          <div class="tab-title">
            <h2>Lịch sử đơn hàng</h2>
            <p class="tab-desc">Theo dõi và quản lý đơn hàng của bạn</p>
          </div>
          <div v-if="ordersLoading" class="orders-skeleton">
            <div v-for="i in 3" :key="i" class="order-card order-card--skeleton">
              <div class="order-header">
                <div style="display:flex;gap:10px;align-items:center">
                  <div class="skeleton" style="width:60px;height:18px;border-radius:6px"></div>
                  <div class="skeleton" style="width:90px;height:14px;border-radius:6px"></div>
                </div>
                <div class="skeleton" style="width:80px;height:24px;border-radius:20px"></div>
              </div>
              <div style="display:flex;gap:6px;margin-bottom:12px">
                <div class="skeleton" style="width:120px;height:24px;border-radius:8px"></div>
                <div class="skeleton" style="width:100px;height:24px;border-radius:8px"></div>
              </div>
              <div class="order-footer">
                <div class="skeleton" style="width:70px;height:14px;border-radius:6px"></div>
                <div class="skeleton" style="width:100px;height:20px;border-radius:6px"></div>
              </div>
            </div>
          </div>
          <div v-else-if="orders.length === 0" class="empty-state">
            <div class="empty-icon"><Package :size="48" /></div>
            <h3>Chưa có đơn hàng nào</h3>
            <p>Hãy bắt đầu mua sắm ngay!</p>
            <router-link to="/products" class="btn-primary"><ShoppingBag :size="14" /> Mua sắm ngay</router-link>
          </div>
          <div v-else class="orders-list">
            <div v-for="order in orders" :key="order.id" class="order-card">
              <div class="order-header">
                <div class="order-id-group">
                  <span class="order-id">#{{ order.id }}</span>
                  <span class="order-date">{{ formatDate(order.created_at) }}</span>
                </div>
                <span class="order-status" :style="{ background: statusColor(order.status), color: '#fff' }">
                  {{ statusLabel(order.status) }}
                </span>
              </div>
              <div class="order-items" v-if="order.details?.length">
                <div v-for="item in order.details.slice(0, 3)" :key="item.id" class="order-item-tag">
                  {{ item.name }} × {{ item.qty }} — {{ formatPrice(item.price) }}
                </div>
                <span v-if="order.details.length > 3" class="order-more">+{{ order.details.length - 3 }} sản phẩm</span>
              </div>
              <div class="order-footer">
                <router-link :to="`/order-tracking?order_id=${order.id}&phone=${order.customer_phone || ''}`" class="btn-link-sm">
                  Chi tiết →
                </router-link>
                <span class="order-total">{{ formatPrice(order.total_amount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Addresses Tab -->
        <div v-if="tab === 'addresses'" class="tab-content">
          <div class="tab-title">
            <h2>Địa chỉ giao hàng</h2>
            <p class="tab-desc">Quản lý địa chỉ để thanh toán nhanh hơn</p>
            <button class="btn-primary btn-sm" @click="showAddrForm = !showAddrForm" style="margin-top: 8px;">
              <template v-if="showAddrForm"><X :size="14" /> Đóng</template>
              <template v-else><Plus :size="14" /> Thêm địa chỉ mới</template>
            </button>
          </div>

          <!-- Address Form -->
          <form v-if="showAddrForm" @submit.prevent="onSaveAddress" class="profile-form addr-form">
            <div class="form-card">
              <h3 class="form-card-title">{{ editingAddrId ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới' }}</h3>
              <div class="field-row">
                <div class="field"><label>Họ</label><input v-model="addrForm.last_name" placeholder="Nguyễn" /></div>
                <div class="field"><label>Tên</label><input v-model="addrForm.first_name" placeholder="Văn A" /></div>
              </div>
              <div class="field"><label>Điện thoại</label><input v-model="addrForm.phone" placeholder="0901234567" /></div>
              <div class="field"><label>Địa chỉ chi tiết *</label><input v-model="addrForm.address1" placeholder="123 Đường ABC, Phường X" required /></div>
              <div class="field-row">
                <div class="field"><label>Phường/Xã</label><input v-model="addrForm.city" placeholder="Phường Bến Nghé" /></div>
                <div class="field"><label>Tỉnh/Thành phố</label><input v-model="addrForm.province" placeholder="Hồ Chí Minh" /></div>
              </div>
              <div class="field-row">
                <div class="field"><label>Quốc gia</label><input v-model="addrForm.country" /></div>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn-primary" :disabled="saving">
                  <Save :size="14" /> {{ editingAddrId ? 'Cập nhật' : 'Lưu địa chỉ' }}
                </button>
                <button type="button" class="btn-outline" @click="resetAddrForm">Hủy</button>
              </div>
            </div>
          </form>

          <!-- Address List -->
          <div v-if="addrLoading" class="addr-skeleton">
            <div v-for="i in 2" :key="i" class="addr-card addr-card--skeleton">
              <div class="addr-info">
                <div style="display:flex;gap:10px;margin-bottom:8px">
                  <div class="skeleton" style="width:120px;height:16px;border-radius:6px"></div>
                  <div class="skeleton" style="width:90px;height:16px;border-radius:6px"></div>
                </div>
                <div class="skeleton" style="width:80%;height:14px;border-radius:6px;margin-bottom:4px"></div>
                <div class="skeleton" style="width:60%;height:12px;border-radius:6px"></div>
              </div>
              <div style="display:flex;gap:6px">
                <div class="skeleton" style="width:34px;height:34px;border-radius:8px"></div>
                <div class="skeleton" style="width:34px;height:34px;border-radius:8px"></div>
              </div>
            </div>
          </div>
          <div v-else-if="addresses.length === 0 && !showAddrForm" class="empty-state">
            <div class="empty-icon"><MapPin :size="48" /></div>
            <h3>Chưa có địa chỉ nào</h3>
            <p>Thêm địa chỉ giao hàng để thanh toán nhanh hơn</p>
          </div>
          <div v-else class="addr-list">
            <div v-for="addr in addresses" :key="addr.id" class="addr-card">
              <div class="addr-info">
                <div class="addr-name">
                  <strong>{{ addr.first_name }} {{ addr.last_name }}</strong>
                  <span v-if="addr.phone" class="addr-phone">{{ addr.phone }}</span>
                </div>
                <p class="addr-line">{{ addr.address1 }}<span v-if="addr.address2">, {{ addr.address2 }}</span></p>
                <p class="addr-region">{{ [addr.city, addr.province].filter(Boolean).join(', ') }}</p>
              </div>
              <div class="addr-actions">
                <button class="btn-action" @click="editAddress(addr)" title="Sửa"><Pencil :size="14" /></button>
                <button class="btn-action btn-danger" @click="deleteAddr(addr.id)" title="Xóa"><Trash2 :size="14" /></button>
              </div>
            </div>
          </div>
        </div>

        <!-- Change Password Tab -->
        <div v-if="tab === 'password'" class="tab-content">
          <div class="tab-title">
            <h2>Đổi mật khẩu</h2>
            <p class="tab-desc">Để bảo vệ tài khoản, hãy sử dụng mật khẩu mạnh</p>
          </div>
          <form @submit.prevent="onChangePassword" class="profile-form">
            <div class="field">
              <label>Mật khẩu hiện tại</label>
              <input v-model="pwForm.current" type="password" required />
            </div>
            <div class="field">
              <label>Mật khẩu mới</label>
              <input v-model="pwForm.newPw" type="password" required minlength="6" />
            </div>
            <div class="field">
              <label>Xác nhận mật khẩu mới</label>
              <input v-model="pwForm.confirm" type="password" required minlength="6" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn-primary" :disabled="saving">
                <Lock :size="14" v-if="!saving" /> {{ saving ? 'Đang xử lý...' : 'Đổi mật khẩu' }}
              </button>
              <span class="save-msg success" v-if="pwMsg"><Check :size="14" /> {{ pwMsg }}</span>
              <span class="save-msg error" v-if="pwError"><X :size="14" /> {{ pwError }}</span>
            </div>
          </form>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import {
  User, Package, MapPin, Lock, LogOut, Save, Check, X,
  ShoppingBag, Plus, Pencil, Trash2
} from 'lucide-vue-next'

const router = useRouter()
const { customer, isLoggedIn, authFetch, updateProfile, changePassword, logout, fetchProfile } = useAuth()

const tab = ref('profile')
const saving = ref(false)
const saveMsg = ref('')
const orders = ref([])
const ordersLoading = ref(false)
const pwMsg = ref('')
const pwError = ref('')
const addresses = ref([])
const addrLoading = ref(false)
const showAddrForm = ref(false)
const editingAddrId = ref(null)
const addrForm = reactive({
  first_name: '', last_name: '', phone: '',
  address1: '', address2: '', city: '', district: '', province: '', country: 'Việt Nam', postcode: '',
})

const profileForm = reactive({
  first_name: customer.value?.first_name || '',
  last_name: customer.value?.last_name || '',
  phone: customer.value?.phone || '',
})

const pwForm = reactive({ current: '', newPw: '', confirm: '' })

const initials = computed(() => {
  const f = customer.value?.first_name?.[0] || ''
  const l = customer.value?.last_name?.[0] || ''
  return (f + l).toUpperCase() || '?'
})

onMounted(() => {
  if (!isLoggedIn.value) router.push('/auth')
  else {
    fetchProfile().then(data => {
      if (data) {
        profileForm.first_name = data.first_name || ''
        profileForm.last_name = data.last_name || ''
        profileForm.phone = data.phone || ''
      }
    })
  }
})

// ─── Profile ───
async function onUpdateProfile() {
  saving.value = true
  saveMsg.value = ''
  try {
    await updateProfile(profileForm)
    saveMsg.value = 'Đã cập nhật thành công!'
    setTimeout(() => saveMsg.value = '', 3000)
  } catch (e) {
    saveMsg.value = ''
    alert('Lỗi: ' + e.message)
  } finally {
    saving.value = false
  }
}

// ─── Orders ───
async function loadOrders() {
  ordersLoading.value = true
  try {
    const data = await authFetch('/orders')
    orders.value = Array.isArray(data) ? data : (data?.data || [])
  } catch { orders.value = [] }
  ordersLoading.value = false
}

// ─── Password ───
async function onChangePassword() {
  pwMsg.value = ''
  pwError.value = ''
  if (pwForm.newPw !== pwForm.confirm) {
    pwError.value = 'Mật khẩu mới không khớp'
    return
  }
  saving.value = true
  try {
    await changePassword(pwForm.current, pwForm.newPw)
    pwMsg.value = 'Đã đổi mật khẩu thành công!'
    pwForm.current = ''
    pwForm.newPw = ''
    pwForm.confirm = ''
  } catch (e) {
    pwError.value = e.message
  } finally {
    saving.value = false
  }
}

// ─── Addresses ───
async function loadAddresses() {
  addrLoading.value = true
  try {
    const data = await authFetch('/addresses')
    addresses.value = Array.isArray(data) ? data : []
  } catch { addresses.value = [] }
  addrLoading.value = false
}

function resetAddrForm() {
  editingAddrId.value = null
  showAddrForm.value = false
  Object.assign(addrForm, {
    first_name: '', last_name: '', phone: '',
    address1: '', address2: '', city: '', district: '', province: '', country: 'Việt Nam', postcode: '',
  })
}

function editAddress(addr) {
  editingAddrId.value = addr.id
  showAddrForm.value = true
  Object.assign(addrForm, {
    first_name: addr.first_name || '', last_name: addr.last_name || '',
    phone: addr.phone || '', address1: addr.address1 || '', address2: addr.address2 || '',
    city: addr.city || '', district: addr.district || '',
    province: addr.province || '', country: addr.country || 'Việt Nam', postcode: addr.postcode || '',
  })
}

async function onSaveAddress() {
  saving.value = true
  try {
    if (editingAddrId.value) {
      await authFetch(`/addresses/${editingAddrId.value}`, { method: 'PUT', body: JSON.stringify(addrForm) })
    } else {
      await authFetch('/addresses', { method: 'POST', body: JSON.stringify(addrForm) })
    }
    resetAddrForm()
    await loadAddresses()
  } catch (e) { alert(e.message) }
  saving.value = false
}

async function deleteAddr(id) {
  if (!confirm('Bạn có chắc muốn xóa địa chỉ này?')) return
  try {
    await authFetch(`/addresses/${id}`, { method: 'DELETE' })
    await loadAddresses()
  } catch (e) { alert(e.message) }
}

// ─── Logout ───
function onLogout() {
  logout()
  router.push('/')
}

// ─── Helpers ───
const statusMap = {
  pending: { label: 'Chờ xác nhận', color: '#f59e0b' },
  confirmed: { label: 'Đã xác nhận', color: '#3b82f6' },
  processing: { label: 'Đang xử lý', color: '#8b5cf6' },
  shipping: { label: 'Đang giao', color: '#06b6d4' },
  delivered: { label: 'Đã giao', color: '#10b981' },
  completed: { label: 'Hoàn thành', color: '#22c55e' },
  cancelled: { label: 'Đã hủy', color: '#ef4444' },
}
function statusLabel(s) { return statusMap[s]?.label || s }
function statusColor(s) { return statusMap[s]?.color || '#94a3b8' }
function formatDate(d) { return new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) }
function formatPrice(p) { return Number(p || 0).toLocaleString('vi-VN') + 'đ' }
</script>

<style scoped>
.account-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 32px 20px 60px;
}
.account-container {
  display: flex;
  gap: 32px;
}

/* ─── Sidebar ─── */
.account-sidebar {
  width: 260px;
  flex-shrink: 0;
}
.account-avatar {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 14px;
}
.avatar-circle {
  width: 50px; height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 17px;
  flex-shrink: 0;
  box-shadow: 0 3px 12px rgba(124,58,237,0.25);
}
.avatar-info h3 { margin: 0; font-size: 15px; font-weight: 700; color: var(--color-text-primary, #1a1a2e); }
.avatar-info p { margin: 3px 0 0; font-size: 12px; color: var(--color-text-secondary, #888); word-break: break-all; }

.account-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 14px;
  padding: 8px;
}
.account-nav button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: none;
  border-radius: 10px;
  background: transparent;
  color: var(--color-text-secondary, #555);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  position: relative;
}
.account-nav button:hover {
  background: var(--color-bg-secondary, #f8f7ff);
  color: var(--color-accent, #7c3aed);
}
.account-nav button.active {
  background: linear-gradient(135deg, rgba(124,58,237,0.08), rgba(168,85,247,0.05));
  color: var(--color-accent, #7c3aed);
  font-weight: 600;
  box-shadow: inset 3px 0 0 var(--color-accent, #7c3aed);
}
.nav-icon { font-size: 16px; width: 22px; text-align: center; flex-shrink: 0; }
.nav-badge {
  margin-left: auto;
  background: var(--color-accent, #7c3aed);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}
.nav-divider { height: 1px; background: var(--color-border, #e5e7eb); margin: 4px 8px; }
.logout-btn { color: #ef4444 !important; }
.logout-btn:hover { background: #fef2f2 !important; color: #dc2626 !important; }

/* ─── Content ─── */
.account-content {
  flex: 1;
  min-width: 0;
}
.tab-content {
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 14px;
  padding: 28px;
}
.tab-title { margin-bottom: 24px; }
.tab-title h2 {
  margin: 0; font-size: 22px; font-weight: 700;
  color: var(--color-text-primary, #1a1a2e);
}
.tab-desc {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary, #888);
}

/* ─── Forms ─── */
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  max-width: 520px;
}
.field-row { display: flex; gap: 14px; }
.field-row .field { flex: 1; }
.field label {
  display: block; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary, #555);
  margin-bottom: 6px;
}
.field input {
  width: 100%; padding: 11px 14px; border-radius: 10px;
  border: 1px solid var(--color-border, #ddd);
  background: var(--color-bg-input, #fafafa);
  color: var(--color-text-primary, #333);
  font-size: 14px; outline: none; box-sizing: border-box;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field input:focus {
  border-color: var(--color-accent, #7c3aed);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
}
.field input.disabled { opacity: 0.5; cursor: not-allowed; background: var(--color-bg-secondary, #f0f0f0); }

.form-actions { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; margin-top: 4px; }
.btn-primary {
  padding: 11px 24px; border: none; border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #9333ea); color: #fff;
  font-weight: 600; font-size: 14px; cursor: pointer;
  text-decoration: none; display: inline-flex; align-items: center; gap: 6px;
  transition: opacity 0.2s, transform 0.1s;
  box-shadow: 0 2px 8px rgba(124,58,237,0.2);
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
.btn-primary:disabled { opacity: 0.5; cursor: wait; }
.btn-sm { padding: 8px 16px; font-size: 13px; }
.btn-outline {
  padding: 10px 20px; border-radius: 10px;
  border: 1px solid var(--color-border, #ddd);
  background: transparent; color: var(--color-text-secondary, #666);
  font-size: 14px; cursor: pointer; transition: all 0.2s;
}
.btn-outline:hover { border-color: var(--color-accent); color: var(--color-accent); }
.save-msg { font-size: 13px; font-weight: 500; }
.save-msg.success { color: #16a34a; }
.save-msg.error { color: #dc2626; }

/* ─── Skeleton Loading ─── */
.skeleton {
  background: linear-gradient(90deg, var(--color-bg-secondary, #f3f4f8) 25%, var(--color-border, #e2e8f0) 50%, var(--color-bg-secondary, #f3f4f8) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease infinite;
}
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.orders-skeleton, .addr-skeleton { display: flex; flex-direction: column; gap: 14px; }
.order-card--skeleton, .addr-card--skeleton { pointer-events: none; }

/* ─── Loading & Empty ─── */
.loading-state, .empty-state {
  text-align: center; padding: 48px 20px;
  color: var(--color-text-secondary, #888);
}
.spinner {
  width: 32px; height: 32px; margin: 0 auto 12px;
  border: 3px solid var(--color-border, #e5e7eb);
  border-top-color: var(--color-accent, #7c3aed);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state h3 { margin: 0 0 4px; font-size: 16px; color: var(--color-text-primary, #333); }
.empty-state p { margin: 0 0 16px; font-size: 13px; }

/* ─── Orders ─── */
.orders-list { display: flex; flex-direction: column; gap: 14px; }
.order-card {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px; padding: 18px;
  background: var(--color-bg-secondary, #fafafa);
  transition: border-color 0.2s;
}
.order-card:hover { border-color: var(--color-accent, #7c3aed); }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.order-id-group { display: flex; align-items: center; gap: 10px; }
.order-id { font-weight: 700; font-size: 15px; color: var(--color-text-primary); }
.order-date { font-size: 12px; color: var(--color-text-secondary, #888); }
.order-status {
  padding: 4px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 600;
}
.order-items { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.order-item-tag {
  padding: 4px 10px; border-radius: 8px; font-size: 12px;
  background: var(--color-bg-card, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  color: var(--color-text-secondary, #555);
}
.order-more { font-size: 12px; color: var(--color-text-secondary); padding: 4px 0; }
.order-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 10px; border-top: 1px solid var(--color-border, #e5e7eb);
}
.order-total { font-weight: 700; color: var(--color-accent, #7c3aed); font-size: 16px; }
.btn-link-sm {
  font-size: 13px; color: var(--color-accent, #7c3aed);
  text-decoration: none; font-weight: 500;
}
.btn-link-sm:hover { text-decoration: underline; }

/* ─── Addresses ─── */
.form-card {
  background: var(--color-bg-secondary, #fafafa);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 12px;
  padding: 20px;
}
.form-card-title { margin: 0 0 16px; font-size: 15px; font-weight: 600; color: var(--color-text-primary); }
.addr-form { max-width: 100%; }
.addr-list { display: flex; flex-direction: column; gap: 12px; }
.addr-card {
  display: flex; justify-content: space-between; align-items: flex-start;
  padding: 16px; border-radius: 12px;
  border: 1px solid var(--color-border, #e5e7eb);
  background: var(--color-bg-secondary, #fafafa);
  transition: border-color 0.2s;
}
.addr-card:hover { border-color: var(--color-accent, #7c3aed); }
.addr-name { display: flex; align-items: center; gap: 10px; margin-bottom: 4px; }
.addr-name strong { font-size: 14px; color: var(--color-text-primary); }
.addr-phone {
  font-size: 12px; color: var(--color-text-secondary);
  background: var(--color-bg-card, #fff);
  padding: 2px 8px; border-radius: 6px;
  border: 1px solid var(--color-border, #e5e7eb);
}
.addr-line { margin: 0; font-size: 13px; color: var(--color-text-primary, #333); }
.addr-region { margin: 2px 0 0; font-size: 12px; color: var(--color-text-secondary, #888); }
.addr-actions { display: flex; gap: 6px; flex-shrink: 0; }
.btn-action {
  width: 34px; height: 34px;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 8px; background: var(--color-bg-card, #fff);
  cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.btn-action:hover { border-color: var(--color-accent); background: rgba(124,58,237,0.05); }
.btn-action.btn-danger:hover { border-color: #ef4444; background: #fef2f2; }

/* ─── Responsive ─── */
@media (max-width: 768px) {
  .account-container { flex-direction: column; }
  .account-sidebar { width: 100%; }
  .account-nav { flex-direction: row; flex-wrap: wrap; }
  .account-nav button { flex: 1; min-width: 120px; justify-content: center; }
  .nav-divider { display: none; }
  .tab-content { padding: 20px; }
  .profile-form { max-width: 100%; }
  .field-row { flex-direction: column; gap: 12px; }
}
</style>
