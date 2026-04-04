<template>
  <div class="comment-mgr">
    <div class="comment-mgr__header">
      <MessageCircle :size="22" class="comment-mgr__icon" />
      <h2 class="comment-mgr__title">{{ t('admin.msg_comments', 'Bình luận') }} ({{ total }})</h2>
      <div class="comment-mgr__badge-row">
        <span class="comment-mgr__badge comment-mgr__badge--pending" @click="statusFilter = 'pending'; load()">{{ counts.pending }} {{ t('admin.msg_pending_review', 'chờ duyệt') }}</span>
        <span class="comment-mgr__badge comment-mgr__badge--approved" @click="statusFilter = 'approved'; load()">{{ counts.approved }} {{ t('admin.msg_approved', 'đã duyệt') }}</span>
        <span class="comment-mgr__badge comment-mgr__badge--spam" @click="statusFilter = 'spam'; load()">{{ counts.spam }} spam</span>
        <span class="comment-mgr__badge" @click="statusFilter = ''; load()">{{ t('admin.msg_all', 'Tất cả') }}</span>
      </div>
    </div>

    <div v-if="loading" class="comment-mgr__loading"><Loader2 :size="20" class="spin" /> {{ t('admin.msg_loading', 'Đang tải...') }}</div>

    <div v-else-if="items.length === 0" class="comment-mgr__empty">
      <MessageCircle :size="48" />
      <p>{{ t('admin.msg_no_comments', 'Chưa có bình luận nào') }}</p>
    </div>

    <div v-else class="comment-mgr__list">
      <div v-for="comment in items" :key="comment.id" class="comment-mgr__item" :class="'comment-mgr__item--' + comment.status">
        <div class="comment-mgr__item-header">
          <span class="comment-mgr__author">{{ comment.author_name }}</span>
          <span v-if="comment.author_email" class="comment-mgr__email">{{ comment.author_email }}</span>
          <span class="comment-mgr__date">{{ formatDate(comment.created_at) }}</span>
          <span class="comment-mgr__status" :class="'comment-mgr__status--' + comment.status">{{ statusLabel(comment.status) }}</span>
        </div>
        <div v-if="comment.content" class="comment-mgr__post-ref">
          {{ t('admin.msg_on_post', 'Trên:') }} <strong>{{ comment.content.title }}</strong>
        </div>
        <p class="comment-mgr__body">{{ comment.body }}</p>

        <!-- Replies -->
        <div v-if="comment.replies?.length" class="comment-mgr__replies">
          <div v-for="reply in comment.replies" :key="reply.id" class="comment-mgr__reply">
            <span class="comment-mgr__author">↳ {{ reply.author_name }}</span>
            <span class="comment-mgr__date">{{ formatDate(reply.created_at) }}</span>
            <p>{{ reply.body }}</p>
          </div>
        </div>

        <div class="comment-mgr__actions">
          <button v-if="comment.status !== 'approved'" class="comment-mgr__btn comment-mgr__btn--approve" @click="approve(comment.id)">
            <Check :size="14" /> {{ t('admin.msg_approve', 'Duyệt') }}
          </button>
          <button v-if="comment.status !== 'spam'" class="comment-mgr__btn comment-mgr__btn--spam" @click="markSpam(comment.id)">
            <ShieldAlert :size="14" /> Spam
          </button>
          <button class="comment-mgr__btn comment-mgr__btn--delete" @click="remove(comment.id)">
            <Trash2 :size="14" /> {{ t('admin.delete', 'Xoá') }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="lastPage > 1" class="comment-mgr__pagination">
      <button v-for="p in lastPage" :key="p" class="comment-mgr__page" :class="{ 'comment-mgr__page--active': p === page }" @click="page = p; load()">{{ p }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { MessageCircle, Check, ShieldAlert, Trash2, Loader2 } from 'lucide-vue-next'
import { apiFetch, useToast } from '../helpers.js'
import { useI18n } from '../../../composables/useI18n.js'

const { t } = useI18n()
const { showToast } = useToast()

const items = ref([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const lastPage = ref(1)
const statusFilter = ref('')
const counts = reactive({ pending: 0, approved: 0, spam: 0 })

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: page.value, per_page: 20 })
    if (statusFilter.value) params.set('status', statusFilter.value)
    const res = await apiFetch(`/comments?${params}`)
    const data = await res.json()
    const result = data.data || data
    items.value = result.data || result
    total.value = result.total || items.value.length
    lastPage.value = result.last_page || 1
  } catch (e) { showToast(t('admin.msg_load_comments_error', 'Lỗi tải bình luận'), 'error') }
  finally { loading.value = false }
}

async function loadCounts() {
  try {
    for (const s of ['pending', 'approved', 'spam']) {
      const res = await apiFetch(`/comments?status=${s}&per_page=1`)
      const d = await res.json()
      counts[s] = d?.data?.total || 0
    }
  } catch (_) {}
}

