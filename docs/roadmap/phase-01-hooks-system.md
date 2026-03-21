# Phase 1: Hooks & Filters System ⚡

> **Priority**: 🔴 Critical — Nền tảng cho mọi phase sau  
> **Duration**: 1–2 weeks  
> **Depends on**: Nothing  
> **Blocks**: Phase 2, 3, 9

---

## Mục tiêu

Tạo hệ thống hooks (actions + filters) cho cả frontend và backend, cho phép plugins:
- Thêm sidebar items mà KHÔNG sửa `App.vue`
- Đăng ký routes mà KHÔNG hardcode trong `routeToTab`
- Thêm dashboard widgets, settings tabs, toolbar buttons
- Intercept và modify dữ liệu trước/sau khi save

---

## Current State Analysis

### Frontend — File hiện tại cần thay đổi

| File | Vấn đề | Cần làm |
|------|--------|---------|
| `frontend/src/App.vue` (L455–L478) | `navItems` hardcoded, mỗi sidebar item phải sửa trực tiếp file này | Chuyển sang hook `sidebar_items` |
| `frontend/src/App.vue` (L513–L527) | `routeToTab` hardcoded ~40 routes | Chuyển sang hook `admin_routes` |
| `frontend/src/App.vue` (L528–L534) | `validViews` hardcoded | Auto-generate từ registered routes |
| `frontend/src/composables/usePluginLoader.js` (L19–L23) | `window.__APP_BRIDGE__` chỉ expose `apiFetch, showToast, t, formatCurrency` | Thêm hooks API |
| `plugins/*/src/index.js` | Plugins register vào `__PLUGIN_REGISTRY__` với components + sidebar config | Thêm hooks registration |

### Backend — File hiện tại cần thay đổi

| File | Vấn đề | Cần làm |
|------|--------|---------|
| `backend-laravel/app/Services/ModuleRegistry.php` | Module sidebar config lưu trong DB column `sidebar` | Giữ nguyên, frontend hooks sẽ đọc từ đây |
| Không có Events | Không có Laravel Events cho content CRUD | Tạo events |

---

## Detailed Tasks

### 1.1 Tạo `frontend/src/core/hooks.js`

```javascript
// frontend/src/core/hooks.js
class HookSystem {
  constructor() {
    this.actions = {}   // { hookName: [{ callback, priority }] }
    this.filters = {}   // { hookName: [{ callback, priority }] }
  }

  // === ACTIONS (side effects, no return value) ===
  addAction(hookName, callback, priority = 10) {
    if (!this.actions[hookName]) this.actions[hookName] = []
    this.actions[hookName].push({ callback, priority })
    this.actions[hookName].sort((a, b) => a.priority - b.priority)
  }

  async doAction(hookName, ...args) {
    const hooks = this.actions[hookName] || []
    for (const { callback } of hooks) {
      await callback(...args)
    }
  }

  removeAction(hookName, callback) {
    if (!this.actions[hookName]) return
    this.actions[hookName] = this.actions[hookName].filter(h => h.callback !== callback)
  }

  // === FILTERS (transform data, return modified value) ===
  addFilter(hookName, callback, priority = 10) {
    if (!this.filters[hookName]) this.filters[hookName] = []
    this.filters[hookName].push({ callback, priority })
    this.filters[hookName].sort((a, b) => a.priority - b.priority)
  }

  applyFilters(hookName, value, ...args) {
    const hooks = this.filters[hookName] || []
    let result = value
    for (const { callback } of hooks) {
      result = callback(result, ...args)
    }
    return result
  }

  removeFilter(hookName, callback) {
    if (!this.filters[hookName]) return
    this.filters[hookName] = this.filters[hookName].filter(h => h.callback !== callback)
  }
}

export const hooks = new HookSystem()
export default hooks
```

**Checklist:**
- [ ] Tạo file `frontend/src/core/hooks.js`
- [ ] Export singleton instance
- [ ] Unit test: register action → doAction → callback called
- [ ] Unit test: register filter → applyFilters → value transformed
- [ ] Unit test: priority ordering works
- [ ] Unit test: removeAction / removeFilter works

### 1.2 Expose Hooks qua Plugin Bridge

**File**: `frontend/src/composables/usePluginLoader.js`

```javascript
// Line 7 — thêm import
import hooks from '../core/hooks.js'

// Line 22 — thêm hooks vào bridge
window.__APP_BRIDGE__ = { 
  apiFetch, showToast, t, currentLang, formatCurrency, 
  currencyLocale, currencySymbol,
  // NEW: Hooks API
  hooks: {
    addAction: hooks.addAction.bind(hooks),
    addFilter: hooks.addFilter.bind(hooks),
    doAction: hooks.doAction.bind(hooks),
    applyFilters: hooks.applyFilters.bind(hooks),
  }
}
```

Cũng expose qua `window.__APP_HOOKS__` cho backward compatibility:
```javascript
window.__APP_HOOKS__ = hooks
```

