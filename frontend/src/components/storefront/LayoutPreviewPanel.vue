<template>
  <div class="layout-builder__preview">
    <div class="preview-toolbar">
      <h4 class="lb-section__title"><Eye :size="14" /> {{ t('admin.msg_1507b51c', 'Xem trước') }}</h4>
      <div class="preview-responsive" v-if="previewMode === 'live'">
        <button :class="{ active: previewWidth === '100%' }" @click="emit('update:previewWidth', '100%')" data-tooltip="Desktop"><Monitor :size="12" /></button>
        <button :class="{ active: previewWidth === '768px' }" @click="emit('update:previewWidth', '768px')" data-tooltip="Tablet"><Tablet :size="12" /></button>
        <button :class="{ active: previewWidth === '375px' }" @click="emit('update:previewWidth', '375px')" data-tooltip="Mobile"><Smartphone :size="12" /></button>
      </div>
    </div>

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
})

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})

onBeforeUnmount(() => {
  clearTimeout(postMessageTimer)
  window.removeEventListener('message', handleIframeMessage)
})
</script>
