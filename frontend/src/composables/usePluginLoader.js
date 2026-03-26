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
import RichTextEditor from '../components/RichTextEditor.vue'

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
      RichTextEditor: markRaw(RichTextEditor),
    },
    // ── Hooks System ──
    hooks,
    // ── Plugin Registration (for plugins that use bridge.registerPlugin) ──
    registerPlugin: (moduleId, plugin) => {
      window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
      window.__PLUGIN_REGISTRY__[moduleId] = plugin
    },
  }
}

import { STATIC_PLUGINS } from '../pluginRegistry.js'

async function loadPlugin(moduleId) {
  if (loadedPlugins[moduleId]) return loadedPlugins[moduleId]

  loadingPlugin.value = moduleId

  try {
    // Check registration
    const plugin = Object.assign({}, STATIC_PLUGINS[moduleId])
    if (!plugin || Object.keys(plugin).length === 0) {
      if (moduleId === 'cms') return null // some plugins may not exist in frontend bundle
      return null
    }

    // Assign to registry
    window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
    window.__PLUGIN_REGISTRY__[moduleId] = plugin

    // Ensure globals
    window.Vue = window.Vue || Vue
    window.LucideVueNext = window.LucideVueNext || LucideVueNext

    // Track hook registrations by capturing counter before/after
    const hookIdBefore = hooks._idCounter

    // Execute the hook registration logic
    if (plugin.initHooks) {
      plugin.initHooks()
    }

    // Call any extra initialization if present in the plugin file body
    // ...

    // Record hook IDs registered by this plugin (for cleanup on unload)
    const hookIdAfter = hooks._idCounter
    if (hookIdAfter > hookIdBefore) {
      pluginHookIds[moduleId] = Array.from(
        { length: hookIdAfter - hookIdBefore },
        (_, i) => hookIdBefore + i + 1
      )
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

