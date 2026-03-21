/**
 * Block Engine — Core data model and registry for the Visual Page Builder.
 *
 * Each block has:  content (type-specific data) + style + responsive + animation
 * Plugins register custom block types via hooks.
 */

// ── Block Schema Factory ──────────────────────────────────────

let _uid = 0
export function generateBlockId() {
  return `blk_${Date.now().toString(36)}_${(++_uid).toString(36)}`
}

export function createBlock(type, overrides = {}) {
  const typeDef = blockRegistry.get(type)
  return {
    id: generateBlockId(),
    type,
    content: { ...(typeDef?.defaultContent || {}), ...(overrides.content || {}) },
    style: {
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      backgroundColor: '',
      backgroundImage: '',
      backgroundGradient: '',
      borderRadius: 0,
      borderWidth: 0,
      borderColor: '',
      boxShadow: '',
      textAlign: 'left',
      fontSize: '',
      fontWeight: '',
      color: '',
      lineHeight: '',
      ...(overrides.style || {}),
    },
    responsive: {
      hideOnMobile: false,
      hideOnTablet: false,
      hideOnDesktop: false,
      ...(overrides.responsive || {}),
    },
    animation: overrides.animation || '',
  }
}

// ── Row / Column helpers ──────────────────────────────────────

export function createRow(columns = 1) {
  const presets = {
    1: ['100%'],
    2: ['50%', '50%'],
    3: ['33.33%', '33.33%', '33.33%'],
    4: ['25%', '25%', '25%', '25%'],
    '2-1': ['66.66%', '33.33%'],
    '1-2': ['33.33%', '66.66%'],
  }
  const widths = presets[columns] || presets[1]
  return {
    id: generateBlockId(),
    type: '_row',
    columns: widths.map(w => ({
      id: generateBlockId(),
      width: w,
      blocks: [],
    })),
  }
}

// ── Block Registry ────────────────────────────────────────────

class BlockRegistry {
  constructor() {
    this.types = {}
  }

  register(type, config) {
    // config = { label, icon, category, defaultContent, settings, component? }
    this.types[type] = { type, ...config }
  }

  get(type) {
    return this.types[type] || null
  }

  all() {
    return Object.values(this.types)
  }

  byCategory(cat) {
    return this.all().filter(t => t.category === cat)
  }

  categories() {
    const cats = new Set(this.all().map(t => t.category))
    return [...cats]
  }
}

export const blockRegistry = new BlockRegistry()

// ── Register Core Block Types ─────────────────────────────────

blockRegistry.register('heading', {
  label: 'Heading',
  icon: 'Type',
  category: 'basic',
  defaultContent: { text: 'Heading Text', level: 2 },
  settings: [
    { key: 'text', type: 'text', label: 'Text' },
    { key: 'level', type: 'select', label: 'Level', options: [1, 2, 3, 4, 5, 6] },
  ],
})

blockRegistry.register('text', {
  label: 'Text',
  icon: 'AlignLeft',
  category: 'basic',
  defaultContent: { html: '<p>Your text here...</p>' },
  settings: [
    { key: 'html', type: 'richtext', label: 'Content' },
  ],
})

blockRegistry.register('image', {
  label: 'Image',
  icon: 'Image',
  category: 'basic',
  defaultContent: { src: '', alt: '', link: '', width: '100%' },
  settings: [
    { key: 'src', type: 'image', label: 'Image URL' },
    { key: 'alt', type: 'text', label: 'Alt Text' },
    { key: 'link', type: 'text', label: 'Link URL' },
    { key: 'width', type: 'text', label: 'Width' },
  ],
})

blockRegistry.register('button', {
  label: 'Button',
  icon: 'MousePointer',
  category: 'basic',
  defaultContent: { text: 'Click Me', url: '#', target: '_self', variant: 'primary' },
  settings: [
    { key: 'text', type: 'text', label: 'Text' },
    { key: 'url', type: 'text', label: 'URL' },
    { key: 'target', type: 'select', label: 'Target', options: ['_self', '_blank'] },
    { key: 'variant', type: 'select', label: 'Style', options: ['primary', 'secondary', 'outline', 'ghost'] },
  ],
})

blockRegistry.register('spacer', {
  label: 'Spacer',
  icon: 'Space',
  category: 'layout',
  defaultContent: { height: 40 },
  settings: [
    { key: 'height', type: 'number', label: 'Height (px)' },
  ],
})

