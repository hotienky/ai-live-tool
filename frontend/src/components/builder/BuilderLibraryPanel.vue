<template>
  <div class="library-container">
    <!-- Templates Grid -->
    <div class="lb-section" v-if="!activePageId" style="margin-bottom: 24px;">
      <h4 class="lb-section__title"><Palette :size="14" /> Mẫu bố cục ưu tiên</h4>
      <div class="template-grid">
        <button v-for="tpl in templates" :key="tpl.key" class="template-card" :class="{ active: activeTemplate === tpl.key }" @click="$emit('apply-template', tpl.key)">
          <component :is="tpl.icon" :size="20" />
          <span class="template-card__name">{{ tpl.name }}</span>
        </button>
      </div>
    </div>

    <!-- Sections Library Grid -->
    <div class="library-grouped">
      <div v-for="(items, category) in groupedLibraryItems" :key="category" class="library-group">
        <h4 class="library-group__title">{{ category }}</h4>
        <div class="library-grid-sidebar">
          <button
            v-for="lib in items"
            :key="lib.type"
            class="library-card-row"
            :class="{ added: sections.some(s => s.type === lib.type), 'library-card-row--disabled': !lib.available }"
            @click="lib.available ? $emit('add-section', lib) : null"
            :disabled="!lib.available"
          >
            <span class="library-card-row__icon"><component :is="sectionIconMap[lib.icon] || Box" :size="20" /></span>
            <div class="library-card-row__text" style="flex:1; text-align:left">
              <strong>{{ lib.label }}</strong>
              <span style="display:block; font-size: 11.5px; margin-top:2px; font-weight: normal; color: var(--text-3); line-height: 1.3">{{ lib.description }}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Palette, Box } from 'lucide-vue-next'

defineProps({
  groupedLibraryItems: { type: Object, default: () => ({}) },
  sectionIconMap: { type: Object, default: () => ({}) },
  sections: { type: Array, default: () => [] },
  templates: { type: Array, default: () => [] },
  activeTemplate: { type: String, default: '' },
  activePageId: { default: null },
})

defineEmits(['add-section', 'apply-template'])
</script>

<style scoped>
.library-grouped { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 32px; background: var(--bg-1); }
.library-group__title { margin: 0 0 16px; font-size: 15px; font-weight: 700; color: var(--text-1); padding-bottom: 8px; border-bottom: 2px solid var(--bg-2); }
.library-grid-sidebar { display: flex; flex-direction: column; gap: 8px; }
.library-card-row { display: flex; align-items: center; gap: 12px; padding: 12px; background: #fff; border: 1px solid var(--border); border-radius: 8px; text-align: left; cursor: pointer; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.library-card-row:hover:not(.library-card-row--disabled) { border-color: var(--accent); background: rgba(99,102,241,0.02); }
.library-card-row__icon { width: 36px; height: 36px; border-radius: 8px; background: rgba(99,102,241,0.08); color: var(--accent); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.library-card-row--disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-2); }
.library-card { background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 16px; display: flex; flex-direction: column; gap: 8px; text-align: left; cursor: pointer; outline: none; position: relative; transition: 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
.library-card:hover:not(.library-card--disabled) { border-color: var(--accent); box-shadow: 0 4px 12px rgba(124,58,237,0.1); transform: translateY(-2px); }
.library-card__icon { color: var(--accent); opacity: 0.8; }
.library-card strong { font-size: 13px; color: var(--text-1); }
.library-card__desc { font-size: 11px; color: var(--text-3); line-height: 1.4; }
.library-card.added { border-color: var(--accent); background: rgba(124,58,237,0.03); opacity: 0.7; }
.library-card__badge { position: absolute; top: -8px; right: -8px; font-size: 10px; font-weight: 700; background: var(--accent); color: #fff; padding: 2px 6px; border-radius: 12px; }
.library-card--disabled { opacity: 0.5; cursor: not-allowed; background: var(--bg-2); }

/* Templates Grid */
.template-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
.template-card { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 16px 12px; border-radius: 12px; border: 2px solid var(--border); background: #fff; cursor: pointer; transition: all 0.2s; color: var(--text-2); text-align: center; }
.template-card:hover { border-color: var(--accent); color: var(--text-1); box-shadow: 0 4px 12px rgba(124,58,237,0.1); transform: translateY(-2px); }
.template-card.active { border-color: var(--accent); background: rgba(124,58,237,0.05); color: var(--accent); }
.template-card__name { font-size: 12px; font-weight: 700; }
</style>
