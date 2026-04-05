<template>
  <section class="sf-pharmacy-hero" :style="heroStyle">
    <!-- Floating Unified Panel (Search + Keywords + Actions) -->
    <div class="sf-ph-overlay-panel">
      <!-- Search Box -->
      <div class="sf-ph-search-wrap">
        <div class="sf-ph-search-box">
          <Search :size="20" class="search-icon" />
          <input 
            type="text" 
            class="sf-ph-search-input" 
            :placeholder="resolvedParams.searchPlaceholder || t('storefront.msg_search_hint', 'Bạn đang tìm gì hôm nay...')" 
          />
        </div>
      </div>

      <!-- Hot Keywords -->
      <div class="sf-ph-keywords" v-if="keywordsList.length">
        <span v-for="(kw, idx) in keywordsList" :key="idx" class="sf-ph-keyword">{{ kw }}</span>
      </div>

      <!-- Action Cards -->
      <div class="sf-ph-actions-row" v-if="actionCards.length">
        <a 
          v-for="(card, idx) in actionCards" 
          :key="idx" 
          :href="card.url || '#'" 
          class="sf-ph-action-card"
          @click.prevent="card.url && card.url !== '#' ? $router.push(card.url) : null"
        >
          <div class="sf-ph-card-icon">
            <img v-if="card.icon" :src="card.icon" alt="icon" />
            <component v-else-if="card.lucideIcon" :is="getIcon(card.lucideIcon)" :size="24" />
            <span v-else class="sf-ph-icon-placeholder">✨</span>
          </div>
          <span class="sf-ph-card-title">{{ card.title || t('storefront.msg_feature', 'Chức năng') }}</span>
          <ChevronRight :size="16" class="sf-ph-card-arrow" />
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { Search, ChevronRight, Activity, Heart, Stethoscope, Pill, ShieldPlus } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: () => [] },
  section: { type: Object, default: () => ({}) }
})

// === Embedded Responsive Logic ===
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200)
const onResize = () => { windowWidth.value = window.innerWidth }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const isMobile = computed(() => windowWidth.value <= 768)
const isTablet = computed(() => windowWidth.value > 768 && windowWidth.value <= 1024)

const resolvedParams = computed(() => {
  const p = { ...(props.params || {}) }
  const tablet = props.section.tabletParams || {}
  const mobile = props.section.mobileParams || {}
  
  if (isTablet.value || isMobile.value) {
    for (const k in tablet) if (tablet[k] !== undefined && tablet[k] !== '') p[k] = tablet[k]
  }
  if (isMobile.value) {
    for (const k in mobile) if (mobile[k] !== undefined && mobile[k] !== '') p[k] = mobile[k]
  }
  return p
})

const heroStyle = computed(() => {
  const bg = resolvedParams.value.desktopImage || 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=2070&auto=format&fit=crop'
  return {
    backgroundImage: `url(${bg})`
  }
})

const keywordsList = computed(() => {
  const kw = resolvedParams.value.hotKeywords
  if (!kw) return []
  if (Array.isArray(kw)) return kw
  return kw.split(',').map(s => s.trim()).filter(Boolean)
})

const actionCards = computed(() => {
  return (props.content && Array.isArray(props.content)) ? props.content : []
})

const iconMapping = {
  Activity, Heart, Stethoscope, Pill, ShieldPlus
}
function getIcon(name) {
  return iconMapping[name] || Pill
}
</script>

<style scoped>
.sf-pharmacy-hero {
  position: relative;
  width: 100%;
  min-height: 520px;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  padding-bottom: 20px;
  margin-bottom: 40px;
  font-family: var(--sf-font-family, 'Inter', sans-serif);
}

.sf-ph-overlay-panel {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 900px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  padding: 24px;
  margin: 0 20px;
  transform: translateY(40px); /* Hang an overlap out of the hero */
}

/* ── Search Box ── */
.sf-ph-search-wrap {
  width: 100%;
  border: 1px solid #e2e8f0;
  border-radius: 99px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.sf-ph-search-wrap:focus-within {
  border-color: #1B51A3;
}

.sf-ph-search-box {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 16px;
}

.search-icon {
  color: #64748b;
  margin-right: 8px;
}

.sf-ph-search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 15px;
  color: #1e293b;
}

/* ── Keywords ── */
.sf-ph-keywords {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 16px 0 24px;
  padding: 0 12px;
}

.sf-ph-keyword {
  color: #475569;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.2s;
}

.sf-ph-keyword:hover {
  color: #1B51A3;
  text-decoration: underline;
}

/* ── Action Cards Row ── */
.sf-ph-actions-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  border-top: 1px solid #f1f5f9;
  padding-top: 20px;
}

.sf-ph-action-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
  padding: 8px;
  border-radius: 12px;
  transition: background 0.2s;
}

.sf-ph-action-card:hover {
  background: #f8fafc;
}

.sf-ph-card-icon {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1B51A3;
}

.sf-ph-card-icon img {
  width: 24px;
  height: 24px;
  object-fit: contain;
}

.sf-ph-card-title {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.sf-ph-card-arrow {
  color: #94a3b8;
  transition: transform 0.2s;
}

.sf-ph-action-card:hover .sf-ph-card-arrow {
  transform: translateX(4px);
  color: #1B51A3;
}

@media (max-width: 768px) {
  .sf-pharmacy-hero {
    min-height: 400px;
    margin-bottom: 20px;
    padding-bottom: 80px;
  }
  .sf-ph-overlay-panel {
    transform: translateY(20px);
    padding: 16px;
  }
  .sf-ph-actions-row {
    flex-direction: column;
  }

}
</style>
