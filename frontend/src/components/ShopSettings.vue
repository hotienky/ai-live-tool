<template>
  <div class="settings">
    <div class="settings__header">
      <h2 class="settings__title">
        <Settings :size="20" />
        Cài đặt Shop
      </h2>
      <span class="settings__shop-name" v-if="currentShop">{{ currentShop.shop_name }}</span>
    </div>

    <div v-if="!currentShop" class="settings__empty">
      <Store :size="32" />
      <p>Chọn shop ở header để cấu hình</p>
    </div>

    <div v-else class="settings__body">
      <!-- Tab Switcher -->
      <div class="settings__tabs">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="settings__tab"
          :class="{ 'settings__tab--active': activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" :size="14" />
          {{ tab.label }}
        </button>
      </div>

      <!-- ═══ Tab: Connection ═══ -->
      <div v-if="activeTab === 'connection'" class="settings__panel">
        <h3 class="settings__panel-title">🔗 Kết nối nền tảng</h3>
        <div class="settings__field">
          <label>TikTok Username</label>
          <input v-model="shopForm.tiktok_username" type="text" placeholder="@username" class="settings__input" />
        </div>
        <div class="settings__field">
          <label>Shopee Shop ID</label>
          <input v-model="shopForm.shopee_shop_id" type="text" placeholder="Shop ID" class="settings__input" />
        </div>
        <div class="settings__field">
          <label>Facebook Page ID</label>
          <input v-model="shopForm.facebook_page_id" type="text" placeholder="Page ID" class="settings__input" />
        </div>
        <button class="settings__save-btn" @click="saveShopInfo">
          <Save :size="14" /> Lưu cấu hình
        </button>
      </div>

      <!-- ═══ Tab: Products ═══ -->
      <div v-if="activeTab === 'products'" class="settings__panel">
        <h3 class="settings__panel-title">🛍️ Sản phẩm ({{ products.length }})</h3>
        <div class="settings__add-row">
          <input v-model="newProduct.name" placeholder="Tên sản phẩm" class="settings__input settings__input--flex" />
          <input v-model="newProduct.price" type="number" placeholder="Giá" class="settings__input settings__input--sm" />
          <input v-model="newProduct.keywords" placeholder="Keywords (phân cách bằng dấu phẩy)" class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addProduct">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <div class="settings__list">
          <div v-for="p in products" :key="p.id" class="settings__list-item">
            <span class="settings__item-name">{{ p.name }}</span>
            <span class="settings__item-price">{{ Number(p.price || 0).toLocaleString() }}đ</span>
            <span class="settings__item-kw">{{ p.keywords }}</span>
            <button class="settings__del-btn" @click="deleteProduct(p.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="products.length === 0" class="settings__empty-list">Chưa có sản phẩm</p>
        </div>
      </div>

      <!-- ═══ Tab: Keywords ═══ -->
      <div v-if="activeTab === 'keywords'" class="settings__panel">
        <h3 class="settings__panel-title">🔑 Keywords Alert ({{ keywords.length }})</h3>
        <div class="settings__add-row">
          <input v-model="newKeyword.keyword" placeholder="Keyword" class="settings__input settings__input--flex" />
          <select v-model="newKeyword.alert_type" class="settings__input settings__input--sm">
            <option value="highlight">Highlight</option>
            <option value="notify">Thông báo</option>
            <option value="auto_reply">Auto Reply</option>
          </select>
          <input v-model="newKeyword.color" type="color" class="settings__color-picker" />
          <button class="settings__add-btn" @click="addKeyword">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <input
          v-if="newKeyword.alert_type === 'auto_reply'"
          v-model="newKeyword.auto_reply_text"
          placeholder="Nội dung auto reply..."
          class="settings__input"
          style="margin-top: 8px"
        />
        <div class="settings__list">
          <div v-for="kw in keywords" :key="kw.id" class="settings__list-item">
            <span class="settings__kw-badge" :style="{ background: kw.color + '22', color: kw.color, borderColor: kw.color }">
              {{ kw.keyword }}
            </span>
            <span class="settings__item-type">{{ kw.alert_type }}</span>
            <span v-if="kw.auto_reply_text" class="settings__item-reply">{{ kw.auto_reply_text }}</span>
            <button class="settings__del-btn" @click="deleteKeyword(kw.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="keywords.length === 0" class="settings__empty-list">Chưa có keyword nào</p>
        </div>
      </div>

      <!-- ═══ Tab: Auto Reply ═══ -->
      <div v-if="activeTab === 'replies'" class="settings__panel">
        <h3 class="settings__panel-title">💬 Mẫu trả lời tự động</h3>

        <!-- Master Toggle -->
        <div class="settings__toggle-row">
          <label class="settings__switch">
            <input type="checkbox" v-model="autoReplyEnabled" @change="toggleAutoReply" />
            <span class="settings__switch-slider"></span>
          </label>
          <span class="settings__toggle-label">
            Auto-Reply {{ autoReplyEnabled ? '🟢 Đang bật' : '🔴 Đang tắt' }}
          </span>
          <span class="settings__toggle-hint">Tự động reply cho comment HOT/WARM</span>
        </div>

        <div class="settings__add-row">
          <select v-model="newTemplate.trigger_label" class="settings__input settings__input--sm">
            <option value="HOT">Khi HOT</option>
            <option value="WARM">Khi WARM</option>
            <option value="keyword">Theo keyword</option>
          </select>
          <input v-model="newTemplate.template_text" placeholder="VD: Cảm ơn {{nickname}}, mình inbox bạn nhé!" class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addTemplate">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <p class="settings__variable-hint">
          Biến hỗ trợ: <code>{{nickname}}</code> <code>{{product}}</code> <code>{{shop}}</code>
          — Cooldown: 1 reply/user/5 phút
        </p>
        <div class="settings__list">
          <div v-for="t in templates" :key="t.id" class="settings__list-item">
            <span class="settings__kw-badge" :style="labelStyle(t.trigger_label)">
              {{ t.trigger_label }}
            </span>
            <span class="settings__item-reply">{{ t.template_text }}</span>
            <span v-if="t.is_active" class="settings__active-badge">Active</span>
            <button class="settings__del-btn" @click="deleteTemplate(t.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="templates.length === 0" class="settings__empty-list">Chưa có mẫu trả lời</p>
        </div>

        <!-- Auto-reply Log -->
        <div v-if="autoReplyLog.length > 0" class="settings__log">
          <h4 class="settings__log-title">📋 Lịch sử auto-reply gần nhất</h4>
          <div v-for="(log, i) in autoReplyLog" :key="i" class="settings__log-item">
            <span class="settings__log-user">@{{ log.nickname }}</span>
            <span class="settings__log-label" :class="'label--' + (log.triggerLabel || '').toLowerCase()">{{ log.triggerLabel }}</span>
            <span class="settings__log-text">→ {{ log.replyText }}</span>
            <span class="settings__log-time">{{ formatTime(log.time) }}</span>
          </div>
        </div>
      </div>

      <!-- ═══ Tab: Moderation ═══ -->
      <div v-if="activeTab === 'moderation'" class="settings__panel">
        <h3 class="settings__panel-title">🛡️ Quản lý bình luận</h3>
        <div class="settings__field">
          <label>Danh sách từ cấm (mỗi dòng 1 từ)</label>
          <textarea v-model="moderationConfig.blacklist" rows="5" class="settings__textarea"
            placeholder="spam&#10;quảng cáo&#10;đối thủ"></textarea>
        </div>
        <div class="settings__field">
          <label>
            <input type="checkbox" v-model="moderationConfig.hideSpam" />
            Tự động ẩn comment spam
          </label>
        </div>
        <div class="settings__field">
          <label>
            <input type="checkbox" v-model="moderationConfig.rateLimitEnabled" />
            Giới hạn tốc độ comment (max {{ moderationConfig.maxPerMinute }}/phút/user)
          </label>
          <input v-if="moderationConfig.rateLimitEnabled" v-model.number="moderationConfig.maxPerMinute" type="number" min="1" max="30" class="settings__input settings__input--sm" style="margin-top:4px" />
        </div>
        <button class="settings__save-btn" @click="saveModerationConfig">
          <Save :size="14" /> Lưu cấu hình
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import {
  Settings, Store, Save, Plus, Trash2,
  Link, ShoppingBag, Key, MessageCircle, Shield
} from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { logger } from '../utils/logger.js'
const { showToast } = useToast()

