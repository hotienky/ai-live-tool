<template>
  <div class="schedule-planner">
    <div class="sp-header">
      <div class="sp-header__left">
        <h2 class="sp-header__title">📅 Lịch Livestream</h2>
        <span class="sp-header__count" v-if="schedules.length">{{ schedules.length }} lịch</span>
      </div>
      <button class="sp-btn-add" @click="showModal = true">
        <span class="sp-btn-add__icon">+</span> Lên lịch
      </button>
    </div>

    <!-- Schedule Cards -->
    <div class="sp-grid" v-if="schedules.length > 0">
      <div
        v-for="s in schedules"
        :key="s.id"
        class="sp-card"
        :class="`sp-card--${s.status}`"
      >
        <div class="sp-card__header">
          <div class="sp-card__platform">
            <span class="sp-card__platform-icon">{{ platformIcons[s.platform] || '📡' }}</span>
            <span class="sp-card__platform-name">{{ platformNames[s.platform] || 'Khác' }}</span>
          </div>
          <span class="sp-card__badge" :class="`sp-card__badge--${s.status}`">
            {{ statusLabels[s.status] }}
          </span>
        </div>

        <h3 class="sp-card__title">{{ s.title || 'Chưa đặt tên' }}</h3>

        <div class="sp-card__info">
          <div class="sp-card__info-row" v-if="s.scheduledAt || s.scheduled_at">
            <span class="sp-card__info-icon">🕐</span>
            <span>{{ formatDateTime(s.scheduledAt || s.scheduled_at) }}</span>
          </div>
          <div class="sp-card__info-row" v-if="s.durationMinutes || s.duration_minutes">
            <span class="sp-card__info-icon">⏱️</span>
            <span>{{ s.durationMinutes || s.duration_minutes }} phút</span>
          </div>
        </div>

        <p class="sp-card__desc" v-if="s.description">{{ s.description }}</p>

        <div class="sp-card__script-preview" v-if="s.script">
          <span class="sp-card__script-label">📝 Kịch bản</span>
          <p class="sp-card__script-text">{{ (s.script || '').substring(0, 80) }}{{ (s.script || '').length > 80 ? '...' : '' }}</p>
        </div>

        <div class="sp-card__actions" v-if="s.status === 'scheduled'">
          <button class="sp-card__btn sp-card__btn--cancel" @click="cancelSchedule(s)">
            ✕ Hủy
          </button>
          <button class="sp-card__btn sp-card__btn--live" @click="goLive(s)">
            🔴 Go Live
          </button>
        </div>
        <div class="sp-card__actions" v-else-if="s.status === 'completed'">
          <button class="sp-card__btn sp-card__btn--delete" @click="deleteSchedule(s)">
            🗑️ Xóa
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="sp-empty" v-else>
      <div class="sp-empty__icon">📅</div>
      <h3 class="sp-empty__title">Chưa có lịch livestream nào</h3>
      <p class="sp-empty__desc">Lên lịch để chuẩn bị tốt hơn cho buổi live.<br/>Thêm script, chọn nền tảng và set thời gian!</p>
      <button class="sp-btn-add sp-btn-add--lg" @click="showModal = true">
        <span class="sp-btn-add__icon">+</span> Tạo lịch đầu tiên
      </button>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div class="sp-overlay" v-if="showModal" @click.self="showModal = false">
        <div class="sp-modal">
          <div class="sp-modal__header">
            <h3>📝 Lên lịch Livestream</h3>
            <button class="sp-modal__close" @click="showModal = false">✕</button>
          </div>

          <div class="sp-modal__body">
            <div class="sp-form-group">
              <label>Tiêu đề <span class="sp-required">*</span></label>
              <input v-model="form.title" placeholder="VD: Live bán hàng 20/03" class="sp-input" />
            </div>

            <div class="sp-form-row">
              <div class="sp-form-group">
                <label>Ngày giờ <span class="sp-required">*</span></label>
                <input type="datetime-local" v-model="form.scheduledAt" class="sp-input" />
              </div>
              <div class="sp-form-group">
                <label>Thời lượng</label>
                <div class="sp-input-suffix">
                  <input type="number" v-model.number="form.durationMinutes" class="sp-input" min="10" />
                  <span class="sp-suffix">phút</span>
                </div>
              </div>
            </div>

            <div class="sp-form-group">
              <label>Nền tảng</label>
              <div class="sp-platform-select">
                <button
                  v-for="(icon, key) in platformIcons"
                  :key="key"
                  class="sp-platform-btn"
                  :class="{ 'sp-platform-btn--active': form.platform === key }"
                  @click="form.platform = key"
                >
                  {{ icon }} {{ platformNames[key] }}
                </button>
              </div>
            </div>

            <div class="sp-form-group">
              <label>Script / Kịch bản</label>
              <textarea
                v-model="form.script"
                rows="4"
                class="sp-input sp-textarea"
                placeholder="1. Chào khán giả&#10;2. Giới thiệu sản phẩm mới&#10;3. Flash sale..."
              ></textarea>
            </div>

            <div class="sp-form-group">
              <label>Mô tả</label>
              <input v-model="form.description" placeholder="Ghi chú ngắn..." class="sp-input" />
            </div>
          </div>

          <div class="sp-modal__footer">
            <button class="sp-btn sp-btn--ghost" @click="showModal = false">Hủy</button>
            <button class="sp-btn sp-btn--primary" @click="createSchedule" :disabled="!form.title || !form.scheduledAt">
              ✨ Tạo lịch
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
const { showToast } = useToast()

