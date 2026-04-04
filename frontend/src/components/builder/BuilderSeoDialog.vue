<template>
  <div v-if="modelValue" class="media-modal-overlay" @click.self="$emit('update:modelValue', false)">
    <div class="media-modal" style="width: 500px; border-radius: 12px;">
      <div class="media-modal-header">
        <h3><Globe :size="16" /> {{ t('admin.msg_seo_settings', 'Cài đặt SEO') }} ({{ activePageLabel }})</h3>
        <button @click="$emit('update:modelValue', false)" :title="t('admin.msg_close', 'Đóng')"><X :size="20" /></button>
      </div>
      
      <div style="padding: 12px 20px 0 20px;">
        <LanguageTabs 
          v-model="activeLang" 
          :base-data="seoConfig" 
          :translations="seoConfig.translations" 
          :fields="['meta_title', 'meta_description', 'og_image']" 
        />
      </div>

      <div style="padding: 20px; max-height: 55vh; overflow-y: auto;">
        <div class="nm-form-group" style="margin-bottom: 12px;">
          <label style="font-size: 13px; font-weight: 600;">{{ t('admin.msg_meta_title', 'Tiêu đề trang (Meta Title)') }} <span style="color:#94a3b8; font-weight: 400; font-size: 11px;">{{ activeLang }}</span></label>
          <input v-model="activeFields.meta_title" class="param-input" :placeholder="t('admin.msg_meta_title_placeholder', 'VD: Khuyến mãi Mùa Hè - Cửa hàng ABC')" />
        </div>
        <div class="nm-form-group" style="margin-bottom: 12px;">
          <label style="font-size: 13px; font-weight: 600;">{{ t('admin.msg_meta_description', 'Mô tả trang (Meta Description)') }} <span style="color:#94a3b8; font-weight: 400; font-size: 11px;">{{ activeLang }}</span></label>
          <textarea v-model="activeFields.meta_description" class="param-input" rows="3" :placeholder="t('admin.msg_meta_description_placeholder', 'Mô tả tóm tắt nội dung...')"></textarea>
        </div>
        <div class="nm-form-group" style="margin-bottom: 12px;">
          <label style="font-size: 13px; font-weight: 600;">{{ t('admin.msg_og_image', 'Ảnh chia sẻ mạng xã hội (OG Image)') }} <span style="color:#94a3b8; font-weight: 400; font-size: 11px;">{{ activeLang }}</span></label>
          <input v-model="activeFields.og_image" class="param-input" :placeholder="t('admin.msg_og_image_placeholder', 'URL hình ảnh hiển thị khi share...')" />
        </div>
        
        <div v-show="isDefaultLang">
          <div class="nm-form-row">
          <div class="nm-form-group" style="flex: 1; margin-bottom: 12px;">
            <label style="font-size: 13px; font-weight: 600;">{{ t('admin.msg_robots_index', 'Được phép index (Robots)') }}</label>
            <select v-model="seoConfig.robots" class="param-input">
              <option value="index, follow">{{ t('admin.msg_allow_index', 'Cho phép Index (Mặc định)') }}</option>
              <option value="noindex, nofollow">{{ t('admin.msg_noindex', 'Không cho phép (Noindex)') }}</option>
            </select>
          </div>
        </div>
          <div class="nm-form-group">
            <label style="font-size: 13px; font-weight: 600;">Schema.org (JSON-LD)</label>
            <textarea v-model="seoConfig.schema_json" class="param-input" rows="4" placeholder="{&#10;  &quot;@context&quot;: &quot;https://schema.org&quot;,&#10;  &quot;@type&quot;: &quot;WebPage&quot;&#10;}"></textarea>
          </div>
        </div>
      </div>
      <div style="padding: 12px 20px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 8px;">
        <button class="cpb-btn-save" @click="$emit('save')">{{ t('admin.msg_apply', 'Áp dụng') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Globe, X } from 'lucide-vue-next'
import { ref, computed } from 'vue'
import LanguageTabs from '../LanguageTabs.vue'
import { useLanguages } from '../../composables/useLanguages.js'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()
const { defaultLangCode } = useLanguages()

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  activePageLabel: { type: String, default: '' },
  seoConfig: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue', 'save', 'init-lang'])

const activeLang = ref(null)

const isDefaultLang = computed(() => {
  return activeLang.value === defaultLangCode.value || !activeLang.value
})

const activeFields = computed(() => {
  if (isDefaultLang.value) return props.seoConfig

  const lang = activeLang.value
  const translations = props.seoConfig.translations || {}
  if (!translations[lang]) {
    // emit để parent khởi tạo, tránh mutate prop trực tiếp
    emit('init-lang', lang)
    return { meta_title: '', meta_description: '', og_image: '' }
  }
  return translations[lang]
})
</script>

<style scoped>
.media-modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; justify-content: center; align-items: center;
  z-index: 1000; backdrop-filter: blur(2px);
}
.media-modal {
  background: #fff; display: flex; flex-direction: column;
  overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
}
.media-modal-header {
  padding: 16px 20px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.media-modal-header h3 {
  margin: 0; font-size: 16px; display: flex; align-items: center;
  gap: 8px; font-weight: 700; color: var(--text-1);
}
.media-modal-header button { background: none; border: none; cursor: pointer; color: var(--text-3); }
.media-modal-header button:hover { color: var(--text-1); }
.nm-form-group { display: flex; flex-direction: column; gap: 4px; }
.nm-form-row { display: flex; gap: 12px; }
.cpb-btn-save {
  background: var(--accent, #7c3aed); color: #fff; border: none;
  padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: 0.2s; display: flex; align-items: center;
  gap: 6px; white-space: nowrap; flex-shrink: 0;
}
.cpb-btn-save:hover:not(:disabled) { filter: brightness(1.1); box-shadow: 0 2px 8px rgba(124,58,237,0.3); }
.cpb-btn-save:disabled { opacity: 0.6; cursor: wait; }
</style>
