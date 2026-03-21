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

// ══════════════════════════════════════
// Register sidebar items via hooks
// ══════════════════════════════════════
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

  // Register blog as a storefront section type
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

// ══════════════════════════════════════
// Register components via Plugin Registry
// ══════════════════════════════════════
if (bridge?.registerPlugin) {
  bridge.registerPlugin(PLUGIN_ID, {
    components: {
      'blog-posts': PostList,
      'blog-categories': PostList,  // Reuse PostList with category filter
      'blog-comments': CommentManager,
      'blog-settings': BlogSettings,
    },
    tabs: [
      { key: 'blog-posts', label: t('admin.posts', 'Bài viết'), icon: 'FileText' },
      { key: 'blog-categories', label: t('admin.categories', 'Danh mục'), icon: 'FolderOpen' },
      { key: 'blog-comments', label: t('admin.comments', 'Bình luận'), icon: 'MessageCircle' },
      { key: 'blog-settings', label: t('admin.settings', 'Cài đặt'), icon: 'Settings' },
    ],
  })
}

console.log('[Plugin:blog] Blog module loaded ✅')
