<template>
  <div class="theme-selector">
    <div class="ts-header">
      <Palette :size="20" />
      <div>
        <h3 class="ts-title">{{ t('admin.choose_theme', 'Chọn giao diện') }}</h3>
        <p class="ts-sub">{{ t('admin.theme_desc', 'Mỗi giao diện bao gồm bộ sections, colors và fonts phù hợp loại site.') }}</p>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="ts-loading">
      <Loader2 :size="20" class="spin" /> {{ t('admin.loading', 'Đang tải...') }}
    </div>

    <!-- Theme Grid -->
    <div v-else class="ts-grid">
      <div
        v-for="theme in themes" :key="theme.id"
        class="ts-card"
        :class="{ 'ts-card--active': activeTheme === theme.id }"
      >
        <!-- Preview -->
        <div class="ts-card__preview" :style="previewStyle(theme)">
          <div class="ts-card__colors">
            <span v-for="(color, key) in (theme.colors || {})" :key="key" class="ts-card__color-dot" :style="{ background: color }" :title="key"></span>
          </div>
          <span v-if="activeTheme === theme.id" class="ts-card__active-badge">
            <Check :size="12" /> {{ t('admin.active', 'Đang dùng') }}
          </span>
        </div>

        <!-- Info -->
        <div class="ts-card__body">
          <div class="ts-card__name-row">
            <h4 class="ts-card__name">{{ theme.name }}</h4>
            <span v-if="theme.category" class="ts-card__category">{{ theme.category }}</span>
          </div>
          <p class="ts-card__desc">{{ theme.description }}</p>

          <!-- Required modules -->
          <div v-if="theme.requires_modules?.length" class="ts-card__requires">
            <Package :size="11" />
            <span v-for="m in theme.requires_modules" :key="m" class="ts-card__module">{{ m }}</span>
          </div>

          <!-- Fonts -->
          <div class="ts-card__fonts" v-if="theme.fonts">
            <Type :size="11" />
            <span>{{ theme.fonts.heading }}</span>
            <span v-if="theme.fonts.body !== theme.fonts.heading"> / {{ theme.fonts.body }}</span>
          </div>

          <!-- Actions -->
          <div class="ts-card__actions">
            <button
              v-if="activeTheme !== theme.id"
              class="ts-btn ts-btn--apply"
              @click="applyTheme(theme)"
              :disabled="applying === theme.id"
            >
              <Wand2 :size="13" />
              {{ applying === theme.id ? t('admin.applying', 'Đang áp dụng...') : t('admin.apply_theme', 'Áp dụng') }}
            </button>
            <button v-else class="ts-btn ts-btn--active" disabled>
              <Check :size="13" /> {{ t('admin.current_theme', 'Đang sử dụng') }}
            </button>
            <button class="ts-btn ts-btn--preview" @click="previewTheme(theme)">
              <Eye :size="13" /> {{ t('admin.preview', 'Xem trước') }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <teleport to="body">
      <transition name="fade">
        <div v-if="previewingTheme" class="ts-preview-overlay" @click="previewingTheme = null">
          <div class="ts-preview-modal" @click.stop>
            <div class="ts-preview-header">
              <h4>{{ previewingTheme.name }} — Preview</h4>
              <div class="ts-preview-responsive">
                <button :class="{ active: previewDevice === 'desktop' }" @click="previewDevice = 'desktop'"><Monitor :size="14" /></button>
                <button :class="{ active: previewDevice === 'tablet' }" @click="previewDevice = 'tablet'"><Tablet :size="14" /></button>
                <button :class="{ active: previewDevice === 'mobile' }" @click="previewDevice = 'mobile'"><Smartphone :size="14" /></button>
              </div>
              <button class="ts-preview-close" @click="previewingTheme = null"><X :size="16" /></button>
            </div>
            <div class="ts-preview-body" :class="'ts-preview--' + previewDevice">
              <div class="ts-preview-frame" :style="previewFrameStyle(previewingTheme)">
                <div class="ts-preview-section" v-for="(sec, i) in (previewingTheme.sections || [])" :key="i">
                  <div class="ts-preview-section__label">{{ sec.type }}</div>
                </div>
                <div class="ts-preview-footer">
                  <span>{{ previewingTheme.name }} Theme</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Palette, Loader2, Check, Package, Type, Wand2, Eye, Monitor, Tablet, Smartphone, X } from 'lucide-vue-next'
