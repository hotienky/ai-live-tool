<template>
  <div class="forms-mgr">
    <div class="fm-header">
      <h3><MessageSquare :size="16" /> Dữ liệu biểu mẫu (Submissions)</h3>
      <div style="display: flex; gap: 8px;">
        <select v-model="selectedForm" class="param-select" style="min-width: 200px" @change="loadData">
          <option value="">-- Tất cả Biểu mẫu --</option>
          <option v-for="f in forms" :key="f.id" :value="f.id">{{ f.title }}</option>
        </select>
        <button class="btn-primary" @click="loadData" style="padding: 6px 12px">
          <RefreshCw :size="14" /> Làm mới
        </button>
      </div>
    </div>

    <!-- Bảng dữ liệu -->
    <div class="table-container" v-if="submissions.length > 0">
      <table class="data-table">
        <thead>
          <tr>
            <th>Thời gian (Time)</th>
            <th>Biểu mẫu (Form ID)</th>
            <th>Dữ liệu KH điền (Payload)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in submissions" :key="sub.id">
            <td style="white-space: nowrap">{{ new Date(sub.createdAt).toLocaleString() }}</td>
            <td><span class="badge badge--system">{{ getFormTitle(sub.formId) }}</span></td>
            <td>
              <div class="payload-box">
                <div v-for="(val, key) in sub.payload" :key="key" class="payload-item">
                  <strong>{{ key }}:</strong> {{ val }}
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Lỗi rỗng -->
    <div v-else class="fm-empty-state">
      <div class="fm-empty-icon">
        <DatabaseBackup :size="56" stroke-width="1" />
      </div>
      <h2>Chưa có dữ liệu nào</h2>
      <p>Mọi thông tin Khách hàng điền từ Website sẽ cấu trúc <br>và tự động đổ về Danh sách này.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { MessageSquare, DatabaseBackup, RefreshCw } from 'lucide-vue-next'
import { useForms } from '../../composables/useForms.js'

const { forms, fetchForms, submissions, fetchSubmissions } = useForms()
const selectedForm = ref('')

onMounted(async () => {
  await fetchForms()
  await loadData()
})

async function loadData() {
  await fetchSubmissions(selectedForm.value || null)
}

function getFormTitle(formId) {
  const f = forms.value.find(x => x.id === formId)
  return f ? f.title : formId
}
</script>

<style scoped>
.forms-mgr {
  padding: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.fm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.fm-header h3 {
  margin: 0;
  font-size: 1.1rem;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-primary, #fff);
}

.table-container {
  flex: 1;
  overflow: auto;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg-1);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
  color: var(--text-1);
}

.data-table th, .data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  text-align: left;
}

.data-table th {
  background: var(--bg-2);
  font-weight: 600;
  color: var(--text-2);
}

.data-table tbody tr:hover {
  background: rgba(255,255,255,0.02);
}

.payload-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.payload-item {
  background: var(--bg-2);
  padding: 4px 8px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.8rem;
}

.badge { display: inline-flex; align-items: center; padding: 2px 7px; border-radius: 8px; font-size: .65rem; font-weight: 700; }
.badge--system { background: rgba(251,191,36,.15); color: #d97706; border: 1px solid rgba(251,191,36,.3); }

.param-select { padding: 6px 10px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-1); color: var(--text-1); font-size: 0.85rem; }

.fm-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  background: var(--bg-card, rgba(0,0,0,0.15));
  border: 1px dashed var(--border-color, rgba(255,255,255,0.1));
  border-radius: 16px;
  flex: 1;
}

.fm-empty-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 96px;
  height: 96px;
  border-radius: 50%;
  background: rgba(139, 92, 246, 0.05);
  color: #8b5cf6;
  margin-bottom: 24px;
  box-shadow: 0 0 0 1px rgba(139, 92, 246, 0.1), inset 0 0 40px rgba(139, 92, 246, 0.05);
}

.fm-empty-state h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 12px 0;
  color: var(--color-text-primary, #fff);
  letter-spacing: -0.02em;
}

.fm-empty-state p {
  font-size: 0.95rem;
  color: var(--color-text-secondary, #9ca3af);
  line-height: 1.6;
  margin: 0 0 32px 0;
  max-width: 450px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--bg-2, rgba(255,255,255,0.05));
  color: var(--color-text-primary, #fff);
  border: 1px solid var(--border-color, rgba(255,255,255,0.1));
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}
.btn-primary:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(255,255,255,0.2);
}
</style>
