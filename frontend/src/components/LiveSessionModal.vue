<template>
  <Teleport to="body">
    <div class="lsm-overlay" @click.self="$emit('close')">
      <div class="lsm">
        <!-- Header -->
        <div class="lsm__header">
          <h3>🔴 Bắt đầu phiên Live</h3>
          <button class="lsm__close" @click="$emit('close')">✕</button>
        </div>

        <!-- Platform Tabs -->
        <div class="lsm__tabs">
          <button
            v-for="p in platforms" :key="p.key"
            class="lsm__tab" :class="{ 'lsm__tab--active': platform === p.key }"
            @click="platform = p.key"
          >
            <span class="lsm__tab-icon">{{ p.icon }}</span>
            <span>{{ p.label }}</span>
          </button>
        </div>

        <!-- Dynamic Input -->
        <div class="lsm__form">
          <label class="lsm__label">{{ inputLabel }}</label>
          <input
            v-model="identifier"
            class="lsm__input"
            :placeholder="inputPlaceholder"
            @keyup.enter="onStart(false)"
            ref="identifierInput"
          />

          <label class="lsm__label">Tên phiên <span class="lsm__optional">(optional)</span></label>
          <input
            v-model="sessionName"
            class="lsm__input"
            :placeholder="defaultSessionName"
          />

          <!-- Actions -->
          <div class="lsm__actions">
            <button class="lsm__btn lsm__btn--live" @click="onStart(false)" :disabled="!identifier.trim() || loading">
              <span v-if="loading" class="lsm__spinner"></span>
              <span v-else>🔴</span>
              Bắt đầu Live
            </button>
            <button class="lsm__btn lsm__btn--mock" @click="onStart(true)" :disabled="loading">
              🎭 Mock
            </button>
          </div>
        </div>

        <!-- Recent Sessions -->
        <div class="lsm__recent" v-if="recentSessions.length > 0">
          <div class="lsm__recent-title">Phiên gần đây</div>
          <div
            v-for="s in recentSessions" :key="s.id"
            class="lsm__recent-item"
            @click="fillFromSession(s)"
          >
            <span class="lsm__recent-icon">{{ platformIcon(s.platform) }}</span>
            <span class="lsm__recent-name">{{ s.shop_name }}</span>
            <span class="lsm__recent-id">{{ sessionIdentifier(s) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const getHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token')}`,
})

const emit = defineEmits(['close', 'started'])

const platforms = [
  { key: 'tiktok', label: 'TikTok', icon: '🎵' },
  { key: 'facebook', label: 'Facebook', icon: '📘' },
  { key: 'youtube', label: 'YouTube', icon: '🎬' },
  { key: 'shopee', label: 'Shopee', icon: '🛒' },
]

const platform = ref('tiktok')
const identifier = ref('')
const sessionName = ref('')
const loading = ref(false)
const recentSessions = ref([])
const identifierInput = ref(null)

const inputLabel = computed(() => {
  const labels = {
    tiktok: 'TikTok Username',
    facebook: 'Facebook Page ID',
    youtube: 'YouTube Video/Channel URL',
    shopee: 'Shopee Shop ID',
  }
  return labels[platform.value]
})

const inputPlaceholder = computed(() => {
  const ph = {
    tiktok: '@username',
    facebook: 'Page ID hoặc tên Page',
    youtube: 'https://youtube.com/watch?v=xxx',
    shopee: 'Shop ID',
  }
  return ph[platform.value]
})

const defaultSessionName = computed(() => {
  const now = new Date()
  const d = `${now.getDate().toString().padStart(2,'0')}/${(now.getMonth()+1).toString().padStart(2,'0')}`
  const t = `${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`
  return `Phiên live ${d} ${t}`
})

function platformIcon(p) {
  const icons = { tiktok: '🎵', facebook: '📘', youtube: '🎬', shopee: '🛒' }
  return icons[p] || '📡'
}

function sessionIdentifier(s) {
  return s.tiktok_username ? `@${s.tiktok_username}`
    : s.facebook_page_id || s.youtube_channel || s.shopee_shop_id || ''
}

function fillFromSession(s) {
  platform.value = s.platform || 'tiktok'
  identifier.value = s.tiktok_username || s.facebook_page_id || s.youtube_channel || s.shopee_shop_id || ''
  sessionName.value = s.shop_name || ''
}

async function fetchRecent() {
  try {
    const res = await fetch(`${API}/shops`, { headers: getHeaders() })
    const shops = await res.json()
    recentSessions.value = shops.slice(0, 5)
  } catch { /* silent */ }
}

