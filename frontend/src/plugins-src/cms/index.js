import CmsManager from './components/CmsManager.vue'
import CmsEditor from './components/CmsEditor.vue'

const PLUGIN_ID = 'cms'

// ── Register via Hooks ──
const initHooks = () => {
  const bridge = window.__APP_BRIDGE__
  const hooks = bridge?.hooks || window.__APP_HOOKS__
  const t = bridge?.t || ((k, fb) => fb)
  const Icons = window.LucideVueNext || {}

  // Register built-in CMS blocks via bridge (bridge is guaranteed to exist here)
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

    const columnSettingsSchema = [
      { key: 'columns', type: 'select', label: 'Số Cột', options: [
        { value: 2, label: '2 Cột' },
        { value: 3, label: '3 Cột' }
      ]},
      { key: 'layout', type: 'select', label: 'Tỷ lệ phân chia', options: [
        { value: '50-50', label: 'Căn đều (50-50)' },
        { value: '60-40', label: 'Lệch phải (60-40)' },
        { value: '40-60', label: 'Lệch trái (40-60)' },
        { value: '33-33-33', label: 'Căn đều (3 cột)' },
      ]},
    ]
  
    bridge.registerBlock({
      type: 'columns-2',
      plugin: 'cms',
      name: '2 Cột đều (50-50)',
      icon: 'Columns',
      description: 'Chia bố cục thành 2 cột cân bằng',
      defaultSettings: { columns: 2, layout: '50-50' },
      settingsSchema: columnSettingsSchema,
    })

    bridge.registerBlock({
      type: 'columns-3',
      plugin: 'cms',
      name: '3 Cột đều (33%)',
      icon: 'Columns',
      description: 'Chia bố cục thành 3 cột cân bằng',
      defaultSettings: { columns: 3, layout: '33-33-33' },
      settingsSchema: columnSettingsSchema,
    })

    bridge.registerBlock({
      type: 'columns-left',
      plugin: 'cms',
      name: '2 Cột Lệch Trái',
      icon: 'Columns',
      description: 'Trái 40%, Phải 60%',
      defaultSettings: { columns: 2, layout: '40-60' },
      settingsSchema: columnSettingsSchema,
    })

    bridge.registerBlock({
      type: 'columns-right',
      plugin: 'cms',
      name: '2 Cột Lệch Phải',
      icon: 'Columns',
      description: 'Trái 60%, Phải 40%',
      defaultSettings: { columns: 2, layout: '60-40' },
      settingsSchema: columnSettingsSchema,
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

  if (hooks) {
    hooks.addFilter('sidebar_items', (items) => {
      items.push({
        key: 'shop/cms',
        label: t('cms.pages', 'Trang nội dung'),
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
}

const plugin = {
  id: PLUGIN_ID,
  name: 'Trang CMS',
  version: '1.0.0',
  components: {
    'cms': CmsManager,
    'cms-editor': CmsEditor,
  },
  initHooks,
}

export default plugin
