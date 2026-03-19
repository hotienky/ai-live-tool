<template>
  <div class="lb-section lb-section--footer" v-show="!activePageId">
    <h4 class="lb-section__title"><LayoutDashboard :size="14" /> Cấu hình Footer</h4>
    <p class="lb-section__hint">Kéo thả để sắp xếp thứ tự các cột. Footer hiển thị ở cuối trang storefront.</p>

    <LanguageTabs v-model="currentLang" style="margin: 15px 0" />

    <!-- Auto-translate button for footer -->
    <div v-if="currentLang !== 'vi'" class="footer-auto-translate">
      <button
        class="btn-footer-translate"
        type="button"
        @click="autoTranslateFooter"
        :disabled="isTranslating"
      >
        <component :is="isTranslating ? 'Loader2' : 'Sparkles'" :size="13" :class="{ spin: isTranslating }" />
        <span>{{ isTranslating ? 'Đang dịch...' : 'Dịch tự động toàn bộ Footer' }}</span>
        <span class="btn-ai-badge">AI</span>
      </button>
    </div>

    <!-- Footer Columns -->
    <div class="footer-builder">
      <div
        v-for="(col, ci) in config.columns"
        :key="'fc-' + ci"
        class="footer-col-card"
        :class="{ 'footer-col-card--dragging': footerDragIdx === ci, 'footer-col-card--drag-over': footerDragOverIdx === ci && footerDragIdx !== ci }"
        draggable="true"
        @dragstart="onFooterDragStart($event, ci)"
        @dragend="onFooterDragEnd"
        @dragover.prevent="onFooterDragOver($event, ci)"
        @dragenter.prevent="footerDragOverIdx = ci"
        @dragleave="footerDragOverIdx = -1"
        @drop.prevent="onFooterDrop(ci)"
      >
        <div class="footer-col-card__header">
          <div class="footer-col-card__label">
            <GripVertical :size="12" class="footer-col-card__grip" />
            <span class="footer-col-card__num">Cột {{ ci + 1 }}</span>
          </div>
          <button class="btn-remove-item" @click="config.columns.splice(ci, 1)" title="Xóa cột">
            <Trash2 :size="12" />
          </button>
        </div>
        <input v-model="col.title" class="param-input param-input--wide" :placeholder="'Tiêu đề cột ' + (ci + 1) + ' (VD: ' + (['Về chúng tôi', 'Hỗ trợ', 'Liên hệ', 'Chính sách'][ci] || 'Thêm') + ')'" />

        <div class="param-row">
          <label>Loại nội dung</label>
          <select v-model="col.type" class="param-select">
            <option value="links">🔗 Links</option>
            <option value="contact">📞 Liên hệ</option>
            <option value="text">📝 Nội dung tự do</option>
          </select>
        </div>

        <!-- Links Type -->
        <template v-if="col.type === 'links'">
          <div v-for="(link, li) in col.links" :key="li" class="footer-link-row"
            draggable="true"
            @dragstart.stop="footerItemDrag = { ci, li }; $event.dataTransfer.effectAllowed = 'move'"
            @dragover.prevent.stop
            @drop.prevent.stop="onFooterItemDrop(ci, li)"
          >
            <GripVertical :size="10" class="footer-link-row__grip" />
            <input v-model="link.label" class="param-input" placeholder="Nhãn" />
            <select v-model="link.urlMode" class="param-select param-select--sm" style="max-width:90px">
              <option value="builtin">Có sẵn</option>
              <option value="cms">CMS</option>
              <option value="custom">Tùy chỉnh</option>
            </select>
            <select v-if="link.urlMode === 'builtin'" v-model="link.url" class="param-input" style="flex:1">
              <option value="/">Trang chủ</option>
              <option value="/products">Sản phẩm</option>
              <option value="/categories">Danh mục</option>
              <option value="/brands">Thương hiệu</option>
              <option value="/promotions">Khuyến mãi</option>
              <option value="/wishlist">Yêu thích</option>
              <option value="/order-tracking">Theo dõi đơn</option>
              <option value="/account">Tài khoản</option>
            </select>
            <select v-else-if="link.urlMode === 'cms'" v-model="link.url" class="param-input" style="flex:1">
              <option value="" disabled>Chọn CMS page</option>
              <option v-for="cp in cmsPageList" :key="cp.id" :value="'/page/' + cp.slug">{{ cp.title }}</option>
            </select>
            <input v-else v-model="link.url" class="param-input" placeholder="/page/..." style="flex:1" />
            <button class="btn-remove-item" @click="col.links.splice(li, 1)" title="Xóa"><X :size="10" /></button>
          </div>
          <button class="btn-add-item" @click="col.links.push({ label: '', url: '', urlMode: 'custom' })">
            <Plus :size="12" /> Thêm link
          </button>
        </template>

        <!-- Contact Type -->
        <template v-if="col.type === 'contact'">
          <div v-for="(item, ii) in col.items" :key="ii" class="footer-link-row"
            draggable="true"
            @dragstart.stop="footerItemDrag = { ci, ii }; $event.dataTransfer.effectAllowed = 'move'"
            @dragover.prevent.stop
            @drop.prevent.stop="onFooterContactDrop(ci, ii)"
          >
            <GripVertical :size="10" class="footer-link-row__grip" />
            <select v-model="item.icon" class="param-select param-select--sm">
              <option value="phone">📞 SĐT</option>
              <option value="email">📧 Email</option>
              <option value="address">📍 Địa chỉ</option>
              <option value="clock">🕐 Giờ</option>
              <option value="text">💬 Ghi chú</option>
            </select>
            <input v-model="item.label" class="param-input" placeholder="Nhãn" />
            <input v-model="item.value" class="param-input" placeholder="Giá trị" />
            <button class="btn-remove-item" @click="col.items.splice(ii, 1)" title="Xóa"><X :size="10" /></button>
          </div>
          <button class="btn-add-item" @click="col.items.push({ icon: 'phone', label: '', value: '' })">
            <Plus :size="12" /> Thêm dòng
          </button>
        </template>

        <!-- Text Type -->
        <template v-if="col.type === 'text'">
          <textarea v-model="col.content" class="param-input param-input--wide footer-textarea" rows="4" placeholder="Nội dung HTML tùy ý..."></textarea>
        </template>
      </div>

      <button class="btn-add-section footer-add-col" @click="config.columns.push({ title: '', type: 'links', links: [], items: [], content: '' })">
        <Plus :size="14" /> Thêm cột (hiện có {{ config.columns.length }} cột)
      </button>
    </div>

    <!-- Social Links -->
    <details class="footer-extra-section" open>
      <summary>🌐 Mạng xã hội</summary>
      <div v-for="(s, si) in config.social" :key="si" class="footer-link-row">
        <select v-model="s.platform" class="param-select param-select--sm">
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
          <option value="zalo">Zalo</option>
          <option value="twitter">Twitter/X</option>
          <option value="shopee">Shopee</option>
          <option value="lazada">Lazada</option>
        </select>
        <input v-model="s.url" class="param-input param-input--wide" placeholder="URL" />
        <button class="btn-remove-item" @click="config.social.splice(si, 1)"><X :size="10" /></button>
      </div>
      <button class="btn-add-item" @click="config.social.push({ platform: 'facebook', url: '' })">
        <Plus :size="12" /> Thêm
      </button>
    </details>

    <!-- Payment Methods -->
    <details class="footer-extra-section">
      <summary>💳 Phương thức thanh toán</summary>
      <div class="footer-badges-grid">
        <label v-for="pm in allPaymentMethods" :key="pm.code" class="footer-badge-check">
          <input type="checkbox" :value="pm.code" v-model="config.paymentMethods" />
          <span>{{ pm.label }}</span>
        </label>
      </div>
    </details>

    <!-- Certification Badges -->
    <details class="footer-extra-section">
      <summary>🏅 Chứng nhận / Badge</summary>
      <div v-for="(b, bi) in config.badges" :key="bi" class="footer-link-row">
        <input v-model="b.label" class="param-input" placeholder="Tên (VD: DMCA)" />
        <input v-model="b.imageUrl" class="param-input param-input--wide" placeholder="URL hình ảnh" />
        <input v-model="b.url" class="param-input" placeholder="Link (tùy chọn)" />
        <button class="btn-remove-item" @click="config.badges.splice(bi, 1)"><X :size="10" /></button>
      </div>
      <button class="btn-add-item" @click="config.badges.push({ label: '', imageUrl: '', url: '' })">
        <Plus :size="12" /> Thêm badge
      </button>
    </details>

    <!-- Bottom Info -->
    <details class="footer-extra-section">
      <summary>📋 Thông tin pháp lý (dòng cuối)</summary>
      <textarea v-model="config.legalText" class="param-input param-input--wide footer-textarea" rows="3" placeholder="VD: Công Ty TNHH ABC&#10;Trụ sở: 123 Đường A, Quận B, TP.HCM&#10;MST: 0123456789"></textarea>
      <div class="param-row" style="margin-top:8px">
        <label>Copyright</label>
        <input type="text" v-model="config.copyrightText" class="param-input param-input--wide" placeholder="© 2026 Shop Name" />
      </div>
    </details>

    <!-- Footer Colors -->
    <div class="footer-colors" style="margin-top:12px">
      <div class="footer-color-row">
        <div class="footer-color-item">
          <label>🎨 Nền</label>
          <div class="footer-color-pick">
            <input type="color" v-model="config.bgColor" class="param-color" />
            <button v-if="config.bgColor" class="btn-clear-color" @click="config.bgColor = ''" title="Xóa"><X :size="10" /></button>
          </div>
        </div>
        <div class="footer-color-item">
          <label>📝 Tiêu đề</label>
          <div class="footer-color-pick">
            <input type="color" v-model="config.headingColor" class="param-color" />
            <button v-if="config.headingColor" class="btn-clear-color" @click="config.headingColor = ''" title="Xóa"><X :size="10" /></button>
          </div>
        </div>
        <div class="footer-color-item">
          <label>✏️ Chữ</label>
          <div class="footer-color-pick">
            <input type="color" v-model="config.textColor" class="param-color" />
            <button v-if="config.textColor" class="btn-clear-color" @click="config.textColor = ''" title="Xóa"><X :size="10" /></button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LayoutDashboard, GripVertical, Trash2, Plus, X, Sparkles, Loader2 } from 'lucide-vue-next'
