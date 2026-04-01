<template>
  <div v-if="visible" class="command-overlay" @mousedown.self="close">
    <div class="command-modal">
      <div class="command-search-header">
        <Search :size="18" class="search-icon" />
        <input 
          ref="searchInput" 
          type="text" 
          v-model="query" 
          placeholder="Lệnh tìm kiếm nhanh (Ctrl + K)..." 
          class="command-input"
          @keydown.down.prevent="moveSelection(1)"
          @keydown.up.prevent="moveSelection(-1)"
          @keydown.enter.prevent="executeSelected"
          @keydown.esc.prevent="close"
        />
        <div class="shortcut-hint">Esc</div>
      </div>
      
      <div class="command-results" ref="resultsContainer">
        <template v-if="filteredCommands.length">
          <div 
            v-for="(cmd, index) in filteredCommands" 
            :key="cmd.id"
            class="command-item"
            :class="{ 'command-item--active': index === selectedIndex }"
            @click="execute(cmd)"
            @mouseenter="selectedIndex = index"
          >
            <div class="cmd-icon"><component :is="cmd.icon || Box" :size="16" /></div>
            <div class="cmd-details">
              <span class="cmd-title">{{ cmd.title }}</span>
              <span v-if="cmd.description" class="cmd-desc">{{ cmd.description }}</span>
            </div>
            <div v-if="cmd.shortcut" class="cmd-shortcut">{{ cmd.shortcut }}</div>
          </div>
        </template>
        <div v-else class="command-empty">
          Không tìm thấy lệnh nào phù hợp với "{{ query }}"
        </div>
      </div>
      
      <div class="command-footer">
        <span class="footer-hint"><span class="key">↑</span><span class="key">↓</span> Chọn</span>
        <span class="footer-hint"><span class="key">Enter</span> Thực thi</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Search, Box, LayoutDashboard, Monitor, Smartphone, Eye, Layout, Type, Image as ImageIcon, BoxSelect } from 'lucide-vue-next'

const props = defineProps({
  visible: Boolean,
  commands: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:visible', 'execute'])

const query = ref('')
const searchInput = ref(null)
const selectedIndex = ref(0)
const resultsContainer = ref(null)

const filteredCommands = computed(() => {
  if (!query.value) return props.commands
  const q = query.value.toLowerCase()
  return props.commands.filter(c => 
    c.title.toLowerCase().includes(q) || 
    (c.description && c.description.toLowerCase().includes(q)) ||
    (c.keywords && c.keywords.some(k => k.toLowerCase().includes(q)))
  ).slice(0, 10) // Limit to 10 results
})

watch(() => props.visible, async (val) => {
  if (val) {
    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    if (searchInput.value) searchInput.value.focus()
  }
})

watch(query, () => { selectedIndex.value = 0 })

function moveSelection(step) {
  const max = filteredCommands.value.length - 1
  if (max < 0) return
  let next = selectedIndex.value + step
  if (next < 0) next = max
  if (next > max) next = 0
  selectedIndex.value = next
  
  // scroll into view smoothly
  nextTick(() => {
    if (!resultsContainer.value) return
    const activeEl = resultsContainer.value.querySelector('.command-item--active')
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' })
    }
  })
}

function executeSelected() {
  if (filteredCommands.value.length > 0) {
    execute(filteredCommands.value[selectedIndex.value])
  }
}

function execute(cmd) {
  emit('execute', cmd)
  close()
}

function close() {
  emit('update:visible', false)
}

// Global Hotkey setup
function handleKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault()
    emit('update:visible', !props.visible)
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.command-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 10000;
  display: flex; justify-content: center; align-items: flex-start; padding-top: 15vh;
  backdrop-filter: blur(4px);
}
.command-modal {
  width: 100%; max-width: 600px; background: #fff; border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25); border: 1px solid var(--border);
  overflow: hidden; display: flex; flex-direction: column;
}
.command-search-header {
  display: flex; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.search-icon { color: var(--text-3); margin-right: 12px; }
.command-input {
  flex: 1; border: none; background: transparent; font-size: 16px; outline: none; color: var(--text-1);
}
.command-input::placeholder { color: var(--text-3); }
.shortcut-hint {
  font-size: 11px; font-weight: 600; color: var(--text-3); background: var(--bg-2);
  padding: 4px 8px; border-radius: 4px; border: 1px solid var(--border);
}
.command-results {
  max-height: 350px; overflow-y: auto; padding: 8px;
}
.command-empty {
  padding: 32px 20px; text-align: center; color: var(--text-3); font-size: 14px;
}
.command-item {
  display: flex; align-items: center; padding: 12px 16px; border-radius: 8px;
  cursor: pointer; gap: 12px; transition: 0.1s;
}
.command-item--active { background: rgba(124, 58, 237, 0.08); }
.cmd-icon {
  width: 32px; height: 32px; border-radius: 8px; background: var(--bg-1);
  display: flex; align-items: center; justify-content: center; color: var(--accent);
  box-shadow: 0 1px 2px rgba(0,0,0,0.05); border: 1px solid var(--border);
}
.cmd-details { flex: 1; display: flex; flex-direction: column; }
.cmd-title { font-size: 14px; font-weight: 600; color: var(--text-1); }
.cmd-desc { font-size: 12px; color: var(--text-3); }
.cmd-shortcut {
  font-size: 12px; font-weight: 600; color: var(--text-3); background: var(--bg-2);
  padding: 4px 8px; border-radius: 4px; letter-spacing: 0.5px;
}
.command-footer {
  display: flex; align-items: center; gap: 16px; padding: 12px 20px;
  background: var(--bg-1); border-top: 1px solid var(--border);
  font-size: 12px; color: var(--text-3);
}
.footer-hint { display: flex; align-items: center; gap: 6px; }
.key {
  background: #fff; padding: 2px 6px; border-radius: 4px; border: 1px solid var(--border);
  font-weight: 700; color: var(--text-2); box-shadow: 0 1px 1px rgba(0,0,0,0.05);
}
</style>