**Checklist:**
- [ ] Import hooks trong `usePluginLoader.js`
- [ ] Thêm hooks vào `window.__APP_BRIDGE__`
- [ ] Thêm `window.__APP_HOOKS__` global

### 1.3 Định nghĩa Core Hook Points

Tạo file `frontend/src/core/hook-names.js` để document tất cả available hooks:

```javascript
// frontend/src/core/hook-names.js
export const HOOKS = {
  // ── Sidebar ──
  SIDEBAR_ITEMS: 'sidebar_items',         // filter(items) → items
  SIDEBAR_BOTTOM_ITEMS: 'sidebar_bottom', // filter(items) → items

  // ── Routes ──
  ADMIN_ROUTES: 'admin_routes',           // filter({ routeToTab, validViews }) → { routeToTab, validViews }
  
  // ── Dashboard ──
  DASHBOARD_WIDGETS: 'dashboard_widgets', // filter(widgets) → widgets
  DASHBOARD_STATS: 'dashboard_stats',     // filter(stats) → stats



  // ── Settings ──
  SETTINGS_TABS: 'settings_tabs',         // filter(tabs) → tabs
  
  // ── Content ──
  BEFORE_CONTENT_SAVE: 'before_content_save', // action(type, data)
  AFTER_CONTENT_SAVE: 'after_content_save',   // action(type, data, response)
  BEFORE_CONTENT_DELETE: 'before_content_delete', // action(type, id)
  AFTER_CONTENT_DELETE: 'after_content_delete',   // action(type, id)
  CONTENT_RENDER: 'content_render',       // filter(html, type) → html
  
  // ── Page Toolbar ──
  PAGE_TOOLBAR_ACTIONS: 'page_toolbar_actions', // filter(actions, context) → actions
  
  // ── Plugin Lifecycle ──
  PLUGIN_LOADED: 'plugin_loaded',         // action(moduleId, plugin)
  PLUGIN_UNLOADED: 'plugin_unloaded',     // action(moduleId)
}
```

**Checklist:**
- [ ] Tạo `frontend/src/core/hook-names.js`
- [ ] Document mỗi hook: input type, output type, khi nào được gọi

### 1.4 Refactor `App.vue` — Sidebar qua Hooks

**File**: `frontend/src/App.vue`

**Hiện tại** (L455–L478):
```javascript
const navItems = [
  { key: 'live-group', label: 'Live', icon: MonitorPlay, ... },
  { key: 'shop/products', label: 'Cửa hàng', icon: Store, ... },
]
```

**Sau refactor**:
```javascript
import hooks from './core/hooks.js'
import { HOOKS } from './core/hook-names.js'

// Core nav items (chỉ giữ core features)
const coreNavItems = [
  { key: 'live-group', label: 'Live', icon: MonitorPlay, featureGroup: 'livestream', ... },
]

// Computed: merge core + plugin nav items via hooks
const navItems = computed(() => {
  return hooks.applyFilters(HOOKS.SIDEBAR_ITEMS, [...coreNavItems])
})
```

**Hiện tại** (L513–L527) — `routeToTab` hardcoded:
```javascript
const routeToTab = {
  'shop/products': 'products', ...
}
```

**Sau refactor**:
```javascript
const coreRouteToTab = {
  'live/keywords': 'keywords', 'live/replies': 'replies',
  // ... chỉ core routes
}

const routeToTab = computed(() => {
  const registered = hooks.applyFilters(HOOKS.ADMIN_ROUTES, {
    routeToTab: { ...coreRouteToTab },
    validViews: ['dashboard', 'live', 'crm', 'reports', 'notifications'],
  })
  return registered.routeToTab
})
```

**Checklist:**
- [ ] Import hooks trong App.vue
- [ ] Refactor `navItems` → `coreNavItems` + `hooks.applyFilters`
- [ ] Refactor `routeToTab` → computed via hooks
- [ ] Refactor `validViews` → auto-generated từ routeToTab
- [ ] Test: core nav items still work
- [ ] Test: plugin adds sidebar item via hook

### 1.5 Update Existing Plugins to Use Hooks

**File**: `plugins/accounting/src/index.js` (và tương tự cho 4 plugins khác)

**Hiện tại**:
```javascript
window.__PLUGIN_REGISTRY__['accounting'] = {
  components: { 'accounting': AccountingDashboard },
  sidebar: {
    group: 'Bán hàng',
    items: [
      { key: 'accounting', label: 'Kế toán', icon: 'DollarSign', route: 'orders/accounting' },
    ]
  }
}
```

