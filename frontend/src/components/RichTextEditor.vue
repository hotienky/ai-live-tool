<template>
  <div class="rte" :class="{ 'rte--focused': isFocused }">
    <!-- Toolbar -->
    <div class="rte__toolbar" v-if="editor">
      <div class="rte__toolbar-group">
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('heading', { level: 1 }) }" @click="editor.chain().focus().toggleHeading({ level: 1 }).run()" title="H1">H1</button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('heading', { level: 2 }) }" @click="editor.chain().focus().toggleHeading({ level: 2 }).run()" title="H2">H2</button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('heading', { level: 3 }) }" @click="editor.chain().focus().toggleHeading({ level: 3 }).run()" title="H3">H3</button>
      </div>
      <div class="rte__divider" />
      <div class="rte__toolbar-group">
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('bold') }" @click="editor.chain().focus().toggleBold().run()" title="Bold"><Bold :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('italic') }" @click="editor.chain().focus().toggleItalic().run()" title="Italic"><Italic :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('underline') }" @click="editor.chain().focus().toggleUnderline().run()" title="Underline"><UnderlineIcon :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('strike') }" @click="editor.chain().focus().toggleStrike().run()" title="Strikethrough"><Strikethrough :size="14" /></button>
      </div>
      <div class="rte__divider" />
      <div class="rte__toolbar-group">
        <button type="button" class="rte__btn" :class="{ active: editor.isActive({ textAlign: 'left' }) }" @click="editor.chain().focus().setTextAlign('left').run()" title="Align Left"><AlignLeft :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive({ textAlign: 'center' }) }" @click="editor.chain().focus().setTextAlign('center').run()" title="Align Center"><AlignCenter :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive({ textAlign: 'right' }) }" @click="editor.chain().focus().setTextAlign('right').run()" title="Align Right"><AlignRight :size="14" /></button>
      </div>
      <div class="rte__divider" />
      <div class="rte__toolbar-group">
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('bulletList') }" @click="editor.chain().focus().toggleBulletList().run()" title="Bullet List"><List :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('orderedList') }" @click="editor.chain().focus().toggleOrderedList().run()" title="Ordered List"><ListOrdered :size="14" /></button>
        <button type="button" class="rte__btn" :class="{ active: editor.isActive('blockquote') }" @click="editor.chain().focus().toggleBlockquote().run()" title="Quote"><Quote :size="14" /></button>
      </div>
      <div class="rte__divider" />
      <div class="rte__toolbar-group">
        <button type="button" class="rte__btn" @click="setLink" :class="{ active: editor.isActive('link') }" title="Link"><LinkIcon :size="14" /></button>
        <button type="button" class="rte__btn" @click="insertImage" title="Image"><ImageIcon :size="14" /></button>
        <button type="button" class="rte__btn" @click="editor.chain().focus().setHorizontalRule().run()" title="Horizontal Rule"><Minus :size="14" /></button>
      </div>
      <div class="rte__divider" />
      <div class="rte__toolbar-group">
        <button type="button" class="rte__btn" @click="editor.chain().focus().undo().run()" :disabled="!editor.can().undo()" title="Undo"><Undo :size="14" /></button>
        <button type="button" class="rte__btn" @click="editor.chain().focus().redo().run()" :disabled="!editor.can().redo()" title="Redo"><Redo :size="14" /></button>
      </div>
      <div class="rte__toolbar-group rte__toolbar-group--right">
        <button type="button" class="rte__btn rte__btn--code" :class="{ active: showSource }" @click="toggleSource" title="HTML Source">
          <Code :size="14" />
        </button>
      </div>
    </div>

    <!-- Editor Content -->
    <div v-show="!showSource" class="rte__content-wrap">
      <EditorContent :editor="editor" class="rte__content" />
    </div>

    <!-- Source Code View -->
    <textarea
      v-show="showSource"
      class="rte__source"
      :value="htmlSource"
      @input="onSourceInput($event.target.value)"
      rows="12"
    />
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, onMounted } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Quote,
  Link as LinkIcon, Image as ImageIcon, Minus,
  Undo, Redo, Code,
} from 'lucide-vue-next'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: 'Nhập nội dung...' },
})
const emit = defineEmits(['update:modelValue'])

const isFocused = ref(false)
const showSource = ref(false)
const htmlSource = ref('')

const editor = useEditor({
  content: props.modelValue || '',
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3, 4] },
    }),
    Image.configure({ inline: false, allowBase64: true }),
    Link.configure({ openOnClick: false, HTMLAttributes: { target: '_blank' } }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    Underline,
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  onUpdate: ({ editor: e }) => {
    const html = e.getHTML()
    emit('update:modelValue', html)
  },
  onFocus: () => { isFocused.value = true },
  onBlur: () => { isFocused.value = false },
})