import { apiFetch } from '../../composables/useApi.js'
import { useCmsPages } from '../../composables/useCmsPages.js'
import { useI18n } from '../../composables/useI18n.js'
import LanguageTabs from '../LanguageTabs.vue'

const { t } = useI18n()

const props = defineProps({
  footerConfig: { type: Object, required: true },
  activePageId: { default: null },
})
const emit = defineEmits(['update:footerConfig'])

const currentLang = ref('vi')

const config = computed({
  get: () => {
    if (currentLang.value === 'vi') return props.footerConfig
    if (!props.footerConfig.translations) props.footerConfig.translations = {}
    if (!props.footerConfig.translations[currentLang.value]) {
       // Copy structure but leave text empty
       const base = JSON.parse(JSON.stringify(props.footerConfig))
       base.columns.forEach(c => {
         c.title = ''
         c.content = ''
         if (c.links) c.links.forEach(l => l.label = '')
         if (c.items) c.items.forEach(i => { i.label = ''; i.value = '' })
       })
       base.legalText = ''
       base.copyrightText = ''
       props.footerConfig.translations[currentLang.value] = base
    }
    return props.footerConfig.translations[currentLang.value]
  },
  set: (v) => {
    if (currentLang.value === 'vi') {
      emit('update:footerConfig', v)
    } else {
      props.footerConfig.translations[currentLang.value] = v
      emit('update:footerConfig', { ...props.footerConfig }) // force deep update
    }
  }
})

