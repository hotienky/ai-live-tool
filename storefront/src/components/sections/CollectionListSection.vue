<template>
  <div class="sf-collection-list-section">
    <div v-if="loading" class="collection-loading">
      <span class="spinner"></span> Đang tải...
    </div>
    
    <div v-else-if="error" class="collection-error">
      Lỗi tải dữ liệu: {{ error }}
    </div>

    <div v-else-if="items.length === 0" class="collection-empty">
      Chưa có dữ liệu cho phần này.
    </div>

    <div v-else :class="['collection-container', layoutClass]" :style="gridStyle">
      <div 
        v-for="(item, index) in items" 
        :key="item.id || index" 
        class="collection-item"
        v-html="renderItem(item)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'

const props = defineProps({
  params: Object,
  content: [Object, Array, String],
  section: Object
})

const items = ref([])
const loading = ref(false)
const error = ref(null)

const layoutClass = computed(() => {
  return props.params?.listLayout === 'grid' ? 'is-grid' : 'is-list'
})

const gridStyle = computed(() => {
  if (props.params?.listLayout === 'grid') {
    return {
      gridTemplateColumns: `repeat(${props.params?.columns || 3}, 1fr)`
    }
  }
  return {}
})

async function fetchData() {
  const typeKey = props.params?.contentType
  if (!typeKey) {
    error.value = "Chưa cấu hình Data Source (contentType)"
    return
  }

  loading.value = true
  error.value = null

  try {
    const url = new URL(`/api/storefront/content/${typeKey}`, window.location.origin)
    if (props.params?.limit) url.searchParams.append('limit', props.params.limit)
    if (props.params?.sort) url.searchParams.append('sort', props.params.sort)
    if (props.params?.order) url.searchParams.append('order', props.params.order)
    
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const data = await res.json()
    // ContentController indexStorefront returns successResponse which has { status: 'success', data: { data: [...] } }
    if (data.status === 'success' && data.data && Array.isArray(data.data.data)) {
      items.value = data.data.data
    } else if (data.data && Array.isArray(data.data)) {
      items.value = data.data
    } else {
      items.value = []
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function renderItem(item) {
  const templateStr = props.params?.itemTemplate || '<div class="p-4 border rounded shadow-sm"><h3>{{ item.title }}</h3></div>'
  
  // Custom interpolation logic. Same as SectionRenderer.
  return templateStr.replace(/\{\{\s*([a-zA-Z0-9_\.]+)\s*\}\}/g, (match, path) => {
    let val = { item: item };
    let fallback = false;
    const keys = path.split('.');
    for (const k of keys) {
      if (val == null) {
        fallback = true;
        break;
      }
      val = val[k];
    }
    return (!fallback && val !== undefined && val !== null) ? String(val) : '';
  });
}

onMounted(() => {
  fetchData()
})

watch(() => props.params?.contentType, () => {
  fetchData()
})
watch(() => props.params?.limit, () => {
  fetchData()
})
watch(() => props.params?.sort, () => {
  fetchData()
})
</script>

<style scoped>
.sf-collection-list-section {
  padding: 20px 0;
}
.collection-loading {
  text-align: center;
  padding: 40px;
  color: #666;
}
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.collection-error {
  color: #ef4444;
  padding: 20px;
  background: #fee2e2;
  border-radius: 8px;
}
.collection-empty {
  text-align: center;
  color: #999;
  padding: 40px;
}

.collection-container.is-grid {
  display: grid;
  gap: 24px;
}
.collection-container.is-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.collection-item {
  width: 100%;
}
</style>
