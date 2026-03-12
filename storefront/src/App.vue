<template>
  <div class="storefront-app">
    <SiteHeader :storeName="storeInfo?.shop_name" />
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
import { ref, onMounted, provide } from 'vue'
import { apiFetch } from './api.js'
import SiteHeader from './components/SiteHeader.vue'
import SiteFooter from './components/SiteFooter.vue'
import { useTheme } from './composables/useTheme.js'
import { useI18n } from './composables/useI18n.js'

const { init: initTheme } = useTheme()
const { init: initI18n } = useI18n()

const storeInfo = ref(null)

async function loadStoreInfo() {
  try {
    storeInfo.value = await apiFetch('/info')
    if (storeInfo.value?.shop_name) {
      document.title = `${storeInfo.value.shop_name} — Cửa hàng trực tuyến`
    }
  } catch { /* ignore */ }
}

onMounted(async () => {
  await Promise.all([
    loadStoreInfo(),
    initTheme(),
    initI18n(),
  ])
})

// Provide store info globally
provide('storeInfo', storeInfo)
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