async function onStart(mock) {
  const id = identifier.value.trim()
  if (!id && !mock) return
  loading.value = true

  try {
    // 1. Find or create shop
    const body = {
      platform: platform.value,
      sessionName: sessionName.value || defaultSessionName.value,
    }
    if (platform.value === 'tiktok') body.tiktokUsername = id
    else if (platform.value === 'facebook') body.facebookPageId = id
    else if (platform.value === 'youtube') body.youtubeChannel = id
    else if (platform.value === 'shopee') body.shopeeShopId = id

    const shopRes = await fetch(`${API}/shops/find-or-create`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    })
    const shop = await shopRes.json()
    if (!shopRes.ok) throw new Error(shop.error || 'Failed')

    // 2. Connect or mock
    const endpoint = mock ? `/shops/${shop.id}/mock` : `/shops/${shop.id}/connect`
    await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(mock ? {} : {}),
    })

    emit('started', shop, mock)
    emit('close')
  } catch (err) {
    console.error('LiveSession error:', err)
    alert(err.message || 'Có lỗi xảy ra')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await fetchRecent()
  await nextTick()
  identifierInput.value?.focus()
})
</script>

<style scoped>
.lsm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

.lsm {
  width: 420px; max-height: 90vh; overflow-y: auto;
  background: var(--color-bg-secondary, #1a1a2e);
  border: 1px solid var(--color-border, #2a2a4a);
  border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  animation: slideUp 0.25s ease-out;
}
@keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

.lsm__header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 18px 20px 12px;
}
.lsm__header h3 { font-size: 16px; font-weight: 700; margin: 0; }
.lsm__close {
  background: none; border: none; color: var(--color-text-muted, #888);
  font-size: 18px; cursor: pointer; padding: 4px;
}
.lsm__close:hover { color: var(--color-text-primary, #fff); }

/* Tabs */
.lsm__tabs {
  display: flex; gap: 4px; padding: 0 16px 12px;
}
.lsm__tab {
  flex: 1; display: flex; align-items: center; justify-content: center;
  gap: 4px; padding: 8px 4px; border-radius: 8px; border: 1px solid transparent;
  background: var(--color-bg-primary, #10101e); color: var(--color-text-muted, #888);
  font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.lsm__tab:hover { color: var(--color-text-primary, #fff); border-color: var(--color-border, #2a2a4a); }
.lsm__tab--active {
  background: linear-gradient(135deg, rgba(255,59,92,0.15), rgba(255,140,66,0.15));
  color: #ff3b5c; border-color: rgba(255,59,92,0.4); font-weight: 700;
}
.lsm__tab-icon { font-size: 16px; }

/* Form */
.lsm__form { padding: 0 20px 16px; }
.lsm__label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--color-text-secondary, #aaa); margin-bottom: 4px; margin-top: 12px;
}
.lsm__label:first-child { margin-top: 0; }
.lsm__optional { font-weight: 400; color: var(--color-text-muted, #666); }
.lsm__input {
  width: 100%; padding: 10px 12px; border-radius: 8px;
  border: 1px solid var(--color-border, #2a2a4a);
  background: var(--color-bg-primary, #10101e);
  color: var(--color-text-primary, #fff);
  font-size: 13px; outline: none; transition: border-color 0.2s;
  box-sizing: border-box;
}
.lsm__input:focus { border-color: #ff3b5c; }
.lsm__input::placeholder { color: var(--color-text-muted, #555); }

/* Actions */
.lsm__actions {
  display: flex; gap: 8px; margin-top: 16px;
}
.lsm__btn {
  flex: 1; padding: 10px 16px; border-radius: 8px; border: none;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center; gap: 6px;
}
.lsm__btn:disabled { opacity: 0.5; cursor: not-allowed; }
.lsm__btn--live {
  background: linear-gradient(135deg, #ff3b5c, #e63350); color: white;
  flex: 2; box-shadow: 0 4px 16px rgba(255,59,92,0.3);
}
.lsm__btn--live:hover:not(:disabled) { background: linear-gradient(135deg, #e63350, #cc2a44); transform: translateY(-1px); }
.lsm__btn--mock {
  background: var(--color-bg-primary, #10101e); color: var(--color-text-secondary, #aaa);
  border: 1px solid var(--color-border, #2a2a4a);
}
.lsm__btn--mock:hover:not(:disabled) { color: var(--color-text-primary, #fff); border-color: var(--color-text-muted, #666); }

.lsm__spinner {
  width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white; border-radius: 50%; animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Recent */
.lsm__recent {
  border-top: 1px solid var(--color-border, #2a2a4a);
  padding: 12px 20px 16px;
}
.lsm__recent-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  color: var(--color-text-muted, #666); margin-bottom: 8px; letter-spacing: 0.5px;
}
.lsm__recent-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s;
}
.lsm__recent-item:hover { background: var(--color-bg-primary, rgba(255,255,255,0.03)); }
.lsm__recent-icon { font-size: 16px; }
.lsm__recent-name { font-size: 13px; font-weight: 600; flex: 1; }
.lsm__recent-id { font-size: 11px; color: var(--color-text-muted, #888); }
</style>
