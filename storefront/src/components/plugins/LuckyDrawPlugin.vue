<template>
  <div class="lucky-draw-plugin" :style="customVars">
    <!-- LOADING -->
    <div v-if="step === 'loading'" class="ld-loading">
      <div class="spinner"></div>
      <p>Đang tải vòng quay...</p>
    </div>

    <!-- ERROR -->
    <div v-else-if="step === 'error'" class="ld-error">{{ errorMsg }}</div>

    <!-- GATE: Auth + Pre-spin Form -->
    <div v-else-if="step === 'gate'" class="ld-gate">
      <div class="ld-container" :style="containerBg">
        <div class="ld-header">
          <h2 class="ld-title">{{ campaign.name || campaign.title }}</h2>
          <p v-if="campaign.description" class="ld-desc">{{ campaign.description }}</p>
        </div>

        <!-- Auth Required Message -->
        <div v-if="flowConfig.auth_mode === 'required' && !isLoggedIn" class="ld-auth-gate">
          <p class="ld-gate-msg">🔐 Vui lòng đăng nhập để tham gia</p>
          <button class="ld-btn ld-btn-login" @click="doLogin">Đăng nhập</button>
        </div>

        <!-- Pre-spin Form -->
        <div v-else class="ld-pre-form">
          <!-- Optional login button -->
          <div v-if="flowConfig.auth_mode === 'optional' && !isLoggedIn" class="ld-opt-login">
            <button class="ld-btn ld-btn-login-sm" @click="doLogin">Đăng nhập (tùy chọn)</button>
            <span class="ld-or">hoặc tiếp tục</span>
          </div>

          <h3 v-if="preFormEnabled" class="ld-form-title">{{ collectInfo?.title || 'Nhập thông tin' }}</h3>
          <div v-if="preFormEnabled" class="ld-fields">
            <div v-for="(f, i) in preFormFields" :key="i" class="ld-field">
              <label>{{ f.label }} <span v-if="f.required" class="ld-req">*</span></label>
              <textarea v-if="f.type === 'textarea'" v-model="formData[f.key]" :placeholder="f.label" class="ld-input"></textarea>
              <input v-else v-model="formData[f.key]" :type="f.type || 'text'" :placeholder="f.label" class="ld-input" />
            </div>
          </div>
          <p v-if="formError" class="ld-form-error">{{ formError }}</p>
          <button class="ld-btn ld-btn-play" @click="proceedToPlay">🎮 Tham gia ngay</button>
        </div>
      </div>
    </div>

    <!-- PLAY: Wheel Spin -->
    <div v-else-if="step === 'play'" class="ld-play">
      <div class="ld-container" :style="containerBg">
        <div class="ld-header">
          <h2 class="ld-title">{{ campaign.name || campaign.title }}</h2>
        </div>
        <div class="ld-wheel-wrapper">
          <div class="ld-pointer"></div>
          <div class="ld-wheel" :style="{ transform: `rotate(${currentRotation}deg)` }" :class="{ 'is-spinning': isSpinning }">
            <svg viewBox="0 0 100 100" class="ld-wheel-svg">
              <g v-for="(prize, index) in chartPrizes" :key="index">
                <path :d="prize.path" :fill="prize.color" stroke="#fff" stroke-width="0.8" />
                <text x="50" y="17" :fill="textColor" font-size="4" font-weight="bold" text-anchor="middle" :transform="`rotate(${prize.textRotation}, 50, 50)`">{{ prize.label }}</text>
              </g>
            </svg>
          </div>
          <button class="ld-spin-btn" @click="doSpin" :disabled="isSpinning">
            <span v-if="isSpinning">...</span>
            <span v-else>{{ buttonText }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- RESULT: Win/Lose -->
    <div v-else-if="step === 'result'" class="ld-result-step">
      <div class="ld-container" :style="containerBg">
        <div class="ld-result-box" :class="spinResult?.prize ? 'ld-win' : 'ld-lose'">
          <div class="ld-result-icon">{{ spinResult?.prize ? '🎉' : '😢' }}</div>
          <h2 class="ld-result-title">{{ resultMessage }}</h2>
          <p v-if="spinResult?.prize" class="ld-prize-name">{{ spinResult.prize.label }}</p>
        </div>
        <div class="ld-result-actions">
          <button v-if="spinResult?.needs_claim" class="ld-btn ld-btn-claim" @click="step = 'claim'">📝 Nhận giải thưởng</button>
          <button v-else class="ld-btn ld-btn-done" @click="step = 'done'">OK</button>
        </div>
      </div>
    </div>

    <!-- CLAIM: Post-spin Form -->
    <div v-else-if="step === 'claim'" class="ld-claim-step">
      <div class="ld-container" :style="containerBg">
        <div class="ld-header">
          <h2 class="ld-title">{{ spinResult?.claim_form?.title || 'Nhập thông tin nhận giải' }}</h2>
          <p class="ld-desc">Bạn đã trúng: <strong>{{ spinResult?.prize?.label }}</strong></p>
        </div>
        <div class="ld-fields">
          <div v-for="(f, i) in claimFields" :key="i" class="ld-field">
            <label>{{ f.label }} <span v-if="f.required" class="ld-req">*</span></label>
            <textarea v-if="f.type === 'textarea'" v-model="claimData[f.key]" :placeholder="f.label" class="ld-input"></textarea>
            <input v-else v-model="claimData[f.key]" :type="f.type || 'text'" :placeholder="f.label" class="ld-input" />
          </div>
        </div>
        <p v-if="formError" class="ld-form-error">{{ formError }}</p>
        <button class="ld-btn ld-btn-claim" @click="submitClaim" :disabled="claimSubmitting">{{ claimSubmitting ? 'Đang gửi...' : '📨 Gửi thông tin nhận giải' }}</button>
      </div>
    </div>

    <!-- DONE -->
    <div v-else-if="step === 'done'" class="ld-done-step">
      <div class="ld-container" :style="containerBg">
        <div class="ld-done-box">
          <div class="ld-done-icon">✅</div>
          <h2>Cảm ơn bạn đã tham gia!</h2>
          <p v-if="spinResult?.prize">Giải thưởng: <strong>{{ spinResult.prize.label }}</strong></p>
          <p v-else>Chúc bạn may mắn lần sau!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { apiFetch, apiPost } from '../../api.js'

const props = defineProps({
  id: { type: [String, Number], required: true }
})

// ── State ──
const step = ref('loading')         // loading | gate | play | result | claim | done
const errorMsg = ref(null)
const campaign = ref(null)
const prizes = ref([])
const flowConfig = ref({})
const formData = ref({})
const claimData = ref({})
const formError = ref('')
const spinResult = ref(null)
const isSpinning = ref(false)
const currentRotation = ref(0)
const claimSubmitting = ref(false)

// ── Auth ──
const isLoggedIn = computed(() => !!localStorage.getItem('sf_token'))

// ── Flow config shortcuts ── unified collect_info model
const collectInfo = computed(() => {
  const fc = flowConfig.value
  // Support new unified collect_info
  if (fc?.collect_info) return fc.collect_info
  // Backward compat with old pre/post_spin_form
  if (fc?.pre_spin_form?.enabled) return { enabled: true, when: 'before', title: fc.pre_spin_form.title, fields: fc.pre_spin_form.fields }
  if (fc?.post_spin_form?.enabled) return { enabled: true, when: 'after', title: fc.post_spin_form.title, fields: fc.post_spin_form.fields }
  return { enabled: false, when: 'before', title: '', fields: [] }
})
const preFormEnabled = computed(() => collectInfo.value?.enabled && collectInfo.value?.when === 'before')
const preFormFields = computed(() => preFormEnabled.value ? (collectInfo.value?.fields || []) : [])
const postFormEnabled = computed(() => collectInfo.value?.enabled && collectInfo.value?.when === 'after')
const claimFields = computed(() => postFormEnabled.value ? (collectInfo.value?.fields || []) : (spinResult.value?.claim_form?.fields || []))

// ── Theme ──
const wheelColor = computed(() => campaign.value?.settings?.wheel_color || '#E84C3D')
const textColor = computed(() => campaign.value?.settings?.text_color || '#FFFFFF')
const buttonText = computed(() => campaign.value?.settings?.button_text || 'QUAY NGAY')
const bgImage = computed(() => campaign.value?.background_image || '')
const containerBg = computed(() => bgImage.value ? { backgroundImage: `url(${bgImage.value})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {})
const customVars = computed(() => ({ '--ld-wheel-color': wheelColor.value, '--ld-text-color': textColor.value }))

// ── Result message ──
const resultMessage = ref('')

// ── Wheel chart ──
const defaultColors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4caf50', '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#ff5722']
const chartPrizes = computed(() => {
  if (prizes.value.length === 0) return []
  const n = prizes.value.length
  const sliceAngle = 360 / n
  return prizes.value.map((p, i) => {
    const startAngle = i * sliceAngle
    const endAngle = (i + 1) * sliceAngle
    const startRad = (startAngle - 90) * Math.PI / 180
    const endRad = (endAngle - 90) * Math.PI / 180
    const x1 = 50 + 50 * Math.cos(startRad), y1 = 50 + 50 * Math.sin(startRad)
    const x2 = 50 + 50 * Math.cos(endRad), y2 = 50 + 50 * Math.sin(endRad)
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1
    return {
      ...p,
      color: p.color || defaultColors[i % defaultColors.length],
      path: `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`,
      textRotation: startAngle + sliceAngle / 2
    }
  })
})

// ── Lifecycle ──
onMounted(async () => {
  if (!props.id) { errorMsg.value = 'Missing Campaign ID'; step.value = 'error'; return }
  try {
    const data = await apiFetch(`/lucky-draw/${props.id}`)
    const d = data.data || data
    campaign.value = d
    prizes.value = d.prizes || []
    flowConfig.value = d.flow_config || {}
    if (prizes.value.length === 0) { errorMsg.value = 'Chưa có giải thưởng.'; step.value = 'error'; return }

    // Determine starting step based on unified collect_info model
    const authMode = flowConfig.value.auth_mode || 'none'
    const ci = collectInfo.value
    const hasPreForm = ci?.enabled && ci?.when === 'before'
    if (authMode !== 'none' || hasPreForm) {
      step.value = 'gate'
    } else {
      step.value = 'play'
    }
  } catch (err) {
    errorMsg.value = err.message || 'Lỗi tải vòng quay.'
    step.value = 'error'
  }
})

// ── Actions ──
function doLogin() {
  // Redirect to storefront login
  window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname)
}

function proceedToPlay() {
  formError.value = ''
  if (preFormEnabled.value) {
    for (const f of preFormFields.value) {
      if (f.required && !formData.value[f.key]) {
        formError.value = `Vui lòng nhập ${f.label}`
        return
      }
    }
  }
  step.value = 'play'
}

async function doSpin() {
  if (isSpinning.value || prizes.value.length === 0) return
  isSpinning.value = true
  formError.value = ''

  try {
    // Build payload
    const payload = { ...formData.value }
    if (preFormEnabled.value) { payload.form = formData.value }

    const token = localStorage.getItem('sf_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const url = `/api/storefront/lucky-draw/${props.id}/spin`
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) })
    const json = await res.json()

    if (!res.ok) {
      const msg = json.message || json.error || `HTTP ${res.status}`
      alert(msg)
      isSpinning.value = false
      return
    }

    const result = json.data || json
    spinResult.value = result
    resultMessage.value = json.message || ''

    const wonPrizeId = result.prize?.id
    if (wonPrizeId) {
      // Animate wheel to winning prize
      const targetIndex = prizes.value.findIndex(p => p.id === wonPrizeId)
      if (targetIndex !== -1) {
        const sliceAngle = 360 / prizes.value.length
        const prizeCenterAngle = targetIndex * sliceAngle + sliceAngle / 2
        const baseRotation = Math.ceil(currentRotation.value / 360) * 360
        currentRotation.value = baseRotation + 360 * 5 + (360 - prizeCenterAngle)
      }
    } else {
      // Random spin for losing
      currentRotation.value += 360 * 5 + Math.random() * 360
    }

    // Determine next step after animation
    const ci = collectInfo.value
    const alreadyCollectedBefore = ci?.enabled && ci?.when === 'before'
    const shouldCollectAfter = ci?.enabled && ci?.when === 'after'

    setTimeout(async () => {
      isSpinning.value = false
      if (wonPrizeId && alreadyCollectedBefore && result.spin_id) {
        // Auto-claim with pre-spin data — no second form needed
        try {
          const claimUrl = `/api/storefront/lucky-draw/${props.id}/claim/${result.spin_id}`
          const claimHeaders = { 'Content-Type': 'application/json' }
          const tk = localStorage.getItem('sf_token')
          if (tk) claimHeaders['Authorization'] = `Bearer ${tk}`
          await fetch(claimUrl, { method: 'POST', headers: claimHeaders, body: JSON.stringify(formData.value) })
        } catch(e) { /* best effort */ }
        step.value = 'done'
      } else if (wonPrizeId && shouldCollectAfter) {
        // Need claim form after winning
        spinResult.value.needs_claim = true
        step.value = 'result'
      } else {
        step.value = 'result'
      }
    }, 4500)

  } catch (err) {
    alert(err.message || 'Lỗi khi quay số!')
    isSpinning.value = false
  }
}

async function submitClaim() {
  formError.value = ''
  claimSubmitting.value = true
  try {
    // Validate claim fields
    for (const f of claimFields.value) {
      if (f.required && !claimData.value[f.key]) {
        formError.value = `Vui lòng nhập ${f.label}`
        claimSubmitting.value = false
        return
      }
    }

    const token = localStorage.getItem('sf_token')
    const headers = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const url = `/api/storefront/lucky-draw/${props.id}/claim/${spinResult.value.spin_id}`
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(claimData.value) })
    const json = await res.json()

    if (!res.ok) {
      formError.value = json.message || 'Lỗi gửi thông tin'
      claimSubmitting.value = false
      return
    }

    step.value = 'done'
  } catch (err) {
    formError.value = err.message || 'Lỗi gửi thông tin'
  }
  claimSubmitting.value = false
}
</script>

<style scoped>
.lucky-draw-plugin { width: 100%; max-width: 600px; margin: 0 auto; font-family: 'Inter', sans-serif; }

/* Loading & Error */
.ld-loading, .ld-error { text-align: center; padding: 40px; background: var(--sf-bg-surface, #f9f9f9); border-radius: 12px; }
.ld-error { color: #E84C3D; font-weight: 500; }
.spinner { width: 32px; height: 32px; border: 3px solid #ccc; border-top-color: #333; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 10px; }
@keyframes spin { 100% { transform: rotate(360deg); } }

/* Container */
.ld-container { padding: 30px 20px; background-color: var(--sf-bg-card, #ffffff); border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); text-align: center; overflow: hidden; }
.ld-header { margin-bottom: 24px; }
.ld-title { margin: 0 0 8px; font-size: 22px; font-weight: 800; color: var(--sf-text-primary, #111); }
.ld-desc { margin: 0; font-size: 14px; color: var(--sf-text-secondary, #666); }

/* Gate */
.ld-auth-gate { padding: 30px; }
.ld-gate-msg { font-size: 16px; margin-bottom: 20px; color: var(--sf-text-primary, #333); }
.ld-opt-login { margin-bottom: 16px; display: flex; align-items: center; gap: 10px; justify-content: center; }
.ld-or { font-size: 13px; color: #999; }

/* Forms */
.ld-form-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: var(--sf-text-primary, #333); }
.ld-fields { text-align: left; }
.ld-field { margin-bottom: 14px; }
.ld-field label { display: block; font-size: 13px; font-weight: 600; color: var(--sf-text-primary, #333); margin-bottom: 4px; }
.ld-req { color: #E84C3D; }
.ld-input { width: 100%; padding: 10px 14px; border: 1.5px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
.ld-input:focus { border-color: var(--ld-wheel-color, #E84C3D); }
.ld-form-error { color: #E84C3D; font-size: 13px; margin: 8px 0; }

/* Buttons */
.ld-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 28px; border: none; border-radius: 50px; font-size: 15px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.ld-btn-play { background: var(--ld-wheel-color, #E84C3D); color: white; width: 100%; margin-top: 16px; }
.ld-btn-play:hover { opacity: 0.9; transform: translateY(-1px); }
.ld-btn-login { background: #1976d2; color: white; }
.ld-btn-login-sm { background: transparent; color: #1976d2; border: 1.5px solid #1976d2; padding: 8px 16px; font-size: 13px; }
.ld-btn-claim { background: #4caf50; color: white; width: 100%; margin-top: 16px; }
.ld-btn-claim:disabled { opacity: 0.7; cursor: not-allowed; }
.ld-btn-done { background: #666; color: white; }

/* Wheel */
.ld-wheel-wrapper { position: relative; width: 100%; max-width: 320px; aspect-ratio: 1/1; margin: 0 auto; }
.ld-pointer { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); width: 26px; height: 36px; background-image: url('data:image/svg+xml;utf8,<svg viewBox="0 0 24 24" fill="%23E84C3D" xmlns="http://www.w3.org/2000/svg"><path d="M12 24L0 0H24L12 24Z"/></svg>'); background-size: contain; background-repeat: no-repeat; z-index: 10; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3)); }
.ld-wheel { width: 100%; height: 100%; border-radius: 50%; border: 5px solid var(--ld-wheel-color, #E84C3D); box-shadow: 0 4px 15px rgba(0,0,0,0.1), inset 0 0 10px rgba(0,0,0,0.05); transition: transform 4s cubic-bezier(0.14, 0.73, 0.1, 1); will-change: transform; }
.ld-wheel-svg { width: 100%; height: 100%; border-radius: 50%; display: block; }
.ld-spin-btn { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; border-radius: 50%; background: white; border: 3px solid var(--ld-wheel-color, #E84C3D); color: var(--ld-wheel-color, #E84C3D); font-weight: 900; font-size: 12px; cursor: pointer; z-index: 5; display: flex; align-items: center; justify-content: center; text-transform: uppercase; transition: all 0.2s; box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
.ld-spin-btn:hover:not(:disabled) { transform: translate(-50%, -50%) scale(1.05); }
.ld-spin-btn:disabled { opacity: 0.8; cursor: not-allowed; }

/* Result */
.ld-result-box { padding: 30px 20px; }
.ld-result-icon { font-size: 48px; margin-bottom: 12px; }
.ld-result-title { margin: 0 0 8px; font-size: 18px; font-weight: 700; color: var(--sf-text-primary, #333); }
.ld-win .ld-result-title { color: #4caf50; }
.ld-lose .ld-result-title { color: #ff9800; }
.ld-prize-name { font-size: 22px; font-weight: 800; color: var(--ld-wheel-color, #E84C3D); margin: 8px 0 0; }
.ld-result-actions { margin-top: 20px; display: flex; gap: 12px; justify-content: center; }

/* Done */
.ld-done-box { padding: 40px 20px; }
.ld-done-icon { font-size: 48px; margin-bottom: 12px; }
.ld-done-box h2 { margin: 0 0 8px; font-size: 18px; color: var(--sf-text-primary, #333); }
.ld-done-box p { margin: 0; font-size: 14px; color: var(--sf-text-secondary, #666); }
</style>
