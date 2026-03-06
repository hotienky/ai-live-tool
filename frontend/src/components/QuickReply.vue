<template>
  <div class="quick-reply-panel" v-if="visible">
    <div class="panel-header">
      <h3>⚡ Quick Reply</h3>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <!-- Comment being replied to -->
    <div class="reply-target" v-if="targetComment">
      <div class="target-label" :class="targetComment.label?.replace(/[\[\]]/g, '').toLowerCase()">
        {{ targetComment.label }}
      </div>
      <span class="target-user">@{{ targetComment.uniqueId }}</span>
      <p class="target-text">"{{ targetComment.comment }}"</p>
    </div>

    <!-- AI-generated reply -->
    <div class="reply-content">
      <div v-if="loading" class="loading-reply">
        <div class="spinner"></div>
        <span>AI đang soạn câu trả lời...</span>
      </div>
      <div v-else>
        <textarea
          v-model="replyText"
          placeholder="Nhập câu trả lời hoặc chờ AI gợi ý..."
          rows="3"
        ></textarea>
        <div class="reply-actions">
          <button class="btn-ai" @click="generateAIReply" :disabled="loading">
            🤖 AI Gợi ý
          </button>
          <button class="btn-copy" @click="copyReply">
            📋 Copy
          </button>
          <button class="btn-send" @click="sendReply">
            📤 Gửi
          </button>
        </div>
      </div>
    </div>

    <!-- Quick templates -->
    <div class="templates">
      <h4>📝 Mẫu nhanh</h4>
      <div class="template-list">
        <button
          v-for="(tpl, i) in templates"
          :key="i"
          class="template-btn"
          @click="replyText = tpl.text"
        >
          {{ tpl.icon }} {{ tpl.name }}
        </button>
      </div>
    </div>

    <!-- Toast -->
    <div class="toast" v-if="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: Boolean,
  targetComment: Object,
  apiBase: { type: String, default: 'http://localhost:3000' }
})

const emit = defineEmits(['close', 'sent'])

const replyText = ref('')
const loading = ref(false)
const toast = ref('')

const templates = [
  { icon: '👋', name: 'Chào hỏi', text: 'Dạ cảm ơn bạn đã quan tâm ạ! Mình hỗ trợ bạn ngay nhé ❤️' },
  { icon: '💰', name: 'Báo giá', text: 'Dạ bạn inbox mình để được báo giá chi tiết và ưu đãi đặc biệt nhé ạ 🎁' },
  { icon: '📦', name: 'Chốt đơn', text: 'Dạ em ghi nhận đơn cho mình ngay ạ! Mình inbox SĐT + địa chỉ ship giúp em nhé 📦' },
  { icon: '🔄', name: 'Tư vấn', text: 'Dạ để em tư vấn chi tiết cho mình nhé! Bé nhà mình bao nhiêu tháng/kg ạ? 👶' },
  { icon: '⏰', name: 'Hẹn lại', text: 'Dạ mình ơi, sản phẩm này sẽ có lại trong vài ngày tới. Mình follow shop để nhận thông báo nhé ❤️' },
  { icon: '🎉', name: 'Khuyến mãi', text: 'Hôm nay shop có ưu đãi đặc biệt cho live! Mua 2 giảm thêm 10% ạ 🎉' },
]

watch(() => props.targetComment, async (comment) => {
  if (comment) {
    replyText.value = ''
    await generateAIReply()
  }
})

async function generateAIReply() {
  if (!props.targetComment) return
  loading.value = true
  try {
    const res = await fetch(`${props.apiBase}/api/reply/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        comment: props.targetComment.comment,
        label: props.targetComment.label,
        nickname: props.targetComment.nickname
      })
    })
    const data = await res.json()
    replyText.value = data.reply || ''
  } catch (err) {
    replyText.value = templates[0].text
  } finally {
    loading.value = false
  }
}

function copyReply() {
  navigator.clipboard.writeText(replyText.value)
  showToast('✅ Đã copy!')
}

function sendReply() {
  emit('sent', { comment: props.targetComment, reply: replyText.value })
  showToast('📤 Đã gửi!')
  replyText.value = ''
}

function showToast(msg) {
  toast.value = msg
  setTimeout(() => toast.value = '', 2000)
}
</script>

<style scoped>
.quick-reply-panel {
  background: #1a1a2e;
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  padding: 16px;
  margin-top: 12px;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 12px;
}
.panel-header h3 { margin: 0; font-size: 14px; color: #fff; }
.close-btn {
  background: none; border: none; color: #999; cursor: pointer; font-size: 16px;
}
.reply-target {
  background: rgba(255,255,255,0.05);
  border-radius: 8px; padding: 10px; margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.target-label {
  font-size: 11px; font-weight: 700; padding: 2px 8px; border-radius: 4px;
}
.target-label.hot { background: #ef4444; color: #fff; }
.target-label.warm { background: #f59e0b; color: #000; }
.target-label.cold { background: #6b7280; color: #fff; }
.target-user { color: #818cf8; font-size: 12px; font-weight: 600; }
.target-text { color: #ccc; font-size: 12px; margin: 4px 0 0 0; width: 100%; font-style: italic; }

textarea {
  width: 100%; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 8px; padding: 10px; color: #fff; font-size: 13px;
  resize: vertical; font-family: inherit; box-sizing: border-box;
}
textarea:focus { outline: none; border-color: #818cf8; }

.reply-actions {
  display: flex; gap: 8px; margin-top: 8px;
}
.reply-actions button {
  flex: 1; padding: 8px; border: none; border-radius: 6px;
  font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.btn-ai { background: #312e81; color: #a5b4fc; }
.btn-ai:hover { background: #3730a3; }
.btn-copy { background: rgba(255,255,255,0.1); color: #ccc; }
.btn-copy:hover { background: rgba(255,255,255,0.15); }
.btn-send { background: #059669; color: #fff; }
.btn-send:hover { background: #047857; }

.loading-reply {
  display: flex; align-items: center; gap: 10px; padding: 20px 0; color: #999;
}
.spinner {
  width: 20px; height: 20px; border: 2px solid #333;
  border-top-color: #818cf8; border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.templates { margin-top: 12px; }
.templates h4 { margin: 0 0 8px 0; font-size: 12px; color: #999; }
.template-list { display: flex; flex-wrap: wrap; gap: 6px; }
.template-btn {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px; padding: 6px 10px; color: #ccc; font-size: 11px;
  cursor: pointer; transition: all 0.2s;
}
.template-btn:hover { background: rgba(255,255,255,0.12); border-color: #818cf8; }

.toast {
  position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
  background: #1e293b; color: #fff; padding: 10px 24px; border-radius: 8px;
  font-size: 13px; z-index: 9999; animation: fadeIn 0.3s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
</style>
