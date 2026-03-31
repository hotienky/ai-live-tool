<template>
  <footer class="site-footer" :style="footerStyle" data-section-type="footer" data-vvb-section-id="__footer" data-vvb-global="true">
    <div class="site-footer__inner container">

      <!-- Dynamic Columns -->
      <div class="site-footer__grid" :style="{ '--cols': totalCols }" v-if="nonEmptyCols.length || hasSocialOrBadges">
        <div v-for="(col, ci) in nonEmptyCols" :key="ci" class="site-footer__col">

          <h4 v-if="col.title" class="site-footer__col-title">{{ col.title }}</h4>

          <!-- Links Column -->
          <template v-if="col.type === 'links'">
            <ul class="sf-link-list">
              <li v-for="(link, li) in (col.links || [])" :key="li">
                <router-link v-if="link.url?.startsWith('/')" :to="link.url" class="sf-link">
                  {{ link.label || link.text || link.name || '—' }}
                </router-link>
                <a v-else :href="link.url || '#'" target="_blank" class="sf-link">{{ link.label || link.text || link.name || '—' }}</a>
              </li>
            </ul>
          </template>

          <!-- Contact Column -->
          <template v-if="col.type === 'contact'">
            <ul class="sf-contact-list">
              <li v-for="(item, ii) in (col.items || [])" :key="ii" class="sf-contact-item">
                <component :is="contactIcon(item.icon)" :size="14" class="sf-contact-icon" />
                <div>
                  <strong v-if="item.label" class="sf-contact-label">{{ item.label }}</strong>
                  <span v-if="item.icon === 'phone' && item.value">
                    <a :href="'tel:' + item.value.replace(/\s/g, '')">{{ item.value }}</a>
                  </span>
                  <span v-else-if="item.icon === 'email' && item.value">
                    <a :href="'mailto:' + item.value">{{ item.value }}</a>
                  </span>
                  <span v-else>{{ item.value }}</span>
                </div>
              </li>
            </ul>
          </template>

          <!-- Text Column -->
          <template v-if="col.type === 'text'">
            <ShortcodeRenderer class="sf-text-content" :html="col.content" />
          </template>
        </div>

        <!-- Social + Payment + Badges (last column or separate section) -->
        <div class="site-footer__col site-footer__col--extras" v-if="hasSocialOrBadges">
          <template v-if="resolvedCfg.social?.length">
            <h4 class="site-footer__col-title">{{ t('storefront.footer.follow_us', 'Theo dõi chúng tôi') }}</h4>
            <div class="sf-social-row">
              <a
                v-for="s in resolvedCfg.social"
                :key="s.platform"
                :href="s.url"
                target="_blank"
                :title="platformLabel(s.platform)"
                class="sf-social-link"
                :class="'sf-social-link--' + s.platform"
              >
                <component :is="platformIcon(s.platform)" :size="18" />
              </a>
            </div>
          </template>

          <template v-if="resolvedCfg.badges?.length">
            <h4 class="site-footer__col-title sf-mt">{{ t('storefront.footer.certifications', 'Chứng nhận') }}</h4>
            <div class="sf-badges-row">
              <a
                v-for="b in resolvedCfg.badges"
                :key="b.label"
                :href="b.url || '#'"
                :target="b.url ? '_blank' : undefined"
                class="sf-badge"
              >
                <img v-if="b.imageUrl" :src="b.imageUrl" :alt="b.label" class="sf-badge-img" />
                <span v-else>{{ b.label }}</span>
              </a>
            </div>
          </template>

          <template v-if="activePayments.length && isEcom && !isLanding">
            <h4 class="site-footer__col-title sf-mt">{{ t('storefront.footer.payment_support', 'Hỗ trợ thanh toán') }}</h4>
            <div class="sf-payments-row">
              <span v-for="pm in activePayments" :key="pm.code" class="sf-payment-badge">
                {{ pm.label }}
              </span>
            </div>
          </template>
        </div>
      </div>

      <!-- Newsletter (only when marketing or ecom module installed) -->
      <div v-if="isMarketing || isEcom" class="site-footer__newsletter">
        <NewsletterForm />
      </div>

      <!-- Legal / Company Info -->
      <div class="site-footer__legal" v-if="resolvedCfg.legalText">
        <ShortcodeRenderer class="sf-legal-text" :html="nl2br(resolvedCfg.legalText)" />
      </div>

      <!-- Copyright -->
      <div class="site-footer__bottom">
        <p class="site-footer__copy">
          {{ resolvedCfg.copyrightText || `© ${year} ${info?.shop_name || storeName || 'Shop'}. All rights reserved.` }}
        </p>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import {
  Phone, Mail, MapPin, Clock, MessageCircle,
  Facebook, Instagram, Youtube, Twitter, Globe,
  ShoppingBag, ExternalLink
} from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'
import { useModules } from '../composables/useModules.js'
import ShortcodeRenderer from './ShortcodeRenderer.vue'
import NewsletterForm from './NewsletterForm.vue'