const props = defineProps({
  currentShop: { type: Object, default: null },
})

const activeTab = ref('connection')
const tabs = [
  { key: 'connection', label: 'Kết nối', icon: Link },
  { key: 'products', label: 'Sản phẩm', icon: ShoppingBag },
  { key: 'keywords', label: 'Keywords', icon: Key },
  { key: 'replies', label: 'Auto Reply', icon: MessageCircle },
  { key: 'moderation', label: 'Moderation', icon: Shield },
]

// Connection form
const shopForm = ref({ tiktok_username: '', shopee_shop_id: '', facebook_page_id: '' })

// Products
const products = ref([])
const newProduct = ref({ name: '', price: '', keywords: '' })

// Keywords
const keywords = ref([])
const newKeyword = ref({ keyword: '', alert_type: 'highlight', color: '#ff3b5c', auto_reply_text: '' })

// Templates
const templates = ref([])
const newTemplate = ref({ trigger_label: 'HOT', template_text: '' })

// Moderation
const moderationConfig = ref({
  blacklist: '',
  hideSpam: true,
  rateLimitEnabled: false,
  maxPerMinute: 5,
})

// Auto-reply state
const autoReplyEnabled = ref(false)
const autoReplyLog = ref([])

watch(() => props.currentShop, (shop) => {
  if (shop) loadAll(shop)
}, { immediate: true })

