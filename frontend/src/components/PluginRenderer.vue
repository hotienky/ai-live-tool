<template>
  <div class="plugin-renderer">
    <!-- Plugin loaded → render its component -->
    <component v-if="pluginComp" :is="pluginComp" @navigate="(route) => emit('navigate', route)" />

    <!-- Loading state -->
    <div v-else-if="isLoading" class="plugin-renderer__loading">
      <div class="plugin-renderer__spinner"></div>
      <p>{{ t('admin.msg_10762b73', 'Đang tải module') }} <strong>{{ moduleId }}</strong>...</p>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="plugin-renderer__error">
      <AlertCircle :size="32" />
      <p>{{ error }}</p>
      <button @click="retry" class="plugin-renderer__retry">{{ t('admin.msg_4dffdf1d', 'Thử lại') }}</button>
    </div>

    <!-- Not installed -->
    <div v-else class="plugin-renderer__empty">
      <Package :size="48" />
      <p>{{ t('admin.msg_845d0b59', 'Module chưa được cài đặt') }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, shallowRef } from 'vue'
import { usePluginLoader } from '../composables/usePluginLoader.js'
import { AlertCircle, Package } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t, formatCurrency } = useI18n()

const props = defineProps({
  moduleId: { type: String, required: true },
  tabKey: { type: String, required: true },
})
const emit = defineEmits(['navigate'])

const { loadPlugin, getPluginComponent } = usePluginLoader()

const pluginComp = shallowRef(null)
const isLoading = ref(false)
const error = ref(null)

async function loadComponent() {
  isLoading.value = true
  error.value = null
  pluginComp.value = null

  try {
    await loadPlugin(props.moduleId)
    const comp = getPluginComponent(props.moduleId, props.tabKey)
    if (comp) {
      pluginComp.value = comp
    } else {
      error.value = `Component "${props.tabKey}" không tìm thấy trong module "${props.moduleId}"`
    }
  } catch (e) {
    error.value = e.message || t('admin.msg_e27c9027', 'Lỗi tải module')
  } finally {
    isLoading.value = false
  }
}

function retry() {
  loadComponent()
}

onMounted(loadComponent)
watch(() => props.moduleId + ':' + props.tabKey, loadComponent)
</script>

<style scoped>
.plugin-renderer { min-height: 200px; }
.plugin-renderer__loading {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; padding: 80px 20px;
  color: var(--color-text-muted);
}
.plugin-renderer__spinner {
  width: 32px; height: 32px; border-radius: 50%;
  border: 3px solid var(--glass-border);
  border-top-color: var(--accent-light);
  animation: spin 0.8s linear infinite;
  margin-bottom: 16px;
}
@keyframes spin { to { transform: rotate(360deg); } }

.plugin-renderer__error {
  text-align: center; padding: 60px 20px; color: #f87171;
}
.plugin-renderer__error p { margin: 12px 0; }
.plugin-renderer__retry {
  padding: 8px 20px; border-radius: 8px; border: 1px solid #f87171;
  color: #f87171; background: transparent; cursor: pointer; font-weight: 600;
}
.plugin-renderer__retry:hover { background: rgba(248,113,113,0.08); }

.plugin-renderer__empty {
  text-align: center; padding: 80px 20px; color: var(--color-text-muted);
}
.plugin-renderer__empty p { margin-top: 12px; }
</style>
