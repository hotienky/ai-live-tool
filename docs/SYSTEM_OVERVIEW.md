# System Overview — AI Live Commerce Platform

> Multi-Tenant SaaS Platform cho quản lý bán hàng, nội dung, và livestream.
> Mỗi Tenant (khách hàng) có database riêng, storefront riêng, và hệ thống plugin mở rộng.

---

## 1. Kiến trúc tổng quan

```
┌─────────────────────────────────────────────────────────────────────┐
│                        NGINX Reverse Proxy (:80)                    │
│   master.localhost  │  {tenant}.cms.localhost  │  {tenant}.localhost │
└────────┬────────────┴──────────┬───────────────┴──────────┬─────────┘
         │                       │                          │
   ┌─────▼──────┐         ┌─────▼──────┐             ┌─────▼──────┐
   │  Frontend   │         │  Frontend   │             │ Storefront  │
   │   Master    │         │    CMS      │             │   (Vue 3)   │
   │  (Vue 3)    │         │  (Vue 3)    │             │   :5173     │
   │   :5174     │         │   :5175     │             └──────┬──────┘
   └─────┬───────┘         └──────┬──────┘                    │
         │                        │                           │
         └────────────┬───────────┴───────────────────────────┘
                      │
              ┌───────▼────────┐
              │  Backend API   │
              │  (Laravel 11)  │
              │    :3333       │
              └───┬────────┬───┘
                  │        │
          ┌───────▼──┐  ┌──▼───────┐
          │ PgBouncer │  │  Redis   │
          │ (pooler)  │  │  :6380   │
          └───┬───────┘  └──────────┘
              │
        ┌─────▼──────┐
        │ PostgreSQL  │
        │  16-alpine  │
        │   :5433     │
        └─────────────┘
```

### Docker Services (7 containers)

| Service | Container | Port | Vai trò |
|---------|-----------|------|---------|
| `postgres` | rc-postgres | 5433 | Database chính (master + tenant DBs) |
| `redis` | rc-redis | 6380 | Cache, session, queue |
| `pgbouncer` | rc-pgbouncer | — | Connection pooler (transaction mode, 1000 max) |
| `backend-laravel` | rc-backend | 3333 | API server (Laravel 11) |
| `frontend-master` | rc-frontend-master | 5174 | Admin panel của hệ thống (Super Admin) |
| `frontend-cms` | rc-frontend-cms | 5175 | Admin panel của Tenant (quản lý shop) |
| `storefront` | rc-storefront | 5173 | Website bán hàng công khai của Tenant |
| `nginx-proxy` | rc-nginx | 80/443 | Reverse proxy, routing theo subdomain |

---

## 2. Multi-Tenancy Model

Hệ thống dùng **Database-per-Tenant** (mỗi Tenant có PostgreSQL database riêng).

```
Master DB (ai_live_tool)          Tenant DB (tenant_abc)
├── tenants                       ├── products
├── tenant_module_subscriptions   ├── orders
├── modules                       ├── customers
├── plans                         ├── cms_pages
├── master_users                  ├── forms / form_submissions
├── master_roles                  ├── contents (blog)
└── billing_invoices              ├── reviews
                                  ├── notifications
                                  └── ... (65+ models)
```

### Tenant Resolution

Request đến Backend được resolve Tenant qua middleware `InitializeTenancyBySlug`:
1. **Subdomain**: `shop-abc.localhost` → tenant_id = `shop-abc`
2. **Header**: `X-Tenant: shop-abc`
3. **Referer**: Parse từ request Referer URL

Sau khi resolve → switch database connection sang Tenant DB → toàn bộ query dùng Tenant DB.

---

## 3. Backend API Architecture

### Route Layers (7 tầng)

```php
// api.php
1. GET  /api/health                              → Health Check (public)
2. GET  /api/v1/*                                → Public REST API (API key auth)
3. GET  /api/storefront/*                        → Storefront Public (tenant-scoped, no auth)
4. GET  /api/shop/store/{id}/*                   → Legacy Storefront (backward compat)
5. POST /api/shop/auth/*                         → Shop Customer Auth (register/login)
6. *    /api/auth/* + /api/{tenant-modules}/*     → Tenant Admin (tenant-scoped + token auth)
7. *    /api/master/*                            → Master Panel (master auth)
```

