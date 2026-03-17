<template>
  <div class="profile-overlay" @click.self="$emit('close')">
    <div class="profile-modal">
      <!-- Header -->
      <div class="pm-header">
        <h3><UserCircle :size="18" /> Hồ Sơ Cá Nhân</h3>
        <button class="pm-close" @click="$emit('close')"><X :size="18" /></button>
      </div>

      <div class="pm-body">
        <!-- User Card -->
        <div class="pm-card">
          <div class="pm-avatar" :style="avatarStyle">
            {{ initials }}
          </div>
          <div class="pm-user-info">
            <span class="pm-user-name">{{ displayName }}</span>
            <span class="pm-user-email">{{ currentUser?.email }}</span>
            <span class="pm-user-role" v-if="roleName">
              <Shield :size="12" /> {{ roleName }}
            </span>
          </div>
        </div>

        <!-- Update Name -->
        <div class="pm-section">
          <h4><PenLine :size="14" /> Đổi tên hiển thị</h4>
          <div class="pm-field-row">
            <div class="pm-input-wrap">
              <input
                v-model="fullName"
                placeholder="Nhập tên hiển thị..."
                class="pm-input"
                @keyup.enter="updateProfile"
              />
            </div>
            <button class="pm-btn pm-btn--primary" @click="updateProfile" :disabled="saving || !fullName.trim()">
              <Check :size="14" />
              {{ saving ? 'Đang lưu...' : 'Lưu' }}
            </button>
          </div>
        </div>

        <!-- Change Password -->
        <div class="pm-section">
          <h4><Lock :size="14" /> Đổi mật khẩu</h4>
          <div class="pm-input-wrap">
            <Lock :size="14" class="pm-input-icon" />
            <input
              v-model="currentPassword"
              :type="showCurrentPw ? 'text' : 'password'"
              placeholder="Mật khẩu hiện tại"
              class="pm-input pm-input--icon pm-input--eye"
            />
            <button type="button" class="pm-eye-btn" @click="showCurrentPw = !showCurrentPw" tabindex="-1">
              <component :is="showCurrentPw ? EyeOff : Eye" :size="14" />
            </button>
          </div>
          <div class="pm-input-wrap">
            <KeyRound :size="14" class="pm-input-icon" />
            <input
              v-model="newPassword"
              :type="showNewPw ? 'text' : 'password'"
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              class="pm-input pm-input--icon pm-input--eye"
              @keyup.enter="changePassword"
            />
            <button type="button" class="pm-eye-btn" @click="showNewPw = !showNewPw" tabindex="-1">
              <component :is="showNewPw ? EyeOff : Eye" :size="14" />
            </button>
          </div>
          <button
            class="pm-btn pm-btn--secondary pm-btn--full"
            @click="changePassword"
            :disabled="savingPw || !currentPassword || !newPassword || newPassword.length < 6"
          >
            <RefreshCw :size="14" />
            {{ savingPw ? 'Đang đổi...' : 'Đổi mật khẩu' }}
          </button>
        </div>

        <!-- Feedback Message -->
        <Transition name="pm-msg">
          <div v-if="message" class="pm-message" :class="'pm-message--' + messageType">
            <component :is="messageType === 'success' ? CheckCircle2 : AlertCircle" :size="14" />
            {{ message }}
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  UserCircle, X, PenLine, Lock, KeyRound, Check,
  RefreshCw, Shield, CheckCircle2, AlertCircle, Eye, EyeOff
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'

const props = defineProps({
  currentUser: Object,
})
const emit = defineEmits(['close', 'updated'])

const fullName = ref(props.currentUser?.full_name || props.currentUser?.fullName || '')
const currentPassword = ref('')
const newPassword = ref('')
const saving = ref(false)
const showCurrentPw = ref(false)
const showNewPw = ref(false)
const savingPw = ref(false)
const message = ref('')
const messageType = ref('success')

const displayName = computed(() =>
  props.currentUser?.full_name || props.currentUser?.fullName || props.currentUser?.email || 'User'
)

const roleName = computed(() => {
  const role = props.currentUser?.role
  if (!role) return ''
  if (typeof role === 'string') return role
  return role?.display_name || role?.name || ''
})

const initials = computed(() => {
  const name = displayName.value
  const parts = name.split(/[\s@]+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})

const avatarStyle = computed(() => {
  const colors = [
    ['#6366f1', '#8b5cf6'], ['#ec4899', '#f43f5e'], ['#f59e0b', '#ef4444'],
    ['#10b981', '#14b8a6'], ['#3b82f6', '#6366f1'], ['#8b5cf6', '#ec4899'],
  ]
  const hash = (props.currentUser?.email || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const [from, to] = colors[hash % colors.length]
  return { background: `linear-gradient(135deg, ${from}, ${to})` }
})

let msgTimeout = null
function showMsg(text, type = 'success') {
  message.value = text
  messageType.value = type
  if (msgTimeout) clearTimeout(msgTimeout)
  msgTimeout = setTimeout(() => { message.value = '' }, 4000)
}

async function updateProfile() {
  if (!fullName.value.trim()) return
  saving.value = true
  try {
    const res = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ full_name: fullName.value.trim() }),
    })
    const data = await res.json()
    if (res.ok) {
      showMsg('Đã cập nhật tên thành công')
      // Update localStorage with new user data
      const stored = JSON.parse(localStorage.getItem('auth_user') || '{}')
      stored.full_name = fullName.value.trim()
      stored.fullName = fullName.value.trim()
      localStorage.setItem('auth_user', JSON.stringify(stored))
      emit('updated', { ...stored, ...data })
    } else {
      showMsg(data?.message || data?.error || 'Lỗi cập nhật', 'error')
    }
  } catch (e) {
    showMsg('Lỗi kết nối: ' + e.message, 'error')
  }
  saving.value = false
}

