<template>
  <div class="schedule-planner">
    <div class="sp-header">
      <h2>📅 Lịch Livestream</h2>
      <button class="btn-add" @click="showModal = true">+ Lên lịch</button>
    </div>

    <!-- Upcoming -->
    <div class="schedule-list">
      <div
        v-for="s in schedules"
        :key="s.id"
        class="schedule-card"
        :class="s.status"
      >
        <div class="card-top">
          <span class="platform-icon">{{ platformIcons[s.platform] || '📡' }}</span>
          <span class="schedule-status" :class="s.status">{{ statusLabels[s.status] }}</span>
        </div>
        <h3>{{ s.title }}</h3>
        <p class="schedule-time">
          🕐 {{ formatDateTime(s.scheduledAt) }}
          <span class="duration">• {{ s.durationMinutes }} phút</span>
        </p>
        <p class="schedule-desc" v-if="s.description">{{ s.description }}</p>
        <div class="card-actions">
          <button v-if="s.status === 'scheduled'" @click="cancelSchedule(s)" class="btn-cancel-s">Hủy</button>
          <button v-if="s.status === 'scheduled'" @click="goLive(s)" class="btn-live">🔴 Go Live</button>
        </div>
      </div>
      <div v-if="schedules.length === 0" class="empty">
        <p>📅 Chưa có lịch livestream nào</p>
        <p class="sub">Lên lịch để chuẩn bị tốt hơn cho buổi live</p>
      </div>
    </div>

    <!-- Create Modal -->
    <div class="modal-overlay" v-if="showModal" @click.self="showModal = false">
      <div class="modal">
        <h3>📝 Lên lịch Livestream</h3>
        <div class="form-group">
          <label>Tiêu đề</label>
          <input v-model="form.title" placeholder="Live bán hàng 20/03" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Ngày giờ</label>
            <input type="datetime-local" v-model="form.scheduledAt" />
          </div>
          <div class="form-group">
            <label>Thời lượng (phút)</label>
            <input type="number" v-model.number="form.durationMinutes" />
          </div>
        </div>
        <div class="form-group">
          <label>Nền tảng</label>
          <select v-model="form.platform">
            <option value="tiktok">🎵 TikTok</option>
            <option value="shopee">🛒 Shopee</option>
            <option value="facebook">📘 Facebook</option>
            <option value="youtube">🎬 YouTube</option>
          </select>
        </div>
        <div class="form-group">
          <label>Script / Kịch bản</label>
          <textarea v-model="form.script" rows="4" placeholder="1. Chào khán giả&#10;2. Giới thiệu sản phẩm mới&#10;3. Flash sale..."></textarea>
        </div>
        <div class="form-group">
          <label>Mô tả</label>
          <input v-model="form.description" placeholder="Mô tả ngắn..." />
        </div>
        <div class="modal-actions">
          <button class="btn-cancel" @click="showModal = false">Hủy</button>
          <button class="btn-create" @click="createSchedule">Tạo lịch</button>
        </div>
      </div>
    </div>
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
  try {
    await apiFetch('/schedules', {
      method: 'POST',
      body: JSON.stringify({ ...form.value, shopId: props.shopId })
    })
    showModal.value = false
    form.value = { title: '', scheduledAt: '', durationMinutes: 60, platform: 'tiktok', script: '', description: '' }
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
    fetchSchedules()
  } catch { /* silent */ }
}

function goLive(s) {
  showToast(`Sẵn sàng live: ${s.title} — ${s.platform}`, 'info')
}

function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('vi-VN', {
    weekday: 'short', day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}
</script>

<style scoped>
.schedule-planner { padding: 0; }
.sp-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.sp-header h2 { margin: 0; font-size: 20px; }
.btn-add {
  background: #7c3aed; color: #fff; border: none; padding: 8px 16px;
  border-radius: 6px; font-weight: 600; cursor: pointer;
}
.btn-add:hover { background: #6d28d9; }

.schedule-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }

.schedule-card {
  background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px; padding: 16px; transition: 0.2s;
}
.schedule-card:hover { border-color: rgba(255,255,255,0.15); }
.schedule-card.live { border-color: #ef4444; background: rgba(239,68,68,0.08); }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.platform-icon { font-size: 20px; }
.schedule-status {
  font-size: 11px; padding: 3px 8px; border-radius: 4px; font-weight: 600;
}
.schedule-status.scheduled { background: #312e8133; color: #a5b4fc; }
.schedule-status.live { background: #7f1d1d33; color: #fca5a5; }
.schedule-status.completed { background: #14532d33; color: #86efac; }
.schedule-status.cancelled { background: rgba(255,255,255,0.05); color: #666; }

.schedule-card h3 { margin: 0 0 6px 0; font-size: 15px; }
.schedule-time { color: #999; font-size: 12px; margin: 4px 0; }
.duration { color: #666; }
.schedule-desc { color: #888; font-size: 12px; margin: 8px 0 0 0; }

.card-actions { display: flex; gap: 8px; margin-top: 12px; }
.btn-cancel-s {
  background: rgba(255,255,255,0.1); color: #ccc; border: none;
  padding: 6px 14px; border-radius: 6px; cursor: pointer; font-size: 12px;
}
.btn-live {
  background: #dc2626; color: #fff; border: none;
  padding: 6px 14px; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;
}
.btn-live:hover { background: #b91c1c; }

.empty { text-align: center; padding: 40px; color: #666; }
.empty p { margin: 4px 0; }
.empty .sub { font-size: 12px; }

.modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0,0,0,0.6); display: flex; align-items: center;
  justify-content: center; z-index: 1000;
}
.modal {
  background: #1a1a2e; border-radius: 12px; padding: 24px;
  width: 480px; max-width: 90vw;
}
.modal h3 { margin: 0 0 16px 0; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; color: #999; margin-bottom: 4px; }
.form-group input, .form-group textarea, .form-group select {
  width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  color: #fff; padding: 8px 12px; border-radius: 6px; font-size: 13px;
  font-family: inherit; box-sizing: border-box;
}
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.btn-cancel {
  background: rgba(255,255,255,0.1); color: #ccc; border: none;
  padding: 8px 16px; border-radius: 6px; cursor: pointer;
}
.btn-create {
  background: #7c3aed; color: #fff; border: none;
  padding: 8px 20px; border-radius: 6px; font-weight: 600; cursor: pointer;
}
.btn-create:hover { background: #6d28d9; }
</style>