const { t, currentLang, defaultLangCode } = useI18n()

import { useSanitize } from '../composables/useSanitize.js'
const { sanitize } = useSanitize()
const { isEcom, isMarketing } = useModules()
import { useTemplate } from '../composables/useTemplate.js'
const { isLanding } = useTemplate()

defineProps({ storeName: { type: String, default: '' } })

const storeInfo = inject('storeInfo', ref(null))
const layoutConfig = inject('layoutConfig', ref(null))
const providedFooterConfig = inject('footerConfig', ref({}))
const info = computed(() => storeInfo.value || {})
const year = new Date().getFullYear()

const cfg = computed(() => {
  const defaults = {
    columns: [],
    social: [],
    paymentMethods: [],
    badges: [],
    legalText: '',
    copyrightText: '',
    bgColor: '',
  }
  // Use provided footerConfig from App.vue (via site-config) or fallback to layoutConfig
  const pfc = providedFooterConfig.value
  const hasProvided = pfc && typeof pfc === 'object' && Object.keys(pfc).length > 0
  const fc = hasProvided ? pfc : layoutConfig.value?.footerConfig

  if (!fc) return defaults
  
  // Backward compat: old format had columns as a number or missing
  const cols = fc.columns
  if (typeof cols === 'number' || (cols !== undefined && !Array.isArray(cols))) {
    // Auto-build columns from storeInfo
    const i = info.value
    const autoCols = []
    // About column
    autoCols.push({ title: i.shop_name || 'Shop', type: 'text', content: i.description || i.shop_tagline || '' })
    // Contact column
    const contactItems = []
    if (i.phone) contactItems.push({ icon: 'phone', label: t('storefront.footer.hotline', 'Hotline'), value: i.phone })
    if (i.email) contactItems.push({ icon: 'email', label: 'Email', value: i.email })
    if (i.address) contactItems.push({ icon: 'address', label: t('storefront.footer.address', 'Địa chỉ'), value: i.address })
    if (i.working_hours) contactItems.push({ icon: 'clock', label: t('storefront.footer.working_hours', 'Giờ làm việc'), value: i.working_hours })
    if (contactItems.length) autoCols.push({ title: t('storefront.footer.contact', 'Liên hệ'), type: 'contact', items: contactItems })
    // Social from storeInfo
    const social = []
    if (i.facebook) social.push({ platform: 'facebook', url: i.facebook })
    if (i.instagram) social.push({ platform: 'instagram', url: i.instagram })
    if (i.youtube) social.push({ platform: 'youtube', url: i.youtube })
    if (i.tiktok) social.push({ platform: 'tiktok', url: i.tiktok })
    if (i.zalo) social.push({ platform: 'zalo', url: `https://zalo.me/${i.zalo}` })
    return {
      ...defaults,
      columns: autoCols,
      social,
      copyrightText: fc.copyrightText || i.copyright || '',
      paymentMethods: fc.showPaymentIcons ? ['cod', 'bank', 'momo', 'vnpay'] : [],
    }
  }
  
  // Ensure each column has links/items arrays (backwards compat for data saved without them)
  const result = { ...defaults, ...fc }
  if (Array.isArray(result.columns)) {
    result.columns = result.columns.map(col => ({
      ...col,
      links: col.links || [],
      items: col.items || [],
      content: col.content || '',
    }))
  }
  return result
})

