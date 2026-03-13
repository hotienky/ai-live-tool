<template>
  <div class="account-page">
    <div class="account-container">
      <div class="account-sidebar">
        <div class="account-avatar">
          <div class="avatar-circle">{{ initials }}</div>
          <div class="avatar-info">
            <h3>{{ customer?.firstName }} {{ customer?.lastName }}</h3>
            <p>{{ customer?.email }}</p>
          </div>
        </div>
        <nav class="account-nav">
          <button :class="{ active: tab === 'profile' }" @click="tab = 'profile'">👤 Thông tin</button>
          <button :class="{ active: tab === 'orders' }" @click="tab = 'orders'; loadOrders()">📦 Đơn hàng</button>
          <button :class="{ active: tab === 'password' }" @click="tab = 'password'">🔒 Đổi mật khẩu</button>
          <button class="logout-btn" @click="onLogout">🚪 Đăng xuất</button>
        </nav>
      </div>

      <div class="account-content">
        <!-- Profile Tab -->
        <div v-if="tab === 'profile'" class="tab-content">
          <h2>Thông tin tài khoản</h2>
          <form @submit.prevent="onUpdateProfile" class="profile-form">
            <div class="field-row">
              <div class="field">
                <label>Họ</label>
                <input v-model="profileForm.lastName" />
              </div>
              <div class="field">
                <label>Tên</label>
                <input v-model="profileForm.firstName" />
              </div>
            </div>
            <div class="field">
              <label>Email</label>
              <input :value="customer?.email" disabled class="disabled" />
            </div>
            <div class="field">
              <label>Số điện thoại</label>
              <input v-model="profileForm.phone" />
            </div>
            <div class="form-actions">
              <div class="save-msg" v-if="saveMsg">{{ saveMsg }}</div>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ saving ? 'Đang lưu...' : 'Cập nhật' }}
              </button>
            </div>
          </form>
        </div>

        <!-- Orders Tab -->
        <div v-if="tab === 'orders'" class="tab-content">
          <h2>Lịch sử đơn hàng</h2>
          <div v-if="ordersLoading" class="loading-state">Đang tải...</div>
          <div v-else-if="orders.length === 0" class="empty-state">
            <p>Chưa có đơn hàng nào</p>
            <router-link to="/products" class="btn-primary">Mua sắm ngay</router-link>
          </div>
          <div v-else class="orders-list">
            <div v-for="order in orders" :key="order.id" class="order-card">
              <div class="order-header">
                <span class="order-id">#{{ order.id }}</span>
                <span class="order-status" :style="{ background: statusColor(order.status) }">{{ statusLabel(order.status) }}</span>
              </div>
              <div class="order-info">
                <span>{{ formatDate(order.created_at) }}</span>
                <span class="order-total">{{ formatPrice(order.total_amount) }}</span>
              </div>
              <div class="order-items" v-if="order.items?.length">
                <span v-for="item in order.items.slice(0, 3)" :key="item.name" class="order-item-tag">
                  {{ item.name }} × {{ item.quantity }}
                </span>
                <span v-if="order.items.length > 3" class="order-more">+{{ order.items.length - 3 }} sản phẩm</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Change Password Tab -->
        <div v-if="tab === 'password'" class="tab-content">
          <h2>Đổi mật khẩu</h2>
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
              <div class="save-msg" v-if="pwMsg">{{ pwMsg }}</div>
              <div class="auth-error" v-if="pwError">{{ pwError }}</div>
              <button type="submit" class="btn-primary" :disabled="saving">Đổi mật khẩu</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '../composables/useAuth.js'
import { apiFetch } from '../api.js'

const router = useRouter()
const { customer, isLoggedIn, updateProfile, changePassword, logout, fetchProfile } = useAuth()

const tab = ref('profile')
const saving = ref(false)
const saveMsg = ref('')
const orders = ref([])
const ordersLoading = ref(false)
const pwMsg = ref('')
const pwError = ref('')

const profileForm = reactive({
  firstName: customer.value?.firstName || '',
  lastName: customer.value?.lastName || '',
  phone: customer.value?.phone || '',
})

const pwForm = reactive({ current: '', newPw: '', confirm: '' })

const initials = computed(() => {
  const f = customer.value?.firstName?.[0] || ''
  const l = customer.value?.lastName?.[0] || ''
  return (f + l).toUpperCase() || '?'
})

onMounted(() => {
  if (!isLoggedIn.value) router.push('/auth')
  else fetchProfile()
})

async function onUpdateProfile() {
  saving.value = true
  saveMsg.value = ''
  try {
    await updateProfile(profileForm)
    saveMsg.value = 'Đã cập nhật!'
    setTimeout(() => saveMsg.value = '', 3000)
  } catch (e) {
    saveMsg.value = 'Lỗi: ' + e.message
  } finally {
    saving.value = false
  }
}

