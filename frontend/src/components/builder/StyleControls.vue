<template>
  <div class="style-controls">
    <!-- Spacing -->
    <section class="sc-section">
      <h5 class="sc-title"><Move :size="12" /> Spacing</h5>
      <div class="sc-spacing">
        <div class="sc-spacing__label">Margin</div>
        <div class="sc-spacing__row">
          <label>T<input type="number" :value="style.margin?.top || 0" @input="updateSpacing('margin', 'top', $event)" class="sc-num" /></label>
          <label>R<input type="number" :value="style.margin?.right || 0" @input="updateSpacing('margin', 'right', $event)" class="sc-num" /></label>
          <label>B<input type="number" :value="style.margin?.bottom || 0" @input="updateSpacing('margin', 'bottom', $event)" class="sc-num" /></label>
          <label>L<input type="number" :value="style.margin?.left || 0" @input="updateSpacing('margin', 'left', $event)" class="sc-num" /></label>
        </div>
        <div class="sc-spacing__label">Padding</div>
        <div class="sc-spacing__row">
          <label>T<input type="number" :value="style.padding?.top || 0" @input="updateSpacing('padding', 'top', $event)" class="sc-num" /></label>
          <label>R<input type="number" :value="style.padding?.right || 0" @input="updateSpacing('padding', 'right', $event)" class="sc-num" /></label>
          <label>B<input type="number" :value="style.padding?.bottom || 0" @input="updateSpacing('padding', 'bottom', $event)" class="sc-num" /></label>
          <label>L<input type="number" :value="style.padding?.left || 0" @input="updateSpacing('padding', 'left', $event)" class="sc-num" /></label>
        </div>
      </div>
    </section>

    <!-- Typography -->
    <section class="sc-section">
      <h5 class="sc-title"><Type :size="12" /> Typography</h5>
      <div class="sc-row">
        <label class="sc-label">Size</label>
        <select :value="style.fontSize || ''" @change="updateField('fontSize', $event.target.value)" class="sc-select">
          <option value="">Auto</option>
          <option v-for="s in fontSizes" :key="s" :value="s">{{ s }}</option>
        </select>
      </div>
      <div class="sc-row">
        <label class="sc-label">Weight</label>
        <select :value="style.fontWeight || ''" @change="updateField('fontWeight', $event.target.value)" class="sc-select">
          <option value="">Normal</option>
          <option value="300">Light</option>
          <option value="500">Medium</option>
          <option value="600">Semi Bold</option>
          <option value="700">Bold</option>
          <option value="800">Extra Bold</option>
        </select>
      </div>
      <div class="sc-row">
        <label class="sc-label">Color</label>
        <div class="sc-color-group">
          <input type="color" :value="style.color || '#000000'" @input="updateField('color', $event.target.value)" class="sc-color" />
          <input type="text" :value="style.color || ''" @input="updateField('color', $event.target.value)" class="sc-input sc-input--sm" />
        </div>
      </div>
      <div class="sc-row">
        <label class="sc-label">Align</label>
        <div class="sc-btn-group">
          <button v-for="a in ['left','center','right','justify']" :key="a" :class="{ active: style.textAlign === a }" @click="updateField('textAlign', a)">
            <component :is="alignIcons[a]" :size="13" />
          </button>
        </div>
      </div>
      <div class="sc-row">
        <label class="sc-label">Line Height</label>
        <input type="text" :value="style.lineHeight || ''" @input="updateField('lineHeight', $event.target.value)" class="sc-input sc-input--sm" placeholder="e.g. 1.5" />
      </div>
    </section>

    <!-- Background -->
    <section class="sc-section">
      <h5 class="sc-title"><PaintBucket :size="12" /> Background</h5>
      <div class="sc-row">
        <label class="sc-label">Color</label>
        <div class="sc-color-group">
          <input type="color" :value="style.backgroundColor || '#ffffff'" @input="updateField('backgroundColor', $event.target.value)" class="sc-color" />
          <input type="text" :value="style.backgroundColor || ''" @input="updateField('backgroundColor', $event.target.value)" class="sc-input sc-input--sm" placeholder="#ffffff" />
        </div>
      </div>
      <div class="sc-row">
        <label class="sc-label">Image URL</label>
        <input type="text" :value="style.backgroundImage || ''" @input="updateField('backgroundImage', $event.target.value)" class="sc-input" placeholder="https://..." />
      </div>
      <div class="sc-row">
        <label class="sc-label">Gradient</label>
        <input type="text" :value="style.backgroundGradient || ''" @input="updateField('backgroundGradient', $event.target.value)" class="sc-input" placeholder="linear-gradient(...)" />
      </div>
    </section>

    <!-- Border -->
    <section class="sc-section">
      <h5 class="sc-title"><Square :size="12" /> Border</h5>
      <div class="sc-row">
        <label class="sc-label">Radius</label>
        <div class="sc-range-group">
          <input type="range" :value="style.borderRadius || 0" @input="updateField('borderRadius', Number($event.target.value))" min="0" max="50" class="sc-range" />
          <span class="sc-range-val">{{ style.borderRadius || 0 }}px</span>
        </div>
      </div>
      <div class="sc-row">
        <label class="sc-label">Width</label>
        <input type="number" :value="style.borderWidth || 0" @input="updateField('borderWidth', Number($event.target.value))" class="sc-input sc-input--sm" min="0" />
      </div>
      <div class="sc-row">
        <label class="sc-label">Color</label>
        <div class="sc-color-group">
          <input type="color" :value="style.borderColor || '#e5e7eb'" @input="updateField('borderColor', $event.target.value)" class="sc-color" />
        </div>
      </div>
      <div class="sc-row">
        <label class="sc-label">Shadow</label>
        <select :value="style.boxShadow || ''" @change="updateField('boxShadow', $event.target.value)" class="sc-select">
          <option value="">None</option>
          <option value="0 1px 3px rgba(0,0,0,0.1)">Small</option>
          <option value="0 4px 12px rgba(0,0,0,0.1)">Medium</option>
          <option value="0 8px 24px rgba(0,0,0,0.15)">Large</option>
          <option value="0 12px 40px rgba(0,0,0,0.2)">XL</option>
        </select>
      </div>
    </section>

    <!-- Animation -->
    <section class="sc-section">
      <h5 class="sc-title"><Sparkles :size="12" /> Animation</h5>
      <div class="sc-anim-grid">
        <button v-for="a in animations" :key="a.value" class="sc-anim-btn" :class="{ active: currentAnimation === a.value }" @click="$emit('update:animation', a.value)">
          {{ a.label }}
        </button>
      </div>
    </section>

    <!-- Responsive -->
    <section class="sc-section">
      <h5 class="sc-title"><Smartphone :size="12" /> Responsive</h5>
      <label class="sc-check"><input type="checkbox" :checked="responsive?.hideOnMobile" @change="updateResponsiveField('hideOnMobile', $event.target.checked)" /> Hide on Mobile</label>
      <label class="sc-check"><input type="checkbox" :checked="responsive?.hideOnTablet" @change="updateResponsiveField('hideOnTablet', $event.target.checked)" /> Hide on Tablet</label>
      <label class="sc-check"><input type="checkbox" :checked="responsive?.hideOnDesktop" @change="updateResponsiveField('hideOnDesktop', $event.target.checked)" /> Hide on Desktop</label>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Move, Type, PaintBucket, Square, Sparkles, Smartphone, AlignLeft, AlignCenter, AlignRight, AlignJustify } from 'lucide-vue-next'