### Modular Route System

Routes được tổ chức theo module trong thư mục riêng:

```
routes/
├── api.php                    ← Main router (loads all modules)
├── tenantModules/             ← 14 files: ai, billing, blog, catalog, commerce, ...
├── storefrontModules/         ← 3 files: storefront, blog, forms
└── masterModules/             ← 5 files: auth, tenants, roles, users, modules, ai-config
```

### Middleware Stack

| Middleware | Vai trò |
|------------|---------|
| `InitializeTenancyBySlug` | Resolve tenant, switch DB |
| `TokenAuth` | Xác thực JWT token cho Tenant Admin |
| `MasterAuth` | Xác thực cho Super Admin |
| `ShopCustomerAuth` | Xác thực customer (storefront) |
| `ModuleMiddleware` | Gate API theo module cài đặt (`module:ecom`, `module:forms`...) |
| `CheckPermission` | RBAC permission check |
| `PlanLimits` | Giới hạn theo gói thuê bao |
| `CompressResponse` | Gzip response cho Storefront |
| `RateLimitShopAuth` | Chống brute-force login |

### Key Services

| Service | Mô tả |
|---------|-------|
| `ModuleRegistry` | Cài/gỡ/request/approve module, dependency check, run migrations |
| `AiService` | AI content generation (OpenAI/Gemini), dual-key config, usage logging |
| `AccountingService` | Sổ kế toán, công nợ, báo cáo tài chính |
| `TaxService` | Tính thuế VAT |
| `DomainManager` | Quản lý custom domain cho Tenant |
| `ThemeEngine` | Hệ thống theme/template cho Storefront |
| `BillingService` | Thanh toán gói thuê bao |

---

## 4. Plugin / Module System

### Cách hoạt động

```
1. Super Admin tạo Module record trong Master DB (bảng `modules`)
   → Định nghĩa: module_id, name, price, requires, sidebar config

2. Tenant Admin vào Settings → Modules → Cài đặt
   → Free module: cài ngay + chạy migrations
   → Paid module: gửi Request → Super Admin duyệt → chạy migrations → kích hoạt

3. Backend gate bằng ModuleMiddleware:
   Route::middleware('module:forms')->group(...)
   → Nếu Tenant chưa cài module → trả 404

4. Frontend CMS load plugin bundle.js từ /plugins/{module_id}/bundle.js
   → Inject sidebar menu, pages, components vào Vue app động
```

### Modules hiện có

| Module ID | Loại | Mô tả |
|-----------|------|-------|
| `ecom` | Core | E-commerce (sản phẩm, đơn hàng, kho, shipping) |
| `blog` | Plugin | Blog/Tin tức + bình luận |
| `cms` | Plugin | Trang tĩnh CMS |
| `forms` | Plugin | Form Builder + nhúng shortcode |
| `reviews` | Plugin | Đánh giá sản phẩm |
| `crm` | Plugin | Quản lý khách hàng, leads |
| `livestream` | Plugin | Livestream bán hàng |
| `lms` | Plugin | Learning Management (courses) |
| `ai-assistant` | Plugin | AI viết mô tả, SEO, chat |
| `marketing` | Plugin | Khuyến mãi, coupon |
| `accounting` | Plugin | Kế toán, sổ sách |
| `shipping` | Plugin | Tính phí vận chuyển (GHN, GHTK...) |
| `tax` | Plugin | Quản lý thuế |

### Plugin Frontend (CMS Admin)

```
backend-laravel/public/plugins/
├── ai-assistant/bundle.js     ← AI features (settings, usage dashboard)
├── blog/bundle.js             ← Blog management
├── forms/bundle.js            ← Form builder
├── reviews/bundle.js          ← Review management
├── seo/bundle.js              ← SEO tools
└── ...
```

Mỗi `bundle.js` được build từ thư mục `plugins/{module}/` và inject vào Frontend CMS tại runtime.

