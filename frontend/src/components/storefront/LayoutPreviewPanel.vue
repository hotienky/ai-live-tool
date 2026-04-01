<template>
  <div class="layout-builder__preview">
    <!-- Wireframe Preview -->
    <div v-if="previewMode === 'wireframe'" class="preview-frame">
      <div class="pv-header">
        <div class="pv-logo"></div>
        <div class="pv-nav">
          <span v-if="pages.products" class="pv-nav-item"></span>
          <span v-if="pages.cart" class="pv-nav-item pv-nav-item--sm"></span>
          <span v-if="pages.account" class="pv-nav-item pv-nav-item--sm"></span>
        </div>
      </div>
      <div class="pv-body">
        <!-- Built-in page preview -->
        <template v-if="activeBuiltinPage === 'products'">
          <div class="pv-page-layout" :class="'pv-page-layout--sidebar-' + (pageConfigs.products?.sidebarPosition || 'left')">
            <div class="pv-sidebar" v-if="pageConfigs.products?.sidebarPosition !== 'hidden'">
              <div class="pv-sidebar__label">Sidebar</div>
              <div class="pv-sidebar__block" v-if="pageConfigs.products?.showFilters?.category"></div>
              <div class="pv-sidebar__block" v-if="pageConfigs.products?.showFilters?.brand"></div>
              <div class="pv-sidebar__block pv-sidebar__block--sm" v-if="pageConfigs.products?.showFilters?.price"></div>
            </div>
            <div class="pv-product-grid">
              <div class="pv-product-grid__label">Sản phẩm ({{ pageConfigs.products?.gridColumns || 4 }} cột)</div>
              <div class="pv-product-grid__items" :style="{ gridTemplateColumns: `repeat(${pageConfigs.products?.gridColumns || 4}, 1fr)` }">
                <div v-for="n in (pageConfigs.products?.itemsPerPage || 12)" :key="n" class="pv-product-item"></div>
              </div>
            </div>
          </div>
        </template>
        <template v-else-if="activeBuiltinPage === 'productDetail'">
          <div class="pv-page-layout pv-page-layout--detail" :style="{ gridTemplateColumns: (pageConfigs.productDetail?.layoutRatio || '50-50').replace('-', 'fr ') + 'fr' }">
            <div class="pv-detail-gallery">
              <div class="pv-detail-gallery__main"></div>
              <div class="pv-detail-gallery__thumbs" v-if="pageConfigs.productDetail?.galleryStyle === 'thumbnails'">
                <div v-for="n in 4" :key="n" class="pv-thumb"></div>
              </div>
            </div>
            <div class="pv-detail-info">
              <div class="pv-detail-info__title"></div>
              <div class="pv-detail-info__price"></div>
              <div class="pv-detail-info__btn"></div>
            </div>
          </div>
          <div class="pv-section pv-section--related" v-if="pageConfigs.productDetail?.showRelatedProducts">
            <div class="pv-section__label">SP liên quan ({{ pageConfigs.productDetail?.relatedCount || 6 }})</div>
            <div class="pv-section__visual" style="height:40px"></div>
          </div>
          <div class="pv-section pv-section--reviews" v-if="pageConfigs.productDetail?.showReviews">
            <div class="pv-section__label">{{ t('admin.msg_b4292de3', 'Đánh giá') }}</div>
            <div class="pv-section__visual" style="height:30px"></div>
          </div>
        </template>
        <template v-else-if="activeBuiltinPage">
          <div class="pv-section">
            <div class="pv-section__label">{{ builtinPageOptions.find(p => p.id === activePageId)?.label || activeBuiltinPage }}</div>
            <div class="pv-section__visual" style="height:80px"></div>
          </div>
        </template>
        <!-- Homepage sections preview -->
        <template v-else>
          <template v-for="section in activeSections" :key="section.type">
            <div class="pv-section" :class="'pv-section--' + section.type">
              <div class="pv-section__label">{{ sectionMeta[section.type]?.label || section.type }}</div>
              <div class="pv-section__visual" :style="{ height: sectionMeta[section.type]?.pvHeight || '30px' }"></div>
            </div>
          </template>
        </template>
      </div>

      <!-- Footer Preview -->
      <div class="pv-footer" :style="footerPreviewStyle">
        <div class="pv-footer__cols">
          <div v-for="(col, ci) in footerConfig.columns" :key="ci" class="pv-footer__col">
            <div class="pv-footer__col-title" :style="footerConfig.headingColor ? { color: footerConfig.headingColor } : {}">{{ col.title || t('admin.msg_20ec6f82', 'Cột ') + (ci + 1) }}</div>
            <template v-if="col.type === 'links'">
              <div v-for="(link, li) in col.links" :key="li" class="pv-footer__link" :style="footerConfig.textColor ? { color: footerConfig.textColor } : {}">{{ link.label || '—' }}</div>
            </template>
            <template v-else-if="col.type === 'contact'">
              <div v-for="(item, ii) in col.items" :key="ii" class="pv-footer__contact" :style="footerConfig.textColor ? { color: footerConfig.textColor } : {}">
                <component :is="{ phone: PhoneIcon, email: MailIcon, address: MapPinIcon, clock: ClockIcon }[item.icon] || CircleDot" :size="10" style="flex-shrink:0" />
                {{ item.value || item.label || '—' }}
              </div>
            </template>
            <template v-else>
              <div class="pv-footer__text" :style="footerConfig.textColor ? { color: footerConfig.textColor } : {}">{{ col.content ? '(HTML)' : '—' }}</div>
            </template>
          </div>
        </div>
        <div v-if="footerConfig.social?.length" class="pv-footer__social">
          <span v-for="s in footerConfig.social" :key="s.platform" class="pv-footer__social-icon">{{ { facebook:'f', instagram:'ig', youtube:'yt', tiktok:'tt', zalo:'z', twitter:'x' }[s.platform] || '?' }}</span>
        </div>
        <div v-if="footerConfig.copyrightText" class="pv-footer__copyright" :style="footerConfig.textColor ? { color: footerConfig.textColor, opacity: 0.6 } : {}">{{ footerConfig.copyrightText }}</div>
      </div>
    </div>

    <!-- Live Preview (iframe with postMessage) -->
    <div v-else class="preview-live" :style="{ maxWidth: previewWidth }">
      <iframe
        v-if="storefrontUrl"
        ref="iframeRef"
        :src="livePreviewBaseUrl"
        class="preview-iframe"
        :key="previewKey"
        @load="sendLayoutToIframe"
      ></iframe>
      <div v-else class="preview-no-url">
        <AlertCircle :size="24" />
        <p>{{ t('admin.msg_c8a05e33', 'Nhập URL storefront để sử dụng Live Preview') }}</p>
        <div class="preview-url-input">
          <input
            :value="storefrontUrl"
            @input="emit('update:storefrontUrl', $event.target.value)"
            type="url"
            placeholder="https://store.fashionvn.com"
            @keyup.enter="emit('refresh-live')"
          />
          <button class="btn-sm" @click="emit('refresh-live')" :disabled="!storefrontUrl">Xem</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { Eye, Monitor, Tablet, Smartphone, AlertCircle, Phone as PhoneIcon, Mail as MailIcon, MapPin as MapPinIcon, Clock as ClockIcon, CircleDot } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  previewMode: { type: String, default: 'wireframe' },
  previewWidth: { type: String, default: '100%' },
  previewKey: { type: Number, default: 0 },
  storefrontUrl: { type: String, default: '' },
  livePreviewBaseUrl: { type: String, default: '' },
  pages: { type: Object, default: () => ({}) },
  activeBuiltinPage: { type: String, default: null },
  activePageId: { type: String, default: null },
  builtinPageOptions: { type: Array, default: () => [] },
  activeSections: { type: Array, default: () => [] },
  sectionMeta: { type: Object, default: () => ({}) },
  pageConfigs: { type: Object, default: () => ({}) },
  footerConfig: { type: Object, default: () => ({}) },
  headerConfig: { type: Object, default: () => ({}) },
  layoutPayload: { type: Object, default: null },
})

