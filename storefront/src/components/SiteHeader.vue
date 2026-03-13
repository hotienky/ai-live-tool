<template>
  <header class="site-header">
    <div class="site-header__inner container">
      <!-- Logo -->
      <router-link :to="'/'" class="site-header__logo">
        <Store :size="22" />
        <span class="site-header__name">{{ storeName || 'Shop' }}</span>
      </router-link>

      <!-- Navigation -->
      <nav class="site-header__nav">
        <router-link :to="'/'" class="site-header__link" exact-active-class="active">
          <Home :size="16" /> Trang chủ
        </router-link>
        <router-link :to="'/products'" class="site-header__link" active-class="active">
          <ShoppingBag :size="16" /> Sản phẩm
        </router-link>
        <router-link :to="'/cart'" class="site-header__link site-header__cart" active-class="active">
          <ShoppingCart :size="16" />
          <span v-if="cartCount > 0" class="cart-badge">{{ cartCount }}</span>
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

      <!-- Auth Link (right side) -->
      <router-link v-if="isLoggedIn" :to="'/account'" class="site-header__auth-btn">
        <User :size="16" />
        <span>Tài khoản</span>
      </router-link>
      <router-link v-else :to="'/auth'" class="site-header__auth-btn">
        <User :size="16" />
        <span>Đăng nhập</span>
      </router-link>

      <!-- Language Switcher -->
      <div class="lang-switcher" v-if="i18nLanguages.length > 1">
        <button class="lang-switcher__btn" @click="langOpen = !langOpen">
          <Globe :size="14" />
          <span>{{ currentLang.toUpperCase() }}</span>
        </button>
        <div v-if="langOpen" class="lang-switcher__dropdown">
          <button
            v-for="lang in i18nLanguages" :key="lang.code"
            class="lang-switcher__item"
            :class="{ active: lang.code === currentLang }"
            @click="switchLang(lang.code)"
          >
            <span v-if="lang.icon" class="lang-icon">{{ lang.icon }}</span>
            {{ lang.name }}
          </button>
        </div>
      </div>

      <!-- Theme Toggle -->
      <button class="theme-toggle" @click="toggleTheme" :title="isDark ? 'Chế độ sáng' : 'Chế độ tối'">
        <Sun v-if="isDark" :size="16" />
        <Moon v-else :size="16" />
      </button>

      <!-- Mobile menu toggle -->
      <button class="site-header__menu-btn" @click="mobileMenu = !mobileMenu">
        <Menu v-if="!mobileMenu" :size="22" />
        <X v-else :size="22" />
      </button>
    </div>

    <!-- Mobile menu -->
    <transition name="slide">
      <div v-if="mobileMenu" class="site-header__mobile">
        <router-link :to="'/'" class="site-header__mobile-link" @click="mobileMenu = false">
          <Home :size="16" /> Trang chủ
        </router-link>
        <router-link :to="'/products'" class="site-header__mobile-link" @click="mobileMenu = false">
          <ShoppingBag :size="16" /> Sản phẩm
        </router-link>
        <router-link :to="'/cart'" class="site-header__mobile-link" @click="mobileMenu = false">
          <ShoppingCart :size="16" /> Giỏ hàng
          <span v-if="cartCount > 0" class="cart-badge cart-badge--mobile">{{ cartCount }}</span>
        </router-link>
        <router-link v-if="isLoggedIn" :to="'/account'" class="site-header__mobile-link" @click="mobileMenu = false">
          <User :size="16" /> Tài khoản
        </router-link>
        <router-link v-else :to="'/auth'" class="site-header__mobile-link" @click="mobileMenu = false">
          <User :size="16" /> Đăng nhập
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Store, Home, ShoppingBag, ShoppingCart, Search, X, Menu, Globe, Sun, Moon, User } from 'lucide-vue-next'
import { useCart } from '../composables/useCart.js'
import { useI18n } from '../composables/useI18n.js'
import { useTheme } from '../composables/useTheme.js'
import { useAuth } from '../composables/useAuth.js'

const { cartCount } = useCart()
const { t, currentLang, languages: i18nLanguages, setLang, init: initI18n } = useI18n()
const { isDark, toggleTheme } = useTheme()
const { isLoggedIn } = useAuth()

