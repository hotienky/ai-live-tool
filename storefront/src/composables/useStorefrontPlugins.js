/**
 * useStorefrontPlugins — Dynamic plugin loader for Storefront
 *
 * Each installed module can optionally provide a `storefront.js` bundle
 * that registers storefront-specific components (routes, homepage sections, widgets)
 * via the `__SF_BRIDGE__` global.
 *
 * This is the storefront equivalent of the CMS's usePluginLoader.js.
 */
import { ref, reactive, markRaw, shallowRef } from 'vue'
import * as Vue from 'vue'
import * as LucideVueNext from 'lucide-vue-next'
import { apiFetch, apiPost } from '../api.js'
import { useI18n } from './useI18n.js'
import { useTheme } from './useTheme.js'
import { useModules } from './useModules.js'

// ── Plugin registry ──
const loadedPlugins = reactive({})
const pluginSections = ref([])      // Homepage sections from plugins
const pluginWidgets = reactive({})   // Named widgets from plugins
const pluginRoutes = ref([])         // Routes from plugins
const pluginLoading = ref(false)
const pluginError = ref(null)

// Expose Vue globally for plugin bundles
window.Vue = Vue
window.LucideVueNext = LucideVueNext

/**
 * Initialize the __SF_BRIDGE__ global for storefront plugins
 */
function initBridge() {
  const { t, currentLang } = useI18n()
  const { isDark, toggleTheme } = useTheme()

  window.__SF_BRIDGE__ = {
    // ── Core utilities ──
    apiFetch,
    apiPost,
    t,
    currentLang,

    // ── Theme ──
    isDark,
    toggleTheme,

    // ── Registration API ──
    registerPlugin(moduleId, config = {}) {
      if (loadedPlugins[moduleId]) {
        console.warn(`[SF Plugin] ${moduleId} already registered`)
        return
      }

      // Register routes
      if (config.routes?.length) {
        pluginRoutes.value = [...pluginRoutes.value, ...config.routes]
      }

      // Register homepage sections (accept both 'sections' and 'homeSections')
      const rawSections = config.sections || config.homeSections || []
      if (rawSections.length) {
        const sections = rawSections.map(s => ({
          ...s,
          component: markRaw(s.component),
          moduleId,
        }))
        pluginSections.value = [...pluginSections.value, ...sections]
      }

      // Register named widgets
      if (config.widgets) {
        for (const [name, comp] of Object.entries(config.widgets)) {
          pluginWidgets[`${moduleId}:${name}`] = markRaw(comp)
        }
      }

      loadedPlugins[moduleId] = {
        id: moduleId,
        loaded: true,
        hasRoutes: !!config.routes?.length,
        hasSections: rawSections.length > 0,
        hasWidgets: !!config.widgets,
      }

      console.log(`[SF Plugin] ${moduleId} registered ✅`, config)
    },
  }
}

/**
 * Load a single plugin's storefront bundle
 */
async function loadPluginBundle(moduleId, bundleUrl) {
  try {
    const res = await fetch(bundleUrl)
    if (!res.ok) {
      // No storefront bundle for this plugin — that's fine
      if (res.status === 404) return
      throw new Error(`HTTP ${res.status}`)
    }
    const code = await res.text()
    if (!code.trim()) return

    // Execute the bundle in global scope
    const fn = new Function(code)
    fn()
    console.log(`[SF Plugin] Loaded ${moduleId} storefront bundle`)
  } catch (err) {
    // 404 = plugin doesn't have storefront bundle, which is normal
    if (!err.message?.includes('404')) {
      console.warn(`[SF Plugin] Failed to load ${moduleId}:`, err.message)
    }
  }
}

/**
 * Load storefront.js bundles for all installed modules
 * @param {string[]} modules - List of installed module IDs
 * @param {object} pluginAssets - Optional map of moduleId → {storefrontJs, storefrontCss}
 */
export async function loadStorefrontPlugins(modules = [], pluginAssets = {}) {
  if (!modules.length) return

  pluginLoading.value = true
  pluginError.value = null

  try {
    // Initialize the bridge
    initBridge()

    // Load each module's storefront bundle
    const loadPromises = modules.map(moduleId => {
      const assets = pluginAssets[moduleId]
      const jsUrl = assets?.storefrontJs || `/plugins/${moduleId}/storefront.js`
      const cssUrl = assets?.storefrontCss || `/plugins/${moduleId}/storefront.css`

      // Load CSS if exists
      loadPluginCss(moduleId, cssUrl)

      // Load JS bundle
      return loadPluginBundle(moduleId, jsUrl)
    })

    await Promise.allSettled(loadPromises)
  } catch (err) {
    pluginError.value = err.message
    console.error('[SF Plugin] Error loading plugins:', err)
  } finally {
    pluginLoading.value = false
  }
}

/**
 * Load plugin CSS if available
 */
function loadPluginCss(moduleId, cssUrl) {
  // Check if already loaded
  if (document.querySelector(`link[data-sf-plugin="${moduleId}"]`)) return

  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = cssUrl
  link.setAttribute('data-sf-plugin', moduleId)
  link.onerror = () => link.remove() // Remove if 404
  document.head.appendChild(link)
}

/**
 * Composable to access storefront plugin state
 */
export function useStorefrontPlugins() {
  return {
    loadedPlugins,
    pluginSections,
    pluginWidgets,
    pluginRoutes,
    pluginLoading,
    pluginError,
    loadStorefrontPlugins,

    // Get a widget component by "moduleId:widgetName"
    getWidget(key) {
      return pluginWidgets[key] || null
    },

    // Get all sections sorted by order
    getSortedSections() {
      return [...pluginSections.value].sort((a, b) => (a.order || 0) - (b.order || 0))
    },
  }
}
