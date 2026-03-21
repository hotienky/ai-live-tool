// usePluginLoader — Dynamic plugin loading via fetch+eval
import { ref, reactive, markRaw } from 'vue'
import * as Vue from 'vue'
import * as LucideVueNext from 'lucide-vue-next'
import { apiFetch, API_BASE } from './useApi.js'
import { useToast } from './useToast.js'
import { useI18n } from './useI18n.js'
import { useContentTranslations } from './useContentTranslations.js'
import { useLanguages } from './useLanguages.js'
import { useShopCustomers } from './useShopCustomers.js'
import { useUrlParam } from './useUrlFilter.js'
import { useSocket } from './useSocket.js'
import { logger } from '../utils/logger.js'
import { hooks } from '../core/hooks.js'
// Shared components — exposed via bridge so plugins can import them
import MediaPicker from '../components/MediaPicker.vue'
import LanguageTabs from '../components/LanguageTabs.vue'
import CurrencyInput from '../components/CurrencyInput.vue'

// ── Set globals immediately at module scope ──
window.Vue = Vue
window.LucideVueNext = LucideVueNext
window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__APP_HOOKS__ = hooks

const loadedPlugins = reactive({})
const pluginComponents = reactive({})
const pluginSidebar = reactive({})
const loadingPlugin = ref(null)
const pluginVersion = ref(0) // Reactive counter — increments after each plugin load
// Track hook IDs per plugin for cleanup
const pluginHookIds = reactive({})

function initBridge() {
  const { showToast } = useToast()
  const { t, currentLang, formatCurrency, currencyLocale, currencySymbol } = useI18n()
  window.__APP_BRIDGE__ = {
    // ── Core utilities ──
    apiFetch,
    API_BASE,
    showToast,
    logger,
    // ── i18n ──
    t,
    currentLang,
    formatCurrency,
    currencyLocale,
    currencySymbol,
    // ── Composables (for plugin components) ──
    useContentTranslations,
    useLanguages,
    useShopCustomers,
    useUrlParam,
    useSocket,
    // ── Shared Components (for plugin components to import) ──
    components: {
      MediaPicker: markRaw(MediaPicker),
      LanguageTabs: markRaw(LanguageTabs),
      CurrencyInput: markRaw(CurrencyInput),
    },
    // ── Hooks System ──
    hooks,
  }
}

// Load a plugin bundle dynamically via fetch + eval (no script tag race conditions)
async function loadPlugin(moduleId) {
  if (loadedPlugins[moduleId]) return loadedPlugins[moduleId]

  loadingPlugin.value = moduleId

  try {
    // Load CSS via apiFetch (auth required) + inject as inline style
    if (!document.getElementById(`plugin-css-${moduleId}`)) {
      try {
        const cssRes = await apiFetch(`/modules/${moduleId}/style.css?v=${Date.now()}`)
        if (cssRes.ok) {
          const cssText = await cssRes.text()
          const style = document.createElement('style')
          style.id = `plugin-css-${moduleId}`
          style.textContent = cssText
          document.head.appendChild(style)
        }
      } catch (_) { /* CSS optional */ }
    }

    // Fetch JS bundle as text (use apiFetch for auth token)
    const v = Date.now()
    const res = await apiFetch(`/modules/${moduleId}/bundle.js?v=${v}`)
    if (!res.ok) {
      // 404 = backend-only module with no frontend bundle — skip silently
      if (res.status === 404) return null
      throw new Error(`HTTP ${res.status} loading plugin ${moduleId}`)
    }
    const code = await res.text()

    // Ensure globals before execution
    window.Vue = window.Vue || Vue
    window.LucideVueNext = window.LucideVueNext || LucideVueNext
    window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}

    // Track hook registrations by capturing counter before/after
    const hookIdBefore = hooks._idCounter

    // Execute the IIFE bundle
    try {
      new Function(code)()
    } catch (evalError) {
      console.error(`[PluginLoader] Error executing ${moduleId} bundle:`, evalError)
      throw new Error(`Plugin ${moduleId} có lỗi code: ${evalError.message}`)
    }

    // Record hook IDs registered by this plugin (for cleanup on unload)
    const hookIdAfter = hooks._idCounter
    if (hookIdAfter > hookIdBefore) {
      pluginHookIds[moduleId] = Array.from(
        { length: hookIdAfter - hookIdBefore },
        (_, i) => hookIdBefore + i + 1
      )
    }

    // Check registration
    const plugin = window.__PLUGIN_REGISTRY__[moduleId]
    if (!plugin) {
      throw new Error(`Plugin ${moduleId} loaded nhưng không đăng ký được`)
    }

    // Mark components as raw (prevent Vue reactivity wrapping)
    if (plugin.components) {
      for (const [key, comp] of Object.entries(plugin.components)) {
        pluginComponents[`${moduleId}:${key}`] = markRaw(comp)
      }
    }

    if (plugin.sidebar) {
      pluginSidebar[moduleId] = plugin.sidebar
    }

    loadedPlugins[moduleId] = plugin

    // Fire module_activated action
    hooks.doActionSync('module_activated', moduleId)

    // Increment reactive counter to trigger re-render of computed that depend on hook results
    pluginVersion.value++

    return plugin
  } catch (e) {
    console.error(`[PluginLoader] Error loading ${moduleId}:`, e)
    throw e
  } finally {
    loadingPlugin.value = null
  }
}

function unloadPlugin(moduleId) {
  // Remove CSS
  const css = document.getElementById(`plugin-css-${moduleId}`)
  if (css) css.remove()

  // Cleanup all hooks registered by this plugin
  if (pluginHookIds[moduleId]) {
    hooks.removeByIds(pluginHookIds[moduleId])
    delete pluginHookIds[moduleId]
  }

  delete loadedPlugins[moduleId]
  delete pluginSidebar[moduleId]
  for (const key of Object.keys(pluginComponents)) {
    if (key.startsWith(`${moduleId}:`)) delete pluginComponents[key]
  }
  if (window.__PLUGIN_REGISTRY__) {
    delete window.__PLUGIN_REGISTRY__[moduleId]
  }
}

function getPluginComponent(moduleId, tabKey) {
  return pluginComponents[`${moduleId}:${tabKey}`] || null
}

export function usePluginLoader() {
  return {
    loadedPlugins, pluginComponents, pluginSidebar, loadingPlugin, pluginVersion,
    initBridge, loadPlugin, unloadPlugin, getPluginComponent, hooks,
  }
}

