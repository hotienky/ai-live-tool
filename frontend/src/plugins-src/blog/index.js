// Blog Plugin — Entry Point
// Registers blog navigation, routes, and components via Hooks + Plugin Registry

import PostList from './components/PostList.vue'
import PostEditor from './components/PostEditor.vue'
import CommentManager from './components/CommentManager.vue'
import BlogSettings from './components/BlogSettings.vue'

const PLUGIN_ID = 'blog'
const bridge = window.__APP_BRIDGE__
const hooks = bridge?.hooks || window.__APP_HOOKS__
const t = bridge?.t || ((k, fb) => fb)
const Icons = window.LucideVueNext || {}

const initHooks = () => {
  const bridge = window.__APP_BRIDGE__
  const hooks = bridge?.hooks || window.__APP_HOOKS__
  const t = bridge?.t || ((k, fb) => fb)
  const Icons = window.LucideVueNext || {}

  if (hooks) {
    hooks.addFilter('sidebar_items', (items) => {
      items.push({
        key: 'blog/posts',
        label: t('admin.blog', 'Blog'),
        icon: Icons.PenSquare || 'PenSquare',
        featureGroup: 'blog',
        moduleId: 'blog',
      })
      return items
    }, 15)

    hooks.addFilter('admin_routes', (config) => {
      Object.assign(config.routeToTab, {
        'blog/posts': 'blog-posts',
        'blog/categories': 'blog-categories',
        'blog/comments': 'blog-comments',
        'blog/settings': 'blog-settings',
      })
      return config
    })

    hooks.addFilter('storefront_sections', (sections) => {
      sections.push({
        type: 'blog',
        label: t('admin.blog_section', 'Blog / Bài viết'),
        icon: 'PenSquare',
        defaultParams: { maxPosts: 6, showViewAll: true },
      })
      return sections
    })
  }

  if (bridge?.registerBlock) {
    bridge.registerBlock({
      type: 'blog-collection',
      plugin: 'blog',
      name: 'Bộ sưu tập bài viết',
      icon: 'BookOpen',
      description: 'Hiển thị lưới bài viết từ danh mục blog',
      defaultSettings: {
        title: 'Bài viết mới nhất',
        category_id: null,
        limit: 6,
        layout: 'grid',
        show_view_all: true,
      },
      settingsSchema: [
        { key: 'title', type: 'text', label: 'Tiêu đề section' },
        { key: 'category_id', type: 'api-select', label: 'Danh mục', endpoint: '/blog/categories', placeholder: 'Tất cả danh mục' },
        { key: 'limit', type: 'number', label: 'Số bài hiển thị', placeholder: '6' },
        { key: 'layout', type: 'radio', label: 'Kiểu hiển thị', options: [
          { value: 'grid', label: 'Lưới' },
          { value: 'list', label: 'Danh sách' },
          { value: 'carousel', label: 'Carousel' },
        ]},
        { key: 'show_view_all', type: 'toggle', label: 'Hiển thị nút "Xem tất cả"' },
      ],
    })

    bridge.registerBlock({
      type: 'latest-posts',
      plugin: 'blog',
      name: 'Bài viết nổi bật',
      icon: 'TrendingUp',
      description: 'Hiển thị bài viết nổi bật hoặc được xem nhiều nhất',
      defaultSettings: {
        title: 'Bài viết nổi bật',
        sort: 'latest',
        limit: 3,
      },
      settingsSchema: [
        { key: 'title', type: 'text', label: 'Tiêu đề section' },
        { key: 'sort', type: 'select', label: 'Sắp xếp theo', options: [
          { value: 'latest', label: 'Mới nhất' },
          { value: 'popular', label: 'Phổ biến nhất' },
          { value: 'featured', label: 'Nổi bật' },
        ]},
        { key: 'limit', type: 'number', label: 'Số bài hiển thị', placeholder: '3' },
      ],
    })
  }
}

const plugin = {
  id: PLUGIN_ID,
  components: {
    'blog-posts': PostList,
    'blog-categories': PostList,
    'blog-comments': CommentManager,
    'blog-settings': BlogSettings,
  },
  tabs: [
    { key: 'blog-posts', label: 'Bài viết', icon: 'FileText' },
    { key: 'blog-categories', label: 'Danh mục', icon: 'FolderOpen' },
    { key: 'blog-comments', label: 'Bình luận', icon: 'MessageCircle' },
    { key: 'blog-settings', label: 'Cài đặt', icon: 'Settings' },
  ],
  initHooks
}

export default plugin