import { animationPresets } from '../../core/blocks.js'

const props = defineProps({
  styleData: { type: Object, default: () => ({}) },
  responsive: { type: Object, default: () => ({}) },
  animation: { type: String, default: '' },
})
const emit = defineEmits(['update:style', 'update:responsive', 'update:animation'])

const style = computed(() => props.styleData || {})
const currentAnimation = computed(() => props.animation || '')
const animations = animationPresets

const alignIcons = { left: AlignLeft, center: AlignCenter, right: AlignRight, justify: AlignJustify }
const fontSizes = ['12px','14px','16px','18px','20px','24px','28px','32px','36px','40px','48px','56px','64px','72px']

function updateField(key, value) {
  emit('update:style', { ...style.value, [key]: value })
}

function updateSpacing(prop, side, e) {
  const val = Number(e.target.value) || 0
  emit('update:style', {
    ...style.value,
    [prop]: { ...(style.value[prop] || {}), [side]: val },
  })
}

function updateResponsiveField(key, value) {
  emit('update:responsive', { ...(props.responsive || {}), [key]: value })
}
</script>

<style scoped>
.style-controls { display: flex; flex-direction: column; gap: 0; }
.sc-section { padding: 14px 0; border-bottom: 1px solid var(--glass-border); }
.sc-section:first-child { padding-top: 0; }
.sc-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.5px; color: var(--text-3); margin: 0 0 10px;
}

