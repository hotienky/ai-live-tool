<template>
  <footer class="site-footer">
    <div class="site-footer__inner container">
      <!-- Top Row: Multi-Column Grid -->
      <div class="site-footer__top" :style="{ '--footer-cols': footerCfg.columns }">

        <!-- Column 1: Brand + Description -->
        <div class="site-footer__brand-col">
          <div class="site-footer__brand">
            <img v-if="info?.logo" :src="info.logo" :alt="info.shop_name" class="site-footer__logo-img" />
            <Store v-else :size="20" class="site-footer__logo-icon" />
            <strong class="site-footer__name">{{ info?.shop_name || storeName || 'Shop' }}</strong>
          </div>
          <p v-if="info?.shop_tagline || info?.description" class="site-footer__desc">
            {{ info?.description || info?.shop_tagline }}
          </p>
          <!-- Social Links -->
          <div class="site-footer__social" v-if="socialLinks.length">
            <a
              v-for="s in socialLinks"
              :key="s.key"
              :href="s.url"
              target="_blank"
              :title="s.label"
              class="site-footer__social-link"
              :class="'site-footer__social-link--' + s.key"
            >
              <component :is="s.icon" :size="16" />
            </a>
          </div>
        </div>

        <!-- Column 2: Contact -->
        <div class="site-footer__col" v-if="footerCfg.showContact && hasContact">
          <h4 class="site-footer__col-title">Liên hệ</h4>
          <ul class="site-footer__contact-list">
            <li v-if="info.phone" class="site-footer__contact-item">
              <Phone :size="14" />
              <a :href="'tel:' + info.phone.replace(/\s/g, '')">{{ info.phone }}</a>
            </li>
            <li v-if="info.email" class="site-footer__contact-item">
              <Mail :size="14" />
              <a :href="'mailto:' + info.email">{{ info.email }}</a>
            </li>
            <li v-if="info.address" class="site-footer__contact-item">
              <MapPin :size="14" />
              <span>{{ info.address }}</span>
            </li>
            <li v-if="info.working_hours" class="site-footer__contact-item">
              <Clock :size="14" />
              <span>{{ info.working_hours }}</span>
            </li>
          </ul>
        </div>

        <!-- Column 3: Footer Nav Links -->
        <div class="site-footer__col" v-if="footerCfg.showLinks && footerLinks.length">
          <h4 class="site-footer__col-title">Liên kết</h4>
          <ul class="site-footer__link-list">
            <li v-for="link in footerLinks" :key="link.id">
              <router-link :to="link.url" class="site-footer__link">
                <ChevronRight :size="12" />
                {{ link.label || link.name }}
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Column 4: Policies (if configured) -->
        <div class="site-footer__col" v-if="footerCfg.showPolicies && policyLinks.length">
          <h4 class="site-footer__col-title">Chính sách</h4>
          <ul class="site-footer__link-list">
            <li v-for="link in policyLinks" :key="link.id">
              <router-link :to="link.url" class="site-footer__link">
                <ChevronRight :size="12" />
                {{ link.label || link.name }}
              </router-link>
            </li>
          </ul>
        </div>
      </div>

      <!-- Payment Icons -->
      <div class="site-footer__payments" v-if="footerCfg.showPaymentIcons">
        <span class="site-footer__payments-label">Phương thức thanh toán</span>
        <div class="site-footer__payments-icons">
          <span v-for="pm in paymentMethods" :key="pm.code" class="site-footer__payment-badge" :title="pm.name">
            {{ pm.label }}
          </span>
        </div>
      </div>

      <!-- Bottom Bar: Copyright -->
      <div class="site-footer__bottom">
        <p class="site-footer__copy">
          {{ footerCfg.copyrightText || info?.copyright || `© ${year} ${info?.shop_name || storeName || 'Shop'}. All rights reserved.` }}
        </p>
        <div class="site-footer__bottom-links">
          <router-link to="/page/chinh-sach-bao-mat" v-if="footerCfg.showPolicies">Chính sách bảo mật</router-link>
          <router-link to="/page/dieu-khoan-su-dung" v-if="footerCfg.showPolicies">Điều khoản sử dụng</router-link>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { apiFetch } from '../api.js'
import {
  Store, Phone, Mail, MapPin, Clock, ChevronRight,
  Facebook, Instagram, Youtube, Twitter, MessageCircle, Globe
} from 'lucide-vue-next'

defineProps({ storeName: { type: String, default: '' } })

const storeInfo = inject('storeInfo', ref(null))
const layoutConfig = inject('layoutConfig', ref(null))
const info = computed(() => storeInfo.value || {})
const year = new Date().getFullYear()

const footerCfg = computed(() => {
  const defaults = {
    columns: 3,
    showContact: true,
    showLinks: true,
    showPolicies: true,
    showPaymentIcons: false,
    copyrightText: '',
  }
  const fc = layoutConfig.value?.footerConfig
  return fc ? { ...defaults, ...fc } : defaults
})

const hasContact = computed(() => {
  const i = info.value
  return i?.phone || i?.email || i?.address || i?.working_hours
})

const footerLinks = ref([])
const policyLinks = ref([])

const socialLinks = computed(() => {
  const i = info.value
  if (!i) return []
  const links = []
  if (i.facebook) links.push({ key: 'fb', url: i.facebook, label: 'Facebook', icon: Facebook })
  if (i.instagram) links.push({ key: 'ig', url: i.instagram, label: 'Instagram', icon: Instagram })
  if (i.youtube) links.push({ key: 'yt', url: i.youtube, label: 'YouTube', icon: Youtube })
  if (i.tiktok) links.push({ key: 'tt', url: i.tiktok, label: 'TikTok', icon: MessageCircle })
  if (i.zalo) links.push({ key: 'zl', url: `https://zalo.me/${i.zalo}`, label: 'Zalo', icon: MessageCircle })
  return links
})