### Plugin Storefront (Shortcode System)

Để plugin hiển thị trên Storefront, hệ thống dùng **Shortcode Renderer**:

```html
<!-- Trong bài viết Blog, Mô tả sản phẩm, hoặc Trang CMS -->
<p>Liên hệ chúng tôi qua form bên dưới:</p>
[form slug="lien-he"]
```

```
ShortcodeRenderer.vue
├── Regex: /\[([a-zA-Z][a-zA-Z0-9_-]*)\s+([^\]]+)\]/g
├── BUILTIN_SHORTCODES: { form: FormRenderer }
├── window.__STOREFRONT_SHORTCODES__: {} ← global registry cho plugin mới
└── Fallback: tag không có trong registry → giữ nguyên text gốc
```

Shortcode hoạt động ở: `CmsPage`, `BlogPage`, `ProductDetailPage`, `HomePage`, `SiteFooter`, `HomeSectionTextBlock`.

---

## 5. Frontend Apps

### 5.1 Frontend Master (`frontend-master/` → `master.localhost`)

Super Admin panel — quản lý toàn bộ hệ thống:
- Quản lý Tenant (tạo, sửa, suspend/activate)
- Quản lý Modules (tạo module, duyệt/từ chối yêu cầu)
- Quản lý Users & Roles (Super Admin accounts)
- AI Config (đặt system API key, override key per-tenant)

### 5.2 Frontend CMS (`frontend/` → `{tenant}.cms.localhost`)

Tenant Admin panel — quản lý shop của từng Tenant:
- Dashboard tổng quan
- Quản lý sản phẩm, danh mục, thương hiệu
- Quản lý đơn hàng, khách hàng
- CMS Pages, Blog, Navigation
- Form Builder, Reviews
- Cấu hình Theme/Layout cho Storefront
- Cài đặt Module marketplace
- AI Assistant (nếu đã cài module)
- Plugin system (load bundle.js động)

**Plugin loading mechanism:**
```javascript
// App.vue (Frontend CMS)
tenantFeatures.forEach(feature => {
  const script = document.createElement('script')
  script.src = `/plugins/${feature}/bundle.js`
  document.body.appendChild(script)
})
```

### 5.3 Storefront (`storefront/` → `{tenant}.localhost`)

Website công khai của Tenant — nơi khách hàng mua sắm:

**Kiến trúc Module-Aware:**
```javascript
// router.js — 3-tier Navigation Guard
router.beforeEach((to) => {
  // 1. Module guard: route 'products' cần module 'ecom'
  // 2. Template guard: template 'landing' chặn ecom routes
  // 3. Page toggle guard: admin có thể tắt từng page
})
```

**Data flow:**
```
App.vue
  └── loadSiteConfig() → GET /api/storefront/site-config
        → storeInfo (shop name, logo, contact...)
        → installedModules → setInstalledModules() → router guards
        → layoutConfig → sections order, template, customCss
        → headerConfig, footerConfig, navLinks
```

---

## 6. Database Schema (Key Tables)

### Master DB

| Table | Mô tả |
|-------|-------|
| `tenants` | Danh sách tenant (id, domain, status, settings) |
| `modules` | Module catalog (module_id, name, price, requires, sidebar) |
| `tenant_module_subscriptions` | Module nào đã cài cho tenant nào |
| `plans` | Gói thuê bao (free, pro, enterprise) |
| `master_users` | Super Admin users |

### Tenant DB (per-tenant)

| Table | Mô tả |
|-------|-------|
| `products` | Sản phẩm |
| `product_variants` | Biến thể sản phẩm |
| `product_categories` | Danh mục |
| `orders` / `order_details` | Đơn hàng |
| `customers` | Khách hàng B2B |
| `shop_customers` | Khách hàng Storefront (B2C) |
| `cms_pages` | Trang tĩnh CMS |
| `contents` | Bài viết blog (polymorphic) |
| `forms` / `form_submissions` | Form Builder data |
| `reviews` | Đánh giá sản phẩm |
| `notifications` | Thông báo hệ thống |
| `banners` | Banner quảng cáo |
| `nav_links` | Navigation menu |
| `media` | Quản lý file/ảnh |
| `ai_usage_logs` | Log sử dụng AI |
| `users` / `roles` | User & RBAC |

