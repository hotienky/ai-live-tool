<template>
  <div class="vvb-live-canvas">
    <iframe
      v-if="url"
      ref="iframeRef"
      :src="iframeUrl"
      class="vvb-iframe"
      @load="onIframeLoad"
    ></iframe>
    <div v-else class="vvb-canvas-empty">
      <p>Chưa khai báo Storefront URL.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useBuilderState } from '../core/state.js'

const props = defineProps({
  url: { type: String, required: true }
})

const { state, selectSection } = useBuilderState()
const iframeRef = ref(null)

// Append ?preview=true to trigger the builder overlay in the frontend app
const iframeUrl = ref('')
watch(() => props.url, (val) => {
  if (!val) return
  const u = new URL(val)
  u.searchParams.set('preview', 'true')
  iframeUrl.value = u.toString()
}, { immediate: true })

let isReady = false

function sendToIframe(type, payload) {
  if (!iframeRef.value?.contentWindow) return
  iframeRef.value.contentWindow.postMessage({ type, payload, source: 'vue-visual-builder' }, '*')
}

function handleIframeMessage(event) {
  const { type, payload } = event.data || {}
  
  if (!type || !type.startsWith('builder:')) return 

  if (type === 'builder:ready') {
    isReady = true
    sendToIframe('builder:init', {})
    syncDataToIframe()
  } else if (type === 'builder:section-selected') {
    if (payload.id) {
      selectSection(payload.id)
    } else {
      const target = state.sections[payload.index]
      if (target) {
        selectSection(target.id || payload.index)
      }
    }
  } else if (type === 'builder:section-reorder') {
    const { fromIndex, toIndex } = payload
    const moved = state.sections.splice(fromIndex, 1)[0]
    state.sections.splice(toIndex, 0, moved)
    syncDataToIframe()
    // Need push history tracking here, ideally done in state.js
  }
}

function syncDataToIframe() {
  if (!isReady) return
  sendToIframe('layout-preview-update', {
    sections: state.sections,
    // Add other fields as required by the library implementation
  })
}

// Watch sections to trigger re-sync and UI update
watch(() => state.sections, () => {
  syncDataToIframe()
}, { deep: true })

onMounted(() => {
  window.addEventListener('message', handleIframeMessage)
})
onBeforeUnmount(() => {
  window.removeEventListener('message', handleIframeMessage)
})

function onIframeLoad() {
  // Just in case builder:ready wasn't handled properly
  sendToIframe('builder:init', {})
}
</script>

<style scoped>
.vvb-live-canvas {
  width: 100%;
  height: 100%;
  border: none;
  background: #e2e8f0;
}
.vvb-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
.vvb-canvas-empty {
  display: flex; align-items: center; justify-content: center; height: 100%; color: #64748b;
}
</style>
