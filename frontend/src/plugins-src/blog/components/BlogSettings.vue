<template>
  <div class="blog-settings">
    <div class="blog-settings__header">
      <Settings :size="22" class="blog-settings__icon" />
      <h2 class="blog-settings__title">{{ t('admin.msg_blog_settings', 'Cài đặt Blog') }}</h2>
    </div>

    <div class="blog-settings__grid">
      <!-- General -->
      <div class="blog-settings__card">
        <h3 class="blog-settings__card-title">{{ t('admin.msg_general', 'Chung') }}</h3>
        <div class="blog-settings__field">
          <label>{{ t('admin.msg_posts_per_page', 'Số bài mỗi trang') }}</label>
          <input v-model.number="settings.posts_per_page" type="number" min="1" max="50" class="blog-settings__input" />
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.show_reading_time" /> {{ t('admin.msg_show_reading_time', 'Hiển thị thời gian đọc') }}
          </label>
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.show_author" /> {{ t('admin.msg_show_author', 'Hiển thị tác giả') }}
          </label>
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.show_featured_image" /> {{ t('admin.msg_show_featured_image', 'Hiển thị ảnh đại diện') }}
          </label>
        </div>
      </div>

      <!-- Comments -->
      <div class="blog-settings__card">
        <h3 class="blog-settings__card-title">{{ t('admin.msg_comments', 'Bình luận') }}</h3>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.comments_enabled" /> {{ t('admin.msg_enable_comments', 'Cho phép bình luận') }}
          </label>
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.comments_moderation" /> {{ t('admin.msg_moderate_comments', 'Duyệt bình luận trước khi hiển thị') }}
          </label>
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.nested_comments" /> {{ t('admin.msg_nested_comments', 'Cho phép trả lời bình luận (nested)') }}
          </label>
        </div>
      </div>

      <!-- RSS & SEO -->
      <div class="blog-settings__card">
        <h3 class="blog-settings__card-title">RSS & SEO</h3>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.rss_enabled" /> {{ t('admin.msg_enable_rss', 'Bật RSS Feed') }}
          </label>
        </div>
        <div v-if="settings.rss_enabled" class="blog-settings__rss-url">
          <label>RSS URL:</label>
          <code>/api/storefront/blog/rss</code>
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.auto_sitemap" /> {{ t('admin.msg_auto_sitemap', 'Tự động thêm bài viết vào sitemap') }}
          </label>
        </div>
        <div class="blog-settings__field">
          <label class="blog-settings__check">
            <input type="checkbox" v-model="settings.og_tags" /> Open Graph meta tags
          </label>
        </div>
      </div>
    </div>

    <div class="blog-settings__actions">
      <button class="blog-settings__btn" @click="save" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin" />
        <Save v-else :size="14" />
        {{ saving ? t('admin.msg_saving', 'Đang lưu...') : t('admin.msg_save_settings', 'Lưu cài đặt') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Settings, Save, Loader2 } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import { useI18n } from '../../../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()
const saving = ref(false)

const settings = reactive({
  posts_per_page: 12,
  show_reading_time: true,
  show_author: true,
  show_featured_image: true,
  comments_enabled: true,
  comments_moderation: true,
  nested_comments: true,
  rss_enabled: true,
  auto_sitemap: true,
  og_tags: true,
})

async function load() {
  try {
    const res = await apiFetch('/system-config?group=blog')
    const data = await res.json()
    const configs = data.data || data
    if (Array.isArray(configs)) {
      for (const c of configs) {
        if (c.key && settings.hasOwnProperty(c.key)) {
          settings[c.key] = c.value === 'true' ? true : c.value === 'false' ? false : isNaN(c.value) ? c.value : Number(c.value)
        }
      }
    }
  } catch (_) {}
}

async function save() {
  saving.value = true
  try {
    const entries = Object.entries(settings).map(([key, value]) => ({
      group: 'blog', key, value: String(value),
    }))
    for (const entry of entries) {
      await apiFetch('/system-config', { method: 'POST', body: JSON.stringify(entry) })
    }
    showToast(t('admin.msg_blog_settings_saved', 'Đã lưu cài đặt blog'), 'success')
  } catch (e) { showToast(t('admin.msg_save_error_detail', 'Lỗi lưu: ') + e.message, 'error') }
  finally { saving.value = false }
}

onMounted(load)
</script>

<style scoped>
.blog-settings__header { display:flex; align-items:center; gap:12px; margin-bottom:24px }
.blog-settings__icon { color:var(--accent-light) }
.blog-settings__title { font-size:20px; font-weight:700 }
.blog-settings__grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(300px,1fr)); gap:20px }
.blog-settings__card { padding:20px; border-radius:12px; border:1px solid var(--glass-border); background:var(--glass-bg) }
.blog-settings__card-title { font-size:15px; font-weight:700; margin-bottom:16px }
.blog-settings__field { margin-bottom:14px }
.blog-settings__field > label { display:block; font-size:13px; font-weight:600; color:var(--color-text-secondary); margin-bottom:6px }
.blog-settings__check { display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer }
.blog-settings__input { width:100px; padding:6px 10px; border-radius:8px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:14px; text-align:center }
.blog-settings__rss-url { padding:8px 12px; background:var(--glass-bg); border:1px solid var(--glass-border); border-radius:8px; font-size:13px; margin-top:8px }
.blog-settings__rss-url code { color:var(--accent-light); font-weight:600 }
.blog-settings__actions { margin-top:24px }
.blog-settings__btn { display:flex; align-items:center; gap:6px; padding:10px 24px; border-radius:10px; background:var(--accent-light,#6366f1); color:#fff; border:none; font-weight:600; font-size:14px; cursor:pointer }
.blog-settings__btn:hover { filter:brightness(1.1) }
.blog-settings__btn:disabled { opacity:.6; cursor:not-allowed }
.spin { animation:spin .8s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
</style>
