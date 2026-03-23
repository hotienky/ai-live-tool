<template>
  <div v-if="loading" class="pbr-loading">
    <div class="skeleton" style="height:220px" v-for="n in 4" :key="n"></div>
  </div>
  <div v-else-if="items.length" class="pbr-grid" :class="`pbr-grid--${settings?.layout || 'grid'}`">
    <ProductCard v-for="p in items" :key="p.id" :product="p" />
  </div>
  <p v-else class="pbr-empty">Không có sản phẩm</p>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../../api.js'
import ProductCard from '../ProductCard.vue'

const props = defineProps({
  settings: { type: Object, default: () => ({}) },
})

const items = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const params = { limit: props.settings?.limit || 8 }
    if (props.settings?.category_id) params.category_id = props.settings.category_id
    if (props.settings?.brand_id) params.brand_id = props.settings.brand_id

    const sortMap = { newest: 'created_at', popular: 'sold_count', price_asc: 'price', price_desc: 'price' }
    params.sort = sortMap[props.settings?.sort] || 'created_at'
    params.order = props.settings?.sort === 'price_asc' ? 'asc' : 'desc'

    if (props.settings?.featured) params.featured = 1

    const res = await apiFetch('/products', params)
    items.value = Array.isArray(res) ? res : (res?.data || [])
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.settings, load, { deep: true })
</script>

<style scoped>
.pbr-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}
.pbr-grid--list { grid-template-columns: 1fr; }
.pbr-loading { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.pbr-empty { color: var(--sf-text-muted); text-align: center; padding: 24px; }

@media (max-width: 1024px) { .pbr-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 640px) { .pbr-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; } }
</style>
