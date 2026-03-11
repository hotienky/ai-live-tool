<template>
  <div class="storefront-app">
    <SiteHeader :storeName="storeInfo?.shop_name" :storeId="currentStoreId" />
    <main class="storefront-main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <SiteFooter :storeName="storeInfo?.shop_name" />
  </div>
</template>

<script setup>
import { ref, watch, provide } from 'vue'
import { useRoute } from 'vue-router'
import { apiFetch } from './api.js'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'

const route = useRoute()
const storeInfo = ref(null)
const currentStoreId = ref(route.params.storeId || '1')

async function loadStoreInfo() {
  try {
    storeInfo.value = await apiFetch(currentStoreId.value, '/info')
    if (storeInfo.value?.shop_name) {
      document.title = `${storeInfo.value.shop_name} — Cửa hàng trực tuyến`
    }
  } catch { /* ignore */ }
}

watch(() => route.params.storeId, (id) => {
  if (id) {
    currentStoreId.value = id
    loadStoreInfo()
  }
}, { immediate: true })

// Provide store info globally
provide('storeInfo', storeInfo)
provide('storeId', currentStoreId)
</script>

<style scoped>
.storefront-app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.storefront-main {
  flex: 1;
  padding-top: var(--sf-header-height);
}
</style>