const langOpen = ref(false)
async function switchLang(code) {
  await setLang(code)
  langOpen.value = false
}
onMounted(() => initI18n())

const props = defineProps({
  storeName: { type: String, default: '' },
  
})

const router = useRouter()
const searchQuery = ref('')
const searchFocused = ref(false)
const mobileMenu = ref(false)

function onSearch() {
  if (searchQuery.value.trim()) {
    router.push({ name: 'products', query: { q: searchQuery.value } })
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
  background: var(--sf-header-bg);
  backdrop-filter: blur(20px) saturate(180%);
  border-bottom: 1px solid var(--sf-border);
  transition: background-color 0.3s ease;
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
  background: var(--sf-bg-card-hover);
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
  background: var(--sf-input-bg);
  border: 1px solid var(--sf-border);
  transition: all var(--sf-transition);
}

.site-header__search.focused {
  border-color: var(--sf-accent);
  background: var(--sf-accent-glow);
  box-shadow: 0 0 0 3px var(--sf-accent-glow);
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
  background: var(--sf-bg-card-hover);
  color: var(--sf-text-primary);
}

.site-header__mobile-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-input-bg);
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

/* Auth Button (right side) */
.site-header__auth-btn {
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; font-weight: 600;
  color: var(--sf-text-primary);
  text-decoration: none;
  padding: 6px 14px;
  border-radius: 20px;
  border: 1px solid var(--sf-border);
  background: var(--sf-bg-card);
  transition: all 0.2s;
  white-space: nowrap;
}
.site-header__auth-btn:hover {
  border-color: var(--sf-accent, #7c3aed);
  color: var(--sf-accent, #7c3aed);
  background: rgba(124, 58, 237, 0.06);
}

@media (max-width: 768px) {
  .site-header__nav { display: none; }
  .site-header__search { display: none; }
  .site-header__auth-btn { display: none; }
  .site-header__menu-btn { display: flex; }
}
</style>
<!-- Extra cart styles -->
<style scoped>
.site-header__cart { position: relative; }
.cart-badge {
  position: absolute; top: 2px; right: 2px;
  min-width: 18px; height: 18px; line-height: 18px;
  border-radius: 9px; background: linear-gradient(135deg, #ef4444, #dc2626);
  color: #fff; font-size: 10px; font-weight: 800; text-align: center;
  padding: 0 4px;
}
.cart-badge--mobile {
  position: static; margin-left: auto;
  min-width: 22px; height: 22px; line-height: 22px;
  font-size: 11px;
}

/* Language Switcher */
.lang-switcher { position: relative; margin-left: 8px; }
.lang-switcher__btn {
  display: flex; align-items: center; gap: 5px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: 8px; padding: 6px 12px; cursor: pointer;
  color: var(--sf-text-secondary); font-size: 12px; font-weight: 700;
  transition: all 0.2s;
}
.lang-switcher__btn:hover { background: var(--sf-bg-card-hover); color: var(--sf-text-primary); }
.lang-switcher__dropdown {
  position: absolute; top: calc(100% + 6px); right: 0; z-index: 100;
  min-width: 160px; padding: 6px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  border-radius: 10px; box-shadow: var(--sf-shadow-md);
}
.lang-switcher__item {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 8px 12px; border: none; border-radius: 6px;
  background: none; color: var(--sf-text-secondary);
  font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
}
.lang-switcher__item:hover { background: var(--sf-bg-card-hover); color: var(--sf-text-primary); }
.lang-switcher__item.active { color: var(--sf-accent, #a78bfa); font-weight: 700; }
.lang-icon { font-size: 16px; }

/* Theme Toggle */
.theme-toggle {
  display: flex; align-items: center; justify-content: center;
  width: 36px; height: 36px; border-radius: 8px; margin-left: 6px;
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  color: var(--sf-text-secondary); cursor: pointer; transition: all 0.25s;
}
.theme-toggle:hover {
  color: var(--sf-accent-light, #f59e0b);
  background: var(--sf-bg-card-hover);
  transform: rotate(15deg);
}
</style>