async function loadAll(shop) {
  if (!shop) return
  shopForm.value = {
    tiktok_username: shop.tiktok_username || '',
    shopee_shop_id: shop.shopee_shop_id || '',
    facebook_page_id: shop.facebook_page_id || '',
  }
  autoReplyEnabled.value = !!shop.auto_reply_enabled
  await Promise.all([loadProducts(shop.id), loadKeywords(shop.id), loadTemplates(shop.id)])
}

async function loadProducts(shopId) {
  try {
    const res = await apiFetch(`/products?shopId=${shopId}`)
    products.value = await res.json()
  } catch { products.value = [] }
}

async function loadKeywords(shopId) {
  try {
    const res = await apiFetch(`/shops/${shopId}/keywords`)
    keywords.value = await res.json()
  } catch { keywords.value = [] }
}

async function loadTemplates(shopId) {
  try {
    const res = await apiFetch(`/shops/${shopId}/templates`)
    templates.value = await res.json()
  } catch { templates.value = [] }
}

async function saveShopInfo() {
  if (!props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}`, {
      method: 'PUT',
      body: JSON.stringify(shopForm.value),
    })
    showToast('Đã lưu cấu hình shop', 'success')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
}

async function addProduct() {
  if (!newProduct.value.name || !props.currentShop) return
  try {
    await apiFetch('/products', {
      method: 'POST',
      body: JSON.stringify({ ...newProduct.value, shopId: props.currentShop.id }),
    })
    newProduct.value = { name: '', price: '', keywords: '' }
    await loadProducts(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function deleteProduct(id) {
  if (!confirm('Xóa sản phẩm này?')) return
  try {
    await apiFetch(`/products/${id}`, { method: 'DELETE' })
    await loadProducts(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function addKeyword() {
  if (!newKeyword.value.keyword || !props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/keywords`, {
      method: 'POST',
      body: JSON.stringify(newKeyword.value),
    })
    newKeyword.value = { keyword: '', alert_type: 'highlight', color: '#ff3b5c', auto_reply_text: '' }
    await loadKeywords(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function deleteKeyword(id) {
  if (!confirm('Xóa keyword này?')) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/keywords/${id}`, { method: 'DELETE' })
    await loadKeywords(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function addTemplate() {
  if (!newTemplate.value.template_text || !props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/templates`, {
      method: 'POST',
      body: JSON.stringify(newTemplate.value),
    })
    newTemplate.value = { trigger_label: 'HOT', template_text: '' }
    await loadTemplates(props.currentShop.id)
  } catch (e) { console.error(e) }
}

