<template>
  <header class="site-header">
    <div class="site-header__inner container">
      <!-- Logo -->
      <router-link :to="`/${storeId}`" class="site-header__logo">
        <Store :size="22" />
        <span class="site-header__name">{{ storeName || 'Shop' }}</span>
      </router-link>

      <!-- Navigation -->
      <nav class="site-header__nav">
        <router-link :to="`/${storeId}`" class="site-header__link" exact-active-class="active">
          <Home :size="16" /> Trang chủ
        </router-link>
        <router-link :to="`/${storeId}/products`" class="site-header__link" active-class="active">
          <ShoppingBag :size="16" /> Sản phẩm
        </router-link>
      </nav>

      <!-- Search -->
      <div class="site-header__search" :class="{ focused: searchFocused }">
        <Search :size="16" class="site-header__search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Tìm kiếm sản phẩm..."
          @focus="searchFocused = true"
          @blur="searchFocused = false"
          @keyup.enter="onSearch"
        />
        <button v-if="searchQuery" class="site-header__search-clear" @click="searchQuery = ''">
          <X :size="14" />
        </button>
      </div>

      <!-- Mobile menu toggle -->
      <button class="site-header__menu-btn" @click="mobileMenu = !mobileMenu">
        <Menu v-if="!mobileMenu" :size="22" />
        <X v-else :size="22" />
      </button>
    </div>

    <!-- Mobile menu -->
    <transition name="slide">
      <div v-if="mobileMenu" class="site-header__mobile">
        <router-link :to="`/${storeId}`" class="site-header__mobile-link" @click="mobileMenu = false">
          <Home :size="16" /> Trang chủ
        </router-link>
        <router-link :to="`/${storeId}/products`" class="site-header__mobile-link" @click="mobileMenu = false">
          <ShoppingBag :size="16" /> Sản phẩm
        </router-link>
        <div class="site-header__mobile-search">
          <Search :size="16" />
          <input v-model="searchQuery" placeholder="Tìm kiếm..." @keyup.enter="onSearch; mobileMenu = false" />
        </div>
      </div>
    </transition>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Home, ShoppingBag, Search, X, Menu } from 'lucide-vue-next'

const props = defineProps({
  storeName: { type: String, default: '' },
  storeId: { type: [String, Number], default: '1' },
})

const router = useRouter()
const searchQuery = ref('')
const searchFocused = ref(false)
const mobileMenu = ref(false)

function onSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'products', params: { storeId: props.storeId }, query: { q: searchQuery.value } })
    mobileMenu.value = false
  }
}
</script>

<style scoped>
.site-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  height: var(--sf-header-height);
  background: rgba(10, 10, 15, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--sf-border);
}

.site-header__inner {
  display: flex;
  align-items: center;
  gap: 24px;
  height: 100%;
}

.site-header__logo {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  flex-shrink: 0;
}

.site-header__logo svg {
  color: var(--sf-accent-light);
}

.site-header__name {
  font-size: 18px;
  font-weight: 800;
  background: var(--sf-accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.site-header__nav {
  display: flex;
  gap: 4px;
}

.site-header__link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: var(--sf-radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-secondary);
  transition: all var(--sf-transition);
  text-decoration: none;
}

.site-header__link:hover {
  color: var(--sf-text-primary);
  background: rgba(255, 255, 255, 0.05);
}

.site-header__link.active {
  color: var(--sf-accent-light);
  background: var(--sf-accent-glow);
}

.site-header__search {
  flex: 1;
  max-width: 400px;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: 100px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--sf-border);
  transition: all var(--sf-transition);
}

.site-header__search.focused {
  border-color: var(--sf-accent);
  background: rgba(124, 58, 237, 0.08);
  box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
}

.site-header__search-icon {
  color: var(--sf-text-muted);
  flex-shrink: 0;
}

.site-header__search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--sf-text-primary);
  font-size: 13px;
}

.site-header__search input::placeholder {
  color: var(--sf-text-muted);
}

.site-header__search-clear {
  display: flex;
  background: none;
  border: none;
  color: var(--sf-text-muted);
  padding: 2px;
  cursor: pointer;
}

.site-header__menu-btn {
  display: none;
  background: none;
  border: 1px solid var(--sf-border);
  border-radius: var(--sf-radius-sm);
  padding: 6px;
  color: var(--sf-text-secondary);
}

.site-header__mobile {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--sf-bg-secondary);
  border-bottom: 1px solid var(--sf-border);
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-header__mobile-link {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: var(--sf-radius-sm);
  color: var(--sf-text-secondary);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
}

.site-header__mobile-link:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--sf-text-primary);
}

.site-header__mobile-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--sf-radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--sf-border);
  color: var(--sf-text-muted);
}

.site-header__mobile-search input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  color: var(--sf-text-primary);
  font-size: 14px;
}

.slide-enter-active { animation: slideDown 0.3s ease; }
.slide-leave-active { animation: slideDown 0.2s ease reverse; }
@keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }

@media (max-width: 768px) {
  .site-header__nav { display: none; }
  .site-header__search { display: none; }
  .site-header__menu-btn { display: flex; }
}
</style>
