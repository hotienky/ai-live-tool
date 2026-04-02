<template>
  <div class="sf-mock-section" :data-builder-id="section.id" :data-section-type="section.type" :data-section-index="index">
    <div class="sf-mock-content">
      <Box :size="32" class="sf-mock-icon" />
      <h3 class="sf-mock-title">{{ title || section.type }}</h3>
      <p class="sf-mock-desc">{{ t('admin.msg_mock_data', 'Khu vực hiển thị dũ liệu mẫu cho block này. Vui lòng lập trình tính năng thực tế ở component tương ứng.') }}</p>
    </div>
  </div>
</template>

<script setup>
import { Box } from 'lucide-vue-next'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

defineProps({
  section: { type: Object, required: true },
  index: { type: Number, required: true },
  title: { type: String, default: '' }
})
</script>

<style scoped>
.sf-mock-section {
  padding: 40px 24px;
  margin: 16px;
  border-radius: 12px;
  background: var(--color-bg-card, #f8fafc);
  border: 2px dashed var(--color-border, #cbd5e1);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: all 0.3s;
}
.sf-mock-section:hover {
  border-color: var(--sf-accent, #7c3aed);
  background: rgba(124, 58, 237, 0.02);
}
.sf-mock-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  max-width: 400px;
}
.sf-mock-icon {
  color: var(--sf-accent, #7c3aed);
  opacity: 0.5;
}
.sf-mock-title {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text-primary, #1e293b);
  text-transform: capitalize;
}
.sf-mock-desc {
  font-size: 13px;
  color: var(--color-text-muted, #64748b);
  line-height: 1.5;
  margin: 0;
}
</style>
