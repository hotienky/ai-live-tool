<template>
  <div class="min-h-screen bg-surface-950 flex">
    <!-- Sidebar -->
    <aside class="w-64 glass border-r border-surface-700/30 flex flex-col fixed h-full z-10">
      <!-- Logo -->
      <div class="p-5 border-b border-surface-700/30">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
            <component :is="icons.Shield" :size="20" class="text-white" />
          </div>
          <div>
            <h1 class="text-sm font-bold text-white">Master Panel</h1>
            <p class="text-[10px] text-surface-400 uppercase tracking-wider">Multi-Tenant</p>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 p-3 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200"
          :class="$route.path === item.to
            ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20'
            : 'text-surface-300 hover:bg-surface-700/40 hover:text-white'"
        >
          <component :is="item.icon" :size="18" />
          {{ item.label }}
        </router-link>
      </nav>

      <!-- User -->
      <div class="p-3 border-t border-surface-700/30">
        <div class="flex items-center gap-3 px-3 py-2">
          <div class="w-8 h-8 rounded-full bg-primary-600/30 flex items-center justify-center text-primary-400 text-xs font-bold">
            {{ user?.name?.charAt(0) || 'A' }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ user?.name }}</p>
            <p class="text-xs text-surface-400 truncate">{{ user?.email }}</p>
          </div>
          <button @click="handleLogout" class="text-surface-400 hover:text-red-400 transition-colors">
            <component :is="icons.LogOut" :size="16" />
          </button>
        </div>
      </div>
    </aside>

    <!-- Main -->
    <main class="flex-1 ml-64 min-h-screen">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { LayoutDashboard, Building2, Shield, LogOut } from 'lucide-vue-next'
import { getStoredUser, logout } from '../services/api.js'

const icons = { LayoutDashboard, Building2, Shield, LogOut }
const user = computed(() => getStoredUser())

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tenants', label: 'Tenants', icon: Building2 },
]

function handleLogout() {
  logout()
}
</script>