blockRegistry.register('divider', {
  label: 'Divider',
  icon: 'Minus',
  category: 'layout',
  defaultContent: { style: 'solid', color: '#e5e7eb', width: 1 },
  settings: [
    { key: 'style', type: 'select', label: 'Style', options: ['solid', 'dashed', 'dotted'] },
    { key: 'color', type: 'color', label: 'Color' },
    { key: 'width', type: 'number', label: 'Thickness' },
  ],
})

blockRegistry.register('video', {
  label: 'Video',
  icon: 'Play',
  category: 'media',
  defaultContent: { url: '', autoplay: false },
  settings: [
    { key: 'url', type: 'text', label: 'Video URL (YouTube, Vimeo)' },
    { key: 'autoplay', type: 'toggle', label: 'Autoplay' },
  ],
})

blockRegistry.register('icon', {
  label: 'Icon',
  icon: 'Smile',
  category: 'basic',
  defaultContent: { name: 'Star', size: 48, color: '' },
  settings: [
    { key: 'name', type: 'text', label: 'Icon Name (Lucide)' },
    { key: 'size', type: 'number', label: 'Size' },
    { key: 'color', type: 'color', label: 'Color' },
  ],
})

blockRegistry.register('html', {
  label: 'HTML Code',
  icon: 'Code',
  category: 'advanced',
  defaultContent: { code: '<!-- Your custom HTML here -->' },
  settings: [
    { key: 'code', type: 'code', label: 'HTML/JS Code' },
  ],
})

blockRegistry.register('columns', {
  label: 'Columns',
  icon: 'Columns',
  category: 'layout',
  defaultContent: { layout: 2 },
  settings: [
    { key: 'layout', type: 'select', label: 'Columns', options: [1, 2, 3, 4, '2-1', '1-2'] },
  ],
})

blockRegistry.register('form', {
  label: 'Form',
  icon: 'FileText',
  category: 'advanced',
  defaultContent: {
    title: 'Contact Form',
    submitText: 'Submit',
    successMessage: 'Thank you!',
    fields: [
      { id: 'f1', type: 'text', label: 'Name', required: true },
      { id: 'f2', type: 'email', label: 'Email', required: true },
      { id: 'f3', type: 'textarea', label: 'Message', required: true },
    ]
  },
  settings: [ // Settings are handled specifically by FormBlock component, but we keep tab empty or simple
    { key: 'title', type: 'text', label: 'Form Title' },
  ]
})

// ── Animation Presets ─────────────────────────────────────────

export const animationPresets = [
  { value: '', label: 'None' },
  { value: 'fade-in', label: 'Fade In' },
  { value: 'slide-up', label: 'Slide Up' },
  { value: 'slide-left', label: 'Slide Left' },
  { value: 'slide-right', label: 'Slide Right' },
  { value: 'zoom-in', label: 'Zoom In' },
  { value: 'bounce', label: 'Bounce' },
]

// ── CSS Generation ────────────────────────────────────────────

export function blockStyleToCSS(style = {}) {
  const css = {}
  if (style.margin) {
    css.marginTop = `${style.margin.top || 0}px`
    css.marginRight = `${style.margin.right || 0}px`
    css.marginBottom = `${style.margin.bottom || 0}px`
    css.marginLeft = `${style.margin.left || 0}px`
  }
  if (style.padding) {
    css.paddingTop = `${style.padding.top || 0}px`
    css.paddingRight = `${style.padding.right || 0}px`
    css.paddingBottom = `${style.padding.bottom || 0}px`
    css.paddingLeft = `${style.padding.left || 0}px`
  }
  if (style.backgroundColor) css.backgroundColor = style.backgroundColor
  if (style.backgroundImage) css.backgroundImage = `url(${style.backgroundImage})`
  if (style.backgroundGradient) css.background = style.backgroundGradient
  if (style.borderRadius) css.borderRadius = `${style.borderRadius}px`
  if (style.borderWidth) css.border = `${style.borderWidth}px ${style.borderColor ? 'solid' : 'solid'} ${style.borderColor || '#e5e7eb'}`
  if (style.boxShadow) css.boxShadow = style.boxShadow
  if (style.textAlign) css.textAlign = style.textAlign
  if (style.fontSize) css.fontSize = style.fontSize
  if (style.fontWeight) css.fontWeight = style.fontWeight
  if (style.color) css.color = style.color
  if (style.lineHeight) css.lineHeight = style.lineHeight
  return css
}

export default blockRegistry
