<template>
  <div v-if="loading" class="resolver-loading">
    <div class="loader"></div>
  </div>
  
  <component 
    v-else-if="resolvedType" 
    :is="resolvedComponent" 
    v-bind="componentProps" 
    :key="route.fullPath"
  />

  <div v-else class="resolver-404 container">
    <FileQuestion :size="64" />
    <h2>{{ t('storefront.page_not_found') || 'Trang không tồn tại' }}</h2>
    <p>{{ t('storefront.page_not_found_desc') || 'Rất tiếc, đường dẫn bạn đang truy cập không tồn tại hoặc đã bị xoá.' }}</p>
    <router-link to="/" class="btn btn--primary">
      <ArrowLeft :size="16" /> {{ t('storefront.back_home') || 'Về trang chủ' }}
    </router-link>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, defineAsyncComponent, computed } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from '../api.js'
import { FileQuestion, ArrowLeft } from 'lucide-vue-next'
import { useI18n } from '../composables/useI18n.js'

const { t } = useI18n()
const route = useRoute()
const loading = ref(true)
const resolvedType = ref(null)
const resolvedData = ref(null)

// Lazy load components to avoid circular dependencies and bundle bloat
const components = {
  page: defineAsyncComponent(() => import('./CmsPage.vue')),
  product: defineAsyncComponent(() => import('./ProductDetailPage.vue')),
  category: defineAsyncComponent(() => import('./ProductsPage.vue'))
}

const resolvedComponent = computed(() => {
  return components[resolvedType.value] || null
})

const componentProps = computed(() => {
  if (resolvedType.value === 'page') return { slug: resolvedData.value.alias }
  if (resolvedType.value === 'product') return { slug: resolvedData.value.slug }
  if (resolvedType.value === 'category') return { slug: resolvedData.value.slug }
  return {}
})

async function resolveUrl() {
  loading.value = true
  resolvedType.value = null
  resolvedData.value = null
  
  try {
    const slug = Array.isArray(route.params.slug) ? route.params.slug.join('/') : (route.params.slug || '')
    if (!slug) {
      loading.value = false
      return
    }
    const res = await apiFetch(`/resolve-url?path=${slug}`)
    if (res && res.type) {
      resolvedType.value = res.type
      resolvedData.value = res.data
    }
  } catch (e) {
    console.error('[UrlResolver] Path not found:', e)
  }
  
  loading.value = false
}

onMounted(() => resolveUrl())
watch(() => route.fullPath, () => resolveUrl())
</script>

<style scoped>
.resolver-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 50vh;
}
.loader {
  border: 4px solid var(--sf-border);
  border-top-color: var(--sf-accent);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}
@keyframes spin { 100% { transform: rotate(360deg); } }

.resolver-404 {
  display: flex; flex-direction: column; align-items: center; gap: 16px;
  padding: 100px 20px; color: var(--sf-text-muted); text-align: center;
}
.resolver-404 h2 { color: var(--sf-text-primary); margin: 0; }
.resolver-404 a { text-decoration: none; margin-top: 16px; }
</style>