async function deleteTemplate(id) {
  if (!confirm('Xóa mẫu trả lời này?')) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}/templates/${id}`, { method: 'DELETE' })
    await loadTemplates(props.currentShop.id)
  } catch (e) { console.error(e) }
}

function saveModerationConfig() {
  localStorage.setItem(`mod_config_${props.currentShop?.id}`, JSON.stringify(moderationConfig.value))
  showToast('Đã lưu cấu hình moderation', 'success')
}

onMounted(() => {
  if (props.currentShop) {
    const saved = localStorage.getItem(`mod_config_${props.currentShop.id}`)
    if (saved) moderationConfig.value = JSON.parse(saved)
  }
})

async function toggleAutoReply() {
  if (!props.currentShop) return
  try {
    await apiFetch(`/shops/${props.currentShop.id}`, {
      method: 'PUT',
      body: JSON.stringify({ autoReplyEnabled: autoReplyEnabled.value }),
    })
    showToast(autoReplyEnabled.value ? 'Auto-reply đã bật' : 'Auto-reply đã tắt', 'success')
  } catch (e) {
    showToast('Lỗi: ' + e.message, 'error')
    autoReplyEnabled.value = !autoReplyEnabled.value
  }
}

function labelStyle(label) {
  const colors = { HOT: '#ef4444', WARM: '#f59e0b', keyword: '#3b82f6' }
  const c = colors[label] || '#6b7280'
  return { background: c + '18', color: c, borderColor: c }
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

// Listen for auto_reply events from socket
function handleAutoReplyEvent(data) {
  autoReplyLog.value.unshift({ ...data, time: new Date().toISOString() })
  if (autoReplyLog.value.length > 20) autoReplyLog.value.pop()
}

defineExpose({ handleAutoReplyEvent })
</script>

<style scoped>
.settings { padding: 20px; overflow-y: auto; height: 100%; }
.settings__header {
  display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
}
.settings__title { font-size: 20px; font-weight: 800; display: flex; align-items: center; gap: 8px; }
.settings__shop-name { font-size: 14px; color: var(--color-text-muted); padding: 4px 12px; background: var(--color-bg-secondary); border-radius: 6px; }
.settings__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  height: 300px; color: var(--color-text-muted); gap: 12px; font-size: 14px;
}
.settings__tabs {
  display: flex; gap: 2px; background: var(--color-bg-primary); border-radius: 8px; padding: 2px; margin-bottom: 20px;
}
.settings__tab {
  display: flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 6px;
  border: none; background: transparent; color: var(--color-text-muted);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.2s;
}
.settings__tab:hover { color: var(--color-text-primary); }
.settings__tab--active { background: var(--color-bg-secondary); color: var(--color-text-primary); font-weight: 600; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }

.settings__panel {
  background: var(--color-bg-secondary); border-radius: 12px; border: 1px solid var(--color-border); padding: 20px;
}
.settings__panel-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.settings__field { margin-bottom: 14px; }
.settings__field label { display: flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; margin-bottom: 4px; color: var(--color-text-secondary); }
.settings__input {
  padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary);
  font-size: 13px; outline: none; box-sizing: border-box; width: 100%;
}
.settings__input:focus { border-color: #ff3b5c; }
.settings__input--flex { flex: 1; }
.settings__input--sm { width: 120px; flex: none; }
.settings__textarea {
  width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--color-border);
  background: var(--color-bg-primary); color: var(--color-text-primary); font-size: 13px;
  font-family: inherit; outline: none; resize: vertical; box-sizing: border-box;
}
.settings__textarea:focus { border-color: #ff3b5c; }
.settings__color-picker { width: 36px; height: 36px; border: none; border-radius: 6px; cursor: pointer; }
.settings__add-row { display: flex; gap: 8px; align-items: center; margin-bottom: 14px; }
.settings__add-btn {
  display: flex; align-items: center; gap: 4px; padding: 8px 14px; border-radius: 8px;
  border: none; background: linear-gradient(135deg, #ff3b5c, #ff8c42); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer; white-space: nowrap;
}
.settings__save-btn {
  display: flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 8px;
  border: none; background: linear-gradient(135deg, #ff3b5c, #ff8c42); color: white;
  font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 12px;
}
.settings__list { display: flex; flex-direction: column; gap: 6px; }
.settings__list-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 12px;
  background: var(--color-bg-primary); border-radius: 8px; font-size: 13px;
}
.settings__item-name { font-weight: 600; flex: 1; }
.settings__item-price { color: #10b981; font-weight: 700; }
.settings__item-kw { color: var(--color-text-muted); font-size: 12px; flex: 1; }
.settings__item-type { font-size: 11px; color: var(--color-text-muted); text-transform: capitalize; }
.settings__item-reply { flex: 1; font-size: 12px; color: var(--color-text-secondary); }
.settings__kw-badge {
  font-size: 11px; padding: 2px 8px; border-radius: 4px; border: 1px solid; font-weight: 600;
}
.settings__del-btn {
  background: none; border: 1px solid var(--color-border); border-radius: 4px;
  padding: 4px 6px; cursor: pointer; color: var(--color-text-muted);
}
.settings__del-btn:hover { color: #ff3b5c; border-color: #ff3b5c; }
.settings__empty-list { text-align: center; padding: 16px; color: var(--color-text-muted); font-size: 13px; }

/* Responsive */
@media (max-width: 768px) {
  .settings__tabs { flex-wrap: wrap; }
  .settings__tab { flex: 1; min-width: 80px; justify-content: center; font-size: 11px; padding: 6px 8px; }
  .settings__add-row { flex-wrap: wrap; }
  .settings__input--sm { width: 100%; }
  .settings__input--flex { width: 100%; }
  .settings__list-item { flex-wrap: wrap; gap: 4px; }
}

/* Auto-reply Toggle */
.settings__toggle-row {
  display: flex; align-items: center; gap: 12px; padding: 12px 16px;
  background: var(--color-bg-primary); border-radius: 10px;
  margin-bottom: 16px; border: 1px solid var(--color-border);
}
.settings__switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; }
.settings__switch input { opacity: 0; width: 0; height: 0; }
.settings__switch-slider {
  position: absolute; inset: 0; background: #555; border-radius: 24px;
  cursor: pointer; transition: 0.3s;
}
.settings__switch-slider::before {
  content: ''; position: absolute; width: 18px; height: 18px;
  left: 3px; top: 3px; background: white; border-radius: 50%;
  transition: 0.3s;
}
.settings__switch input:checked + .settings__switch-slider { background: #10b981; }
.settings__switch input:checked + .settings__switch-slider::before { transform: translateX(20px); }
.settings__toggle-label { font-size: 14px; font-weight: 700; }
.settings__toggle-hint { font-size: 11px; color: var(--color-text-muted); margin-left: auto; }
.settings__variable-hint {
  font-size: 11px; color: var(--color-text-muted); margin: -8px 0 14px;
}
.settings__variable-hint code {
  background: var(--color-bg-primary); padding: 1px 5px; border-radius: 3px;
  font-size: 10px; border: 1px solid var(--color-border);
}
.settings__active-badge {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  background: rgba(16,185,129,0.15); color: #10b981; font-weight: 600;
}

/* Auto-reply Log */
.settings__log { margin-top: 20px; }
.settings__log-title { font-size: 13px; font-weight: 700; margin-bottom: 8px; }
.settings__log-item {
  display: flex; align-items: center; gap: 8px; padding: 6px 10px;
  background: var(--color-bg-primary); border-radius: 6px; font-size: 12px;
  margin-bottom: 4px;
}
.settings__log-user { font-weight: 600; color: var(--color-text-primary); }
.settings__log-label { font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 3px; }
.label--hot { background: rgba(239,68,68,0.15); color: #ef4444; }
.label--warm { background: rgba(245,158,11,0.15); color: #f59e0b; }
.settings__log-text { flex: 1; color: var(--color-text-secondary); }
.settings__log-time { font-size: 10px; color: var(--color-text-muted); }
</style>