.sc-row {
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px; margin-bottom: 8px;
}
.sc-label { font-size: 12px; font-weight: 600; color: var(--text-2); white-space: nowrap; min-width: 60px; }

.sc-input {
  flex: 1; padding: 6px 10px; border-radius: 6px;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 12px; color: var(--text-1); max-width: 100%;
}
.sc-input:focus { outline: none; border-color: var(--accent); }
.sc-input--sm { max-width: 80px; flex: none; }

.sc-select {
  padding: 6px 10px; border-radius: 6px; font-size: 12px;
  border: 1px solid var(--color-border); background: var(--bg-2); color: var(--text-1);
}

.sc-color-group { display: flex; align-items: center; gap: 6px; }
.sc-color { width: 28px; height: 28px; border-radius: 6px; border: none; cursor: pointer; padding: 1px; }

.sc-num {
  width: 48px; padding: 4px 6px; border-radius: 4px; text-align: center;
  border: 1px solid var(--color-border); background: var(--bg-2);
  font-size: 11px; color: var(--text-1);
}
.sc-num:focus { outline: none; border-color: var(--accent); }

.sc-spacing { margin-bottom: 4px; }
.sc-spacing__label { font-size: 10px; font-weight: 700; color: var(--text-3); margin-bottom: 4px; text-transform: uppercase; }
.sc-spacing__row {
  display: flex; gap: 6px; margin-bottom: 8px;
}
.sc-spacing__row label {
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; color: var(--text-3);
}

.sc-btn-group { display: flex; gap: 2px; }
.sc-btn-group button {
  padding: 6px 10px; border-radius: 6px; border: 1px solid var(--color-border);
  background: transparent; color: var(--text-3); cursor: pointer; transition: all 0.15s;
}
.sc-btn-group button.active { background: var(--accent); color: #fff; border-color: var(--accent); }

.sc-range-group { display: flex; align-items: center; gap: 8px; flex: 1; }
.sc-range { flex: 1; accent-color: var(--accent); }
.sc-range-val { font-size: 11px; font-weight: 600; color: var(--text-3); min-width: 36px; }

/* Animation grid */
.sc-anim-grid { display: flex; flex-wrap: wrap; gap: 4px; }
.sc-anim-btn {
  padding: 5px 10px; border-radius: 6px; font-size: 11px; font-weight: 600;
  border: 1px solid var(--color-border); background: transparent;
  color: var(--text-3); cursor: pointer; transition: all 0.15s;
}
.sc-anim-btn.active { background: var(--accent); color: #fff; border-color: var(--accent); }

/* Checkbox */
.sc-check {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--text-2); margin-bottom: 6px; cursor: pointer;
}
.sc-check input { accent-color: var(--accent); }
</style>
