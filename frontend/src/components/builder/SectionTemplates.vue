<template>
  <div class="section-templates">
    <div class="st-header">
      <h4 class="st-title"><LayoutTemplate :size="16" /> {{ t('admin.section_templates', 'Section Templates') }}</h4>
      <div class="st-search">
        <Search :size="13" />
        <input v-model="search" type="text" :placeholder="t('admin.search_templates', 'Tìm template...')" class="st-search__input" />
      </div>
    </div>

    <!-- Categories -->
    <div class="st-categories">
      <button v-for="cat in categories" :key="cat.key" class="st-cat" :class="{ active: activeCategory === cat.key }" @click="activeCategory = cat.key">
        {{ cat.label }} ({{ cat.count }})
      </button>
    </div>

    <!-- Template Grid -->
    <div class="st-grid">
      <div v-for="tpl in filteredTemplates" :key="tpl.id" class="st-card" @click="$emit('select', tpl)">
        <div class="st-card__preview" :style="{ background: tpl.previewBg || 'var(--bg-2)' }">
          <div class="st-card__preview-blocks">
            <div v-for="(b, i) in (tpl.previewBlocks || [])" :key="i" class="st-preview-block" :class="'st-preview--' + b"></div>
          </div>
        </div>
        <div class="st-card__body">
          <span class="st-card__name">{{ tpl.name }}</span>
          <span class="st-card__cat">{{ tpl.category }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { LayoutTemplate, Search } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
defineEmits(['select'])

const search = ref('')
const activeCategory = ref('all')

const templates = [
  // Hero Sections
  { id: 'hero-cta', name: 'CTA Hero', category: 'hero', previewBg: 'linear-gradient(135deg, #1a1a2e, #7c3aed33)', previewBlocks: ['heading', 'text', 'button'], sections: [{ type: 'heading', content: { text: 'Welcome to Our Site', level: 1 }, style: { fontSize: '48px', fontWeight: '800', color: '#fff', textAlign: 'center' } }, { type: 'text', content: { html: '<p>Build beautiful websites with our visual builder</p>' }, style: { color: '#e5e7eb', textAlign: 'center' } }, { type: 'button', content: { text: 'Get Started', url: '#', variant: 'primary' }, style: { textAlign: 'center' } }] },
  { id: 'hero-split', name: 'Split Hero', category: 'hero', previewBlocks: ['heading', 'text', 'image'], sections: [] },
  { id: 'hero-video', name: 'Video Hero', category: 'hero', previewBlocks: ['video', 'heading'], sections: [] },
  { id: 'hero-slider', name: 'Slider Hero', category: 'hero', previewBlocks: ['image', 'heading', 'button'], sections: [] },

  // Features
  { id: 'features-3col', name: '3-Column Features', category: 'features', previewBlocks: ['icon', 'icon', 'icon'], sections: [] },
  { id: 'features-icons', name: 'Icon List', category: 'features', previewBlocks: ['icon', 'text', 'icon', 'text'], sections: [] },
  { id: 'features-stats', name: 'Stats Bar', category: 'features', previewBlocks: ['heading', 'heading', 'heading', 'heading'], sections: [] },
  { id: 'features-alt', name: 'Alternating Features', category: 'features', previewBlocks: ['image', 'text', 'text', 'image'], sections: [] },

  // Social Proof
  { id: 'testimonials-cards', name: 'Testimonial Cards', category: 'social', previewBlocks: ['text', 'text', 'text'], sections: [] },
  { id: 'logos-strip', name: 'Logo Strip', category: 'social', previewBlocks: ['image', 'image', 'image', 'image'], sections: [] },
  { id: 'case-study', name: 'Case Study', category: 'social', previewBlocks: ['image', 'heading', 'text'], sections: [] },

  // CTA
  { id: 'cta-banner', name: 'CTA Banner', category: 'cta', previewBg: 'linear-gradient(135deg, #7c3aed, #ec4899)', previewBlocks: ['heading', 'button'], sections: [] },
  { id: 'cta-newsletter', name: 'Newsletter Signup', category: 'cta', previewBlocks: ['heading', 'text', 'button'], sections: [] },
  { id: 'cta-download', name: 'App Download', category: 'cta', previewBlocks: ['heading', 'image', 'button', 'button'], sections: [] },

  // Content
  { id: 'pricing-table', name: 'Pricing Table', category: 'content', previewBlocks: ['heading', 'columns'], sections: [] },
  { id: 'team-grid', name: 'Team Grid', category: 'content', previewBlocks: ['image', 'image', 'image'], sections: [] },
  { id: 'faq-accordion', name: 'FAQ Section', category: 'content', previewBlocks: ['heading', 'text', 'text'], sections: [] },
  { id: 'gallery-masonry', name: 'Image Gallery', category: 'content', previewBlocks: ['image', 'image', 'image', 'image'], sections: [] },
  { id: 'timeline', name: 'Timeline', category: 'content', previewBlocks: ['text', 'text', 'text'], sections: [] },
  { id: 'contact-form', name: 'Contact Section', category: 'content', previewBlocks: ['heading', 'text', 'button'], sections: [] },
]

const categories = computed(() => {
  const cats = [{ key: 'all', label: 'All', count: templates.length }]
  const catMap = {}
  templates.forEach(t => {
    catMap[t.category] = (catMap[t.category] || 0) + 1
  })
  Object.entries(catMap).forEach(([k, v]) => cats.push({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1), count: v }))
  return cats
})

