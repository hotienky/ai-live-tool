/**
 * hook-names.js — All core hook names for KAC CMS Platform
 * 
 * Plugins use these constants to register with the hook system.
 * This file serves as documentation AND constants.
 */

// ══════════════════════════════════════
// SIDEBAR & NAVIGATION
// ══════════════════════════════════════

/**
 * Filter: sidebar_items
 * Modify the admin sidebar navigation items.
 * 
 * @filter
 * @param {Array} items - Current sidebar items
 * @returns {Array} Modified items
 * 
 * Item shape:
 * {
 *   key: 'shop/products',           // unique key
 *   label: 'Cửa hàng',             // display label
 *   icon: 'Store',                   // lucide icon name (string) or component
 *   featureGroup: 'store',           // optional: group for feature toggle
 *   permission: 'products.view',     // optional: permission required
 *   moduleId: 'ecom',               // optional: require module installed
 *   children: [...],                 // optional: dropdown items
 *   activeKeys: ['shop/products'],   // optional: views that make this active
 * }
 */
export const SIDEBAR_ITEMS = 'sidebar_items'

/**
 * Filter: admin_routes
 * Register route-to-tab mappings for the admin panel.
 * 
 * @filter
 * @param {Object} config - { routeToTab: {}, validViews: [] }
 * @returns {Object} Modified config
 */
export const ADMIN_ROUTES = 'admin_routes'


// ══════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════

/**
 * Filter: dashboard_widgets
 * Add widgets to the admin dashboard.
 * 
 * @filter
 * @param {Array} widgets - Current dashboard widgets
 * @returns {Array} Modified widgets
 * 
 * Widget shape:
 * {
 *   type: 'lms_stats',
 *   label: 'LMS Overview',
 *   component: AsyncComponent,
 *   size: 'half' | 'full',
 *   priority: 10,
 * }
 */
export const DASHBOARD_WIDGETS = 'dashboard_widgets'


// ══════════════════════════════════════
// CONTENT
// ══════════════════════════════════════

/**
 * Action: before_content_save
 * Fires before content is saved. Can be used for validation.
 * @action
 * @param {string} contentType
 * @param {Object} data
 */
export const BEFORE_CONTENT_SAVE = 'before_content_save'

/**
 * Action: after_content_save
 * Fires after content is successfully saved.
 * @action
 * @param {string} contentType
 * @param {Object} data
 */
export const AFTER_CONTENT_SAVE = 'after_content_save'

/**
 * Action: before_content_delete
 * @action
 * @param {string} contentType
 * @param {number} id
 */
export const BEFORE_CONTENT_DELETE = 'before_content_delete'

/**
 * Action: after_content_delete
 * @action
 * @param {string} contentType
 * @param {number} id
 */
export const AFTER_CONTENT_DELETE = 'after_content_delete'

/**
 * Filter: content_render
 * Modify how content is rendered in the storefront.
 * @filter
 * @param {string} html - Current rendered HTML
 * @param {Object} content - Content object
 * @returns {string} Modified HTML
 */
export const CONTENT_RENDER = 'content_render'


// ══════════════════════════════════════
// STOREFRONT
// ══════════════════════════════════════

/**
 * Filter: storefront_sections
 * Register custom sections for the layout builder.
 * 
 * @filter
 * @param {Array} sections - Available section types
 * @returns {Array} Modified sections
 * 
 * Section shape:
 * {
 *   type: 'course_grid',
 *   label: 'Course Grid',
 *   icon: 'Grid3x3',
 *   component: SfCourseGrid,
 *   category: 'lms',
 * }
 */
export const STOREFRONT_SECTIONS = 'storefront_sections'

/**
 * Filter: storefront_blocks
 * Register custom blocks for the visual page builder.
 * @filter
 * @param {Array} blocks - Available block types
 * @returns {Array} Modified blocks
 */
export const STOREFRONT_BLOCKS = 'storefront_blocks'


// ══════════════════════════════════════
// PAGES & TOOLBAR
// ══════════════════════════════════════

/**
 * Filter: page_toolbar_actions
 * Add custom action buttons to content editor toolbar.
 * @filter
 * @param {Array} actions - Current toolbar actions
 * @param {Object} context - { contentType, contentId }
 * @returns {Array} Modified actions
 */
export const PAGE_TOOLBAR_ACTIONS = 'page_toolbar_actions'

/**
 * Filter: settings_tabs
 * Register settings tabs in admin settings page.
 * @filter
 * @param {Array} tabs - Current settings tabs
 * @returns {Array} Modified tabs
 */
export const SETTINGS_TABS = 'settings_tabs'


// ══════════════════════════════════════
// MODULE LIFECYCLE
// ══════════════════════════════════════

/**
 * Action: module_installed
 * Fires after a module is successfully installed.
 * @action
 * @param {string} moduleId
 * @param {Object} moduleInfo
 */
export const MODULE_INSTALLED = 'module_installed'

/**
 * Action: module_uninstalled
 * @action
 * @param {string} moduleId
 */
export const MODULE_UNINSTALLED = 'module_uninstalled'

/**
 * Action: module_activated
 * @action
 * @param {string} moduleId
 */
export const MODULE_ACTIVATED = 'module_activated'


// ══════════════════════════════════════
// AUTH & USER
// ══════════════════════════════════════

/**
 * Action: user_login
 * @action
 * @param {Object} user
 */
export const USER_LOGIN = 'user_login'

/**
 * Action: user_logout
 * @action
 */
export const USER_LOGOUT = 'user_logout'


// ══════════════════════════════════════
// ORDERS (for e-com plugins)
// ══════════════════════════════════════

/**
 * Action: order_created
 * @action
 * @param {Object} order
 */
export const ORDER_CREATED = 'order_created'

/**
 * Action: order_status_changed
 * @action
 * @param {Object} order
 * @param {string} oldStatus
 * @param {string} newStatus
 */
export const ORDER_STATUS_CHANGED = 'order_status_changed'