const emit = defineEmits([
  'update:previewWidth', 'update:storefrontUrl', 'refresh-live',
  'section-selected', 'section-hover', 'section-reorder',
  'inline-edit', 'section-delete', 'section-toggle', 'add-section-at', 'open-config',
  'edit-image'
])

const iframeRef = ref(null)

const footerPreviewStyle = computed(() => {
  const s = {}
  if (props.footerConfig.bgColor) s.background = props.footerConfig.bgColor
  return s
})

// ── PostMessage-based live preview ──
function sendLayoutToIframe() {
  if (!iframeRef.value?.contentWindow || !props.layoutPayload) return
  iframeRef.value.contentWindow.postMessage({
    type: 'layout-preview-update',
    payload: JSON.parse(JSON.stringify(props.layoutPayload)),
  }, '*')
}

// Watch layoutPayload and specific deeply nested configs to ensure changes trigger postMessage
let postMessageTimer
watch([
  () => props.layoutPayload,
  () => props.footerConfig,
  () => props.headerConfig,
  () => props.pageConfigs
], () => {
  clearTimeout(postMessageTimer)
  postMessageTimer = setTimeout(sendLayoutToIframe, 300)
}, { deep: true })

// ── Builder Bridge: Listen for messages from BuilderOverlay in iframe ──
import { onMounted } from 'vue'

