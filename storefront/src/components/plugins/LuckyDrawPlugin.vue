<template>
  <div class="lucky-draw-plugin" :style="customVars">
    <div v-if="loading" class="ld-loading">
      <div class="spinner"></div>
      <p>Đang tải vòng quay...</p>
    </div>
    
    <div v-else-if="error" class="ld-error">
      {{ error }}
    </div>

    <div v-else-if="campaign" class="ld-container" :style="{ backgroundImage: bgImage ? `url(${bgImage})` : 'none' }">
      <div class="ld-header">
        <h2 class="ld-title">{{ campaign.name }}</h2>
        <p v-if="campaign.description" class="ld-desc">{{ campaign.description }}</p>
      </div>

      <div class="ld-wheel-wrapper">
        <div class="ld-pointer"></div>
        <div 
          class="ld-wheel" 
          :style="{ transform: `rotate(${currentRotation}deg)` }"
          :class="{ 'is-spinning': isSpinning }"
        >
          <!-- Draw Wheel Slices using SVG -->
          <svg viewBox="0 0 100 100" class="ld-wheel-svg">
            <g v-for="(prize, index) in chartPrizes" :key="index">
              <path 
                :d="prize.path" 
                :fill="prize.color" 
                stroke="#fff" 
                stroke-width="1"
              />
              <!-- Text -->
              <text 
                x="50" 
                y="15" 
                :fill="textColor" 
                font-size="4.5" 
                font-weight="bold" 
                text-anchor="middle"
                :transform="`rotate(${prize.textRotation}, 50, 50)`"
              >
                {{ prize.label }}
              </text>
            </g>
          </svg>
        </div>

        <button 
          class="ld-spin-btn" 
          @click="spinWheel" 
          :disabled="isSpinning"
        >
          <span v-if="isSpinning">Đang quay</span>
          <span v-else>{{ buttonText }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiFetch } from '../../api.js'

const props = defineProps({
  id: { type: [String, Number], required: true }
})

const loading = ref(true)
const error = ref(null)
const campaign = ref(null)
const prizes = ref([])

const isSpinning = ref(false)
const currentRotation = ref(0) // Default wheel orientation
const slicesCount = computed(() => prizes.value.length)

// Style Variables
const wheelColor = computed(() => campaign.value?.settings?.wheel_color || '#E84C3D')
const textColor = computed(() => campaign.value?.settings?.text_color || '#FFFFFF')
const buttonText = computed(() => campaign.value?.settings?.button_text || 'QUAY NGAY')
const bgImage = computed(() => campaign.value?.background_image || '')

const customVars = computed(() => ({
  '--ld-wheel-color': wheelColor.value,
  '--ld-text-color': textColor.value,
}))

// Colors array if individual prize color is missing
const defaultColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722']

