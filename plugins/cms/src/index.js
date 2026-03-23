import CmsManager from './components/CmsManager.vue'
import CmsEditor from './components/CmsEditor.vue'

const PLUGIN_ID = 'cms'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)

// ── Register built-in CMS blocks ────────────────────────────────────
// These are the core blocks available in every page builder, regardless
// of which other plugins are installed.
if (bridge?.registerBlock) {
  bridge.registerBlock({
    type: 'hero-banner',
    plugin: 'cms',
    name: 'Hero Banner',
    icon: 'Image',
    description: 'Banner lớn đầu trang với tiêu đề, mô tả và nút CTA',
    defaultSettings: {
      title: 'Tiêu đề chào mừng',
      subtitle: 'Mô tả ngắn gọn hấp dẫn về trang của bạn',
      button_text: '',
      button_url: '',
      image: '',
      text_align: 'center',
      min_height: '400px',
    },
    settingsSchema: [
      { key: 'title', type: 'text', label: 'Tiêu đề chính' },
      { key: 'subtitle', type: 'textarea', label: 'Mô tả phụ' },
      { key: 'image', type: 'image', label: 'Ảnh nền' },
      { key: 'button_text', type: 'text', label: 'Text nút CTA', placeholder: 'Ví dụ: Mua ngay' },
      { key: 'button_url', type: 'text', label: 'Link nút CTA', placeholder: '/san-pham' },
      { key: 'text_align', type: 'select', label: 'Căn chỉnh', options: [
        { value: 'left', label: 'Trái' },
        { value: 'center', label: 'Giữa' },
        { value: 'right', label: 'Phải' },
      ]},
      { key: 'min_height', type: 'text', label: 'Chiều cao tối thiểu', placeholder: '400px' },
    ],
  })

  bridge.registerBlock({
    type: 'rich-text',
    plugin: 'cms',
    name: 'Nội dung văn bản',
    icon: 'FileText',
    description: 'Khối văn bản HTML/Rich text tự do',
    defaultSettings: { content: '' },
    settingsSchema: [
      { key: 'content', type: 'richtext', label: 'Nội dung' },
    ],
  })

  bridge.registerBlock({
    type: 'image-banner',
    plugin: 'cms',
    name: 'Ảnh Banner',
    icon: 'ImageIcon',
    description: 'Hiển thị ảnh với tuỳ chọn link và alt text',
    defaultSettings: { image: '', link: '', alt: '', full_width: true },
    settingsSchema: [
      { key: 'image', type: 'image', label: 'Ảnh' },
      { key: 'link', type: 'text', label: 'Đường dẫn khi click', placeholder: '/san-pham' },
      { key: 'alt', type: 'text', label: 'Alt text (SEO)' },
      { key: 'full_width', type: 'toggle', label: 'Full width' },
    ],
  })

  bridge.registerBlock({
    type: 'spacer',
    plugin: 'cms',
    name: 'Khoảng cách',
    icon: 'Minus',
    description: 'Tạo khoảng cách giữa các block',
    defaultSettings: { height: '40px' },
    settingsSchema: [
      { key: 'height', type: 'text', label: 'Chiều cao', placeholder: '40px' },
    ],
  })

  bridge.registerBlock({
    type: 'html-embed',
    plugin: 'cms',
    name: 'HTML / Shortcode',
    icon: 'Code',
    description: 'Nhúng HTML tuỳ chỉnh hoặc shortcode plugin',
    defaultSettings: { html: '' },
    settingsSchema: [
      { key: 'html', type: 'code', label: 'Mã HTML / Shortcode', placeholder: '<div>...</div> hoặc [lucky-draw id="1"]' },
    ],
  })
}

// ── Register via Hooks ──
if (hooks) {
  hooks.addFilter('sidebar_items', (items) => {
    items.push({
      key: 'shop/cms',
      label: t('cms.pages', 'Trang CMS'),
      icon: 'BookOpen',
      featureGroup: 'store',
      moduleId: 'cms',
    })
    return items
  })

  hooks.addFilter('admin_routes', (config) => {
    Object.assign(config.routeToTab, {
      'shop/cms': 'cms',
      'shop/cms/create': 'cms-editor',
      'shop/cms/edit': 'cms-editor',
    })
    return config
  })
}

// ── Register via registerPlugin (preferred) ──
if (bridge?.registerPlugin) {
  bridge.registerPlugin(PLUGIN_ID, {
    components: {
      'cms': CmsManager,
      'cms-editor': CmsEditor,
    },
  })
}

const plugin = {
  id: PLUGIN_ID,
  name: 'Trang CMS',
  version: '1.0.0',
  components: {
    'cms': CmsManager,
    'cms-editor': CmsEditor,
  },
  sidebar: {
    group: 'Giao diện',
    items: [
      { key: 'cms', label: 'Trang CMS', icon: 'BookOpen', route: 'shop/cms' },
    ],
  },
}

window.__PLUGIN_REGISTRY__ = window.__PLUGIN_REGISTRY__ || {}
window.__PLUGIN_REGISTRY__[PLUGIN_ID] = plugin
window.dispatchEvent(new CustomEvent('plugin:loaded', { detail: { id: PLUGIN_ID, plugin } }))

export default plugin