**Sau refactor** — thêm hooks registration:
```javascript
const { hooks } = window.__APP_BRIDGE__

// Register sidebar items via hooks
hooks.addFilter('sidebar_items', (items) => {
  items.push({
    key: 'orders/accounting', 
    label: bridge.t('admin.accounting', 'Kế toán'), 
    icon: 'DollarSign',
    group: 'Bán hàng',
    moduleId: 'accounting',
  })
  return items
})

// Register routes
hooks.addFilter('admin_routes', (config) => {
  config.routeToTab['orders/accounting'] = 'accounting'
  config.validViews.push('orders/accounting')
  return config
})

// Still register component
window.__PLUGIN_REGISTRY__['accounting'] = {
  components: { 'accounting': AccountingDashboard },
}
```

**Checklist:**
- [ ] Update `plugins/accounting/src/index.js`
- [ ] Update `plugins/cms/src/index.js`
- [ ] Update `plugins/marketing/src/index.js`
- [ ] Update `plugins/tax/src/index.js`
- [ ] Update `plugins/warehouse/src/index.js`
- [ ] Build all plugins: `cd plugins && node build-all.js`
- [ ] Test: install module → sidebar appears
- [ ] Test: uninstall module → sidebar disappears

### 1.6 Backend — Laravel Events

**Tạo mới:**

```
backend-laravel/app/Events/
  ├── ContentSaved.php
  ├── ContentDeleted.php
  ├── MediaUploaded.php
  ├── MediaDeleted.php
  ├── UserLoggedIn.php
  ├── ModuleInstalled.php
  ├── ModuleUninstalled.php
  └── PagePublished.php
```

**Example** `ContentSaved.php`:
```php
<?php
namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;

class ContentSaved
{
    use Dispatchable;
    
    public function __construct(
        public string $contentType,  // 'page', 'product', 'post'
        public int $contentId,
        public array $data,
        public ?int $userId = null,
    ) {}
}
```

**Dispatch trong controllers:**

File `backend-laravel/app/Http/Controllers/Tenant/CmsPagesController.php`:
```php
// After saving page
ContentSaved::dispatch('page', $page->id, $page->toArray(), auth()->id());
```

File `backend-laravel/app/Http/Controllers/Tenant/ModuleController.php`:
```php
// After install
ModuleInstalled::dispatch($moduleId, $this->tenantId());
// After uninstall  
ModuleUninstalled::dispatch($moduleId, $this->tenantId());
```

**Checklist:**
- [ ] Tạo 8 Event classes
- [ ] Dispatch `ContentSaved` trong `CmsPagesController` (store, update)
- [ ] Dispatch `ContentDeleted` trong `CmsPagesController` (destroy)
- [ ] Dispatch `MediaUploaded` trong `MediaController`
- [ ] Dispatch `ModuleInstalled` / `ModuleUninstalled` trong `ModuleController`
- [ ] Dispatch `UserLoggedIn` trong `AuthController`
- [ ] Register events trong `EventServiceProvider`

---

## Testing Checklist

- [ ] Plugin thêm sidebar item qua hooks → hiển thị trong nav
- [ ] Plugin thêm route → navigate tới route hoạt động
- [ ] Uninstall plugin → sidebar item biến mất
- [ ] Multiple plugins đăng ký sidebar → tất cả hiển thị đúng thứ tự
- [ ] Priority ordering works (plugin A priority 5 hiển thị trước plugin B priority 20)
- [ ] Laravel Events fire đúng timing
- [ ] Build production: `npx vite build` passed

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `frontend/src/core/hooks.js` |
| **CREATE** | `frontend/src/core/hook-names.js` |
| **CREATE** | `backend-laravel/app/Events/ContentSaved.php` |
| **CREATE** | `backend-laravel/app/Events/ContentDeleted.php` |
| **CREATE** | `backend-laravel/app/Events/MediaUploaded.php` |
| **CREATE** | `backend-laravel/app/Events/MediaDeleted.php` |
| **CREATE** | `backend-laravel/app/Events/UserLoggedIn.php` |
| **CREATE** | `backend-laravel/app/Events/ModuleInstalled.php` |
| **CREATE** | `backend-laravel/app/Events/ModuleUninstalled.php` |
| **CREATE** | `backend-laravel/app/Events/PagePublished.php` |
| **MODIFY** | `frontend/src/App.vue` — refactor navItems, routeToTab |
| **MODIFY** | `frontend/src/composables/usePluginLoader.js` — expose hooks |
| **MODIFY** | `plugins/accounting/src/index.js` |
| **MODIFY** | `plugins/cms/src/index.js` |
| **MODIFY** | `plugins/marketing/src/index.js` |
| **MODIFY** | `plugins/tax/src/index.js` |
| **MODIFY** | `plugins/warehouse/src/index.js` |
| **MODIFY** | `backend-laravel/app/Http/Controllers/Tenant/CmsPagesController.php` |
| **MODIFY** | `backend-laravel/app/Http/Controllers/Tenant/MediaController.php` |
| **MODIFY** | `backend-laravel/app/Http/Controllers/Tenant/ModuleController.php` |
| **MODIFY** | `backend-laravel/app/Http/Controllers/Tenant/AuthController.php` |
