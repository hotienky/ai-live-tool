<template>
  <div class="mp-layout flex">
    <!-- Mobile Overlay Backdrop -->
    <div 
      v-if="isSidebarOpen" 
      class="fixed inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm transition-opacity"
      @click="isSidebarOpen = false"
    ></div>

    <!-- Sidebar -->
    <aside 
      class="mp-sidebar fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-300 ease-in-out md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Logo -->
      <div class="mp-sidebar__brand">
        <div class="mp-sidebar__logo-icon">
          <component :is="icons.Shield" :size="20" />
        </div>
        <div>
          <h1 class="mp-sidebar__title">Master Panel</h1>
          <p class="mp-sidebar__subtitle">Multi-Tenant</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="mp-sidebar__nav">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="mp-sidebar__link"
          :class="{ 'mp-sidebar__link--active': $route.path === item.to }"
          @click="isSidebarOpen = false"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </router-link>
      </nav>

      <!-- Bottom: Theme Toggle + User -->
      <div class="mp-sidebar__footer">
        <button class="mp-theme-toggle" @click="toggleTheme" :title="isDark ? 'Chế độ sáng' : 'Chế độ tối'">
          <Sun v-if="isDark" :size="16" />
          <Moon v-else :size="16" />
          <span>{{ isDark ? 'Sáng' : 'Tối' }}</span>
        </button>
        <div class="mp-sidebar__user">
          <div class="mp-sidebar__avatar">{{ user?.name?.charAt(0) || 'A' }}</div>
          <div class="mp-sidebar__user-info">
            <p class="mp-sidebar__user-name">{{ user?.name }}</p>
            <p class="mp-sidebar__user-email">{{ user?.email }}</p>
          </div>
          <button @click="handleLogout" class="mp-sidebar__logout" title="Đăng xuất">
            <component :is="icons.LogOut" :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-h-screen md:ml-64 w-full transition-all duration-300">
      
      <!-- Mobile Header -->
      <header class="md:hidden flex items-center justify-between p-4 border-b border-[var(--mp-border)] bg-[var(--mp-bg-sidebar)] sticky top-0 z-10 backdrop-blur-md">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white">
            <component :is="icons.Shield" :size="16" />
          </div>
          <span class="font-bold text-[var(--mp-text-primary)]">Master Panel</span>
        </div>
        <button @click="isSidebarOpen = true" class="p-2 -mr-2 text-[var(--mp-text-secondary)] hover:bg-[var(--mp-nav-hover-bg)] rounded-lg transition-colors">
          <Menu :size="24" />
        </button>
      </header>

      <!-- Main Router View -->
      <main class="mp-main flex-1 relative overflow-x-hidden">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { LayoutDashboard, Building2, Shield, LogOut, Sun, Moon, Users, KeyRound, Menu } from 'lucide-vue-next'
import { getStoredUser, logout } from '../services/api.js'

const icons = { LayoutDashboard, Building2, Shield, LogOut, Users, KeyRound }
const user = computed(() => getStoredUser())
const isSidebarOpen = ref(false)

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/roles', label: 'Roles', icon: KeyRound },
]

const isDark = ref(true)

function applyTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode)
  localStorage.setItem('master-theme', mode)
}

function toggleTheme() {
  isDark.value = !isDark.value
  applyTheme(isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('master-theme') || 'dark'
  isDark.value = saved === 'dark'
  applyTheme(saved)
})

function handleLogout() {
  logout()
}
</script>

<style scoped>
.mp-layout {
  min-height: 100vh;
  display: flex;
  background: var(--mp-bg-primary);
}

/* ── Sidebar ── */
.mp-sidebar {
  /* width, fixed, and transforms handled via Tailwind classes in template */
  display: flex;
  flex-direction: column;
  background: var(--mp-bg-sidebar);
  border-right: 1px solid var(--mp-border);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s ease;
}

.mp-sidebar__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid var(--mp-border);
}

.mp-sidebar__logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: linear-gradient(135deg, #1a6df5, #0d52d9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.mp-sidebar__title {
  font-size: 14px;
  font-weight: 700;
  color: var(--mp-text-primary);
  margin: 0;
}

.mp-sidebar__subtitle {
  font-size: 10px;
  color: var(--mp-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
}

.mp-sidebar__nav {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mp-sidebar__link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--mp-text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid transparent;
}
.mp-sidebar__link:hover {
  background: var(--mp-nav-hover-bg);
  color: var(--mp-text-primary);
}
.mp-sidebar__link--active {
  background: var(--mp-nav-active-bg);
  color: var(--mp-nav-active-text);
  border-color: var(--mp-nav-active-border);
  font-weight: 600;
}

/* ── Sidebar Footer ── */
.mp-sidebar__footer {
  border-top: 1px solid var(--mp-border);
  padding: 8px 12px 12px;
}

.mp-theme-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 8px;
  background: var(--mp-bg-input);
  border: 1px solid var(--mp-border);
  color: var(--mp-text-secondary);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.mp-theme-toggle:hover {
  background: var(--mp-nav-hover-bg);
  color: var(--mp-text-primary);
}

.mp-sidebar__user {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
}

.mp-sidebar__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--mp-avatar-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--mp-avatar-text);
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.mp-sidebar__user-info {
  flex: 1;
  min-width: 0;
}

.mp-sidebar__user-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--mp-text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-sidebar__user-email {
  font-size: 11px;
  color: var(--mp-text-muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mp-sidebar__logout {
  background: none;
  border: none;
  color: var(--mp-text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}
.mp-sidebar__logout:hover {
  color: #ef4444;
}

/* ── Main ── */
.mp-main {
  /* Layout logic shifted to Tailwind grid/flex in template */
  width: 100%;
}
</style>