// Sync external v-model changes
watch(() => props.modelValue, (newVal) => {
  if (!editor.value) return
  const currentHtml = editor.value.getHTML()
  // Avoid infinite loop — only update if genuinely different
  if (newVal !== currentHtml) {
    editor.value.commands.setContent(newVal || '', false)
  }
})

// Source view helpers
function toggleSource() {
  if (!showSource.value) {
    htmlSource.value = editor.value?.getHTML() || ''
  } else {
    // Apply source changes back to editor
    editor.value?.commands.setContent(htmlSource.value, false)
    emit('update:modelValue', htmlSource.value)
  }
  showSource.value = !showSource.value
}

function onSourceInput(val) {
  htmlSource.value = val
  editor.value?.commands.setContent(val, false)
  emit('update:modelValue', val)
}

// Link
function setLink() {
  if (editor.value.isActive('link')) {
    editor.value.chain().focus().unsetLink().run()
    return
  }
  const url = prompt('URL:')
  if (url) {
    editor.value.chain().focus().setLink({ href: url }).run()
  }
}

// Image
function insertImage() {
  const url = prompt('Image URL:')
  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

onBeforeUnmount(() => {
  editor.value?.destroy()
})
</script>

<style scoped>
.rte {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-bg-primary);
  transition: border-color 0.2s;
}
.rte--focused {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 2px var(--color-accent-glow, rgba(99,102,241,0.15));
}

/* Toolbar */
.rte__toolbar {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 6px 8px;
  background: var(--color-bg-elevated, var(--color-bg-card));
  border-bottom: 1px solid var(--color-border);
  flex-wrap: wrap;
}
.rte__toolbar-group {
  display: flex;
  align-items: center;
  gap: 1px;
}
.rte__toolbar-group--right {
  margin-left: auto;
}
.rte__divider {
  width: 1px;
  height: 20px;
  background: var(--color-border);
  margin: 0 4px;
}
.rte__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary);
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  transition: all 0.15s;
}
.rte__btn:hover {
  background: var(--color-bg-tertiary, rgba(255,255,255,0.08));
  color: var(--color-text-primary);
}
.rte__btn.active {
  background: var(--color-accent-glow, rgba(99,102,241,0.15));
  color: var(--color-accent-primary);
}
.rte__btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.rte__btn--code {
  font-family: monospace;
}

/* Content */
.rte__content-wrap {
  min-height: 180px;
  max-height: 500px;
  overflow-y: auto;
}
.rte__content :deep(.tiptap) {
  padding: 12px 16px;
  min-height: 180px;
  outline: none;
  font-size: 14px;
  line-height: 1.7;
  color: var(--color-text-primary);
}
.rte__content :deep(.tiptap p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  color: var(--color-text-muted);
  pointer-events: none;
  height: 0;
}

/* Headings */
.rte__content :deep(.tiptap h1) { font-size: 1.8em; font-weight: 800; margin: 0.5em 0 0.3em; }
.rte__content :deep(.tiptap h2) { font-size: 1.4em; font-weight: 700; margin: 0.5em 0 0.3em; }
.rte__content :deep(.tiptap h3) { font-size: 1.15em; font-weight: 700; margin: 0.5em 0 0.3em; }

/* Lists */
.rte__content :deep(.tiptap ul),
.rte__content :deep(.tiptap ol) { padding-left: 1.5em; }
.rte__content :deep(.tiptap li) { margin-bottom: 4px; }

/* Blockquote */
.rte__content :deep(.tiptap blockquote) {
  border-left: 3px solid var(--color-accent-primary, #6366f1);
  padding-left: 16px;
  margin: 12px 0;
  color: var(--color-text-secondary);
  font-style: italic;
}

/* Links */
.rte__content :deep(.tiptap a) {
  color: var(--color-accent-primary, #6366f1);
  text-decoration: underline;
}

/* Images */
.rte__content :deep(.tiptap img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 8px 0;
}

/* HR */
.rte__content :deep(.tiptap hr) {
  border: none;
  border-top: 1px solid var(--color-border);
  margin: 16px 0;
}

/* Source textarea */
.rte__source {
  width: 100%;
  min-height: 180px;
  padding: 12px 16px;
  border: none;
  background: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 13px;
  line-height: 1.6;
  resize: vertical;
  outline: none;
  box-sizing: border-box;
}
</style>