import { apiFetch } from '../composables/useApi.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
const emit = defineEmits(['themeChanged'])

const themes = ref([])
const activeTheme = ref('starter')
const loading = ref(true)
const applying = ref(null)
const previewingTheme = ref(null)
const previewDevice = ref('desktop')

function previewStyle(theme) {
  const bg = theme.colors?.background || '#0f0f1a'
  const accent = theme.colors?.accent || '#7c3aed'
  return {
    background: `linear-gradient(135deg, ${bg}, ${accent}22)`,
    borderBottom: `3px solid ${accent}`,
  }
}

function previewFrameStyle(theme) {
  return {
    '--preview-bg': theme.colors?.background || '#fff',
    '--preview-accent': theme.colors?.accent || '#7c3aed',
    '--preview-text': theme.colors?.text || '#334155',
    '--preview-surface': theme.colors?.surface || '#f8fafc',
    fontFamily: theme.fonts?.body || 'Inter',
  }
}

async function loadThemes() {
  loading.value = true
  try {
    const res = await apiFetch('/themes')
    const data = await res.json()
    themes.value = data.data?.themes || data.themes || []
    activeTheme.value = data.data?.active || data.active || 'starter'
  } catch (e) {
    console.error('[ThemeSelector] Load failed:', e)
  }
  loading.value = false
}

async function applyTheme(theme) {
  applying.value = theme.id
  try {
    const res = await apiFetch('/themes/apply', {
      method: 'POST',
      body: JSON.stringify({ theme_id: theme.id }),
    })
    if (res.ok) {
      activeTheme.value = theme.id
      showToast(t('admin.theme_applied', `Đã áp dụng giao diện "${theme.name}"`), 'success')
      emit('themeChanged', theme)
    } else {
      const err = await res.json()
      showToast(err.message || t('admin.theme_error', 'Lỗi áp dụng'), 'error')
    }
  } catch (e) {
    showToast(t('admin.theme_error', 'Lỗi áp dụng giao diện'), 'error')
  }
  applying.value = null
}

function previewTheme(theme) {
  previewingTheme.value = theme
  previewDevice.value = 'desktop'
}

onMounted(loadThemes)
</script>

<style scoped>
.theme-selector { max-width: 960px; }

.ts-header {
  display: flex; align-items: flex-start; gap: 12px; margin-bottom: 28px;
}
.ts-header svg { color: var(--accent); flex-shrink: 0; margin-top: 2px; }
.ts-title { font-size: 20px; font-weight: 800; margin: 0 0 4px; }
.ts-sub { font-size: 13px; color: var(--text-3); margin: 0; }

.ts-loading {
  display: flex; align-items: center; gap: 10px; padding: 60px 0;
  justify-content: center; color: var(--text-3);
}

/* Grid */
.ts-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;
}

/* Card */
.ts-card {
  border-radius: 16px; overflow: hidden;
  background: var(--glass-bg); border: 2px solid var(--glass-border);
  transition: all 0.3s;
}
.ts-card:hover { border-color: var(--color-border-hover); transform: translateY(-2px); box-shadow: var(--shadow-card); }
.ts-card--active { border-color: var(--accent); }

/* Preview area */
.ts-card__preview {
  height: 120px; position: relative; display: flex;
  align-items: flex-end; padding: 12px; overflow: hidden;
}
.ts-card__colors { display: flex; gap: 4px; }
.ts-card__color-dot {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.3);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
}
.ts-card__active-badge {
  position: absolute; top: 10px; right: 10px;
  display: flex; align-items: center; gap: 4px;
  padding: 4px 10px; border-radius: 8px;
  background: var(--accent); color: #fff;
  font-size: 11px; font-weight: 700;
}

