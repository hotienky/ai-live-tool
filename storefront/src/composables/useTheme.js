import { reactive, computed, watch } from 'vue'
import { apiFetch } from '../api.js'

/**
 * useTheme — Storefront theme composable
 * Loads theme config from CMS, applies CSS variables, toggles light/dark mode
 */

const THEME_KEY = 'sf_theme_mode'

// Theme presets (same as CMS ThemeCustomizer)
const PRESETS = {
  modern_dark: {
    mode: 'dark',
    accent: '#7c3aed',
    font: 'Inter',
    radius: '12',
    cardStyle: 'glass',
  },
  clean_light: {
    mode: 'light',
    accent: '#3b82f6',
    font: 'Inter',
    radius: '10',
    cardStyle: 'solid',
  },
  warm: {
    mode: 'light',
    accent: '#f59e0b',
    font: 'Plus Jakarta Sans',
    radius: '14',
    cardStyle: 'solid',
  },
  ocean: {
    mode: 'dark',
    accent: '#06b6d4',
    font: 'Outfit',
    radius: '16',
    cardStyle: 'glass',
  },
}

// Accent-derived colors
function deriveColors(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    accent: hex,
    accentLight: `rgba(${Math.min(r + 60, 255)}, ${Math.min(g + 60, 255)}, ${Math.min(b + 60, 255)}, 1)`,
    accentGlow: `rgba(${r}, ${g}, ${b}, 0.15)`,
    accentGradient: `linear-gradient(135deg, ${hex}, rgba(${Math.min(r + 40, 255)}, ${Math.min(g + 40, 255)}, ${Math.min(b + 40, 255)}, 1))`,
    shadowAccent: `0 8px 24px rgba(${r}, ${g}, ${b}, 0.25)`,
  }
}

const state = reactive({
  mode: localStorage.getItem(THEME_KEY) || 'dark',
  accent: '#7c3aed',
  font: 'Inter',
  radius: '12',
  cardStyle: 'glass',
  loaded: false,
  tenantDefaultMode: 'dark',
})

function applyTheme() {
  const root = document.documentElement
  root.setAttribute('data-theme', state.mode)

  // Accent colors
  const colors = deriveColors(state.accent)
  root.style.setProperty('--sf-accent', colors.accent)
  root.style.setProperty('--sf-accent-light', colors.accentLight)
  root.style.setProperty('--sf-accent-glow', colors.accentGlow)
  root.style.setProperty('--sf-accent-gradient', colors.accentGradient)
  root.style.setProperty('--sf-shadow-accent', colors.shadowAccent)

  // Font
  const fontMap = {
    'Inter': "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    'Roboto': "'Roboto', -apple-system, sans-serif",
    'Outfit': "'Outfit', -apple-system, sans-serif",
    'Plus Jakarta Sans': "'Plus Jakarta Sans', -apple-system, sans-serif",
  }
  root.style.setProperty('--sf-font-family', fontMap[state.font] || fontMap['Inter'])

  // Load Google Font if not Inter
  if (state.font !== 'Inter') {
    const id = 'sf-google-font'
    let link = document.getElementById(id)
    if (!link) {
      link = document.createElement('link')
      link.id = id
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    link.href = `https://fonts.googleapis.com/css2?family=${state.font.replace(/ /g, '+')}:wght@400;500;600;700;800&display=swap`
  }

  // Border radius
  const r = parseInt(state.radius) || 12
  root.style.setProperty('--sf-radius-sm', `${Math.max(r - 4, 4)}px`)
  root.style.setProperty('--sf-radius-md', `${r}px`)
  root.style.setProperty('--sf-radius-lg', `${r + 4}px`)
  root.style.setProperty('--sf-radius-xl', `${r + 8}px`)
}

export function useTheme() {
  const isDark = computed(() => state.mode === 'dark')
  const themeMode = computed(() => state.mode)

  function toggleTheme() {
    state.mode = state.mode === 'dark' ? 'light' : 'dark'
    localStorage.setItem(THEME_KEY, state.mode)
    applyTheme()
  }

  function setMode(mode) {
    state.mode = mode
    localStorage.setItem(THEME_KEY, mode)
    applyTheme()
  }

  async function loadThemeConfig() {
    try {
      const config = await apiFetch('/theme')
      // StorefrontController.theme() returns {accent, mode, font, radius, card_style}
      // Keys are stored WITHOUT 'theme.' prefix in the DB under group_name='theme'
      if (config && typeof config === 'object') {
        if (config['accent']) state.accent = config['accent']
        if (config['font'])   state.font   = config['font']
        if (config['radius']) state.radius  = config['radius']
        if (config['card_style']) state.cardStyle = config['card_style']
        if (config['mode']) {
          state.tenantDefaultMode = config['mode']
          if (!localStorage.getItem(THEME_KEY)) {
            state.mode = config['mode']
          }
        }
      }
    } catch { /* use defaults */ }
    state.loaded = true
    applyTheme()
  }

  async function init() {
    if (!state.loaded) {
      await loadThemeConfig()
    } else {
      applyTheme()
    }
  }

  return {
    isDark, themeMode, toggleTheme, setMode, init,
    loadThemeConfig,
    accent: computed(() => state.accent),
    font: computed(() => state.font),
  }
}
