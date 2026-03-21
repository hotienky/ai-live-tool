# 🚀 PLATFORM ROADMAP — Managed SaaS CMS Platform

> **Vision**: Build a general-purpose, multi-tenant, managed SaaS CMS platform —  
> combining the flexibility of WordPress, the simplicity of Shopify, and the API power of Strapi —  
> with native Vietnamese market features and headless CMS capabilities.

---

## 🏛️ Business Model — Managed SaaS CMS

### Mô hình tổng quan

```
┌──────────────────────────────────────────────────────────────────┐
│                    YOUR PLATFORM (Master Admin)                  │
│                                                                  │
│   ┌────────────┐   ┌────────────┐   ┌────────────┐              │
│   │  Tenant A  │   │  Tenant B  │   │  Tenant C  │   ...N       │
│   │  shop.com  │   │  blog.vn   │   │  lms.io    │              │
│   │  E-com     │   │  Blog      │   │  Courses   │              │
│   │  5 modules │   │  3 modules │   │  4 modules │              │
│   └────────────┘   └────────────┘   └────────────┘              │
│                                                                  │
│   ┌─── Platform Owner (Bạn) quản lý ──────────────────────────┐ │
│   │ • Server, Infrastructure, Scaling                          │ │
│   │ • Security, Backups, Disaster Recovery                     │ │
│   │ • Platform Updates & Patches                               │ │
│   │ • Module Marketplace (curation, review, revenue share)     │ │
│   │ • Billing, Subscriptions, Invoicing                        │ │
│   │ • Tenant provisioning (create/suspend/upgrade/delete)      │ │
│   │ • Support system                                           │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   ┌─── Tenant (Khách hàng) tự quản lý ────────────────────────┐ │
│   │ • Nội dung: Pages, Posts, Products, Courses...             │ │
│   │ • Giao diện: Theme, Layout Builder, Colors, Fonts          │ │
│   │ • Modules: Install / Uninstall / Configure                 │ │
│   │ • Domain: Custom domain mapping                            │ │
│   │ • Users & Roles: Team members, permissions                 │ │
│   │ • API Keys: Headless mode, integrations                    │ │
│   │ • Webhooks: Event notifications                            │ │
│   │ • Languages: Multi-language content                        │ │
│   └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│   ┌─── Developer (Bên thứ 3) ─────────────────────────────────┐ │
│   │ • Build plugins via Plugin SDK                             │ │
│   │ • Build themes via Theme SDK                               │ │
│   │ • Submit to Marketplace                                    │ │
│   │ • Earn revenue (70/30 split)                               │ │
│   │ • Access API docs & developer portal                       │ │
│   └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Revenue Streams

| # | Stream | Mô tả | Phase |
|---|--------|-------|-------|
| 1 | **Subscription Plans** | Monthly/yearly plans (Free → Enterprise) | Phase 8 |
| 2 | **Module Marketplace** | Commission 30% từ paid plugins/themes | Phase 8, 9 |
| 3 | **Custom Domain** | Tính phí custom domain (included in paid plans) | Phase 8 |
| 4 | **API Usage** | Rate-limited, pay-per-use cho API calls vượt quota | Phase 5, 8 |
| 5 | **Storage Overage** | Extra storage beyond plan limit | Phase 8 |
| 6 | **Enterprise Services** | Dedicated hosting, SLA, custom development | Phase 8 |
| 7 | **White-label** | Tenants rebrand platform cho khách hàng riêng (future) | Phase 10 |

### Business Model → Phase Mapping

Mỗi yêu cầu kinh doanh phải được đáp ứng bởi phase cụ thể:

| Yêu cầu kinh doanh | Status | Thực hiện tại |
|---------------------|--------|---------------|
| **INFRASTRUCTURE** | | |
| Multi-tenant isolation | ✅ Đã có | Laravel Tenancy |
| Tenant provisioning (create/suspend) | ✅ Đã có | Master Admin |
| Custom domain per tenant | 🔶 Cần hoàn thiện | Phase 7 + nginx config |
| SSL auto-provisioning | ❌ Chưa có | Phase 10.4 |
| Auto backup & restore | ❌ Chưa có | Phase 10.4 |
| Resource monitoring per tenant | ❌ Chưa có | Phase 8.2 |
| **CMS CORE** | | |
| Pages & Rich Text Editor | ✅ Đã có | — |
| Media Library (cloud storage) | ✅ Đã có | — |
| Navigation Menu builder | ✅ Đã có | — |
| Multi-language (i18n) | ✅ Đã có | — |
| User Roles & Permissions | ✅ Đã có | — |
| Theme Customizer | ✅ Basic | Phase 6 nâng cấp |
| Layout Builder (sections) | ✅ Đã có | — |
| Custom Fields | ✅ Đã có | Phase 3 nâng cấp |
| **GENERAL-PURPOSE** | | |
| Plugin/Module system | ✅ Done | Phase 1 ✅ — `hooks.js`, `hook-names.js`, 7 plugins |
| Dynamic Content Types | ✅ Done | Phase 3 ✅ — `ContentTypeRegistry`, `contents` table |
| Blog module | ✅ Done | Phase 4 ✅ — `plugins/blog/`, controllers, comments, RSS |
| E-com as optional module | ✅ Done | Phase 2 ✅ — `plugins/ecom/` via hooks |
| Theme marketplace | ❌ Chưa có | Phase 6 |
| Site type templates | ❌ Chưa có | Phase 7 |
| Onboarding wizard | ❌ Chưa có | Phase 7 |
| **HEADLESS CMS** | | |
| Public REST API v1 | ❌ Chưa có | Phase 5 |
| API key management | ✅ Basic | Phase 5 nâng cấp |
| Rate limiting per plan | ❌ Chưa có | Phase 5 |
| API documentation | ❌ Chưa có | Phase 5.2 |
| Webhooks (event-driven) | ✅ Basic | Phase 5.3 nâng cấp |
| SDK (npm package) | ❌ Chưa có | Phase 9 |
| **MONETIZATION** | | |
| Subscription plans | ❌ Chưa có | Phase 8 |
| Payment gateway (VNPay/MoMo) | ❌ Chưa có | Phase 8 |
| Auto-invoicing | ❌ Chưa có | Phase 8 |
| Feature gating per plan | ❌ Chưa có | Phase 8 |
| Usage tracking | ❌ Chưa có | Phase 8 |
| Module marketplace revenue | ❌ Chưa có | Phase 8, 9 |
| **ECOSYSTEM** | | |
| Hooks system (plugin interop) | ✅ Done | Phase 1 ✅ — `addFilter`, `addAction`, `applyFilters`, `doAction` |
| Plugin SDK & CLI | ❌ Chưa có | Phase 9 |
| Theme SDK | ❌ Chưa có | Phase 9 |
| Developer portal & docs | ❌ Chưa có | Phase 9 |
| Community / Forum | ❌ Chưa có | Phase 10 |

### Subscription Plans (dự kiến)

| Plan | Giá | Sites | Pages | Storage | Modules | API | Domain |
|------|-----|-------|-------|---------|---------|-----|--------|
| **Free** | 0đ | 1 | 5 | 500MB | 3 free | ❌ | subdomain |
| **Starter** | 99k/mo | 1 | 50 | 2GB | All free | 100/hr | 1 custom |
| **Pro** | 299k/mo | 3 | ∞ | 10GB | All free + 3 paid | 1000/hr | 3 custom |
| **Business** | 699k/mo | 10 | ∞ | 50GB | All | 10000/hr | ∞ custom |
| **Enterprise** | Custom | ∞ | ∞ | ∞ | All + custom | ∞ | ∞ + SLA |

### Competitive Advantages (USP)

| So với | Lợi thế của bạn |
|--------|-----------------|
| **WordPress.com** | Modern stack (Vue + Laravel), native e-commerce, better plugin isolation, real-time features |
| **Shopify** | General-purpose (not just e-commerce), headless API, content types, cheaper pricing |
| **Webflow** | Plugin marketplace, e-commerce built-in, Vietnamese market features, developer API |
| **Strapi** | Managed hosting (customer no need to manage server), visual builder, module marketplace |
| **Wix** | Open plugin ecosystem, API-first, headless mode, developer-friendly |
| **All above** | Livestream commerce, Vietnamese tax/accounting/shipping, multi-tenant SaaS model |

---

## 📊 Current State Assessment

### ✅ What We Have (Core Foundation)
| Component | Status | Files |
|-----------|--------|-------|
| Multi-tenancy | ✅ Working | Laravel Tenancy, `Tenant.php` |
| Auth & Roles | ✅ Working | `AuthController`, `RolesController`, `RoleManager.vue` |
| CMS Pages | ✅ Working | `CmsPagesController`, `CmsPageForm.vue`, `RichTextEditor.vue` |
| Media Library | ✅ Working | `MediaController`, `MediaLibrary.vue`, cloud storage |
| Navigation Menus | ✅ Working | `NavLinksController`, `NavLinkManager.vue` |
| i18n (vi/en/ja) | ✅ Working | `useI18n.js`, 2326 translation keys |
| Theme System | ✅ Basic | `ThemeCustomizer.vue`, CSS variables |
| Layout Builder | ✅ Working | `StorefrontLayoutBuilder.vue`, section-based |
| Hooks & Filters | ✅ Working | `frontend/src/core/hooks.js`, `hook-names.js` |
| Plugin System | ✅ Working | `usePluginLoader.js`, `ModuleRegistry.php`, **7 plugins** |
| Content Type System | ✅ Working | `ContentTypeRegistry.php`, `ContentController.php`, `contents` table |
| Custom Fields | ✅ Working | `CustomFieldsController`, `CustomFieldManager.vue` |
| API Keys | ✅ Working | `ApiKeysController`, `ApiKeyManager.vue` |
| Webhooks | ✅ Basic | `WebhooksController`, `WebhookManager.vue` |
| Notifications | ✅ Working | Pusher/WebSocket, bell + page |

### ✅ Plugin Packages (Phase 1 & 2 Done)
| Plugin | Status | Notes |
|--------|--------|-------|
| `plugins/ecom` | ✅ Done | Products, Orders, Customers — via hooks |
| `plugins/shipping` | ✅ Done | Shipments, Shipping settings |
| `plugins/warehouse` | ✅ Done | Stock, Suppliers, Inventory |
| `plugins/accounting` | ✅ Done | Journal, Invoices, Payment vouchers |
| `plugins/marketing` | ✅ Done | Promotions, Flash Sales |
| `plugins/tax` | ✅ Done | Tax settings |
| `plugins/cms` | ✅ Done | CMS core plugin |

### ✅ Blog Module (Phase 4 — Completed)
| Component | Status | Notes |
|-----------|--------|-------|
| `BlogController.php` | ✅ Done | RSS feed, post list, single post |
| `CommentController.php` | ✅ Done | Comment CRUD + moderation |
| `Comment.php` model | ✅ Done | SoftDeletes, nested, scopes |
| Admin routes | ✅ Done | `tenantModules/blog.php` |
| Storefront routes | ✅ Done | `storefrontModules/blog.php` (no auth) |
| `comments` migration | ✅ Done | `migrations/modules/blog/` |
| `plugins/blog/` package | ✅ Done | IIFE bundle 31.56 KB |
| `PostList.vue` | ✅ Done | Search, filter, pagination |
| `PostEditor.vue` | ✅ Done | SEO, taxonomies, revisions |
| `CommentManager.vue` | ✅ Done | Approve/spam/delete, counts |
| `BlogSettings.vue` | ✅ Done | RSS, comments, SEO config |
| Sidebar via hooks | ✅ Done | Posts, Categories, Comments, Settings |
| Storefront components | 🔶 Deferred | `SfBlogSection.vue`, `SfPostPage.vue` (Phase 6) |

### 🔴 Missing for General-Purpose CMS
- Public REST API (versioned, documented) — Phase 5
- Theme marketplace — Phase 6
- Site type templates / onboarding — Phase 7
- Billing & subscriptions management — Phase 8
- Plugin SDK & developer docs — Phase 9
- CustomFields → Content Type system merge — Phase 3 backlog
- Storefront blog components (SfBlogSection, SfPostPage) — Phase 6 backlog

---

## 🗺️ PHASE BREAKDOWN

---

## Phase 1: Hooks & Filters System ⚡ ✅ COMPLETED
**Priority**: 🔴 Critical — Foundation for everything else
**Status**: ✅ Done — 2026-03-21
**Goal**: Enable plugins to intercept and modify core behavior

### 1.1 Frontend Hooks (JavaScript)
```
📁 frontend/src/core/hooks.js
📁 frontend/src/core/hook-names.js
```

**Tasks:**
- [x] Create `hooks.js` — central event/filter bus
  - `addAction(hookName, callback, priority)` — register side-effect
  - `doAction(hookName, ...args)` — trigger all registered callbacks
  - `addFilter(hookName, callback, priority)` — register data transformer
  - `applyFilters(hookName, value, ...args)` — pipe value through all transformers
  - `removeAction(hookName, callback)` / `removeFilter(hookName, callback)`
- [x] Expose via `window.__APP_HOOKS__` in plugin bridge
- [x] Core hook points:
  - `sidebar_items` — filter: plugins add/modify sidebar items
  - `admin_routes` — filter: plugins register custom routes
  - `page_toolbar_actions` — filter: plugins add toolbar buttons
  - `before_page_save` / `after_page_save` — action
  - `content_render` — filter: modify rendered content
  - `dashboard_widgets` — filter: plugins add dashboard cards
  - `settings_tabs` — filter: plugins add settings sections
- [x] Update `usePluginLoader.js` to expose hooks to plugins
- [x] Update existing plugins to use hooks instead of hardcoded sidebar

### 1.2 Backend Hooks (Laravel Events)
```
📁 backend-laravel/app/Events/
📁 backend-laravel/app/Listeners/
```

**Tasks:**
- [ ] Create Laravel events for core actions:
  - `ContentSaved`, `ContentDeleted`
  - `MediaUploaded`
  - `UserLoggedIn`, `UserCreated`
  - `ModuleInstalled`, `ModuleUninstalled`
  - `PagePublished`
- [ ] Create `HookRegistry` service for runtime filter registration
- [ ] Allow plugins to register event listeners via module config

> **Note**: Backend Laravel events chưa implement — frontend hooks đã đủ cho giai đoạn hiện tại. Backend events sẽ làm khi cần webhook/event-driven features (Phase 5.3).

### 1.3 Tests
- [ ] Unit tests for hooks system (register, trigger, priority ordering)
- [ ] Integration test: plugin registers sidebar via hook

---

## Phase 2: Tách E-commerce ra Plugin 📦 ✅ COMPLETED
**Priority**: 🔴 Critical — Core phải agnostic
**Status**: ✅ Done — 2026-03-21
**Goal**: Core chỉ giữ CMS features, e-commerce thành optional module package

### 2.1 Plugin Packages Created
```
📁 plugins/ecom/        ✅ — Products, Orders, Customers, Categories, Brands
📁 plugins/shipping/    ✅ — Shipments, Shipping settings
📁 plugins/warehouse/   ✅ — Stock, Suppliers, Inventory reports
📁 plugins/accounting/  ✅ — Journal, Invoices, Payment vouchers
📁 plugins/marketing/   ✅ — Promotions, Flash Sales
📁 plugins/tax/         ✅ — Tax settings
📁 plugins/cms/         ✅ — CMS core plugin
```

**Tasks:**
- [x] Create `plugins/ecom/` scaffold
- [x] Move e-commerce Vue components → `plugins/ecom/src/components/`
- [x] Register ecom sidebar items via hooks system (`hooks.addFilter('sidebar_items', ...)`)
- [x] Register ecom routes via hooks system (`hooks.addFilter('admin_routes', ...)`)
- [x] Move e-commerce related API routes to conditionally load based on module installation
- [x] Update `App.vue` — remove hardcoded e-commerce component imports
- [x] Replace direct component references with `PluginRenderer.vue` for ecom views
- [ ] Test: fresh tenant without ecom module → no e-commerce UI visible
- [ ] Test: install ecom module → all e-commerce features available

### 2.2 Plugin Packages: `shipping`, `warehouse`, `accounting`, `marketing`, `tax`
- [x] All moved to `plugins/` as independent buildable packages

### 2.3 Cleanup Core Frontend
- [x] `App.vue` only imports CMS-core components
- [x] Sidebar items come from hooks
- [x] Route handling via dynamic registration

### 2.4 Database Considerations
- [x] E-commerce tables stay in tenant DB
- [x] Core migration only creates CMS tables
- [x] Each plugin can define its own migrations (`migrations/modules/`)
- [ ] `ModuleMigration` auto-run system on module install/uninstall

---

## Phase 3: Content Type System 📐 ✅ LARGELY DONE
**Priority**: 🟡 High — Enables Blog, LMS, Booking, etc.
**Status**: ✅ Core done — 2026-03-21 | 🔶 Some items pending
**Goal**: Dynamic content types that plugins can register

### 3.1 Backend — Content Type Registry ✅
```
📁 backend-laravel/app/Services/ContentTypeRegistry.php        ✅
📁 backend-laravel/app/Http/Controllers/Tenant/ContentController.php  ✅
📁 backend-laravel/app/Models/Content.php                      ✅
📁 backend-laravel/app/Models/ContentRevision.php              ✅
📁 backend-laravel/app/Models/ContentTaxonomy.php              ✅
📁 backend-laravel/database/migrations/tenant/2026_03_21_100000_create_contents_table.php  ✅
```

**Tasks:**
- [x] Design `contents` table (polymorphic content storage):
  ```sql
  contents: id, type, slug, title, body, status, author_id,
            meta (JSONB), published_at, created_at, updated_at
  content_taxonomies: id, content_id, taxonomy, term
  ```
- [x] `ContentTypeRegistry` service:
  - `register(type, config)` — plugin registers a content type
  - `get(type)` / `all()` / `exists(type)`
  - `getValidationRules(type)` — auto-generate from config
  - `getTaxonomies(type)`
- [x] Generic `ContentController` with CRUD for any content type
- [x] Support field types: text, richtext, number, date, media, select, relation, json, currency
- [x] Taxonomy system: categories + tags per content type (`ContentTaxonomy`)
- [x] Validation rules per field
- [x] Revision history model (`ContentRevision`)

### 3.2 Frontend — Dynamic Content Editor ✅
```
📁 frontend/src/components/ContentEditor.vue        ✅
📁 frontend/src/components/ContentList.vue          ✅
📁 frontend/src/components/ContentFieldRenderer.vue ✅
```

**Tasks:**
- [x] `ContentList.vue` — generic list view for any content type
- [x] `ContentEditor.vue` — dynamic form generated from content type field definitions
- [x] `ContentFieldRenderer.vue` — renders field based on type
- [ ] Support for custom field layouts (sections, tabs)
- [ ] Preview capability
- [ ] Revision history UI

### 3.3 Integrate with Custom Fields Module
- [ ] Merge `CustomFieldManager` logic into Content Type system
- [ ] Custom Fields becomes the UI for managing content type field definitions

---

## Phase 4: Blog Module 📝 ✅ COMPLETED
**Priority**: 🟡 High — First "non-ecom" use case, proves platform is general-purpose
**Status**: ✅ Done — 2026-03-21
**Goal**: Full blog functionality via plugin + content types

### Status
| Component | Status | File |
|-----------|--------|------|
| `post` content type registered | ✅ Done | `AppServiceProvider` |
| `BlogController.php` | ✅ Done | RSS feed, posts list, single post by slug |
| `CommentController.php` | ✅ Done | index, approve, spam, destroy, store, forContent |
| `Comment.php` model | ✅ Done | SoftDeletes, scopes: approved, pending, topLevel |
| Admin routes | ✅ Done | `routes/tenantModules/blog.php` — comment moderation |
| Storefront routes | ✅ Done | `routes/storefrontModules/blog.php` — RSS, posts, comments (no auth) |
| Post CRUD (admin) | ✅ Done | Via generic `/content/post/*` (ContentController) |
| `comments` migration | ✅ Done | `migrations/modules/blog/` |
| `plugins/blog/` package | ✅ Done | IIFE bundle 31.56 KB + 14.82 KB CSS |
| `PostList.vue` | ✅ Done | Search, category filter, status filter, pagination |
| `PostEditor.vue` | ✅ Done | SEO, taxonomies, revisions, auto-excerpt, reading time |
| `CommentManager.vue` | ✅ Done | Approve/spam/delete, nested replies, moderation counts |
| `BlogSettings.vue` | ✅ Done | RSS, comments, SEO config |
| Hooks registration | ✅ Done | Sidebar: Posts, Categories, Comments, Settings |
| Blog module in `ModuleSeeder` | ✅ Done | Seeded to all tenants |
| Storefront Vue components | 🔶 Deferred | `SfBlogSection.vue`, `SfPostPage.vue` → Phase 6 |

### 4.1 Plugin: `blog` ✅
```
📁 plugins/blog/
  ├── src/
  │   ├── components/
  │   │   ├── PostEditor.vue        ✅ — blog post editor with SEO + taxonomies
  │   │   ├── PostList.vue          ✅ — post management with filters
  │   │   ├── CommentManager.vue    ✅ — moderation UI
  │   │   └── BlogSettings.vue      ✅ — RSS, comments, SEO config
  │   ├── helpers.js                ✅ — bridge wrapper
  │   └── index.js                  ✅ — hooks (sidebar_items, admin_routes)
  ├── vite.config.js                ✅
  ├── package.json                  ✅
  └── dist/
      ├── bundle.js                 ✅ (31.56 KB)
      └── style.css                 ✅ (14.82 KB)
```

**Tasks:**
- [x] `post` content type schema: title, slug, body, excerpt, featured_image, categories, tags, author, status
- [x] RSS feed endpoint (`BlogController::rss`)
- [x] Storefront: public posts list + single post by slug
- [x] Comment model + controller (admin moderation + storefront submit)
- [x] Storefront routes: `/blog/posts`, `/blog/rss`, `/blog/comments`
- [x] Create `plugins/blog/` package scaffold
- [x] `plugins/blog/src/index.js` — register sidebar + routes via hooks
- [x] Blog-specific features:
  - [x] RSS feed generation
  - [x] Excerpt auto-generation (first 160 chars)
  - [x] Reading time auto-calculation (words / 200)
  - [x] Comment moderation UI (CommentManager)
  - [x] Featured post toggle
- [ ] Future improvements (backlog):
  - [ ] Move `post` type registration to `BlogServiceProvider`
  - [ ] Related posts
  - [ ] Social sharing meta tags
  - [ ] SEO: auto sitemap for posts, structured data

### 4.2 Storefront Components — Deferred to Phase 6
```
📁 plugins/blog/src/storefront/     (future)
  ├── SfBlogSection.vue       — latest posts grid
  ├── SfPostPage.vue          — single post view (+ comment form)
  └── SfPostSidebar.vue       — categories, tags, recent posts
```

---

## Phase 5: Public REST API v1 🌐
**Priority**: 🟡 High — Enables headless mode
**Duration**: 2–3 weeks
**Goal**: Versioned, documented, rate-limited public API

> **Lợi thế từ Phase 3**: `ContentTypeRegistry` + `ContentController` generic đã sẵn sàng. Phase 5 chủ yếu là wrap lại với versioning, auth (API key), rate limiting và response format chuẩn — không cần build from scratch.

### 5.1 API Architecture
```
📁 backend-laravel/app/Http/Controllers/Api/V1/
  ├── ContentController.php     — expose ContentController generic ra public API
  ├── MediaController.php       — Media files
  ├── MenuController.php        — Navigation menus
  ├── SiteController.php        — Site config, theme, settings
  ├── TaxonomyController.php    — Categories, tags
  └── SearchController.php      — Full-text search
```

**Tasks:**
- [ ] Design API v1 endpoint structure:
  ```
  # Public (read-only, API key required)
  GET    /api/v1/content/{type}              → Paginated list
  GET    /api/v1/content/{type}/{slug}       → Single item
  GET    /api/v1/taxonomies/{type}           → Categories/tags
  GET    /api/v1/media/{id}                  → Media file info
  GET    /api/v1/menus/{location}            → Navigation
  GET    /api/v1/site                        → Site config
  GET    /api/v1/search?q=                   → Full-text search

  # Authenticated (Bearer token)
  POST   /api/v1/content/{type}              → Create
  PUT    /api/v1/content/{type}/{id}         → Update
  DELETE /api/v1/content/{type}/{id}         → Delete
  POST   /api/v1/media                       → Upload
  
  # E-commerce (if ecom module installed)
  GET    /api/v1/products
  GET    /api/v1/products/{slug}
  POST   /api/v1/cart
  POST   /api/v1/checkout
  GET    /api/v1/orders (authenticated)
  ```
- [ ] API key authentication (per-tenant)
- [ ] Rate limiting (tier-based: Free=100/hr, Pro=1000/hr, Business=10000/hr)
- [ ] Response format standardization (JSON:API or custom envelope)
- [ ] Pagination: cursor-based for large datasets
- [ ] Filtering: `?filter[status]=published&filter[category]=tech`
- [ ] Field selection: `?fields=title,slug,excerpt,featured_image`
- [ ] Include relations: `?include=author,categories`
- [ ] Caching: ETags, conditional requests
- [ ] CORS configuration per tenant

### 5.2 API Documentation
- [ ] Auto-generated OpenAPI/Swagger spec
- [ ] Interactive API playground (Swagger UI or custom)
- [ ] SDK generation: `npm install @kac-cms/sdk`
- [ ] Code examples: fetch, axios, Next.js, Nuxt

### 5.3 Webhooks Enhancement
- [ ] Webhook events for all content CRUD operations
- [ ] Webhook delivery retry with exponential backoff
- [ ] Webhook logs (last N deliveries with status)
- [ ] Webhook secret signing (HMAC)

---

## Phase 6: Theme Marketplace 🎨
**Priority**: 🟠 Medium  
**Duration**: 2–3 weeks  
**Goal**: Tenants can choose, preview, and switch themes

### 6.1 Theme Engine
```
📁 backend-laravel/app/Services/ThemeEngine.php
📁 themes/
  ├── starter/               → Minimal landing page
  │   ├── theme.json         → { name, version, sections, colors }
  │   ├── sections/          → Vue SFC section components
  │   ├── layouts/           → Page layouts
  │   ├── preview.png        → Theme preview screenshot
  │   └── style.css          → Theme styles
  ├── ecommerce-modern/      → E-commerce focused
  ├── blog-magazine/         → Blog/magazine layout
  ├── portfolio-minimal/     → Portfolio showcase
  └── saas-landing/          → SaaS marketing page
```

**Tasks:**
- [ ] Define `theme.json` spec:
  ```json
  {
    "id": "ecommerce-modern",
    "name": "Modern Shop",
    "version": "1.0.0",
    "description": "Clean e-commerce theme",
    "author": "KAC",
    "requires_modules": ["ecom"],
    "sections": ["banner", "categories", "products", "testimonials"],
    "colors": { "primary": "#7c3aed", "accent": "#ff8c42" },
    "fonts": { "heading": "Inter", "body": "Inter" },
    "layouts": ["full-width", "sidebar-left", "sidebar-right"]
  }
  ```
- [ ] Theme installer: copy theme files, apply config, rebuild
- [ ] Theme preview (sandbox iframe)
- [ ] Theme customizer integration (override colors, fonts, spacing)
- [ ] Theme section components are Vue SFCs loaded dynamically
- [ ] 3–5 built-in themes covering major site types

### 6.2 Storefront Rendering Engine
- [ ] Refactor `StorefrontHome.vue` to be theme-agnostic
- [ ] Section components loaded from active theme
- [ ] Layout system: theme defines available page layouts
- [ ] CSS variable injection from theme config

---

## Phase 7: Onboarding & Site Templates 🎯
**Priority**: 🟠 Medium  
**Duration**: 1–2 weeks  
**Goal**: New tenant → choose site type → auto-setup

### 7.1 Site Templates
```
📁 backend-laravel/app/Services/SiteTemplateService.php
📁 backend-laravel/database/seeders/templates/
  ├── ecommerce.json
  ├── blog.json
  ├── portfolio.json
  ├── landing-page.json
  └── blank.json
```

**Tasks:**
- [ ] Template definition format:
  ```json
  {
    "id": "ecommerce",
    "name": "Online Store",
    "icon": "ShoppingBag",
    "description": "Full e-commerce with products, cart, checkout",
    "modules": ["ecom", "shipping", "tax", "marketing", "warehouse"],
    "theme": "ecommerce-modern",
    "sample_data": true,
    "layout_sections": ["banner", "categories", "featured_products", "new_arrivals"],
    "default_pages": ["About Us", "Contact", "FAQ", "Privacy Policy"]
  }
  ```
- [ ] `SiteTemplateService`:
  - `applyTemplate(tenantId, templateId)` — install modules, set theme, create sample data
  - `listTemplates()` — available templates
- [ ] Onboarding wizard (frontend):
  - Step 1: Choose site type (cards with preview)
  - Step 2: Enter store name, upload logo
  - Step 3: Choose theme variant (colors)
  - Step 4: Done — redirect to admin dashboard
- [ ] Sample data seeder per template (demo products, posts, pages)

---

## Phase 8: Billing & Subscriptions 💳
**Priority**: 🟠 Medium  
**Duration**: 2–3 weeks  
**Goal**: Monetize the platform

### 8.1 Subscription Plans
```
📁 backend-laravel/app/Services/BillingService.php
📁 backend-laravel/app/Models/Subscription.php
📁 backend-laravel/app/Models/Invoice.php (billing)
```

**Tasks:**
- [ ] Plan definitions:
  | Plan | Price | Limits |
  |------|-------|--------|
  | Free | 0đ | 1 site, 5 pages, 500MB storage, subdomain only |
  | Starter | 99k/mo | 1 site, 50 pages, 2GB, custom domain, 3 free modules |
  | Pro | 299k/mo | 3 sites, unlimited pages, 10GB, all free modules, API access |
  | Business | 699k/mo | 10 sites, 50GB, headless mode, priority support |
  | Enterprise | Custom | Unlimited, dedicated DB, SLA, custom dev |
- [ ] Feature gating: check plan limits before allowing actions
- [ ] Payment integration (VNPay, MoMo, Stripe)
- [ ] Auto-invoicing (monthly billing)
- [ ] Usage tracking (storage, API calls, bandwidth)
- [ ] Upgrade/downgrade flow
- [ ] Trial period (14 days Pro)
- [ ] Module marketplace: paid modules with revenue sharing (70/30)

### 8.2 Admin Dashboard (Master)
- [ ] Tenant management: list, suspend, upgrade
- [ ] Revenue dashboard: MRR, churn, growth
- [ ] Module approval queue (for paid modules)
- [ ] System health monitoring

---

## Phase 9: Plugin SDK & Developer Platform 🛠️
**Priority**: 🟢 Enhancement  
**Duration**: 2 weeks  
**Goal**: Third-party developers can build and sell plugins

### 9.1 Plugin SDK
```
📁 sdk/
  ├── create-plugin/          → npx create-kac-plugin my-plugin
  │   ├── template/
  │   │   ├── src/
  │   │   │   ├── components/
  │   │   │   ├── helpers.js
  │   │   │   └── index.js
  │   │   ├── vite.config.js
  │   │   └── package.json
  │   └── bin/create.js
  ├── types/                  → TypeScript type definitions
  │   ├── hooks.d.ts
  │   ├── bridge.d.ts
  │   └── content-types.d.ts
  └── docs/                   → Developer documentation
```

**Tasks:**
- [ ] CLI scaffolding tool: `npx create-kac-plugin`
- [ ] TypeScript definitions for plugin bridge
- [ ] Plugin development guide
- [ ] Hot-reload development mode for plugins
- [ ] Plugin submission & review process
- [ ] Plugin versioning & updates

### 9.2 Developer Portal
- [ ] API reference (auto-generated from OpenAPI spec)
- [ ] Plugin development tutorials
- [ ] Theme development guide
- [ ] Code examples & starter templates
- [ ] Community forum / Discord

---

## Phase 10: Advanced Features 🔮
**Priority**: 🟢 Future  
**Duration**: Ongoing

### 10.1 AI Features
- [ ] AI content generation (blog posts, product descriptions)
- [ ] AI image generation for media library
- [ ] AI-powered SEO suggestions
- [ ] Smart auto-categorization of content
- [ ] Chatbot builder module

### 10.2 Advanced E-commerce
- [ ] Multi-vendor marketplace module
- [ ] Subscription/recurring orders
- [ ] Digital products (downloads, licenses)
- [ ] Affiliate program module

### 10.3 Additional Module Packages
- [ ] **LMS**: Courses, lessons, quizzes, certificates, enrollments
- [ ] **Booking**: Services, calendar, appointments, payments
- [ ] **Forum**: Discussions, threads, moderation
- [ ] **Events**: Event management, ticketing, RSVP
- [ ] **Real Estate**: Listings, search, map integration
- [ ] **Restaurant**: Menu, table booking, delivery

### 10.4 Infrastructure
- [ ] Auto-scaling per tenant (K8s)
- [ ] CDN integration for media
- [ ] Automated backups with 1-click restore
- [ ] Geographic redundancy
- [ ] Custom domain SSL auto-provisioning (Let's Encrypt)

---

## 📅 Timeline Overview

```
Month 1:   Phase 1 (Hooks) + Phase 2 (Tách E-com)
Month 2:   Phase 3 (Content Types) + Phase 4 (Blog Module)
Month 3:   Phase 5 (Public API v1)
Month 4:   Phase 6 (Themes) + Phase 7 (Onboarding)
Month 5:   Phase 8 (Billing) + Phase 9 (SDK)
Month 6+:  Phase 10 (Advanced Features) — ongoing
```

---

## 🏗️ Architecture Evolution

### Before (Monolithic Frontend)
```
App.vue ─── imported 93+ components directly
         ├── E-commerce components (hardcoded)
         ├── CMS components
         ├── System components
         └── Plugin components (dynamic)
```

### Current ✅ (Plugin-first Architecture — Phase 1–4 Done)
```
App.vue ─── Core only (Auth, CMS Pages, Media, Nav, Settings)
         ├── PluginRenderer.vue (dynamic component loader)
         ├── Hooks system ✅ (sidebar_items, admin_routes, dashboard_widgets, ...)
         └── Everything loaded via plugins
             ├── plugins/cms        ✅ ── CMS Pages, Media, Navigation
             ├── plugins/ecom       ✅ ── Products, Orders, Customers, Categories
             ├── plugins/shipping   ✅ ── Shipments, Shipping settings
             ├── plugins/warehouse  ✅ ── Stock, Suppliers, Inventory
             ├── plugins/accounting ✅ ── Journal, Invoices, Payment vouchers
             ├── plugins/marketing  ✅ ── Promotions, Flash Sales
             ├── plugins/tax        ✅ ── Tax settings
             └── plugins/blog       ✅ ── Posts, Comments, RSS, Settings (31.56 KB)
```

### Next Steps Toward Target
```
Phase 5         ❌ — Public REST API v1 (Controllers/Api/V1/)
Phase 6         ❌ — Theme marketplace + storefront blog components
Phase 7         ❌ — Onboarding wizard + site templates
Phase 8         ❌ — Billing & subscriptions
Phase 9         ❌ — Plugin SDK & developer portal
```

---

## 📝 Implementation Notes

### Naming Convention
- Platform name: **KAC CMS** (or your preferred brand)
- API prefix: `/api/v1/`
- Plugin package: `@kac-cms/sdk`
- CLI: `npx create-kac-plugin`

### Technology Stack
| Layer | Technology |
|-------|-----------|
| Backend | Laravel 11 + PHP 8.3 |
| Frontend Admin | Vue 3 + Vite |
| Storefront | Vue 3 (SSR via Nuxt optional) |
| Headless Frontend | Any (Next.js, Nuxt, Flutter, etc.) |
| Database | PostgreSQL (per-tenant) |
| Cache | Redis |
| Queue | Laravel Queue + Redis |
| Storage | S3-compatible (MinIO / AWS S3) |
| Search | Meilisearch or Algolia |
| Realtime | Pusher / Laravel Echo |
| Infrastructure | Docker + Docker Compose → K8s |

### Key Design Principles
1. **Core phải nhẹ** — chỉ Auth, CMS, Media, Menus, Themes, i18n, Settings
2. **Everything is a Plugin** — kể cả e-commerce
3. **API-first** — mọi tính năng đều có API endpoint
4. **Multi-tenant by default** — data isolation, resource isolation
5. **Hooks everywhere** — plugins tương tác qua hooks, không sửa core
6. **Progressive enhancement** — Free plan chạy được, premium thêm tính năng