const props = defineProps({
  shopId: [Number, String],
})

const schedules = ref([])
const showModal = ref(false)
const form = ref({
  title: '', scheduledAt: '', durationMinutes: 60,
  platform: 'tiktok', script: '', description: ''
})

const platformIcons = { tiktok: '🎵', shopee: '🛒', facebook: '📘', youtube: '🎬' }
const platformNames = { tiktok: 'TikTok', shopee: 'Shopee', facebook: 'Facebook', youtube: 'YouTube' }
const statusLabels = { scheduled: '📅 Đã lên lịch', live: '🔴 Đang live', completed: '✅ Hoàn thành', cancelled: '❌ Đã hủy' }

onMounted(fetchSchedules)

async function fetchSchedules() {
  try {
    let url = `/schedules`
    if (props.shopId) url += `?shopId=${props.shopId}`
    const res = await apiFetch(url)
    schedules.value = await res.json()
  } catch { schedules.value = [] }
}

async function createSchedule() {
  if (!form.value.title || !form.value.scheduledAt) {
    showToast('Vui lòng nhập tiêu đề và ngày giờ', 'error')
    return
  }
  try {
    await apiFetch('/schedules', {
      method: 'POST',
      body: JSON.stringify({ ...form.value, shopId: props.shopId })
    })
    showModal.value = false
    form.value = { title: '', scheduledAt: '', durationMinutes: 60, platform: 'tiktok', script: '', description: '' }
    showToast('Đã tạo lịch livestream! 🎉', 'success')
    fetchSchedules()
  } catch (err) { showToast('Lỗi: ' + err.message, 'error') }
}

