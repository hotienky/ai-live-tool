<template>
  <div class="profile-overlay" @click.self="$emit('close')">
    <div class="profile-modal">
      <div class="profile-header">
        <h3>👤 Hồ Sơ Cá Nhân</h3>
        <button class="close-btn" @click="$emit('close')">&times;</button>
      </div>

      <div class="profile-body">
        <!-- User Info -->
        <div class="profile-section">
          <div class="profile-avatar">
            {{ initials }}
          </div>
          <div class="profile-info">
            <span class="profile-name">{{ currentUser?.fullName || currentUser?.email }}</span>
            <span class="profile-email">{{ currentUser?.email }}</span>
            <span class="profile-role">{{ currentUser?.role || 'user' }}</span>
          </div>
        </div>

        <!-- Update Name -->
        <div class="profile-section">
          <h4>📝 Đổi tên hiển thị</h4>
          <div class="form-row">
            <input
              v-model="fullName"
              placeholder="Tên của bạn"
              class="profile-input"
            />
            <button class="btn-save" @click="updateProfile" :disabled="saving">
              {{ saving ? '...' : 'Lưu' }}
            </button>
          </div>
        </div>

        <!-- Change Password -->
        <div class="profile-section">
          <h4>🔒 Đổi mật khẩu</h4>
          <input
            v-model="currentPassword"
            type="password"
            placeholder="Mật khẩu hiện tại"
            class="profile-input"
          />
          <input
            v-model="newPassword"
            type="password"
            placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
            class="profile-input"
          />
          <button
            class="btn-save btn-password"
            @click="changePassword"
            :disabled="savingPw || !currentPassword || !newPassword"
          >
            {{ savingPw ? '...' : '🔐 Đổi mật khẩu' }}
          </button>
        </div>

        <!-- Error/Success -->
        <div v-if="message" class="profile-message" :class="messageType">
          {{ message }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { apiFetch } from '../composables/useApi.js'

const props = defineProps({
  currentUser: Object,
})
const emit = defineEmits(['close', 'updated'])

const fullName = ref(props.currentUser?.fullName || '')
const currentPassword = ref('')
const newPassword = ref('')
const saving = ref(false)
const savingPw = ref(false)
const message = ref('')
const messageType = ref('success')

const initials = computed(() => {
  const name = props.currentUser?.fullName || props.currentUser?.email || '?'
  return name.slice(0, 2).toUpperCase()
})

async function updateProfile() {
  saving.value = true
  message.value = ''
  try {
    const res = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ fullName: fullName.value }),
    })
    const data = await res.json()
    if (res.ok) {
      messageType.value = 'success'
      message.value = '✅ Đã cập nhật tên'
      localStorage.setItem('auth_user', JSON.stringify(data))
      emit('updated', data)
    } else {
      messageType.value = 'error'
      message.value = data.error || 'Lỗi cập nhật'
    }
  } catch (e) {
    messageType.value = 'error'
    message.value = 'Lỗi kết nối: ' + e.message
  }
  saving.value = false
}

async function changePassword() {
  savingPw.value = true
  message.value = ''
  try {
    const res = await apiFetch('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      messageType.value = 'success'
      message.value = '✅ ' + (data.message || 'Đổi mật khẩu thành công')
      currentPassword.value = ''
      newPassword.value = ''
    } else {
      messageType.value = 'error'
      message.value = data.error || 'Lỗi đổi mật khẩu'
    }
  } catch (e) {
    messageType.value = 'error'
    message.value = 'Lỗi kết nối: ' + e.message
  }
  savingPw.value = false
}
</script>

<style scoped>
.profile-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); display: flex; align-items: center;
  justify-content: center; z-index: 10000;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.profile-modal {
  background: #1a1a2e; border: 1px solid rgba(255,255,255,0.1);
  border-radius: 16px; width: 420px; max-width: 90vw;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: scaleIn 0.25s ease;
}
@keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }

.profile-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 0; margin-bottom: 8px;
}
.profile-header h3 { margin: 0; font-size: 18px; font-weight: 700; }
.close-btn {
  background: none; border: none; color: #999; font-size: 22px;
  cursor: pointer; padding: 4px 8px;
}
.close-btn:hover { color: #fff; }

.profile-body { padding: 12px 24px 24px; }

.profile-section {
  margin-bottom: 20px; padding-bottom: 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.profile-section:last-child { border-bottom: none; margin-bottom: 0; }
.profile-section h4 { margin: 0 0 10px 0; font-size: 13px; color: #999; font-weight: 600; }

.profile-avatar {
  width: 56px; height: 56px; border-radius: 50%;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 800; color: #fff;
}
.profile-section:first-child {
  display: flex; align-items: center; gap: 16px;
}
.profile-info { display: flex; flex-direction: column; gap: 2px; }
.profile-name { font-size: 16px; font-weight: 700; }
.profile-email { font-size: 12px; color: #999; }
.profile-role {
  font-size: 11px; color: #818cf8; text-transform: uppercase;
  font-weight: 700; letter-spacing: 0.5px;
}

.form-row { display: flex; gap: 8px; }

.profile-input {
  width: 100%; padding: 10px 14px; border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.12);
  background: rgba(255,255,255,0.06); color: #fff;
  font-size: 13px; outline: none; box-sizing: border-box;
  margin-bottom: 8px;
}
.profile-input:focus { border-color: #ff3b5c; }
.profile-input::placeholder { color: #666; }

.btn-save {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #ff3b5c, #ff8c42);
  color: #fff; font-size: 13px; font-weight: 600; cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.btn-save:hover { transform: scale(1.02); }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-password { width: 100%; margin-top: 4px; }

.profile-message {
  padding: 10px 14px; border-radius: 8px; font-size: 13px;
  margin-top: 8px; text-align: center;
}
.profile-message.success { background: rgba(16,185,129,0.15); color: #6ee7b7; }
.profile-message.error { background: rgba(239,68,68,0.15); color: #fca5a5; }
</style>
