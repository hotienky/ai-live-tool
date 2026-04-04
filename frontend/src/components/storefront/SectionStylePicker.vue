<template>
  <div class="style-picker" v-if="templates.length > 0">
    <div class="style-picker__header">
      <Palette :size="13" />
      <span>{{ t('admin.msg_choose_style', 'Chọn kiểu hiển thị') }}</span>
    </div>
    <div class="style-picker__grid" :class="{ 'style-picker__grid--compact': templates.length > 4 }">
      <button
        v-for="tpl in templates"
        :key="tpl.id"
        class="style-card"
        :class="{ active: currentTemplateId === tpl.id }"
        @click="selectTemplate(tpl)"
        :title="tpl.description"
      >
        <div class="style-card__preview" v-html="tpl.svgPreview"></div>
        <div class="style-card__info">
          <span class="style-card__name">{{ tpl.name }}</span>
          <span class="style-card__desc">{{ tpl.description }}</span>
        </div>
        <div class="style-card__check" v-if="currentTemplateId === tpl.id">
          <Check :size="12" />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Palette, Check } from 'lucide-vue-next'
import { getTemplatesForSection } from './sectionTemplates.js'
import { useI18n } from '../../composables/useI18n.js'

const { t } = useI18n()

const props = defineProps({
  sectionType: { type: String, required: true },
  params: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['apply-template'])

const templates = computed(() => getTemplatesForSection(props.sectionType))

// Determine current active template by matching config values
const currentTemplateId = computed(() => {
  for (const tpl of templates.value) {
    const configKeys = Object.keys(tpl.config)
    const allMatch = configKeys.every(k => {
      const paramVal = props.params[k]
      const tplVal = tpl.config[k]
      // Handle undefined/null as matching default (first template)
      if (paramVal === undefined || paramVal === null) return tpl === templates.value[0]
      return String(paramVal) === String(tplVal)
    })
    if (allMatch) return tpl.id
  }
  return templates.value[0]?.id || null
})

function selectTemplate(tpl) {
  emit('apply-template', tpl.config)
}
</script>

<style scoped>
.style-picker {
  margin-bottom: 12px;
}

.style-picker__header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.style-picker__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.style-picker__grid--compact {
  grid-template-columns: repeat(2, 1fr);
}

.style-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  padding: 0;
  border: 2px solid var(--color-border, #e2e8f0);
  border-radius: 10px;
  background: var(--color-bg-card-solid, #fff);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  text-align: left;
  color: inherit;
}

.style-card:hover {
  border-color: var(--color-text-muted, #94a3b8);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.style-card.active {
  border-color: var(--color-accent-primary, #6366f1);
  background: var(--color-accent-glow, rgba(99, 102, 241, 0.06));
  box-shadow: 0 0 0 3px var(--color-accent-glow, rgba(99, 102, 241, 0.12));
}

.style-card__preview {
  padding: 6px;
  background: var(--glass-bg, #f8fafc);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  line-height: 0;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.style-card__preview :deep(svg) {
  width: 100%;
  height: auto;
  max-height: 80px;
}

.style-card__info {
  padding: 6px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.style-card__name {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-primary, #1e293b);
  line-height: 1.2;
}

.style-card__desc {
  font-size: 10px;
  color: var(--color-text-muted, #94a3b8);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.style-card__check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-accent-primary, #6366f1);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(99, 102, 241, 0.3);
  animation: checkPop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes checkPop {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Responsive: single column on very small panels */
@media (max-width: 380px) {
  .style-picker__grid {
    grid-template-columns: 1fr;
  }
}
</style>