/* Body */
.ts-card__body { padding: 16px; }
.ts-card__name-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.ts-card__name { font-size: 16px; font-weight: 700; margin: 0; }
.ts-card__category {
  padding: 2px 8px; border-radius: 6px;
  background: var(--color-accent-glow); color: var(--accent);
  font-size: 10px; font-weight: 700; text-transform: uppercase;
}
.ts-card__desc {
  font-size: 13px; color: var(--text-3); line-height: 1.5; margin: 0 0 12px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.ts-card__requires, .ts-card__fonts {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: var(--text-3); margin-bottom: 6px;
}
.ts-card__module {
  padding: 1px 6px; border-radius: 4px;
  background: rgba(245,158,11,0.12); color: #f59e0b;
  font-size: 10px; font-weight: 600;
}

/* Actions */
.ts-card__actions { display: flex; gap: 8px; margin-top: 14px; }
.ts-btn {
  display: flex; align-items: center; gap: 5px; padding: 8px 16px;
  border-radius: 8px; font-size: 12px; font-weight: 700; cursor: pointer;
  border: 1px solid var(--glass-border); transition: all 0.2s;
}
.ts-btn--apply {
  background: var(--accent-gradient); color: #fff; border: none;
  box-shadow: var(--accent-shadow);
}
.ts-btn--apply:hover { transform: translateY(-1px); }
.ts-btn--apply:disabled { opacity: 0.5; cursor: wait; transform: none; }
.ts-btn--active {
  background: rgba(16,185,129,0.12); color: #10b981; border-color: rgba(16,185,129,0.3);
}
.ts-btn--preview {
  background: transparent; color: var(--text-2);
}
.ts-btn--preview:hover { border-color: var(--accent); color: var(--accent); }

/* Preview Modal */
.ts-preview-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
}
.ts-preview-modal {
  background: var(--bg-1, #0f0f1a); border-radius: 16px;
  width: 100%; max-width: 1100px; max-height: 85vh;
  overflow: hidden; display: flex; flex-direction: column;
  box-shadow: 0 24px 64px rgba(0,0,0,0.4);
}
.ts-preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px; border-bottom: 1px solid var(--glass-border);
}
.ts-preview-header h4 { font-size: 15px; font-weight: 700; margin: 0; }
.ts-preview-responsive { display: flex; gap: 4px; }
.ts-preview-responsive button {
  padding: 6px 10px; border-radius: 6px; border: 1px solid var(--glass-border);
  background: transparent; color: var(--text-3); cursor: pointer; transition: all 0.2s;
}
.ts-preview-responsive button.active { background: var(--accent); color: #fff; border-color: var(--accent); }
.ts-preview-close {
  background: none; border: none; color: var(--text-3); cursor: pointer; padding: 4px;
}

.ts-preview-body { flex: 1; overflow-y: auto; padding: 24px; display: flex; justify-content: center; }
.ts-preview--desktop .ts-preview-frame { width: 100%; }
.ts-preview--tablet .ts-preview-frame { width: 768px; }
.ts-preview--mobile .ts-preview-frame { width: 375px; }

.ts-preview-frame {
  background: var(--preview-bg); border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.1); overflow: hidden;
  color: var(--preview-text);
}
.ts-preview-section {
  padding: 32px 24px; border-bottom: 1px solid rgba(0,0,0,0.06);
  display: flex; align-items: center; justify-content: center;
  min-height: 80px;
}
.ts-preview-section__label {
  padding: 6px 16px; border-radius: 8px;
  background: var(--preview-surface); font-size: 13px;
  font-weight: 600; color: var(--preview-accent);
  border: 1px dashed var(--preview-accent);
}
.ts-preview-footer {
  padding: 16px 24px; text-align: center; font-size: 12px;
  color: var(--preview-text); opacity: 0.5;
  border-top: 1px solid rgba(0,0,0,0.06);
}

/* Transitions */
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 768px) {
  .ts-grid { grid-template-columns: 1fr; }
  .ts-preview-modal { max-width: 100%; }
}
</style>