// CMS pages for link selector
const { pages: cmsPageListRaw, fetchPages: fetchCmsPageList } = useCmsPages(apiFetch)
const cmsPageList = computed(() => (cmsPageListRaw.value || []).filter(p => p.status === 'published' || p.is_published))

const allPaymentMethods = [
  { code: 'cod', label: 'COD' },
  { code: 'bank', label: 'Bank Transfer' },
  { code: 'visa', label: 'VISA' },
  { code: 'mastercard', label: 'Mastercard' },
  { code: 'jcb', label: 'JCB' },
  { code: 'momo', label: 'MoMo' },
  { code: 'zalopay', label: 'ZaloPay' },
  { code: 'vnpay', label: 'VNPay' },
  { code: 'napas', label: 'Napas' },
  { code: 'applepay', label: 'Apple Pay' },
]

// Drag-drop
const footerDragIdx = ref(-1)
const footerDragOverIdx = ref(-1)
const footerItemDrag = ref(null)

function onFooterDragStart(e, idx) { footerDragIdx.value = idx; e.dataTransfer.effectAllowed = 'move' }
function onFooterDragEnd() { footerDragIdx.value = -1; footerDragOverIdx.value = -1 }
function onFooterDragOver(e, idx) { footerDragOverIdx.value = idx }
function onFooterDrop(idx) {
  const from = footerDragIdx.value
  if (from < 0 || from === idx) { onFooterDragEnd(); return }
  const cols = config.value.columns
  const [moved] = cols.splice(from, 1)
  cols.splice(idx, 0, moved)
  onFooterDragEnd()
}
function onFooterItemDrop(ci, targetLi) {
  const src = footerItemDrag.value
  if (!src || src.ci !== ci || src.li === targetLi) { footerItemDrag.value = null; return }
  const arr = config.value.columns[ci].links
  const [moved] = arr.splice(src.li, 1)
  arr.splice(targetLi, 0, moved)
  footerItemDrag.value = null
}
function onFooterContactDrop(ci, targetIi) {
  const src = footerItemDrag.value
  if (!src || src.ci !== ci || src.ii === targetIi) { footerItemDrag.value = null; return }
  const arr = config.value.columns[ci].items
  const [moved] = arr.splice(src.ii, 1)
  arr.splice(targetIi, 0, moved)
  footerItemDrag.value = null
}

