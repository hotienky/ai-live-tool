<template>
  <div class="block-renderer" :style="computedStyle" :class="[animClass, responsiveClass]" :data-block-id="block.id">
    <!-- Heading -->
    <component v-if="block.type === 'heading'" :is="'h' + (block.content.level || 2)" class="br-heading" :contenteditable="editable" @blur="onTextEdit($event, 'text')" v-text="block.content.text" />

    <!-- Text -->
    <div v-else-if="block.type === 'text'" class="br-text" :contenteditable="editable" @blur="onHtmlEdit" v-html="block.content.html" />

    <!-- Image -->
    <div v-else-if="block.type === 'image'" class="br-image">
      <img v-if="block.content.src" :src="block.content.src" :alt="block.content.alt || ''" :style="{ width: block.content.width || '100%' }" loading="lazy" />
      <div v-else class="br-image__placeholder"><ImageIcon :size="32" /><span>Click to add image</span></div>
    </div>

    <!-- Button -->
    <div v-else-if="block.type === 'button'" class="br-button-wrap">
      <a :href="editable ? '#' : (block.content.url || '#')" :target="block.content.target" class="br-button" :class="'br-button--' + (block.content.variant || 'primary')" @click.prevent>
        {{ block.content.text || 'Button' }}
      </a>
    </div>

    <!-- Spacer -->
    <div v-else-if="block.type === 'spacer'" class="br-spacer" :style="{ height: (block.content.height || 40) + 'px' }" />

    <!-- Divider -->
    <hr v-else-if="block.type === 'divider'" class="br-divider" :style="{ borderStyle: block.content.style || 'solid', borderColor: block.content.color || '#e5e7eb', borderWidth: (block.content.width || 1) + 'px 0 0 0' }" />

    <!-- Video -->
    <div v-else-if="block.type === 'video'" class="br-video">
      <iframe v-if="embedUrl" :src="embedUrl" frameborder="0" allowfullscreen class="br-video__frame"></iframe>
      <div v-else class="br-video__placeholder"><PlayCircle :size="32" /><span>Add video URL</span></div>
    </div>

    <!-- Icon -->
    <div v-else-if="block.type === 'icon'" class="br-icon" :style="{ color: block.content.color || 'currentColor', fontSize: (block.content.size || 48) + 'px' }">
      <component :is="resolveIcon(block.content.name)" :size="block.content.size || 48" />
    </div>

    <!-- HTML -->
    <div v-else-if="block.type === 'html'" class="br-html" v-html="block.content.code" />

    <!-- Columns -->
    <div v-else-if="block.type === 'columns'" class="br-columns" :style="{ gridTemplateColumns: columnWidths }">
      <slot />
    </div>

    <!-- Unknown -->
    <div v-else class="br-unknown">
      <AlertCircle :size="16" /> Unknown block: {{ block.type }}
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Image as ImageIcon, PlayCircle, AlertCircle, Star } from 'lucide-vue-next'
import { blockStyleToCSS } from '../../core/blocks.js'

const props = defineProps({
  block: { type: Object, required: true },
  editable: { type: Boolean, default: false },
})
const emit = defineEmits(['update'])

const computedStyle = computed(() => blockStyleToCSS(props.block.style))

const animClass = computed(() => props.block.animation ? `anim-${props.block.animation}` : '')

const responsiveClass = computed(() => {
  const r = props.block.responsive || {}
  const cls = []
  if (r.hideOnMobile) cls.push('hide-mobile')
  if (r.hideOnTablet) cls.push('hide-tablet')
  if (r.hideOnDesktop) cls.push('hide-desktop')
  return cls.join(' ')
})

const embedUrl = computed(() => {
  const url = props.block.content?.url
  if (!url) return null
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  const v = url.match(/vimeo\.com\/(\d+)/)
  if (v) return `https://player.vimeo.com/video/${v[1]}`
  if (url.includes('/embed/') || url.includes('player.')) return url
  return null
})

const columnWidths = computed(() => {
  const layout = props.block.content?.layout || 2
  const presets = { 1: '1fr', 2: '1fr 1fr', 3: '1fr 1fr 1fr', 4: '1fr 1fr 1fr 1fr', '2-1': '2fr 1fr', '1-2': '1fr 2fr' }
  return presets[layout] || '1fr'
})

function resolveIcon(name) {
  // Fallback to Star if icon not found
  return Star
}

function onTextEdit(e, key) {
  if (!props.editable) return
  emit('update', { ...props.block, content: { ...props.block.content, [key]: e.target.innerText } })
}

function onHtmlEdit(e) {
  if (!props.editable) return
  emit('update', { ...props.block, content: { ...props.block.content, html: e.target.innerHTML } })
}
</script>

<style scoped>
.block-renderer { position: relative; transition: all 0.2s; }

.br-heading { margin: 0; line-height: 1.3; }
.br-text { line-height: 1.7; }
.br-text :deep(p) { margin: 0 0 12px; }
.br-text :deep(p:last-child) { margin: 0; }

.br-image img { max-width: 100%; border-radius: 8px; display: block; }
.br-image__placeholder, .br-video__placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px; border: 2px dashed var(--color-border, #e5e7eb);
  border-radius: 8px; color: var(--text-3, #9ca3af); cursor: pointer;
  font-size: 13px;
}

.br-button-wrap { display: flex; }
.br-button {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 12px 28px; border-radius: 8px; font-size: 14px; font-weight: 700;
  text-decoration: none; cursor: pointer; transition: all 0.2s;
}
.br-button--primary { background: var(--accent, #7c3aed); color: #fff; }
.br-button--secondary { background: var(--bg-2, #f3f4f6); color: var(--text-1, #111); }
.br-button--outline { border: 2px solid var(--accent, #7c3aed); color: var(--accent, #7c3aed); background: transparent; }
.br-button--ghost { background: transparent; color: var(--accent, #7c3aed); }

.br-spacer { width: 100%; }
.br-divider { border: none; margin: 0; }

.br-video__frame { width: 100%; aspect-ratio: 16/9; border-radius: 8px; }

.br-icon { display: flex; align-items: center; justify-content: center; }

.br-html { overflow: hidden; }
.br-columns { display: grid; gap: 16px; }

.br-unknown {
  display: flex; align-items: center; gap: 6px;
  padding: 12px; border-radius: 8px;
  background: rgba(239,68,68,0.08); color: #ef4444; font-size: 13px;
}

/* Contenteditable */
[contenteditable]:focus { outline: 2px solid var(--accent, #7c3aed); outline-offset: 2px; border-radius: 4px; }

/* Animations */
.anim-fade-in { animation: fadeIn 0.6s ease both; }
.anim-slide-up { animation: slideUp 0.6s ease both; }
.anim-slide-left { animation: slideLeft 0.6s ease both; }
.anim-slide-right { animation: slideRight 0.6s ease both; }
.anim-zoom-in { animation: zoomIn 0.5s ease both; }
.anim-bounce { animation: bounce 0.6s ease both; }

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
@keyframes slideLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes slideRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
@keyframes zoomIn { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
@keyframes bounce { 0% { transform: scale(0.8); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }

/* Responsive hide classes */
@media (max-width: 768px) { .hide-mobile { display: none !important; } }
@media (min-width: 769px) and (max-width: 1024px) { .hide-tablet { display: none !important; } }
@media (min-width: 1025px) { .hide-desktop { display: none !important; } }
</style>