async function cancelSchedule(s) {
  if (!confirm('Hủy lịch livestream này?')) return
  try {
    await apiFetch(`/schedules/${s.id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'cancelled' })
    })
    showToast('Đã hủy lịch', 'info')
    fetchSchedules()
  } catch { /* silent */ }
}

async function deleteSchedule(s) {
  if (!confirm('Xóa lịch này?')) return
  try {
    await apiFetch(`/schedules/${s.id}`, { method: 'DELETE' })
    fetchSchedules()
  } catch { /* silent */ }
}

function goLive(s) {
  showToast(`Sẵn sàng live: ${s.title} — ${platformNames[s.platform] || s.platform}`, 'info')
}

function formatDateTime(d) {
  if (!d) return '—'
  const date = new Date(d)
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
  const hours = date.getHours().toString().padStart(2, '0')
  const mins = date.getMinutes().toString().padStart(2, '0')
  return `${weekday}, ${day}/${month} • ${hours}:${mins}`
}
</script>

<style scoped>
.schedule-planner { padding: 0; }

/* Header */
.sp-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 24px;
}
.sp-header__left { display: flex; align-items: center; gap: 12px; }
.sp-header__title { margin: 0; font-size: 22px; font-weight: 800; }
.sp-header__count {
  background: rgba(124,58,237,0.15); color: #a78bfa;
  font-size: 12px; font-weight: 700; padding: 3px 10px;
  border-radius: 12px;
}

.sp-btn-add {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff; border: none; padding: 10px 20px;
  border-radius: 10px; font-weight: 700; cursor: pointer;
  font-size: 14px; display: flex; align-items: center; gap: 6px;
  transition: all 0.2s; box-shadow: 0 4px 15px rgba(124,58,237,0.3);
}
.sp-btn-add:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.4); }
.sp-btn-add--lg { padding: 12px 28px; font-size: 15px; margin-top: 16px; }
.sp-btn-add__icon { font-size: 18px; font-weight: 300; }

/* Grid */
.sp-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

/* Card */
.sp-card {
  background: linear-gradient(145deg, rgba(30,30,50,0.9), rgba(20,20,35,0.95));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px; padding: 20px;
  transition: all 0.3s ease;
  position: relative; overflow: hidden;
}
.sp-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 3px; border-radius: 16px 16px 0 0;
  background: linear-gradient(90deg, #7c3aed, #a78bfa);
  opacity: 0.6;
}
.sp-card:hover {
  border-color: rgba(124,58,237,0.3);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.3);
}
.sp-card--live { border-color: rgba(239,68,68,0.4); }
.sp-card--live::before { background: linear-gradient(90deg, #ef4444, #f87171); opacity: 1; }
.sp-card--completed { opacity: 0.65; }
.sp-card--cancelled { opacity: 0.45; }

/* Card Header */
.sp-card__header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.sp-card__platform {
  display: flex; align-items: center; gap: 6px;
}
.sp-card__platform-icon { font-size: 18px; }
.sp-card__platform-name { font-size: 12px; color: #a1a1aa; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

.sp-card__badge {
  font-size: 11px; padding: 4px 10px; border-radius: 20px;
  font-weight: 700; letter-spacing: 0.3px;
}
.sp-card__badge--scheduled { background: rgba(124,58,237,0.15); color: #a78bfa; }
.sp-card__badge--live { background: rgba(239,68,68,0.15); color: #f87171; animation: livePulse 2s infinite; }
.sp-card__badge--completed { background: rgba(16,185,129,0.15); color: #34d399; }
.sp-card__badge--cancelled { background: rgba(107,114,128,0.15); color: #6b7280; }

@keyframes livePulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Card Content */
.sp-card__title {
  margin: 0 0 10px 0; font-size: 16px; font-weight: 700;
  color: #f4f4f5;
}

.sp-card__info { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.sp-card__info-row {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; color: #a1a1aa;
}
.sp-card__info-icon { font-size: 13px; }

.sp-card__desc {
  font-size: 13px; color: #71717a; margin: 0 0 10px;
  line-height: 1.4;
}

.sp-card__script-preview {
  background: rgba(124,58,237,0.06); border: 1px solid rgba(124,58,237,0.12);
  border-radius: 8px; padding: 8px 10px; margin-bottom: 12px;
}
.sp-card__script-label { font-size: 11px; color: #a78bfa; font-weight: 700; display: block; margin-bottom: 4px; }
.sp-card__script-text { font-size: 12px; color: #a1a1aa; margin: 0; line-height: 1.4; }

/* Card Actions */
.sp-card__actions { display: flex; gap: 8px; margin-top: 12px; }
.sp-card__btn {
  padding: 7px 16px; border-radius: 8px; font-size: 12px;
  font-weight: 600; cursor: pointer; border: none; transition: all 0.2s;
}
.sp-card__btn--cancel {
  background: rgba(255,255,255,0.06); color: #a1a1aa;
  border: 1px solid rgba(255,255,255,0.1);
}
.sp-card__btn--cancel:hover { background: rgba(255,255,255,0.1); color: #d4d4d8; }
.sp-card__btn--live {
  background: linear-gradient(135deg, #dc2626, #ef4444);
  color: #fff; flex: 1;
  box-shadow: 0 4px 12px rgba(220,38,38,0.3);
}
.sp-card__btn--live:hover { transform: translateY(-1px); box-shadow: 0 6px 18px rgba(220,38,38,0.4); }
.sp-card__btn--delete {
  background: rgba(239,68,68,0.1); color: #f87171;
  border: 1px solid rgba(239,68,68,0.15);
}
.sp-card__btn--delete:hover { background: rgba(239,68,68,0.2); }

/* Empty State */
.sp-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px;
  text-align: center;
}
.sp-empty__icon { font-size: 56px; margin-bottom: 16px; opacity: 0.6; }
.sp-empty__title { font-size: 20px; font-weight: 700; margin: 0 0 8px; color: #d4d4d8; }
.sp-empty__desc { font-size: 14px; color: #71717a; line-height: 1.6; margin: 0; }

/* Modal */
.sp-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; animation: fadeIn 0.2s;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.sp-modal {
  background: linear-gradient(165deg, #1e1e32, #161625);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px; width: 520px; max-width: 92vw;
  max-height: 85vh; overflow-y: auto;
  box-shadow: 0 25px 80px rgba(0,0,0,0.5);
  animation: slideUp 0.3s ease-out;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }

.sp-modal__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px; border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sp-modal__header h3 { margin: 0; font-size: 18px; font-weight: 800; }
.sp-modal__close {
  background: rgba(255,255,255,0.06); border: none; color: #a1a1aa;
  width: 32px; height: 32px; border-radius: 8px; cursor: pointer;
  font-size: 16px; transition: all 0.2s;
}
.sp-modal__close:hover { background: rgba(255,255,255,0.1); color: #fff; }

.sp-modal__body { padding: 20px 24px; }

.sp-form-group { margin-bottom: 16px; }
.sp-form-group label {
  display: block; font-size: 13px; color: #a1a1aa;
  margin-bottom: 6px; font-weight: 600;
}
.sp-required { color: #ef4444; }

.sp-form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.sp-input {
  width: 100%; background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: #f4f4f5; padding: 10px 14px; border-radius: 10px;
  font-size: 14px; font-family: inherit; box-sizing: border-box;
  transition: all 0.2s; outline: none;
}
.sp-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.15); }
.sp-input::placeholder { color: #52525b; }
.sp-textarea { resize: vertical; min-height: 80px; }

.sp-input-suffix { position: relative; }
.sp-input-suffix .sp-input { padding-right: 50px; }
.sp-suffix {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  font-size: 12px; color: #71717a; pointer-events: none;
}

/* Platform Select */
.sp-platform-select { display: flex; gap: 8px; flex-wrap: wrap; }
.sp-platform-btn {
  padding: 8px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
  color: #a1a1aa; font-size: 13px; cursor: pointer;
  transition: all 0.2s; font-weight: 600;
}
.sp-platform-btn:hover { border-color: rgba(124,58,237,0.3); color: #d4d4d8; }
.sp-platform-btn--active {
  background: rgba(124,58,237,0.15); border-color: #7c3aed;
  color: #a78bfa;
}

/* Footer */
.sp-modal__footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 16px 24px; border-top: 1px solid rgba(255,255,255,0.06);
}
.sp-btn {
  padding: 10px 20px; border-radius: 10px; font-size: 14px;
  font-weight: 700; cursor: pointer; border: none;
  transition: all 0.2s;
}
.sp-btn--ghost {
  background: rgba(255,255,255,0.06); color: #a1a1aa;
}
.sp-btn--ghost:hover { background: rgba(255,255,255,0.1); color: #d4d4d8; }
.sp-btn--primary {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  color: #fff; box-shadow: 0 4px 15px rgba(124,58,237,0.3);
}
.sp-btn--primary:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(124,58,237,0.4); }
.sp-btn--primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
</style>
