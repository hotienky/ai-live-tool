<template>
  <section class="sf-pharmacy-hero" :style="heroStyle">
    <div class="sf-ph-overlay"></div>
    <div class="sf-ph-content">
      <h1 class="sf-ph-title" v-if="responsiveConfig.primaryText">{{ responsiveConfig.primaryText }}</h1>
      
      <!-- Search Box -->
      <div class="sf-ph-search-wrap">
        <div class="sf-ph-search-box">
          <Search :size="20" class="search-icon" />
          <input 
            type="text" 
            class="sf-ph-search-input" 
            :placeholder="responsiveConfig.searchPlaceholder || 'Bạn đang tìm gì hôm nay...'" 
          />
          <button class="sf-ph-search-btn">Tìm kiếm</button>
        </div>
        
        <!-- Hot Keywords -->
        <div class="sf-ph-keywords" v-if="keywordsList.length">
          <span v-for="(kw, idx) in keywordsList" :key="idx" class="sf-ph-keyword">{{ kw }}</span>
        </div>
      </div>
    </div>

    <!-- Action Cards -->
    <div class="sf-ph-actions-container" v-if="actionCards.length">
      <div class="sf-ph-actions-grid" :style="{ gridTemplateColumns: `repeat(${Math.min(actionCards.length, 3)}, 1fr)` }">
        <a 
          v-for="(card, idx) in actionCards" 
          :key="idx" 
          :href="card.url || '#'" 
          class="sf-ph-action-card"
          @click.prevent="card.url ? null : undefined"
        >
          <div class="sf-ph-card-icon">
            <img v-if="card.icon" :src="card.icon" alt="icon" />
            <component v-else-if="card.lucideIcon" :is="getIcon(card.lucideIcon)" :size="28" />
            <span v-else class="sf-ph-icon-placeholder">✨</span>
          </div>
          <span class="sf-ph-card-title">{{ card.title || 'Chức năng' }}</span>
          <ChevronRight :size="16" class="sf-ph-card-arrow" />
        </a>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Search, ChevronRight, Activity, Heart, Stethoscope, Pill, ShieldPlus } from 'lucide-vue-next'
import { useResponsiveConfig } from '../../composables/useResponsiveConfig.js'

const props = defineProps({
  config: { type: Object, default: () => ({}) },
  tabletConfig: { type: Object, default: () => ({}) },
  mobileConfig: { type: Object, default: () => ({}) },
})

const { responsiveConfig } = useResponsiveConfig(props)

const heroStyle = computed(() => {
  const bg = responsiveConfig.value.desktopImage || 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=2070&auto=format&fit=crop'
  // Ideally, use mobileImage for mobile, but typically it's handled via CSS media queries. 
  // Here we just use inline style for simplicity or apply classes.
  return {
    backgroundImage: `url(${bg})`
  }
})

const keywordsList = computed(() => {
  const kw = responsiveConfig.value.hotKeywords
  if (!kw) return []
  return kw.split(',').map(s => s.trim()).filter(Boolean)
})

const actionCards = computed(() => {
  return responsiveConfig.value._content || []
})

const iconMapping = {
  Activity, Heart, Stethoscope, Pill, ShieldPlus
}
function getIcon(name) {
  return iconMapping[name] || Heart
}
</script>

<style scoped>
.sf-pharmacy-hero {
  position: relative;
  width: 100%;
  min-height: 480px;
  background-size: cover;
  background-position: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin-bottom: 60px; /* Space for trailing cards */
  font-family: var(--font-family, 'Inter', sans-serif);
}

.sf-ph-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to right, rgba(0, 48, 91, 0.7) 0%, rgba(0, 48, 91, 0.3) 100%);
}

.sf-ph-content {
  position: relative;
  z-index: 2;
  width: 100%;
  max-width: 800px;
  padding: 0 20px;
  text-align: center;
  margin-top: -40px;
}

.sf-ph-title {
  color: #fff;
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 30px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.2);
}

.sf-ph-search-wrap {
  width: 100%;
  max-width: 680px;
  margin: 0 auto;
}

.sf-ph-search-box {
  display: flex;
  background: #fff;
  border-radius: 99px;
  padding: 6px 6px 6px 20px;
  align-items: center;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
}

.search-icon {
  color: #64748b;
  flex-shrink: 0;
}

.sf-ph-search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 12px 16px;
  font-size: 16px;
  color: #1e293b;
  background: transparent;
}

.sf-ph-search-btn {
  background: #00305b; /* Pharmacity dark blue */
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 12px 28px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.sf-ph-search-btn:hover {
  background: #004580;
}

.sf-ph-keywords {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 16px;
}

.sf-ph-keyword {
  color: #fff;
  font-size: 13px;
  background: rgba(255,255,255,0.2);
  padding: 4px 12px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  cursor: pointer;
  transition: background 0.2s;
}

.sf-ph-keyword:hover {
  background: rgba(255,255,255,0.3);
}

.sf-ph-actions-container {
  position: absolute;
  bottom: -40px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 10;
  padding: 0 20px;
}

.sf-ph-actions-grid {
  display: grid;
  gap: 16px;
  width: 100%;
  max-width: 900px;
}

.sf-ph-action-card {
  background: #ffffff;
  border-radius: 16px;
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  text-decoration: none;
  box-shadow: 0 10px 30px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  border: 1px solid #f1f5f9;
}

.sf-ph-action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 14px 40px rgba(0,48,91,0.12);
  border-color: #e2e8f0;
}

.sf-ph-card-icon {
  width: 48px;
  height: 48px;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00305b;
}

.sf-ph-card-icon img {
  width: 32px;
  height: 32px;
  object-fit: contain;
}

.sf-ph-card-title {
  flex: 1;
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.sf-ph-card-arrow {
  color: #94a3b8;
  transition: transform 0.2s;
}

.sf-ph-action-card:hover .sf-ph-card-arrow {
  transform: translateX(4px);
  color: #00305b;
}

@media (max-width: 768px) {
  .sf-pharmacy-hero {
    min-height: 400px;
    margin-bottom: auto; /* Revert on mobile */
    padding-bottom: 80px; /* Space for stack */
  }
  .sf-ph-title {
    font-size: 28px;
  }
  .sf-ph-actions-container {
    bottom: -60px;
  }
  .sf-ph-actions-grid {
    grid-template-columns: 1fr !important;
    max-width: 400px;
  }
  .sf-ph-search-btn {
    padding: 10px 16px;
  }
  .sf-ph-search-input {
    font-size: 14px;
  }
}
</style>