const resolvedCfg = computed(() => {
  const c = cfg.value
  const lang = currentLang.value
  if (!lang || lang === defaultLangCode.value) return c
  
  if (c.translations && c.translations[lang]) {
    return { ...c, ...c.translations[lang] }
  }
  return c
})

const isDarkBg = computed(() => {
  const bg = resolvedCfg.value.bgColor
  if (!bg) return false
  // Parse hex color and check luminance
  const hex = bg.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) < 128
})

const footerStyle = computed(() => {
  const bg = resolvedCfg.value.bgColor
  if (!bg) return {}
  const style = { background: bg }
  if (isDarkBg.value) {
    style['--sf-text-primary'] = '#fff'
    style['--sf-text-secondary'] = 'rgba(255,255,255,0.8)'
    style['--sf-text-muted'] = 'rgba(255,255,255,0.5)'
    style['--sf-border'] = 'rgba(255,255,255,0.15)'
    style['--sf-bg-card'] = 'rgba(255,255,255,0.1)'
    style['--sf-accent-light'] = '#60a5fa'
  }
  return style
})

// Filter out truly empty footer columns (show if has title OR has content)
const nonEmptyCols = computed(() => {
  return (resolvedCfg.value.columns || []).filter(col => {
    // Always show if column has a title
    if (col.title && col.title.trim()) return true
    if (col.type === 'links') return col.links?.length > 0
    if (col.type === 'contact') return col.items?.length > 0
    if (col.type === 'text') return !!(col.content && col.content.trim())
    return true
  })
})

const totalCols = computed(() => {
  const dataCols = nonEmptyCols.value.length
  const hasExtras = hasSocialOrBadges.value
  return Math.max(dataCols + (hasExtras ? 1 : 0), 1)
})

const hasSocialOrBadges = computed(() =>
  resolvedCfg.value.social?.length || resolvedCfg.value.badges?.length || activePayments.value.length
)

const allPaymentMap = {
  cod: 'COD',
  bank: 'Bank',
  visa: 'VISA',
  mastercard: 'Mastercard',
  jcb: 'JCB',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  vnpay: 'VNPay',
  napas: 'Napas',
  applepay: 'Apple Pay',
}

const activePayments = computed(() =>
  (resolvedCfg.value.paymentMethods || []).map(code => ({ code, label: allPaymentMap[code] || code }))
)

function contactIcon(type) {
  const map = { phone: Phone, email: Mail, address: MapPin, clock: Clock, text: MessageCircle }
  return map[type] || MessageCircle
}

function platformIcon(platform) {
  const map = {
    facebook: Facebook, instagram: Instagram, youtube: Youtube,
    twitter: Twitter, tiktok: MessageCircle, zalo: MessageCircle,
    shopee: ShoppingBag, lazada: ExternalLink,
  }
  return map[platform] || Globe
}

function platformLabel(platform) {
  const map = {
    facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube',
    twitter: 'Twitter/X', tiktok: 'TikTok', zalo: 'Zalo',
    shopee: 'Shopee', lazada: 'Lazada',
  }
  return map[platform] || platform
}

function nl2br(text) {
  return (text || '').replace(/\n/g, '<br>')
}
</script>

<style scoped>
.site-footer {
  margin-top: auto;
  background: var(--sf-bg-secondary);
  border-top: 1px solid var(--sf-border);
  color: var(--sf-text-secondary);
}
.site-footer__inner {
  padding: 40px 24px 20px;
}