const filteredTemplates = computed(() => {
  let items = templates
  if (activeCategory.value !== 'all') items = items.filter(t => t.category === activeCategory.value)
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    items = items.filter(t => t.name.toLowerCase().includes(q))
  }
  return items
})
</script>

<style scoped>
.section-templates { padding: 16px; }
.st-header { margin-bottom: 16px; }
.st-title { display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 700; margin: 0 0 12px; }
.st-search {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; border-radius: 8px;
  background: var(--bg-2); border: 1px solid var(--color-border);
}
.st-search svg { color: var(--text-3); }
.st-search__input { flex: 1; border: none; background: transparent; font-size: 13px; color: var(--text-1); outline: none; }

.st-categories { display: flex; gap: 4px; margin-bottom: 16px; flex-wrap: wrap; }
.st-cat {
  padding: 5px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
  border: 1px solid var(--color-border); background: transparent;
  color: var(--text-3); cursor: pointer; transition: all 0.2s;
}
.st-cat.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.st-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
.st-card {
  border-radius: 10px; overflow: hidden; cursor: pointer;
  border: 1px solid var(--color-border); background: var(--glass-bg);
  transition: all 0.2s;
}
.st-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.st-card__preview {
  height: 80px; padding: 10px; display: flex; align-items: center; justify-content: center;
}
.st-card__preview-blocks { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
.st-preview-block {
  width: 20px; height: 8px; border-radius: 2px; opacity: 0.5;
}
.st-preview--heading { background: var(--text-1); width: 40px; height: 10px; }
.st-preview--text { background: var(--text-3); width: 50px; }
.st-preview--button { background: var(--accent); width: 30px; border-radius: 4px; }
.st-preview--image { background: var(--accent); opacity: 0.3; width: 30px; height: 20px; border-radius: 4px; }
.st-preview--icon { background: var(--accent); width: 12px; height: 12px; border-radius: 50%; }
.st-preview--video { background: #ef4444; width: 40px; height: 24px; border-radius: 4px; opacity: 0.4; }
.st-preview--columns { background: var(--text-3); width: 60px; height: 12px; opacity: 0.3; }

.st-card__body { padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; }
.st-card__name { font-size: 12px; font-weight: 700; }
.st-card__cat { font-size: 10px; color: var(--text-3); text-transform: capitalize; }
</style>