const chartPrizes = computed(() => {
  if (slicesCount.value === 0) return []
  const sliceAngle = 360 / slicesCount.value
  return prizes.value.map((p, i) => {
    const startAngle = i * sliceAngle
    const endAngle = (i + 1) * sliceAngle
    
    // SVG calculations (radius 50, center 50,50)
    // -90deg offset so 0 starts at top
    const startRad = (startAngle - 90) * Math.PI / 180
    const endRad = (endAngle - 90) * Math.PI / 180
    
    const x1 = 50 + 50 * Math.cos(startRad)
    const y1 = 50 + 50 * Math.sin(startRad)
    const x2 = 50 + 50 * Math.cos(endRad)
    const y2 = 50 + 50 * Math.sin(endRad)
    
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1
    
    // Path d = M center L start A radius radius 0 largeArc sweep end Z (close)
    const path = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`
    
    // Text should be centered in the slice.
    // Text rotates around origin 50,50. Note: original text is drawn at top (x=50, y=15), so we rotate it by (startAngle + endAngle)/2.
    const textRotation = startAngle + (sliceAngle / 2)

    return {
      ...p,
      color: p.color || defaultColors[i % defaultColors.length],
      path,
      textRotation
    }
  })
})

async function fetchCampaign() {
  loading.value = true
  error.value = null
  try {
    const res = await apiFetch(`/storefront/lucky-draw/${props.id}`)
    const data = res.data || res
    campaign.value = data
    prizes.value = data.prizes || []
    
    if (prizes.value.length === 0) {
      error.value = 'Chưa có giải thưởng nào trong chiến dịch này.'
    }
  } catch (err) {
    error.value = err.message || 'Lỗi tải vòng quay.'
  } finally {
    loading.value = false
  }
}

async function spinWheel() {
  if (isSpinning.value || slicesCount.value === 0) return
  isSpinning.value = true
  
  try {
    const res = await apiFetch(`/storefront/lucky-draw/${props.id}/spin`, { method: 'POST' })
    const data = res.data || res
    const wonPrizeId = data.prize?.id
    
    if (!wonPrizeId) {
       // Lose or random empty
       alert(res.message || 'Chúc bạn may mắn lần sau!')
       isSpinning.value = false
       return
    }

    // Find the prize index to stop on
    const targetIndex = prizes.value.findIndex(p => p.id === wonPrizeId)
    if (targetIndex === -1) {
       alert('Lỗi: Không tìm thấy giải thưởng trùng khớp trên vòng quay.')
       isSpinning.value = false
       return
    }

    // Math:
    // Pointer is at TOP (0 degrees).
    // The prize's center in our drawing starts at `targetIndex * sliceAngle + (sliceAngle / 2)`.
    // To align the prize center to TOP, the wheel must be rotated backwards by that angle.
    const sliceAngle = 360 / slicesCount.value
    const prizeCenterAngle = targetIndex * sliceAngle + (sliceAngle / 2)
    
    // Add extra spins (e.g. 5 full rotations = 1800 deg)
    const extraSpins = 360 * 5 
    
    // currentRotation increases monotonically so it spins forward continuously.
    // current target absolute rotation = (current base rounding up to 360) + extraSpins + (360 - prizeCenterAngle)
    const baseRotation = Math.ceil(currentRotation.value / 360) * 360
    let targetRotation = baseRotation + extraSpins + (360 - prizeCenterAngle)
    
    currentRotation.value = targetRotation

    // Wait for the CSS animation to complete (4 seconds)
    setTimeout(() => {
      isSpinning.value = false
      // Show result
      alert(res.message || `Chúc mừng! Bạn đã trúng: ${data.prize.label}`)
    }, 4500) // 4.5s matches transition duration + 0.5 buffer
    
  } catch (err) {
    alert(err.message || 'Lỗi khi quay số!')
    isSpinning.value = false
  }
}

onMounted(() => {
  if (props.id) {
    fetchCampaign()
  } else {
    error.value = 'Missing Campaign ID (id="..")'
    loading.value = false
  }
})
</script>

<style scoped>
.lucky-draw-plugin {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  font-family: 'Inter', sans-serif;
}
.ld-loading, .ld-error {
  text-align: center;
  padding: 40px;
  background: var(--sf-bg-surface, #f9f9f9);
  border-radius: 12px;
}
.ld-error {
  color: #E84C3D;
  font-weight: 500;
}
.spinner {
  width: 32px; height: 32px;
  border: 3px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.ld-container {
  padding: 30px 20px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 16px;
  background-color: var(--sf-bg-card, #ffffff);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  text-align: center;
  overflow: hidden;
}

.ld-header {
  margin-bottom: 24px;
}
.ld-title {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 800;
  color: var(--sf-text-primary, #111);
}
.ld-desc {
  margin: 0;
  font-size: 14px;
  color: var(--sf-text-secondary, #666);
}

.ld-wheel-wrapper {
  position: relative;
  width: 100%;
  max-width: 350px;
  aspect-ratio: 1/1;
  margin: 0 auto;
}

.ld-pointer {
  position: absolute;
  top: -15px; /* Stick out above the wheel */
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 40px;
  background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23E84C3D" xmlns="http://www.w3.org/2000/svg"><path d="M12 24L0 0H24L12 24Z"/></svg>');
  background-size: contain;
  background-repeat: no-repeat;
  z-index: 10;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.ld-wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  border: 6px solid var(--ld-wheel-color, #E84C3D);
  box-shadow: 0 4px 15px rgba(0,0,0,0.1), inset 0 0 10px rgba(0,0,0,0.1);
  transition: transform 4s cubic-bezier(0.14, 0.73, 0.1, 1); 
  /* Ease-out curve for natural deceleration */
  will-change: transform;
}
.ld-wheel-svg {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  display: block;
}

.ld-spin-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: white;
  border: 4px solid var(--ld-wheel-color, #E84C3D);
  color: var(--ld-wheel-color, #E84C3D);
  font-weight: 900;
  font-size: 14px;
  cursor: pointer;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  text-transform: uppercase;
  transition: all 0.2s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
}
.ld-spin-btn:hover:not(:disabled) {
  transform: translate(-50%, -50%) scale(1.05);
  box-shadow: 0 6px 15px rgba(0,0,0,0.3);
}
.ld-spin-btn:disabled {
  opacity: 0.8;
  cursor: not-allowed;
  filter: grayscale(0.5);
}
</style>