const paymentMethods = computed(() => {
  return [
    { code: 'cod', name: 'Thanh toán khi nhận hàng', label: 'COD' },
    { code: 'bank', name: 'Chuyển khoản ngân hàng', label: 'Bank' },
    { code: 'momo', name: 'Ví MoMo', label: 'MoMo' },
    { code: 'vnpay', name: 'VNPay', label: 'VNPay' },
  ]
})

onMounted(async () => {
  try {
    const res = await apiFetch('/nav-links')
    const allLinks = Array.isArray(res) ? res : (res?.data || [])
    const activeLinks = allLinks.filter(l => l.status === 1).sort((a, b) => a.sort - b.sort)
    footerLinks.value = activeLinks.filter(l => l.type === 'footer')
    policyLinks.value = activeLinks.filter(l => l.type === 'policy')
  } catch { /* ignore */ }
})
</script>

<style scoped>
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--sf-border);
  background: var(--sf-bg-secondary);
}

.site-footer__inner {
  padding: 40px 24px 24px;
}

/* ── Top Grid ── */
.site-footer__top {
  display: grid;
  grid-template-columns: 1.5fr repeat(calc(var(--footer-cols, 3) - 1), 1fr);
  gap: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--sf-border);
}

/* ── Brand Column ── */
.site-footer__brand {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.site-footer__logo-img {
  width: 36px; height: 36px; border-radius: 8px; object-fit: contain;
  flex-shrink: 0;
}
.site-footer__logo-icon {
  color: var(--sf-accent-light); flex-shrink: 0;
}
.site-footer__name {
  font-size: 16px; font-weight: 700; color: var(--sf-text-primary);
}
.site-footer__desc {
  font-size: 13px; color: var(--sf-text-muted); line-height: 1.6;
  margin: 0 0 16px; max-width: 320px;
}

/* ── Social Links (in brand column) ── */
.site-footer__social {
  display: flex; gap: 8px; margin-top: 4px;
}
.site-footer__social-link {
  display: flex; align-items: center; justify-content: center;
  width: 34px; height: 34px; border-radius: 8px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-secondary); transition: all 0.25s; text-decoration: none;
}
.site-footer__social-link:hover {
  border-color: var(--sf-accent); color: var(--sf-accent-light);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.site-footer__social-link--fb:hover { color: #1877f2; border-color: #1877f2; }
.site-footer__social-link--ig:hover { color: #e1306c; border-color: #e1306c; }
.site-footer__social-link--yt:hover { color: #ff0000; border-color: #ff0000; }
.site-footer__social-link--tt:hover { color: #010101; border-color: #010101; }

/* ── Column shared ── */
.site-footer__col-title {
  font-size: 13px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--sf-text-primary);
  margin: 0 0 14px; padding-bottom: 8px;
  border-bottom: 2px solid var(--sf-accent-light);
  display: inline-block;
}

/* ── Contact List ── */
.site-footer__contact-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 10px;
}
.site-footer__contact-item {
  display: flex; align-items: flex-start; gap: 10px;
  font-size: 13px; color: var(--sf-text-secondary); line-height: 1.5;
}
.site-footer__contact-item svg {
  color: var(--sf-accent-light); flex-shrink: 0; margin-top: 2px;
}
.site-footer__contact-item a {
  color: var(--sf-text-secondary); text-decoration: none; transition: color 0.2s;
}
.site-footer__contact-item a:hover { color: var(--sf-accent-light); }

/* ── Link List ── */
.site-footer__link-list {
  list-style: none; padding: 0; margin: 0;
  display: flex; flex-direction: column; gap: 8px;
}
.site-footer__link {
  font-size: 13px; color: var(--sf-text-secondary);
  text-decoration: none; transition: all 0.2s;
  display: flex; align-items: center; gap: 4px;
}
.site-footer__link svg {
  color: var(--sf-accent-light); opacity: 0; transition: all 0.2s;
  transform: translateX(-4px);
}
.site-footer__link:hover {
  color: var(--sf-accent-light);
  padding-left: 4px;
}
.site-footer__link:hover svg {
  opacity: 1; transform: translateX(0);
}

/* ── Payment Icons ── */
.site-footer__payments {
  display: flex; align-items: center; gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--sf-border);
  flex-wrap: wrap;
}
.site-footer__payments-label {
  font-size: 12px; color: var(--sf-text-muted); font-weight: 500;
}
.site-footer__payments-icons {
  display: flex; gap: 6px; flex-wrap: wrap;
}
.site-footer__payment-badge {
  font-size: 11px; font-weight: 600;
  padding: 4px 10px; border-radius: 4px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-secondary);
  letter-spacing: 0.3px;
}

/* ── Bottom Bar ── */
.site-footer__bottom {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 16px; flex-wrap: wrap; gap: 12px;
}
.site-footer__copy {
  font-size: 12px; color: var(--sf-text-muted); margin: 0;
}
.site-footer__bottom-links {
  display: flex; gap: 16px;
}
.site-footer__bottom-links a {
  font-size: 12px; color: var(--sf-text-muted);
  text-decoration: none; transition: color 0.2s;
}
.site-footer__bottom-links a:hover { color: var(--sf-accent-light); }

/* ── Responsive ── */
@media (max-width: 768px) {
  .site-footer__top { grid-template-columns: 1fr !important; gap: 24px; }
  .site-footer__bottom { flex-direction: column; text-align: center; }
  .site-footer__bottom-links { justify-content: center; }
  .site-footer__payments { justify-content: center; }
}
</style>
