import { reactive, computed, watch } from 'vue'
import { apiFetch } from '../api.js'

/**
 * useTheme — Storefront theme composable
 * Loads theme config from CMS, applies CSS variables, toggles light/dark mode.
 * Supports separate accent colors for light/dark modes.
 */

const THEME_KEY = 'sf_theme_mode'

// Theme presets (same as CMS ThemeCustomizer)
const PRESETS = {
  modern_dark: {
    mode: 'dark',
    font: 'Inter',
    radius: '12',
    cardStyle: 'glass',
    dark: { accent: '#7c3aed' },
    light: { accent: '#6d28d9' },
  },
  clean_light: {
    mode: 'light',
    font: 'Inter',
    radius: '10',
    cardStyle: 'solid',
    dark: { accent: '#3b82f6' },
    light: { accent: '#2563eb' },
  },
  warm: {
    mode: 'light',
    font: 'Plus Jakarta Sans',
    radius: '14',
    cardStyle: 'solid',
    dark: { accent: '#f59e0b' },
    light: { accent: '#d97706' },
  },
  ocean: {
    mode: 'dark',
    font: 'Outfit',
    radius: '16',
    cardStyle: 'glass',
    dark: { accent: '#06b6d4' },
    light: { accent: '#0891b2' },
  },
}

// HSL-based accent color derivation for better color harmony
function hexToHSL(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255
  let g = parseInt(hex.slice(3, 5), 16) / 255
  let b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2
  if (max === min) { h = s = 0 } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return { h: h * 360, s: s * 100, l: l * 100 }
}

function hslToHex(h, s, l) {
  h /= 360; s /= 100; l /= 100
  let r, g, b
  if (s === 0) { r = g = b = l } else {
    const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q; if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p }
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = f(p, q, h + 1/3); g = f(p, q, h); b = f(p, q, h - 1/3)
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function deriveColors(hex) {
  const rr = parseInt(hex.slice(1, 3), 16)
  const gg = parseInt(hex.slice(3, 5), 16)
  const bb = parseInt(hex.slice(5, 7), 16)
  const hsl = hexToHSL(hex)
  return {
    accent: hex,
    accentLight: hslToHex(hsl.h, Math.min(hsl.s + 5, 100), Math.min(hsl.l + 15, 85)),
    accentGlow: `rgba(${rr}, ${gg}, ${bb}, 0.15)`,
    accentGradient: `linear-gradient(135deg, ${hex}, ${hslToHex(hsl.h + 15, hsl.s, Math.min(hsl.l + 10, 80))})`,
    shadowAccent: `0 8px 24px rgba(${rr}, ${gg}, ${bb}, 0.25)`,
  }
}

const state = reactive({
  mode: localStorage.getItem(THEME_KEY) || 'light',
  font: 'Inter',
  radius: '12',
  cardStyle: 'glass',
  loaded: false,
  tenantDefaultMode: 'light',
  // Per-mode accent colors
  dark: { accent: '#7c3aed' },
  light: { accent: '#6d28d9' },
})

function applyTheme() {
  const root = document.documentElement
  root.setAttribute('data-theme', state.mode)

  // Get accent for current mode
  const currentAccent = state.mode === 'light' ? state.light.accent : state.dark.accent
  const colors = deriveColors(currentAccent)
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

  function applyThemeConfig(config) {
    if (config && typeof config === 'object') {
      if (config['dark_accent']) state.dark.accent = config['dark_accent']
      else if (config['accent']) state.dark.accent = config['accent']
      if (config['light_accent']) state.light.accent = config['light_accent']
      else if (config['accent']) state.light.accent = config['accent']
      if (config['font'])       state.font      = config['font']
      if (config['radius'])     state.radius    = config['radius']
      if (config['card_style']) state.cardStyle = config['card_style']
      if (config['mode']) {
        state.tenantDefaultMode = config['mode']
        if (!localStorage.getItem(THEME_KEY)) {
          state.mode = config['mode']
        }
      }
    }
    state.loaded = true
    applyTheme()
  }

  /** Init from siteConfig.theme — no API call needed. */
  function initFromConfig(themeData) {
    applyThemeConfig(themeData)
  }

  async function loadThemeConfig() {
    try {
      const config = await apiFetch('/theme')
      applyThemeConfig(config)
    } catch { /* use defaults */ }
    if (!state.loaded) {
      state.loaded = true
      applyTheme()
    }
  }

  async function init() {
    if (!state.loaded) {
      await loadThemeConfig()
    } else {
      applyTheme()
    }
  }

  return {
    isDark, themeMode, toggleTheme, setMode, init, initFromConfig,
    loadThemeConfig,
    accent: computed(() => state.mode === 'light' ? state.light.accent : state.dark.accent),
    font: computed(() => state.font),
  }
}