async function changePassword() {
  if (!currentPassword.value || newPassword.value.length < 6) return
  savingPw.value = true
  try {
    const res = await apiFetch('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        current_password: currentPassword.value,
        new_password: newPassword.value,
      }),
    })
    const data = await res.json()
    if (res.ok) {
      showMsg('Đổi mật khẩu thành công')
      currentPassword.value = ''
      newPassword.value = ''
    } else {
      showMsg(data?.message || data?.error || 'Lỗi đổi mật khẩu', 'error')
    }
  } catch (e) {
    showMsg('Lỗi kết nối: ' + e.message, 'error')
  }
  savingPw.value = false
}
</script>

<style scoped>
/* ── Overlay ── */
.profile-overlay {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 10000;
  animation: pmFadeIn 0.2s ease;
}
@keyframes pmFadeIn { from { opacity: 0 } to { opacity: 1 } }

/* ── Modal ── */
.profile-modal {
  background: var(--bg-1, #fff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 16px;
  width: 440px; max-width: 92vw;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.12);
  animation: pmSlideUp 0.3s ease;
  overflow: hidden;
}
@keyframes pmSlideUp {
  from { transform: translateY(20px); opacity: 0 }
  to { transform: translateY(0); opacity: 1 }
}

/* ── Header ── */
.pm-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border, #e5e7eb);
}
.pm-header h3 {
  margin: 0; font-size: 16px; font-weight: 700;
  display: flex; align-items: center; gap: 8px;
  color: var(--text-1, #111);
}
.pm-close {
  width: 32px; height: 32px; border-radius: 8px;
  border: 1px solid var(--border, #e5e7eb);
  background: var(--bg-2, #f9fafb);
  color: var(--text-3, #9ca3af);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s;
}
.pm-close:hover {
  background: #fee2e2; color: #ef4444;
  border-color: #fecaca;
}

/* ── Body ── */
.pm-body { padding: 20px 24px 24px; }

/* ── User Card ── */
.pm-card {
  display: flex; align-items: center; gap: 16px;
  padding: 16px;
  background: var(--bg-2, #f9fafb);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  margin-bottom: 20px;
}
.pm-avatar {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; font-weight: 800; color: #fff;
  flex-shrink: 0;
}
.pm-user-info {
  display: flex; flex-direction: column; gap: 2px;
  min-width: 0;
}
.pm-user-name {
  font-size: 15px; font-weight: 700;
  color: var(--text-1, #111);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pm-user-email {
  font-size: 12px; color: var(--text-3, #9ca3af);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pm-user-role {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 11px; font-weight: 600;
  color: var(--accent, #6366f1);
  background: rgba(99, 102, 241, 0.08);
  padding: 2px 8px; border-radius: 6px;
  width: fit-content; margin-top: 2px;
  text-transform: capitalize;
}

/* ── Sections ── */
.pm-section {
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--border, #e5e7eb);
}
.pm-section:last-of-type { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
.pm-section h4 {
  margin: 0 0 12px;
  font-size: 13px; font-weight: 600;
  color: var(--text-2, #6b7280);
  display: flex; align-items: center; gap: 6px;
}

/* ── Inputs ── */
.pm-input-wrap {
  position: relative;
  margin-bottom: 8px;
  flex: 1;
}
.pm-input-icon {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--text-3, #9ca3af);
  pointer-events: none;
}
.pm-input {
  width: 100%; padding: 10px 14px;
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 10px;
  background: var(--bg-1, #fff);
  color: var(--text-1, #111);
  font-size: 13px; outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pm-input--icon { padding-left: 36px; }
.pm-input:focus {
  border-color: var(--accent, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}
.pm-input::placeholder { color: var(--text-3, #9ca3af); }
.pm-input--eye { padding-right: 38px; }

/* ── Eye Toggle ── */
.pm-eye-btn {
  position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
  background: none; border: none; padding: 4px 6px;
  color: var(--text-3, #9ca3af); cursor: pointer;
  border-radius: 6px; display: flex; align-items: center;
  transition: color 0.15s, background 0.15s;
}
.pm-eye-btn:hover {
  color: var(--text-1, #111);
  background: var(--bg-2, #f3f4f6);
}

/* ── Field Row ── */
.pm-field-row {
  display: flex; gap: 8px; align-items: flex-start;
}

/* ── Buttons ── */
.pm-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 20px; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  border: none; cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.pm-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pm-btn--primary {
  background: var(--accent, #6366f1);
  color: #fff;
}
.pm-btn--primary:hover:not(:disabled) {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

.pm-btn--secondary {
  background: var(--bg-2, #f9fafb);
  color: var(--text-1, #111);
  border: 1px solid var(--border, #e5e7eb);
}
.pm-btn--secondary:hover:not(:disabled) {
  background: var(--accent, #6366f1);
  color: #fff;
  border-color: var(--accent, #6366f1);
}

.pm-btn--full { width: 100%; margin-top: 4px; }

/* ── Message ── */
.pm-message {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px; border-radius: 10px;
  font-size: 13px; font-weight: 500;
  margin-top: 16px;
}
.pm-message--success {
  background: rgba(16, 185, 129, 0.08);
  color: #059669;
  border: 1px solid rgba(16, 185, 129, 0.2);
}
.pm-message--error {
  background: rgba(239, 68, 68, 0.08);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

/* ── Transitions ── */
.pm-msg-enter-active { animation: pmSlideDown 0.3s ease; }
.pm-msg-leave-active { animation: pmSlideDown 0.2s ease reverse; }
@keyframes pmSlideDown {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