### Module Migrations

Mỗi module có migration riêng trong `database/migrations/modules/{module_id}/`:
```
modules/blog/      → contents, comments, content_taxonomies
modules/ecom/      → products, orders, variants, coupons...
modules/forms/     → forms, form_submissions
modules/reviews/   → reviews
modules/crm/       → leads, customers
modules/livestream/ → livestream sessions
modules/lms/       → courses
```

Migrations tự động chạy khi cài module (hoặc khi approve paid module).

---

## 7. AI Integration

### Dual-Key Priority System

```
Tenant's Own Key (highest priority)
    ↓ fallback
Master Admin Override Key (per-tenant)
    ↓ fallback
System Global Key (lowest priority)
```

### Supported Providers
- **OpenAI** (GPT-4o, GPT-4o-mini)
- **Google Gemini** (gemini-2.0-flash)

### Usage Tracking
Mỗi AI call được log vào `ai_usage_logs`:
- Model, provider, prompt/completion tokens
- Estimated cost (USD)
- Tenant ID, user ID, feature used

---

## 8. Security Measures

| Area | Implementation |
|------|----------------|
| **Authentication** | JWT token (Tenant) + Sanctum-like (Master) |
| **Multi-tenant isolation** | Database-per-tenant, middleware enforcement |
| **XSS Prevention** | `strip_tags()` trên public API output, `sanitize()` trên Storefront |
| **Rate Limiting** | Throttle trên login, form submit (10/min per IP) |
| **Module Gating** | `ModuleMiddleware` chặn API nếu module chưa cài |
| **RBAC** | `CheckPermission` middleware cho Tenant Admin |
| **Response Compression** | Gzip middleware cho Storefront API |
| **Connection Pooling** | PgBouncer (1000 max connections, transaction mode) |

---

## 9. Quick Start

```bash
# Clone & start
git clone <repo>
cd read-comment
docker compose up -d

# URLs
# Super Admin:     http://master.localhost
# Tenant CMS:     http://{tenant-id}.cms.localhost
# Storefront:     http://{tenant-id}.localhost
# API:            http://localhost/api/health
```

---

## 10. Project Structure

```
read-comment/
├── backend-laravel/           ← Laravel 11 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   │   ├── Master/        ← 7 controllers (Super Admin)
│   │   │   ├── Tenant/        ← 57 controllers (Tenant Admin)
│   │   │   └── Shop/          ← 1 controller (Storefront Auth)
│   │   ├── Models/            ← 65 Eloquent models
│   │   ├── Services/          ← 12+ service classes
│   │   ├── Modules/           ← 8 internal module definitions
│   │   └── Http/Middleware/   ← 12 middleware classes
│   ├── routes/
│   │   ├── api.php            ← Main router
│   │   ├── tenantModules/     ← 14 route files
│   │   ├── storefrontModules/ ← 3 route files
│   │   └── masterModules/     ← 5 route files
│   ├── database/migrations/
│   │   └── modules/           ← 7 module migration folders
│   └── public/plugins/        ← Plugin JS/CSS bundles
│
├── frontend-master/           ← Vue 3 Super Admin
├── frontend/                  ← Vue 3 Tenant CMS Admin
├── storefront/                ← Vue 3 Public Storefront
│   └── src/
│       ├── components/
│       │   ├── ShortcodeRenderer.vue  ← Universal shortcode parser
│       │   ├── FormRenderer.vue       ← Form plugin renderer
│       │   └── sections/              ← Homepage section components
│       ├── views/                     ← Page components
│       ├── composables/               ← Shared logic hooks
│       └── router.js                  ← Module-aware routing
│
├── plugins/                   ← Plugin source code (builds to bundles)
├── themes/                    ← Storefront themes
├── nginx/                     ← Nginx config
├── pgbouncer/                 ← PgBouncer config
├── docker-compose.yml
└── docs/                      ← Documentation
```