async function loadOrders() {
  ordersLoading.value = true
  try {
    const data = await apiFetch('/orders', { limit: 50 })
    orders.value = data.data || data || []
  } catch {
    orders.value = []
  } finally {
    ordersLoading.value = false
  }
}

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

function onLogout() {
  logout()
  router.push('/')
}

const statusMap = {
  pending: { label: 'Chờ xác nhận', color: '#fbbf24' },
  confirmed: { label: 'Đã xác nhận', color: '#60a5fa' },
  processing: { label: 'Đang xử lý', color: '#a78bfa' },
  shipping: { label: 'Đang giao', color: '#22d3ee' },
  delivered: { label: 'Đã giao', color: '#34d399' },
  completed: { label: 'Hoàn thành', color: '#86efac' },
  cancelled: { label: 'Đã hủy', color: '#fca5a5' },
}
function statusLabel(s) { return statusMap[s]?.label || s }
function statusColor(s) { return statusMap[s]?.color || '#94a3b8' }
function formatDate(d) { return new Date(d).toLocaleDateString('vi-VN') }
function formatPrice(p) { return Number(p || 0).toLocaleString('vi-VN') + 'đ' }
</script>

<style scoped>
.account-page {
  max-width: 1000px;
  margin: 0 auto;
  padding: 32px 20px;
}
.account-container {
  display: flex;
  gap: 24px;
}
.account-sidebar {
  width: 240px;
  flex-shrink: 0;
}
.account-avatar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.avatar-circle {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 16px;
}
.avatar-info h3 { margin: 0; font-size: 15px; color: var(--color-text-primary, #333); }
.avatar-info p { margin: 2px 0 0; font-size: 12px; color: var(--color-text-secondary, #888); }
.account-nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.account-nav button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-text-secondary, #555);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.account-nav button:hover,
.account-nav button.active {
  background: var(--color-bg-secondary, #f5f5f5);
  color: var(--color-accent, #7c3aed);
  font-weight: 600;
}
.logout-btn { color: #ef4444 !important; }
.logout-btn:hover { background: #fef2f2 !important; }
.account-content {
  flex: 1;
  min-width: 0;
}
.tab-content h2 {
  margin: 0 0 20px;
  font-size: 20px;
  color: var(--color-text-primary, #333);
}
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 480px;
}
.field-row { display: flex; gap: 12px; }
.field-row .field { flex: 1; }
.field label {
  display: block; font-size: 13px; font-weight: 600;
  color: var(--color-text-secondary, #555);
  margin-bottom: 6px;
}
.field input {
  width: 100%; padding: 10px 14px; border-radius: 8px;
  border: 1px solid var(--color-border, #ddd);
  background: var(--color-bg-input, #fafafa);
  color: var(--color-text-primary, #333);
  font-size: 14px; outline: none; box-sizing: border-box;
}
.field input:focus {
  border-color: var(--color-accent, #7c3aed);
  box-shadow: 0 0 0 3px rgba(124,58,237,0.08);
}
.field input.disabled { opacity: 0.5; cursor: not-allowed; }
.form-actions { display: flex; align-items: center; gap: 12px; }
.btn-primary {
  padding: 10px 24px; border: none; border-radius: 8px;
  background: var(--color-accent, #7c3aed); color: #fff;
  font-weight: 600; font-size: 14px; cursor: pointer;
  text-decoration: none; display: inline-block;
}
.btn-primary:hover:not(:disabled) { opacity: 0.9; }
.btn-primary:disabled { opacity: 0.5; }
.save-msg { font-size: 13px; color: #16a34a; }
.auth-error { font-size: 13px; color: #dc2626; }
.loading-state, .empty-state {
  text-align: center; padding: 40px;
  color: var(--color-text-secondary, #888);
}
.orders-list { display: flex; flex-direction: column; gap: 12px; }
.order-card {
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 10px; padding: 16px;
  background: var(--color-bg-card, #fff);
}
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.order-id { font-weight: 700; font-size: 15px; color: var(--color-text-primary); }
.order-status {
  padding: 3px 10px; border-radius: 20px;
  font-size: 12px; font-weight: 600; color: #fff;
}
.order-info {
  display: flex; justify-content: space-between;
  font-size: 13px; color: var(--color-text-secondary, #888);
}
.order-total { font-weight: 700; color: var(--color-accent, #7c3aed); font-size: 15px; }
.order-items { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.order-item-tag {
  padding: 3px 8px; border-radius: 6px; font-size: 12px;
  background: var(--color-bg-secondary, #f5f5f5);
  color: var(--color-text-secondary, #666);
}
.order-more { font-size: 12px; color: var(--color-text-secondary); padding: 3px 0; }

@media (max-width: 640px) {
  .account-container { flex-direction: column; }
  .account-sidebar { width: 100%; }
}
</style>
