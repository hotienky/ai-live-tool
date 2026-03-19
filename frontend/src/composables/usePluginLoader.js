// usePluginLoader — Dynamic plugin loading via fetch+eval
import { ref, reactive, markRaw } from 'vue'
import * as Vue from 'vue'
import * as LucideVueNext from 'lucide-vue-next'
import { apiFetch } from './useApi.js'
import { useToast } from './useToast.js'

// ── Set globals immediately at module scope ──
window.Vue = Vue
window.LucideVueNext = LucideVueNext
window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}

const loadedPlugins = reactive({})
const pluginComponents = reactive({})
const pluginSidebar = reactive({})
const loadingPlugin = ref(null)

function initBridge() {
  const { showToast } = useToast()
  window.__APP_BRIDGE__ = { apiFetch, showToast }
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
    if (!res.ok) throw new Error(`HTTP ${res.status} loading plugin ${moduleId}`)
    const code = await res.text()

    // Ensure globals before execution
    window.Vue = window.Vue || Vue
    window.LucideVueNext = window.LucideVueNext || LucideVueNext
    window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}

    // Execute the IIFE bundle
    try {
      new Function(code)()
    } catch (evalError) {
      console.error(`[PluginLoader] Error executing ${moduleId} bundle:`, evalError)
      throw new Error(`Plugin ${moduleId} có lỗi code: ${evalError.message}`)
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
    return plugin
  } catch (e) {
    console.error(`[PluginLoader] Error loading ${moduleId}:`, e)
    throw e
  } finally {
    loadingPlugin.value = null
  }
}

function unloadPlugin(moduleId) {
  const css = document.getElementById(`plugin-css-${moduleId}`)
  if (css) css.remove()
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
    loadedPlugins, pluginComponents, pluginSidebar, loadingPlugin,
    initBridge, loadPlugin, unloadPlugin, getPluginComponent,
  }
}
