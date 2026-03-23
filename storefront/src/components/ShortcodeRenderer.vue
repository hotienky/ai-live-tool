<template>
  <div class="shortcode-renderer">
    <template v-for="(block, idx) in parsedBlocks" :key="idx">
      <div v-if="block.type === 'html'" v-html="block.content"></div>
      
      <component 
        v-else-if="block.type === 'shortcode' && getComponent(block.tag)"
        :is="getComponent(block.tag)"
        v-bind="block.attributes"
      />
      
      <!-- Fallback if component is not registered -->
      <div v-else-if="block.type === 'shortcode'" class="shortcode-unsupported" style="padding:10px; border:1px dashed #ccc; background:#f9f9f9; color:#666; font-size:13px; margin: 10px 0;">
         [Plugin <strong>{{ block.tag }}</strong> chưa được hỗ trợ trên Storefront]
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useSanitize } from '../composables/useSanitize.js'
import FormRenderer from './FormRenderer.vue'
import LuckyDrawPlugin from './plugins/LuckyDrawPlugin.vue'

const props = defineProps({
  html: {
    type: String,
    default: ''
  }
})

const { sanitize } = useSanitize()

// Core registry for native components compiled into storefront
const BUILTIN_SHORTCODES = {
  'form': FormRenderer,
  'lucky-draw': LuckyDrawPlugin,
}

function getComponent(tag) {
  // 1. Check built-in natively compiled components
  if (BUILTIN_SHORTCODES[tag]) return BUILTIN_SHORTCODES[tag]
  // 2. Check global registry for dynamically injected plugin components
  if (window.__STOREFRONT_SHORTCODES__ && window.__STOREFRONT_SHORTCODES__[tag]) {
    return window.__STOREFRONT_SHORTCODES__[tag]
  }
  return null
}

const parsedBlocks = computed(() => {
  if (!props.html) return []
  
  const blocks = []
  const htmlStr = props.html
  let lastIndex = 0
  
  // Require tag name starting with a letter + at least one attribute (prevents matching [1], [text], etc.)
  const regex = /\[([a-zA-Z][a-zA-Z0-9_-]*)\s+([^\]]+)\]/g
  let match
  
  while ((match = regex.exec(htmlStr)) !== null) {
    const tag = match[1]
    const attrString = match[2]
    
    // Only parse as shortcode if the tag is registered
    if (!getComponent(tag)) {
      continue // skip unknown tags, leave them as original text
    }
    
    if (match.index > lastIndex) {
      blocks.push({
        type: 'html',
        content: sanitize(htmlStr.substring(lastIndex, match.index))
      })
    }
    
    const attributes = {}
    
    // Parse attributes like slug="contact-us" id="123"
    const attrRegex = /([a-zA-Z0-9_-]+)=["']([^"']*)["']/g
    let attrMatch
    while ((attrMatch = attrRegex.exec(attrString)) !== null) {
      attributes[attrMatch[1]] = attrMatch[2]
    }
    
    blocks.push({
      type: 'shortcode',
      tag: tag,
      attributes: attributes
    })
    
    lastIndex = regex.lastIndex
  }
  
  if (lastIndex < htmlStr.length) {
    blocks.push({
      type: 'html',
      content: sanitize(htmlStr.substring(lastIndex))
    })
  }
  
  return blocks
})
</script>

<style scoped>
.shortcode-renderer { width: 100%; }
.shortcode-renderer :deep(p:first-child) { margin-top: 0; }
.shortcode-renderer :deep(p:last-child) { margin-bottom: 0; }
</style>
