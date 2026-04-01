import { ref, computed, watch, toRaw } from 'vue'

/**
 * Undo/Redo history composable for the Page Builder.
 * Uses JSON deep-copy to avoid structuredClone issues with Vue proxies.
 *
 * @param {import('vue').Ref<Array>} source — reactive blocks array
 * @param {Object} opts
 * @param {number} opts.capacity — max history states (default 50)
 * @param {number} opts.debounce — ms debounce for auto-snapshot (default 800)
 */
export function useBuilderHistory(source, opts = {}) {
  const capacity = opts.capacity || 50
  const debounceMs = opts.debounce || 800

  // Deep-copy helper that strips Vue reactivity proxies first
  function deepCopy(val) {
    try {
      return JSON.parse(JSON.stringify(toRaw(val)))
    } catch {
      return []
    }
  }

  const history = ref([deepCopy(source.value)])
  const cursor = ref(0)
  const _skipWatch = ref(false)

  const canUndo = computed(() => cursor.value > 0)
  const canRedo = computed(() => cursor.value < history.value.length - 1)

  /** Push a snapshot manually (called after discrete actions) */
  function snapshot() {
    // Trim any redo states
    if (cursor.value < history.value.length - 1) {
      history.value = history.value.slice(0, cursor.value + 1)
    }
    const clone = deepCopy(source.value)
    history.value.push(clone)
    // Enforce capacity
    if (history.value.length > capacity) {
      history.value.shift()
    } else {
      cursor.value++
    }
  }

  function undo() {
    if (!canUndo.value) return
    cursor.value--
    _skipWatch.value = true
    source.value = deepCopy(history.value[cursor.value])
  }

  function redo() {
    if (!canRedo.value) return
    cursor.value++
    _skipWatch.value = true
    source.value = deepCopy(history.value[cursor.value])
  }

  // Auto-snapshot on deep changes (debounced for text typing)
  let timer = null
  watch(source, () => {
    if (_skipWatch.value) {
      _skipWatch.value = false
      return
    }
    clearTimeout(timer)
    timer = setTimeout(() => {
      snapshot()
    }, debounceMs)
  }, { deep: true })

  return { snapshot, undo, redo, canUndo, canRedo }
}
