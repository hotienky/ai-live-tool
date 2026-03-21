# Phase 9: Plugin SDK & Developer Platform 🛠️

> **Priority**: 🟢 Enhancement  
> **Duration**: 2 weeks  
> **Depends on**: Phase 1 (Hooks)

---

## Mục tiêu

Third-party developers có thể build, test, submit plugins/themes. Tạo ecosystem cho platform.

---

## Tasks

### 9.1 CLI Tool: `create-kac-plugin`

```bash
npx create-kac-plugin my-plugin
# → scaffolds plugin project with:
#    - src/components/
#    - src/index.js (hooks registration boilerplate)
#    - vite.config.js (pre-configured)
#    - package.json
#    - README.md
```

**Tạo mới**:
```
sdk/
  ├── create-plugin/
  │   ├── bin/create.js            ← CLI entry
  │   ├── template/                ← scaffold files
  │   │   ├── src/
  │   │   │   ├── components/
  │   │   │   │   └── ExampleTab.vue
  │   │   │   ├── helpers.js
  │   │   │   └── index.js
  │   │   ├── vite.config.js
  │   │   ├── package.json
  │   │   └── README.md
  │   └── package.json
  ├── types/
  │   ├── hooks.d.ts               ← TypeScript definitions
  │   ├── bridge.d.ts
  │   └── content-types.d.ts
  └── docs/
      ├── getting-started.md
      ├── hooks-reference.md
      ├── content-types.md
      ├── api-reference.md
      └── publishing.md
```

### 9.2 TypeScript Definitions

```typescript
// sdk/types/bridge.d.ts
interface AppBridge {
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  t: (key: string, fallback?: string) => string
  currentLang: Ref<string>
  formatCurrency: (amount: number) => string
  hooks: HookSystem
}

interface HookSystem {
  addAction: (hookName: string, callback: Function, priority?: number) => void
  addFilter: (hookName: string, callback: Function, priority?: number) => void
  doAction: (hookName: string, ...args: any[]) => Promise<void>
  applyFilters: (hookName: string, value: any, ...args: any[]) => any
}

// Available hook names
type HookName = 
  | 'sidebar_items'
  | 'admin_routes'
  | 'dashboard_widgets'
  | 'settings_tabs'
  | 'before_content_save'
  | 'after_content_save'
  | 'content_render'
  | 'page_toolbar_actions'
  | 'storefront_sections'
```

### 9.3 Plugin Development Mode

Hot-reload during development:
```bash
cd plugins/my-plugin
npm run dev
# → Watches for changes, auto-builds, hot-reloads in admin panel
```

**Modify**: `frontend/src/composables/usePluginLoader.js`
- Add dev mode: load plugin from local dev server instead of built bundle

### 9.4 Plugin Submission & Review

Backend flow:
1. Developer uploads plugin zip
2. Auto code scan (security checks)
3. Admin review queue
4. Approved → published to marketplace
5. Tenant can install

**Tạo mới**:
```
backend-laravel/app/Services/PluginReviewService.php
backend-laravel/app/Http/Controllers/Master/PluginSubmissionController.php
```

### 9.5 Developer Portal

Static site (or CMS pages):
- Getting started guide
- Hooks reference
- Content Types API
- REST API docs
- Plugin publishing guide
- Code examples

---

## Checklist

- [ ] Create `sdk/create-plugin/` CLI tool
- [ ] Plugin scaffold template
- [ ] TypeScript type definitions for bridge & hooks
- [ ] Plugin development mode (hot-reload)
- [ ] Plugin submission API
- [ ] Plugin review queue (master admin)
- [ ] Security scan automation
- [ ] Developer documentation (5+ guide pages)
- [ ] `npm publish` for `create-kac-plugin` package

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `sdk/` directory (CLI, types, docs) |
| **CREATE** | `backend-laravel/app/Services/PluginReviewService.php` |
| **CREATE** | `backend-laravel/app/Http/Controllers/Master/PluginSubmissionController.php` |
| **MODIFY** | `frontend/src/composables/usePluginLoader.js` — dev mode |
| **MODIFY** | `plugins/shared/vite.config.shared.js` — improve for SDK |