function handleIframeMessage(event) {
  const { type, payload } = event.data || {}
  switch (type) {
    case 'builder:section-selected':
      emit('section-selected', payload)
      break
    case 'builder:section-hover':
      emit('section-hover', payload)
      break
    case 'builder:section-reorder':
      emit('section-reorder', payload)
      break
    case 'builder:inline-edit':
      emit('inline-edit', payload)
      break
    case 'builder:section-delete':
      emit('section-delete', payload)
      break
    case 'builder:section-toggle':
      emit('section-toggle', payload)
      break
    case 'builder:add-section-at':
      emit('add-section-at', payload)
      break
    case 'builder:open-config':
      emit('open-config', payload)
      break
    case 'builder:edit-image':
      emit('edit-image', payload)
      break
    case 'builder:ready':
      // Overlay is ready — send current builder mode and full layout payload
      sendToIframe('builder:mode', { mode: 'edit' })
      sendLayoutToIframe()
      break
  }
}

// Send commands TO the iframe overlay
function sendToIframe(type, payload) {
  if (!iframeRef.value?.contentWindow) return
  iframeRef.value.contentWindow.postMessage({ type, payload }, '*')
}

// Expose for parent component
defineExpose({
  highlightSection: (index) => sendToIframe('builder:highlight-section', { index }),
  selectSection: (index) => sendToIframe('builder:select-section', { index }),
  postMessageToIframe: (type, payload) => {
    if (iframeRef.value?.contentWindow) {
      iframeRef.value.contentWindow.postMessage({ type, payload }, '*')
    }
  }
})

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})

onBeforeUnmount(() => {
  clearTimeout(postMessageTimer)
  window.removeEventListener('message', handleIframeMessage)
})
</script>

<style scoped>
.layout-builder__preview {
  display: flex; flex-direction: column; flex: 1; width: 100%; height: 100%;
}

