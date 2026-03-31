<template>
  <div v-if="isBuilderMode" class="vvb-overlay">
    <!-- Highlight Boxes & Toolbars code here, similar to the original BuilderOverlay -->
    <!-- MỚI: Thay vì hardcode sectionNames, sectionIcons, nó nhận thông tin từ DOM hoặc injected plugin -->
    <div
      v-for="(info, idx) in sectionRects"
      :key="info.type + '-' + idx"
      class="vvb-section-overlay"
      :class="{
        'vvb-section-overlay--hover': hoveredIndex === idx,
        'vvb-section-overlay--selected': selectedIndex === idx,
        'vvb-section-overlay--dragging': dragState.dragging && dragState.fromIndex === idx,
        'vvb-section-overlay--drop-target': dragState.dragging && dragState.overIndex === idx && dragState.fromIndex !== idx
      }"
      :style="{ top: info.top + 'px', left: info.left + 'px', width: info.width + 'px', height: info.height + 'px' }"
      @mouseenter="onHover(idx)"
      @mouseleave="onLeave(idx)"
      @click.stop="onSelect(idx)"
    >
      <!-- Label -->
      <div class="vvb-label" v-show="hoveredIndex === idx || selectedIndex === idx">
        <span class="vvb-label__text">{{ info.type }}</span>
      </div>

      <!-- Toolbar -->
      <div class="vvb-toolbar" v-show="selectedIndex === idx">
        <template v-if="!info.isFixed">
          <button class="vvb-toolbar__btn" @click.stop="moveSection(idx, -1)" :disabled="idx === 0">▲</button>
          <button class="vvb-toolbar__btn" @click.stop="moveSection(idx, 1)" :disabled="idx === sectionRects.length - 1">▼</button>
          <button class="vvb-toolbar__btn" @click.stop="deleteSection(idx)" style="color: #fca5a5">X</button>
        </template>
      </div>

      <!-- Drag Handle -->
      <div
        class="vvb-drag-handle"
        v-show="(hoveredIndex === idx || selectedIndex === idx) && !info.isFixed"
        draggable="true"
        @dragstart="onDragStart($event, idx)"
        @dragend="onDragEnd"
      >
        &#8942;&#8942;
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const isBuilderMode = ref(false)
const sectionRects = ref([])
const hoveredIndex = ref(-1)
const selectedIndex = ref(-1)

const dragState = ref({ dragging: false, fromIndex: -1, overIndex: -1 })

function updateSectionRects() {
  const elements = document.querySelectorAll('[data-builder-id]')
  const rects = []
  elements.forEach((el) => {
    const rect = el.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const id = el.getAttribute('data-builder-id')
    const type = el.getAttribute('data-builder-type') || el.getAttribute('data-section-type')
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    rects.push({
      id,
      type,
      index: parseInt(el.getAttribute('data-section-index') || '0'),
      isFixed: type === 'header' || type === 'footer' || el.hasAttribute('data-fixed'),
      top: rect.top + scrollTop,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      element: el,
    })
  })
  sectionRects.value = rects
}

// Emits messages up to the parent Admin Builder iframe via PostMessage
function sendToParent(type, payload) {
  if (!window.parent || window.parent === window) return
  window.parent.postMessage({ type, payload, source: 'vue-visual-builder' }, '*')
}

function handleParentMessage(event) {
  const { type, payload, source } = event.data || {}
  if (source !== 'vue-visual-builder') return

  if (type === 'builder:init') {
    isBuilderMode.value = true
    nextTick(updateSectionRects)
  } else if (type === 'builder:select-section') {
    selectedIndex.value = payload.index
    const info = sectionRects.value[payload.index]
    if (info) info.element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

function onHover(idx) {
  hoveredIndex.value = idx
  sendToParent('builder:section-hover', { index: idx })
}

function onLeave(idx) {
  if (hoveredIndex.value === idx) hoveredIndex.value = -1
}

function onSelect(idx) {
  selectedIndex.value = idx
  const info = sectionRects.value[idx]
  sendToParent('builder:section-selected', { index: idx, id: info?.id, type: info?.type })
}

function moveSection(idx, direction) {
  const toIdx = idx + direction
  sendToParent('builder:section-reorder', { fromIndex: idx, toIndex: toIdx })
}

function deleteSection(idx) {
  sendToParent('builder:section-delete', { index: idx })
  selectedIndex.value = -1
}

function onDragStart(e, idx) {
  dragState.value = { dragging: true, fromIndex: idx, overIndex: -1 }
  e.dataTransfer.effectAllowed = 'move'
}

function onDragEnd() {
  if (dragState.value.overIndex >= 0 && dragState.value.fromIndex !== dragState.value.overIndex) {
    sendToParent('builder:section-reorder', {
      fromIndex: dragState.value.fromIndex,
      toIndex: dragState.value.overIndex
    })
  }
  dragState.value = { dragging: false, fromIndex: -1, overIndex: -1 }
}

let rafId = null
function onScrollResize() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(updateSectionRects)
}

let observer = null
onMounted(() => {
  window.addEventListener('message', handleParentMessage)
  sendToParent('builder:ready', {})

  window.addEventListener('scroll', onScrollResize, { passive: true })
  window.addEventListener('resize', onScrollResize, { passive: true })

  observer = new MutationObserver(() => nextTick(updateSectionRects))
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-section-type'] })
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleParentMessage)
  window.removeEventListener('scroll', onScrollResize)
  window.removeEventListener('resize', onScrollResize)
  if (observer) observer.disconnect()
})
</script>

<style>
/* Đã tối giản hoá cho generic library */
.vvb-overlay { position: absolute; top: 0; left: 0; width: 100%; z-index: 2147483647; pointer-events: none; }
.vvb-section-overlay {
  position: absolute; pointer-events: all; cursor: pointer;
  border: 2px solid transparent; border-radius: 4px;
  transition: all 0.15s; box-sizing: border-box;
}
.vvb-section-overlay--hover { border-color: rgba(99, 102, 241, 0.5); background: rgba(99, 102, 241, 0.05); }
.vvb-section-overlay--selected { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15); background: rgba(99, 102, 241, 0.08); }

.vvb-label {
  position: absolute; top: 0; left: 0; transform: translateY(-100%);
  background: #6366f1; color: white; padding: 2px 8px; font-size: 11px;
  border-radius: 4px 4px 0 0; pointer-events: none;
}
.vvb-toolbar {
  position: absolute; top: 0; right: 0; transform: translateY(-100%);
  background: #1e293b; display: flex; border-radius: 4px 4px 0 0; overflow: hidden;
}
.vvb-toolbar__btn {
  background: transparent; border: none; color: white; padding: 6px 10px; cursor: pointer; font-size: 12px;
}
.vvb-toolbar__btn:hover { background: rgba(255,255,255,0.2); }

.vvb-drag-handle {
  position: absolute; top: 50%; left: 0; transform: translate(-100%, -50%);
  background: #6366f1; color: white; width: 16px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 4px 0 0 4px; cursor: grab; letter-spacing: -2px; line-height: 1; font-weight: bold;
}
</style>
