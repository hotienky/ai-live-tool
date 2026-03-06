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
        <h3 class="settings__panel-title">💬 Mẫu trả lời nhanh</h3>
        <div class="settings__add-row">
          <select v-model="newTemplate.trigger_label" class="settings__input settings__input--sm">
            <option value="HOT">Khi HOT</option>
            <option value="WARM">Khi WARM</option>
            <option value="keyword">Theo keyword</option>
          </select>
          <input v-model="newTemplate.template_text" placeholder="Nội dung mẫu trả lời..." class="settings__input settings__input--flex" />
          <button class="settings__add-btn" @click="addTemplate">
            <Plus :size="14" /> Thêm
          </button>
        </div>
        <div class="settings__list">
          <div v-for="t in templates" :key="t.id" class="settings__list-item">
            <span class="settings__kw-badge" style="background: rgba(59,130,246,0.15); color: #3b82f6; border-color: #3b82f6">
              {{ t.trigger_label }}
            </span>
            <span class="settings__item-reply">{{ t.template_text }}</span>
            <button class="settings__del-btn" @click="deleteTemplate(t.id)">
              <Trash2 :size="12" />
            </button>
          </div>
          <p v-if="templates.length === 0" class="settings__empty-list">Chưa có mẫu trả lời</p>
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
    alert('✅ Đã lưu cấu hình shop')
  } catch (e) { alert('❌ Lỗi: ' + e.message) }
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
  alert('✅ Đã lưu cấu hình moderation')
}

onMounted(() => {
  if (props.currentShop) {
    const saved = localStorage.getItem(`mod_config_${props.currentShop.id}`)
    if (saved) moderationConfig.value = JSON.parse(saved)
  }
})
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
</style>
