import { ref, watch, onMounted } from 'vue'

const STORAGE_KEY = 'ai-live-theme'

// ── Accent Color Presets ──
const accentPresets = {
  purple: { primary: '#7c3aed', dark: '#6d28d9', light: '#a78bfa', glow: 'rgba(124,58,237,0.2)' },
  blue:   { primary: '#3b82f6', dark: '#2563eb', light: '#60a5fa', glow: 'rgba(59,130,246,0.2)' },
  green:  { primary: '#10b981', dark: '#059669', light: '#34d399', glow: 'rgba(16,185,129,0.2)' },
  rose:   { primary: '#f43f5e', dark: '#e11d48', light: '#fb7185', glow: 'rgba(244,63,94,0.2)' },
  amber:  { primary: '#f59e0b', dark: '#d97706', light: '#fbbf24', glow: 'rgba(245,158,11,0.2)' },
  cyan:   { primary: '#06b6d4', dark: '#0891b2', light: '#22d3ee', glow: 'rgba(6,182,212,0.2)' },
}

// ── Font Size Presets ──
const fontSizePresets = {
  compact:     { base: '13px', card: '18px', heading: '22px' },
  normal:      { base: '14px', card: '20px', heading: '24px' },
  comfortable: { base: '15px', card: '22px', heading: '26px' },
}

// ── Shared State (singleton) ──
const theme = ref('dark')          // 'dark' | 'light' | 'system'
const accentColor = ref('purple')  // preset name
const fontSize = ref('normal')     // 'compact' | 'normal' | 'comfortable'
const resolvedTheme = ref('dark')  // actual applied: 'dark' | 'light'

let mediaQuery = null

function applyTheme() {
  const el = document.documentElement

  // Resolve system preference
  if (theme.value === 'system') {
    resolvedTheme.value = mediaQuery?.matches ? 'dark' : 'light'
  } else {
    resolvedTheme.value = theme.value
  }

  el.setAttribute('data-theme', resolvedTheme.value)

  // Apply accent color
  const accent = accentPresets[accentColor.value] || accentPresets.purple
  el.style.setProperty('--color-accent-primary', accent.primary)
  el.style.setProperty('--color-accent-glow', accent.glow)
  el.style.setProperty('--accent-gradient', `linear-gradient(135deg, ${accent.primary}, ${accent.dark})`)
  el.style.setProperty('--accent-light', accent.light)
  el.style.setProperty('--accent-shadow', `0 4px 15px ${accent.glow}`)

  // Apply font size
  const fs = fontSizePresets[fontSize.value] || fontSizePresets.normal
  el.style.setProperty('--font-size-base', fs.base)
  el.style.setProperty('--font-size-card', fs.card)
  el.style.setProperty('--font-size-heading', fs.heading)
}

function savePrefs() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    theme: theme.value,
    accentColor: accentColor.value,
    fontSize: fontSize.value,
  }))
}

function loadPrefs() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const prefs = JSON.parse(saved)
      if (prefs.theme) theme.value = prefs.theme
      if (prefs.accentColor && accentPresets[prefs.accentColor]) accentColor.value = prefs.accentColor
      if (prefs.fontSize && fontSizePresets[prefs.fontSize]) fontSize.value = prefs.fontSize
    }
  } catch { /* ignore */ }
}

let initialized = false

export function useTheme() {
  if (!initialized) {
    initialized = true
    mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', () => {
      if (theme.value === 'system') applyTheme()
    })

    loadPrefs()
    applyTheme()

    watch([theme, accentColor, fontSize], () => {
      applyTheme()
      savePrefs()
    })
  }

  function toggleTheme() {
    const modes = ['dark', 'light', 'system']
    const idx = modes.indexOf(theme.value)
    theme.value = modes[(idx + 1) % modes.length]
  }

  function setTheme(mode) {
    theme.value = mode
  }

  function setAccent(name) {
    if (accentPresets[name]) accentColor.value = name
  }

  function setFontSize(size) {
    if (fontSizePresets[size]) fontSize.value = size
  }

  return {
    theme,
    accentColor,
    fontSize,
    resolvedTheme,
    accentPresets,
    fontSizePresets,
    toggleTheme,
    setTheme,
    setAccent,
    setFontSize,
  }
}