/* ── Grid ── */
.site-footer__grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 3), 1fr);
  gap: 32px;
  padding-bottom: 24px;
}

/* ── Column Title ── */
.site-footer__col-title {
  font-size: 15px; font-weight: 700;
  color: var(--sf-text-primary);
  margin: 0 0 14px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.sf-mt { margin-top: 20px; }

/* ── Links ── */
.sf-link-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.sf-link {
  font-size: 13px; color: var(--sf-text-secondary);
  text-decoration: none; transition: all 0.2s;
  display: inline-block;
}
.sf-link:hover {
  color: var(--sf-accent-light);
  padding-left: 4px;
}

/* ── Contact ── */
.sf-contact-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 12px;
}
.sf-contact-item {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 13px; line-height: 1.5;
}
.sf-contact-icon {
  color: var(--sf-accent-light); flex-shrink: 0; margin-top: 2px;
}
.sf-contact-label {
  display: block; font-size: 12px; font-weight: 600;
  color: var(--sf-text-primary); margin-bottom: 2px;
}
.sf-contact-item a {
  color: var(--sf-text-secondary); text-decoration: none; transition: color 0.2s;
}
.sf-contact-item a:hover { color: var(--sf-accent-light); }

/* ── Text Content ── */
.sf-text-content {
  font-size: 13px; line-height: 1.6; color: var(--sf-text-secondary);
}

/* ── Social ── */
.sf-social-row {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.sf-social-link {
  display: flex; align-items: center; justify-content: center;
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-secondary); transition: all 0.25s; text-decoration: none;
}
.sf-social-link:hover {
  transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.sf-social-link--facebook:hover { background: #1877f2; color: #fff; border-color: #1877f2; }
.sf-social-link--instagram:hover { background: #e1306c; color: #fff; border-color: #e1306c; }
.sf-social-link--youtube:hover { background: #ff0000; color: #fff; border-color: #ff0000; }
.sf-social-link--tiktok:hover { background: #010101; color: #fff; border-color: #010101; }
.sf-social-link--zalo:hover { background: #0068ff; color: #fff; border-color: #0068ff; }
.sf-social-link--twitter:hover { background: #1da1f2; color: #fff; border-color: #1da1f2; }
.sf-social-link--shopee:hover { background: #ee4d2d; color: #fff; border-color: #ee4d2d; }
.sf-social-link--lazada:hover { background: #0f146d; color: #fff; border-color: #0f146d; }

/* ── Badges ── */
.sf-badges-row {
  display: flex; gap: 8px; flex-wrap: wrap;
}
.sf-badge {
  display: inline-flex; text-decoration: none;
}
.sf-badge-img {
  height: 28px; width: auto; border-radius: 4px;
  object-fit: contain;
}

/* ── Payments ── */
.sf-payments-row {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.sf-payment-badge {
  font-size: 11px; font-weight: 700;
  padding: 6px 12px; border-radius: 6px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-secondary);
  letter-spacing: 0.3px;
}

/* ── Legal ── */
.site-footer__legal {
  border-top: 1px solid var(--sf-border);
  padding: 16px 0 8px;
}
.sf-legal-text {
  font-size: 12px; color: var(--sf-text-muted); line-height: 1.7;
  text-align: center;
}

/* ── Newsletter ── */
.site-footer__newsletter {
  border-top: 1px solid var(--sf-border);
  padding: 20px 0;
  max-width: 480px;
  margin: 0 auto;
}

/* ── Copyright ── */
.site-footer__bottom {
  border-top: 1px solid var(--sf-border);
  padding-top: 12px; text-align: center;
}
.site-footer__copy {
  font-size: 12px; color: var(--sf-text-muted); margin: 0;
}

/* ── Responsive ── */
@media (max-width: 768px) {
  .site-footer__grid { grid-template-columns: 1fr !important; gap: 24px; }
}
@media (min-width: 769px) and (max-width: 1024px) {
  .site-footer__grid { grid-template-columns: repeat(2, 1fr) !important; }
}
</style>