onMounted(() => { fetchCmsPageList() })

// ── Auto-translate footer ──
const isTranslating = ref(false)

async function translateText(text, toLang) {
  if (!text || !String(text).trim()) return ''
  try {
    const res = await apiFetch('/languages/auto-translate', {
      method: 'POST',
      body: JSON.stringify({ text, from: 'vi', to: toLang })
    })
    const data = await res.json()
    return data?.translated || ''
  } catch { return '' }
}

async function autoTranslateFooter() {
  const lang = currentLang.value
  if (!lang || lang === 'vi') return
  isTranslating.value = true

  try {
    const base = props.footerConfig
    const target = config.value

    // Translate column titles, link labels, contact items, text content
    for (let ci = 0; ci < base.columns.length; ci++) {
      const baseCol = base.columns[ci]
      const targetCol = target.columns[ci]
      if (!targetCol) continue

      // Column title
      if (baseCol.title) {
        const translated = await translateText(baseCol.title, lang)
        if (translated) targetCol.title = translated
      }

      // Links labels
      if (baseCol.links) {
        for (let li = 0; li < baseCol.links.length; li++) {
          if (baseCol.links[li]?.label && targetCol.links?.[li]) {
            const translated = await translateText(baseCol.links[li].label, lang)
            if (translated) targetCol.links[li].label = translated
          }
        }
      }

      // Contact items
      if (baseCol.items) {
        for (let ii = 0; ii < baseCol.items.length; ii++) {
          if (baseCol.items[ii]?.label && targetCol.items?.[ii]) {
            const translated = await translateText(baseCol.items[ii].label, lang)
            if (translated) targetCol.items[ii].label = translated
          }
          if (baseCol.items[ii]?.value && targetCol.items?.[ii]) {
            const translated = await translateText(baseCol.items[ii].value, lang)
            if (translated) targetCol.items[ii].value = translated
          }
        }
      }

      // Text content
      if (baseCol.content && baseCol.type === 'text') {
        const translated = await translateText(baseCol.content, lang)
        if (translated) targetCol.content = translated
      }
    }

    // Legal text
    if (base.legalText) {
      const translated = await translateText(base.legalText, lang)
      if (translated) target.legalText = translated
    }

    // Copyright
    if (base.copyrightText) {
      const translated = await translateText(base.copyrightText, lang)
      if (translated) target.copyrightText = translated
    }
  } catch (e) {
    console.error('Footer auto-translate failed:', e)
  } finally {
    isTranslating.value = false
  }
}
</script>

<style scoped>
.footer-auto-translate {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
.btn-footer-translate {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px 7px 10px;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #ec4899 100%);
  color: #fff;
  border: none;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35);
}
.btn-footer-translate:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(124, 58, 237, 0.5);
  filter: brightness(1.08);
}
.btn-footer-translate:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
.btn-ai-badge {
  font-size: 9px;
  font-weight: 800;
  background: rgba(255,255,255,0.25);
  border-radius: 6px;
  padding: 1px 5px;
  letter-spacing: 0.08em;
}
.spin {
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