async function approve(id) {
  try { await apiFetch(`/comments/${id}/approve`, { method: 'POST' }); showToast(t('admin.msg_approved', 'Đã duyệt'), 'success'); load(); loadCounts() }
  catch (e) { showToast(t('admin.msg_error', 'Lỗi'), 'error') }
}
async function markSpam(id) {
  try { await apiFetch(`/comments/${id}/spam`, { method: 'POST' }); showToast(t('admin.msg_marked_spam', 'Đã đánh dấu spam'), 'success'); load(); loadCounts() }
  catch (e) { showToast(t('admin.msg_error', 'Lỗi'), 'error') }
}
async function remove(id) {
  if (!confirm(t('admin.msg_confirm_delete_comment', 'Xoá bình luận này?'))) return
  try { await apiFetch(`/comments/${id}`, { method: 'DELETE' }); showToast(t('admin.msg_deleted', 'Đã xoá'), 'success'); load(); loadCounts() }
  catch (e) { showToast(t('admin.msg_error', 'Lỗi'), 'error') }
}

function statusLabel(s) { return { pending: t('admin.msg_pending_review', 'Chờ duyệt'), approved: t('admin.msg_approved', 'Đã duyệt'), spam: 'Spam' }[s] || s }
function formatDate(d) { return d ? new Date(d).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '' }

onMounted(() => { load(); loadCounts() })
</script>

<style scoped>
.comment-mgr__header { display:flex; align-items:center; gap:12px; margin-bottom:20px; flex-wrap:wrap }
.comment-mgr__icon { color:var(--accent-light) }
.comment-mgr__title { font-size:20px; font-weight:700; margin-right:auto }
.comment-mgr__badge-row { display:flex; gap:8px }
.comment-mgr__badge { padding:4px 12px; border-radius:16px; font-size:12px; font-weight:600; cursor:pointer; background:var(--glass-bg); border:1px solid var(--glass-border) }
.comment-mgr__badge--pending { background:#fef3c7; color:#92400e; border-color:#fde68a }
.comment-mgr__badge--approved { background:#d1fae5; color:#065f46; border-color:#a7f3d0 }
.comment-mgr__badge--spam { background:#fee2e2; color:#991b1b; border-color:#fca5a5 }
.comment-mgr__loading,.comment-mgr__empty { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px; color:var(--color-text-muted) }
.spin { animation:spin .8s linear infinite }
@keyframes spin { to { transform:rotate(360deg) } }
.comment-mgr__list { display:flex; flex-direction:column; gap:12px }
.comment-mgr__item { padding:16px; border-radius:12px; border:1px solid var(--glass-border); background:var(--glass-bg) }
.comment-mgr__item--pending { border-left:3px solid #f59e0b }
.comment-mgr__item--spam { border-left:3px solid #ef4444; opacity:.7 }
.comment-mgr__item--approved { border-left:3px solid #10b981 }
.comment-mgr__item-header { display:flex; align-items:center; gap:10px; margin-bottom:6px; flex-wrap:wrap }
.comment-mgr__author { font-weight:600; font-size:14px }
.comment-mgr__email { font-size:12px; color:var(--color-text-muted) }
.comment-mgr__date { font-size:12px; color:var(--color-text-muted); margin-left:auto }
.comment-mgr__status { font-size:11px; font-weight:600; padding:2px 8px; border-radius:10px }
.comment-mgr__status--pending { background:#fef3c7; color:#92400e }
.comment-mgr__status--approved { background:#d1fae5; color:#065f46 }
.comment-mgr__status--spam { background:#fee2e2; color:#991b1b }
.comment-mgr__post-ref { font-size:12px; color:var(--color-text-secondary); margin-bottom:8px }
.comment-mgr__body { font-size:14px; line-height:1.5; margin:0 }
.comment-mgr__replies { margin-top:12px; padding-left:20px; border-left:2px solid var(--glass-border) }
.comment-mgr__reply { padding:8px 0; font-size:13px }
.comment-mgr__reply p { margin:4px 0 0 }
.comment-mgr__actions { display:flex; gap:8px; margin-top:12px }
.comment-mgr__btn { display:flex; align-items:center; gap:4px; padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; font-size:12px; font-weight:600; cursor:pointer }
.comment-mgr__btn--approve { color:#059669 } .comment-mgr__btn--approve:hover { background:#d1fae5 }
.comment-mgr__btn--spam { color:#dc2626 } .comment-mgr__btn--spam:hover { background:#fee2e2 }
.comment-mgr__btn--delete { color:#6b7280 } .comment-mgr__btn--delete:hover { background:#f3f4f6 }
.comment-mgr__pagination { display:flex; justify-content:center; gap:6px; margin-top:20px }
.comment-mgr__page { padding:6px 12px; border-radius:8px; border:1px solid var(--glass-border); background:transparent; cursor:pointer; font-size:13px }
.comment-mgr__page--active { background:var(--accent-light); color:#fff; border-color:var(--accent-light) }
</style>
