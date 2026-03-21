<template>
  <div class="post-editor">
    <div class="post-editor__header">
      <button class="post-editor__back" @click="$emit('back')">
        <ChevronLeft :size="16" /> Quay lại
      </button>
      <h2 class="post-editor__title">{{ editId ? 'Chỉnh sửa bài viết' : 'Viết bài mới' }}</h2>
    </div>

    <div class="post-editor__body">
      <!-- Main -->
      <div class="post-editor__main">
        <div class="post-editor__field">
          <label class="post-editor__label">Tiêu đề *</label>
          <input v-model="form.title" type="text" class="post-editor__input post-editor__input--title" placeholder="Tiêu đề bài viết..." @blur="autoSlug" />
        </div>

        <div class="post-editor__field post-editor__slug-row">
          <label class="post-editor__label">Slug</label>
          <div class="post-editor__slug-input">
            <span class="post-editor__slug-prefix">/blog/</span>
            <input v-model="form.slug" type="text" class="post-editor__input" placeholder="auto-generated" />
          </div>
        </div>

        <div class="post-editor__field">
          <label class="post-editor__label">Nội dung</label>
          <textarea v-model="form.body" class="post-editor__textarea" rows="18" placeholder="Viết nội dung bài viết..."></textarea>
        </div>

        <div class="post-editor__field">
          <label class="post-editor__label">Tóm tắt</label>
          <textarea v-model="form.excerpt" class="post-editor__textarea post-editor__textarea--sm" rows="3" placeholder="Tóm tắt ngắn (tự động tạo nếu để trống)..."></textarea>
        </div>

        <!-- SEO Fields -->
        <div class="post-editor__meta-section">
          <h3 class="post-editor__section-title">SEO & Tuỳ chỉnh</h3>
          <div class="post-editor__field">
            <label class="post-editor__label">SEO Title</label>
            <input v-model="form.meta.seo_title" type="text" class="post-editor__input" placeholder="Tiêu đề SEO..." />
          </div>
          <div class="post-editor__field">
            <label class="post-editor__label">Meta Description</label>
            <textarea v-model="form.meta.seo_description" class="post-editor__textarea post-editor__textarea--sm" rows="2" placeholder="Mô tả meta..."></textarea>
          </div>
          <div class="post-editor__field post-editor__checkbox-field">
            <label><input type="checkbox" v-model="form.meta.is_featured" /> Bài viết nổi bật</label>
          </div>
          <div class="post-editor__field">
            <label class="post-editor__label">Thời gian đọc (phút)</label>
            <input v-model.number="form.meta.reading_time" type="number" class="post-editor__input" placeholder="Auto-calculated" min="1" />
          </div>
        </div>
      </div>

      <!-- Sidebar -->
      <div class="post-editor__sidebar">
        <!-- Publish -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">Xuất bản</h4>
          <div class="post-editor__field">
            <select v-model="form.status" class="post-editor__select">
              <option value="draft">Nháp</option>
              <option value="published">Xuất bản</option>
              <option value="archived">Lưu trữ</option>
            </select>
          </div>
          <div v-if="form.status === 'published'" class="post-editor__field">
            <label class="post-editor__label">Ngày xuất bản</label>
            <input v-model="form.published_at" type="datetime-local" class="post-editor__input" />
          </div>
        </div>

        <!-- Featured Image -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">Ảnh đại diện</h4>
          <div v-if="form.featured_image" class="post-editor__img-preview">
            <img :src="form.featured_image" alt="" />
            <button @click="form.featured_image = ''" class="post-editor__img-remove">✕</button>
          </div>
          <input v-model="form.featured_image" type="text" class="post-editor__input" placeholder="URL ảnh" />
        </div>

        <!-- Categories -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">Danh mục</h4>
          <div class="post-editor__tags">
            <span v-for="(c, i) in (form.taxonomies.category || [])" :key="i" class="post-editor__tag">
              {{ c }} <button @click="removeTag('category', i)" class="post-editor__tag-x">✕</button>
            </span>
          </div>
          <div class="post-editor__tag-input">
            <input v-model="newCategory" type="text" placeholder="Thêm danh mục..." class="post-editor__input" @keydown.enter.prevent="addTag('category', newCategory); newCategory = ''" />
            <button @click="addTag('category', newCategory); newCategory = ''" class="post-editor__tag-add">+</button>
          </div>
        </div>

        <!-- Tags -->
        <div class="post-editor__card">
          <h4 class="post-editor__card-title">Thẻ</h4>
          <div class="post-editor__tags">
            <span v-for="(t, i) in (form.taxonomies.tag || [])" :key="i" class="post-editor__tag post-editor__tag--tag">
              {{ t }} <button @click="removeTag('tag', i)" class="post-editor__tag-x">✕</button>
            </span>
          </div>
          <div class="post-editor__tag-input">
            <input v-model="newTagVal" type="text" placeholder="Thêm thẻ..." class="post-editor__input" @keydown.enter.prevent="addTag('tag', newTagVal); newTagVal = ''" />
            <button @click="addTag('tag', newTagVal); newTagVal = ''" class="post-editor__tag-add">+</button>
          </div>
        </div>

        <!-- Revisions -->
        <div v-if="revisions.length" class="post-editor__card">
          <h4 class="post-editor__card-title">Lịch sử ({{ revisions.length }})</h4>
          <ul class="post-editor__revisions">
            <li v-for="rev in revisions.slice(0, 5)" :key="rev.id">
              <Clock :size="12" /> {{ formatDate(rev.created_at) }}
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="post-editor__actions">
      <button class="post-editor__btn post-editor__btn--sec" @click="$emit('back')">Huỷ</button>
      <button class="post-editor__btn post-editor__btn--pri" @click="save" :disabled="saving">
        <Loader2 v-if="saving" :size="14" class="spin" />
        <Save v-else :size="14" />
        {{ saving ? 'Đang lưu...' : 'Lưu bài viết' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ChevronLeft, Save, Clock, Loader2 } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'

const { showToast } = useToast()
const props = defineProps({ editId: { type: [Number, String], default: null } })
const emit = defineEmits(['back', 'saved'])

const form = reactive({
  title: '', slug: '', body: '', excerpt: '',
  featured_image: '', status: 'draft', published_at: '',
  meta: { seo_title: '', seo_description: '', reading_time: null, is_featured: false },
  taxonomies: { category: [], tag: [] },
})
const saving = ref(false)
const revisions = ref([])
const newCategory = ref('')
const newTagVal = ref('')

function autoSlug() {
  if (!form.slug && form.title) {
    form.slug = form.title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  }
  // Auto reading time
  if (form.body && !form.meta.reading_time) {
    form.meta.reading_time = Math.max(1, Math.ceil(form.body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
  }
}

function addTag(taxonomy, val) {
  val = (val || '').trim()
  if (!val) return
  if (!form.taxonomies[taxonomy]) form.taxonomies[taxonomy] = []
  if (!form.taxonomies[taxonomy].includes(val)) form.taxonomies[taxonomy].push(val)
}
function removeTag(taxonomy, i) { form.taxonomies[taxonomy]?.splice(i, 1) }

function formatDate(d) { return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }

async function loadPost() {
  if (!props.editId) return
  try {
    const res = await apiFetch(`/content/post/${props.editId}`)
    const data = await res.json()
    const item = data.data || data
    form.title = item.title || ''; form.slug = item.slug || ''
    form.body = item.body || ''; form.excerpt = item.excerpt || ''
    form.featured_image = item.featured_image || ''
    form.status = item.status || 'draft'
    form.published_at = item.published_at ? item.published_at.slice(0, 16) : ''
    form.meta = { seo_title: '', seo_description: '', reading_time: null, is_featured: false, ...(item.meta || {}) }
    if (item.taxonomies) {
      const taxMap = { category: [], tag: [] }
      for (const t of item.taxonomies) {
        if (!taxMap[t.taxonomy]) taxMap[t.taxonomy] = []
        taxMap[t.taxonomy].push(t.term)
      }
      form.taxonomies = taxMap
    }
    revisions.value = item.revisions || []
  } catch (e) { showToast('Lỗi tải bài viết', 'error') }
}

async function save() {
  if (!form.title.trim()) return showToast('Vui lòng nhập tiêu đề', 'warning')
  // Auto excerpt
  if (!form.excerpt && form.body) {
    form.excerpt = form.body.replace(/<[^>]*>/g, '').substring(0, 160)
  }
  // Auto reading time
  if (form.body) {
    form.meta.reading_time = Math.max(1, Math.ceil(form.body.replace(/<[^>]*>/g, '').split(/\s+/).length / 200))
  }

  saving.value = true
  try {
    const method = props.editId ? 'PUT' : 'POST'
    const url = props.editId ? `/content/post/${props.editId}` : '/content/post'
    const res = await apiFetch(url, { method, body: JSON.stringify(form) })
    const data = await res.json()
    if (res.ok) { showToast(data.message || 'Đã lưu', 'success'); emit('saved', data.data || data) }
    else showToast(data.message || 'Lỗi lưu', 'error')
  } catch (e) { showToast('Lỗi: ' + e.message, 'error') }
  finally { saving.value = false }
}

onMounted(loadPost)
</script>

<style scoped>
.post-editor__header { display:flex; align-items:center; gap:16px; margin-bottom:24px }
.post-editor__back { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; color:var(--color-text-secondary); cursor:pointer; font-size:13px }
.post-editor__title { font-size:20px; font-weight:700 }
.post-editor__body { display:grid; grid-template-columns:1fr 300px; gap:24px }
.post-editor__main { min-width:0 }
.post-editor__sidebar { display:flex; flex-direction:column; gap:16px }
.post-editor__field { margin-bottom:16px }
.post-editor__label { display:block; font-size:13px; font-weight:600; color:var(--color-text-secondary); margin-bottom:6px }
.post-editor__input,.post-editor__textarea,.post-editor__select { width:100%; padding:8px 12px; border-radius:8px; border:1px solid var(--glass-border); background:var(--glass-bg); color:var(--color-text); font-size:14px }
.post-editor__input:focus,.post-editor__textarea:focus { border-color:var(--accent-light); outline:none }
.post-editor__input--title { font-size:18px; font-weight:600; padding:12px 16px }
.post-editor__textarea { resize:vertical; min-height:200px; font-family:inherit }
.post-editor__textarea--sm { min-height:60px }
.post-editor__slug-row {}
.post-editor__slug-input { display:flex }
.post-editor__slug-prefix { padding:8px 4px 8px 12px; font-size:14px; color:var(--color-text-muted); border:1px solid var(--glass-border); border-right:none; border-radius:8px 0 0 8px; background:var(--glass-bg) }
.post-editor__slug-input .post-editor__input { border-radius:0 8px 8px 0 }
.post-editor__meta-section { border-top:1px solid var(--glass-border); padding-top:20px; margin-top:8px }
.post-editor__section-title { font-size:15px; font-weight:700; margin-bottom:16px }
.post-editor__checkbox-field label { display:flex; align-items:center; gap:8px; font-size:14px; cursor:pointer }
.post-editor__card { padding:16px; border-radius:12px; border:1px solid var(--glass-border); background:var(--glass-bg) }
.post-editor__card-title { font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; color:var(--color-text-secondary); margin-bottom:12px }
.post-editor__img-preview { position:relative; margin-bottom:8px }
.post-editor__img-preview img { width:100%; border-radius:8px; object-fit:cover; max-height:160px }
.post-editor__img-remove { position:absolute; top:6px; right:6px; width:24px; height:24px; border-radius:50%; background:rgba(0,0,0,.6); color:#fff; border:none; cursor:pointer; font-size:12px; display:flex; align-items:center; justify-content:center }
.post-editor__tags { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:8px }
.post-editor__tag { display:flex; align-items:center; gap:4px; padding:4px 10px; border-radius:16px; font-size:12px; background:var(--accent-light,#6366f1); color:#fff }
.post-editor__tag--tag { background:#10b981 }
.post-editor__tag-x { background:none; border:none; color:rgba(255,255,255,.7); cursor:pointer; font-size:11px; padding:0 }
.post-editor__tag-input { display:flex; gap:6px }
.post-editor__tag-input .post-editor__input { flex:1 }
.post-editor__tag-add { padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; color:var(--accent-light); cursor:pointer; font-weight:700 }
.post-editor__revisions { list-style:none; padding:0; margin:0 }
.post-editor__revisions li { display:flex; align-items:center; gap:6px; padding:4px 0; font-size:12px; color:var(--color-text-muted) }
.post-editor__actions { display:flex; justify-content:flex-end; gap:12px; margin-top:24px; padding-top:20px; border-top:1px solid var(--glass-border) }
.post-editor__btn { display:flex; align-items:center; gap:6px; padding:10px 20px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; border:none }
.post-editor__btn--sec { background:var(--glass-bg); color:var(--color-text-secondary); border:1px solid var(--glass-border) }
.post-editor__btn--pri { background:var(--accent-light,#6366f1); color:#fff }
.post-editor__btn--pri:hover { filter:brightness(1.1) }
.post-editor__btn:disabled { opacity:.6; cursor:not-allowed }
.spin { animation:spin .8s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
@media(max-width:768px) { .post-editor__body { grid-template-columns:1fr } }
</style>
