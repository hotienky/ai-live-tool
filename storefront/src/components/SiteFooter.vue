<template>
  <footer class="site-footer">
    <div class="site-footer__inner container">
      <!-- Brand + Tagline -->
      <div class="site-footer__top">
        <div class="site-footer__brand">
          <img v-if="info?.logo" :src="info.logo" :alt="info.shop_name" class="site-footer__logo-img" />
          <Store v-else :size="18" class="site-footer__logo-icon" />
          <div>
            <strong>{{ info?.shop_name || storeName || 'Shop' }}</strong>
            <span v-if="info?.shop_tagline" class="site-footer__tagline">{{ info.shop_tagline }}</span>
          </div>
        </div>

        <!-- Contact Info -->
        <div class="site-footer__contact" v-if="info?.phone || info?.email || info?.address">
          <div v-if="info.phone" class="site-footer__contact-item">
            <Phone :size="14" />
            <a :href="'tel:' + info.phone.replace(/\s/g, '')">{{ info.phone }}</a>
          </div>
          <div v-if="info.email" class="site-footer__contact-item">
            <Mail :size="14" />
            <a :href="'mailto:' + info.email">{{ info.email }}</a>
          </div>
          <div v-if="info.address" class="site-footer__contact-item">
            <MapPin :size="14" />
            <span>{{ info.address }}</span>
          </div>
        </div>

        <!-- Footer Nav Links (from API) -->
        <div class="site-footer__links" v-if="footerLinks.length">
          <router-link
            v-for="link in footerLinks"
            :key="link.id"
            :to="link.url"
          >{{ link.label || link.name }}</router-link>
        </div>
      </div>

      <!-- Bottom Bar: Copyright + Social -->
      <div class="site-footer__bottom">
        <p class="site-footer__copy">
          {{ info?.copyright || `© ${year} ${info?.shop_name || storeName || 'Shop'}. Powered by AI Live Tool` }}
        </p>
        <div class="site-footer__social" v-if="socialLinks.length">
          <a
            v-for="s in socialLinks"
            :key="s.key"
            :href="s.url"
            target="_blank"
            :title="s.label"
            class="site-footer__social-link"
          >
            <component :is="s.icon" :size="16" />
          </a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import { apiFetch } from '../api.js'
import { Store, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Twitter, MessageCircle, Globe } from 'lucide-vue-next'

defineProps({ storeName: { type: String, default: '' } })

const storeInfo = inject('storeInfo', ref(null))
const info = computed(() => storeInfo.value || {})
const year = new Date().getFullYear()

const footerLinks = ref([])

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

onMounted(async () => {
  try {
    const res = await apiFetch('/nav-links')
    const allLinks = Array.isArray(res) ? res : (res?.data || [])
    footerLinks.value = allLinks.filter(l => l.type === 'footer' && l.status === 1).sort((a, b) => a.sort - b.sort)
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
  padding: 32px 24px 20px;
}

.site-footer__top {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sf-border);
}

.site-footer__brand {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.site-footer__logo-img {
  width: 32px; height: 32px; border-radius: 6px; object-fit: contain;
  flex-shrink: 0; margin-top: 2px;
}
.site-footer__logo-icon { color: var(--sf-accent-light); flex-shrink: 0; margin-top: 2px; }

.site-footer__brand strong {
  font-size: 15px; display: block; color: var(--sf-text-primary);
}
.site-footer__tagline {
  font-size: 12px; color: var(--sf-text-muted); display: block; margin-top: 2px;
}

.site-footer__contact {
  display: flex; flex-direction: column; gap: 8px;
}
.site-footer__contact-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--sf-text-secondary);
}
.site-footer__contact-item a {
  color: var(--sf-text-secondary); text-decoration: none; transition: color 0.2s;
}
.site-footer__contact-item a:hover { color: var(--sf-accent-light); }
.site-footer__contact-item svg { color: var(--sf-accent-light); flex-shrink: 0; }

.site-footer__links {
  display: flex; flex-direction: column; gap: 6px;
}
.site-footer__links a {
  font-size: 13px; color: var(--sf-text-secondary);
  text-decoration: none; transition: color 0.2s;
}
.site-footer__links a:hover { color: var(--sf-accent-light); }

.site-footer__bottom {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 16px; flex-wrap: wrap; gap: 12px;
}
.site-footer__copy {
  font-size: 12px; color: var(--sf-text-muted); margin: 0;
}
.site-footer__social {
  display: flex; gap: 8px;
}
.site-footer__social-link {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-secondary); transition: all 0.2s; text-decoration: none;
}
.site-footer__social-link:hover {
  border-color: var(--sf-accent); color: var(--sf-accent-light);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .site-footer__top { grid-template-columns: 1fr; }
  .site-footer__bottom { flex-direction: column; text-align: center; }
}
</style>