/* Responsive controls */
.preview-responsive { display: flex; gap: 4px; }
.preview-responsive button { padding: 6px; border: 1px solid transparent; border-radius: 6px; background: transparent; color: var(--text-3, #94a3b8); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; }
.preview-responsive button:hover { background: var(--bg-2, #f3f4f6); color: var(--text-1, #1f2937); }
.preview-responsive button.active { background: rgba(124, 58, 237, 0.1); color: var(--accent, #7c3aed); border-color: rgba(124, 58, 237, 0.2); }

/* Live preview area */
.preview-live {
  display: flex; flex-direction: column; flex: 1; width: 100%;
  margin: 16px auto; overflow: hidden; transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  min-height: 500px; max-height: calc(100vh - 120px);
  background: transparent;
  box-shadow: 0 10px 40px -10px rgba(0,0,0,0.1); border-radius: 8px; border: 1px solid var(--border, #e5e7eb);
}
.preview-iframe { width: 100%; flex: 1; border: none; background: #fff; display: block; }
.preview-no-url { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 40px 20px; color: var(--text-2); text-align: center; flex: 1; background: #fff; }
.preview-no-url p { font-size: 13px; margin: 0; }
.preview-url-input { display: flex; gap: 6px; width: 100%; max-width: 320px; margin-top: 4px; }
.preview-url-input input { flex: 1; padding: 8px 12px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-1); color: var(--text-1); font-size: 13px; outline: none; }
.preview-url-input input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
.preview-url-input .btn-sm { padding: 8px 16px; border-radius: 6px; border: none; background: var(--accent); color: #fff; font-size: 13px; font-weight: 600; cursor: pointer; }
.preview-url-input .btn-sm:disabled { opacity: 0.5; cursor: not-allowed; }

/* Wireframe Area */
.preview-frame {
  margin: 20px; border: 1px solid var(--border); border-radius: 12px;
  overflow: hidden; background: #fff; flex: 1; display: flex; flex-direction: column;
}
.pv-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); background: var(--bg-2); }
.pv-logo { width: 60px; height: 12px; border-radius: 4px; background: var(--text-3); opacity: 0.3; }
.pv-nav { display: flex; gap: 8px; }
.pv-nav-item { width: 40px; height: 10px; border-radius: 3px; background: var(--text-3); opacity: 0.2; }
.pv-nav-item--sm { width: 20px; }
.pv-body { padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1; overflow-y: auto; }
.pv-section { border-radius: 8px; padding: 10px 12px; border: 1px dashed var(--border); background: var(--bg-2); }
.pv-section__label { font-size: 10px; color: var(--text-2); font-weight: 700; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
.pv-section__visual { border-radius: 4px; background: var(--text-3); opacity: 0.2; }

.pv-footer { padding: 24px 20px 16px; border-top: 2px solid var(--border); background: #f8fafc; }
.pv-footer__cols { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 16px; margin-bottom: 16px; }
.pv-footer__col-title { font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
.pv-footer__link, .pv-footer__contact, .pv-footer__text { font-size: 11px; color: #64748b; line-height: 1.8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-footer__contact { display: flex; align-items: center; gap: 6px; }
.pv-footer__social { display: flex; gap: 8px; justify-content: center; margin: 12px 0 8px; padding-top: 12px; border-top: 1px solid var(--border); }
.pv-footer__social-icon { width: 24px; height: 24px; border-radius: 50%; background: var(--text-3); color: #fff; font-size: 10px; display: flex; align-items: center; justify-content: center; font-weight: 800; text-transform: uppercase; opacity: 0.8; }
.pv-footer__copyright { font-size: 10px; text-align: center; color: #94a3b8; margin-top: 8px; }

/* Wireframe: Products */
.pv-page-layout { display: grid; grid-template-columns: 100px 1fr; gap: 12px; min-height: 200px; }
.pv-page-layout--sidebar-right { grid-template-columns: 1fr 100px; }
.pv-page-layout--sidebar-right .pv-sidebar { order: 2; }
.pv-page-layout--sidebar-right .pv-product-grid { order: 1; }
.pv-page-layout--sidebar-hidden { grid-template-columns: 1fr; }
.pv-sidebar { border-radius: 8px; padding: 10px; border: 1px dashed var(--border); background: var(--bg-2); }
.pv-sidebar__label { font-size: 9px; color: var(--text-2); font-weight: 700; margin-bottom: 6px; text-transform: uppercase; }
.pv-sidebar__block { height: 20px; border-radius: 4px; background: var(--text-3); opacity: 0.2; margin-bottom: 6px; }
.pv-sidebar__block--sm { height: 14px; }
.pv-product-grid { border-radius: 8px; padding: 10px; border: 1px dashed var(--border); background: var(--bg-2); }
.pv-product-grid__label { font-size: 9px; color: var(--text-2); font-weight: 700; margin-bottom: 6px; text-transform: uppercase; }
.pv-product-grid__items { display: grid; gap: 8px; }
.pv-product-item { aspect-ratio: 1; border-radius: 6px; background: var(--text-3); opacity: 0.15; }

/* Wireframe: Detail */
.pv-page-layout--detail { display: grid; gap: 12px; min-height: 150px; }
.pv-detail-gallery { border-radius: 8px; padding: 10px; border: 1px dashed var(--border); background: var(--bg-2); }
.pv-detail-gallery__main { height: 80px; border-radius: 6px; background: var(--text-3); opacity: 0.15; margin-bottom: 6px; }
.pv-detail-gallery__thumbs { display: flex; gap: 4px; }
.pv-thumb { width: 22px; height: 22px; border-radius: 4px; background: var(--text-3); opacity: 0.2; }
.pv-detail-info { border-radius: 8px; padding: 12px; border: 1px dashed var(--border); background: var(--bg-2); display: flex; flex-direction: column; gap: 8px; }
.pv-detail-info__title { height: 14px; width: 70%; border-radius: 4px; background: var(--text-3); opacity: 0.3; }
.pv-detail-info__price { height: 14px; width: 40%; border-radius: 4px; background: var(--accent); opacity: 0.4; }
.pv-detail-info__btn { height: 24px; width: 60%; border-radius: 6px; background: var(--accent); opacity: 0.6; margin-top: 8px; }
</style>
