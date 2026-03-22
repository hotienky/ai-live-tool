# Plugin Feature Map — Kiểm tra & Đề xuất

> **Mục đích**: Tài liệu này tổng hợp TẤT CẢ chức năng của từng plugin hiện có, chỉ ra các vấn đề về tổ chức, và đề xuất hướng giải quyết.

---

## 1. Tổng quan hiện trạng

### 32 Plugin bundles (frontend) vs 14 route files (backend)

Hệ thống có **32 file `bundle.js`** (frontend plugin) nhưng chỉ có **14 file route** backend. Nhiều plugin chỉ có frontend bundle mà chưa có backend route riêng, hoặc backend route bị gom chung vào file khác.

---

## 2. Feature Map — Từng Plugin đang có gì?

### 🛒 E-Commerce (`ecom`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `catalog.php` | Products CRUD, Categories CRUD, Brands CRUD, Stock adjust |
| Backend | `commerce.php` | Orders (CRUD + status + history + totals), Cart, Shop Customers (CRUD + addresses), Coupons (CRUD + validate), Invoices (CRUD + PDF + email) |
| Frontend | `plugins/ecom/bundle.js` | Product list/form, Category/Brand management |
| Storefront | `storefront.php` | Product listing, detail, categories, brands, banners, cart, checkout, wishlist |
| Migration | `modules/ecom/` | ✅ Có |

---

### 📝 Blog (`blog`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `blog.php` | ⚠️ **CHỈ CÓ**: Comment moderation (list, approve, spam, delete) |
| Backend | `content.php` | Blog post CRUD dùng generic `content/{type}` (chung cho MỌI content type) |
| Frontend | `plugins/blog/bundle.js` | Blog post management UI |
| Storefront | `storefrontModules/blog.php` | Blog posts (list, detail, RSS), Comments (create, list) |
| Migration | `modules/blog/` | ✅ Có |

> [!WARNING]
> **Vấn đề**: Blog post CRUD backend nằm trong `content.php` (dùng generic Content API) chứ **KHÔNG** nằm trong `blog.php`. File `blog.php` chỉ có comment moderation. Người dùng không thể biết plugin Blog có những gì.

---

### 📄 CMS (`cms`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `content.php` | CMS Pages CRUD (create, update, publish, unpublish, schedule) |
| Frontend | `plugins/cms/bundle.js` | CMS page editor UI |
| Storefront | `storefront.php` | Page listing, page detail |
| Migration | — | Dùng chung bảng `cms_pages` (base migration, không cần module migration) |

> [!WARNING]
> **Vấn đề**: CMS routes KHÔNG có `middleware('module:cms')`. Bất kỳ tenant nào cũng truy cập được API `/cms-pages` dù chưa cài module CMS.

---

### 📋 Forms (`forms`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `tenantModules/forms.php` | Forms CRUD, Submissions (list, show, export, delete, mark read) |
| Backend | `storefrontModules/forms.php` | Public: get schema, submit (rate limited) |
| Frontend | `plugins/forms/bundle.js` | Form builder UI, submissions viewer |
| Storefront | `ShortcodeRenderer` → `FormRenderer` | Render form qua shortcode `[form slug="..."]` |
| Migration | `modules/forms/` | ✅ Có |

✅ Plugin này tổ chức **ĐÚNG** — có module gate, route riêng, migration riêng.

---

### ⭐ Reviews (`reviews`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `tenantModules/reviews.php` | Admin: list, stats, create, update, approve, delete |
| Backend | `storefrontModules/storefront.php` | Public: create review, list reviews by product |
| Frontend | `plugins/reviews/bundle.js` | Review management UI |
| Migration | `modules/reviews/` | ✅ Có |

✅ Tổ chức tốt, có module gate.

---

### 🤖 AI Assistant (`ai-assistant`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `tenantModules/ai.php` | Generate content, batch translate, settings (key mode), usage dashboard |
| Frontend | `plugins/ai-assistant/bundle.js` | Settings tab, usage chart, SEO generation |
| Migration | — | Dùng `ai_usage_logs` (base migration) |

✅ Tổ chức tốt, có module gate.

---

### 📊 Marketing (`marketing`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `commerce.php` | Promotions CRUD (trong file commerce chứ KHÔNG phải file marketing riêng!) |
| Frontend | `plugins/marketing/bundle.js` | Promotion management UI |
| Storefront | `router.js` | Promotions page |

> [!WARNING]
> **Vấn đề**: Marketing routes nằm trong `commerce.php` thay vì file `marketing.php` riêng.

---

### 💰 Tax (`tax`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `commerce.php` | Tax rates CRUD, tax config, tax preview |
| Frontend | `plugins/tax/bundle.js` | Tax configuration UI |

> [!CAUTION]
> Tax routes cũng nằm trong `commerce.php`, không có file route riêng.

---

### 📒 Accounting (`accounting`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `commerce.php` | Accounting entries CRUD, summary/monthly/profit-loss/balance-sheet reports, CSV/Excel exports, config |
| Frontend | `plugins/accounting/bundle.js` | Accounting dashboard |

> [!CAUTION]
> Accounting routes cũng nằm trong `commerce.php`.

---

### 🏭 Warehouse (`warehouse`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `commerce.php` | Stock receipts, Suppliers, Payment vouchers, Purchase orders, Inventory reports (stock/movement/COGS/low-stock), CSV export |
| Frontend | `plugins/warehouse/bundle.js` | Warehouse management UI |

> [!CAUTION]
> Warehouse routes cũng nằm trong `commerce.php`.

---

### 🚚 Shipping (`shipping`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `commerce.php` | Shipments CRUD, stats, status update, tracking |
| Frontend | `plugins/shipping/bundle.js` | Shipping management UI |

> [!CAUTION]
> Shipping routes cũng nằm trong `commerce.php`.

---

### 📺 Livestream (`livestream`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `live.php` | Shops (connect/disconnect), Keywords, Auto-Reply Templates, Export (leads/comments/customers/report), Profile/Password |
| Frontend | `plugins/livestream/bundle.js` | Livestream management UI |

✅ Có file route riêng, có module gate.

---

### 👥 CRM (`crm`)

| Layer | File | Chức năng |
|-------|------|-----------|
| Backend | `crm.php` | Leads (CRUD + pipeline stats), Customers (CRUD), Sessions |
| Frontend | `plugins/crm/bundle.js` | CRM UI |

> [!WARNING]
> **Vấn đề**: CRM routes **KHÔNG CÓ** `middleware('module:crm')`. Bất kỳ tenant nào cũng truy cập được dù chưa cài CRM.

---

### Các Plugin CHỈ CÓ Frontend Bundle (chưa có backend route riêng)

| Plugin | Bundle | Backend | Status |
|--------|--------|---------|--------|
| `banners` | ✅ | Nằm chung trong `content.php` | ⚠️ Không có module gate |
| `flash-sales` | ✅ | Nằm trong `system.php` | ⚠️ Sai vị trí (nên ở ecom) |
| `newsletter` | ✅ | Nằm chung `StorefrontController` | ⚠️ Không tách route |
| `seo` | ✅ | Nằm trong `system.php` (redirects, robots.txt, sitemap) | ⚠️ |
| `analytics` | ✅ | Dùng Dashboard API | ⚠️ Không có route riêng |
| `languages` | ✅ | Nằm trong `system.php` | ⚠️ |
| `custom-fields` | ✅ | Nằm trong `system.php` | ⚠️ |
| `activity-log` | ✅ | Nằm trong `system.php` | ⚠️ |
| `api-integration` | ✅ | Nằm trong `system.php` | ⚠️ |
| `booking` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `events` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `forum` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `jobboard` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `lms` | ✅ | ❌ Chưa có backend route (có migration) | 🔴 |
| `lucky-draw` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `membership` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `realestate` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `restaurant` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |
| `salon` | ✅ | ❌ Chưa có backend | 🔴 Frontend only |

---

## 3. Các vấn đề chính

### ❌ Vấn đề 1: "Chồng chéo route" — Nhiều plugin bị gom vào ít file

```
commerce.php chứa:     ecom + marketing + tax + accounting + warehouse + shipping (6 modules!)
content.php chứa:      cms + banners + nav-links + media + redirects + blog_content (6 features!)
system.php chứa:       modules + dashboard + auth + notifications + webhooks + logs + roles + users
                       + config + api-keys + languages + custom-fields + flash-sales (13 features!)
```

→ Không thể biết plugin nào có chức năng gì chỉ bằng cách nhìn vào tên file.

### ❌ Vấn đề 2: Thiếu Module Gate ở một số plugin

| Plugin | Gate Status |
|--------|-------------|
| `cms` (CMS Pages) | ❌ Không có `middleware('module:cms')` |
| `crm` | ❌ Không có `middleware('module:crm')` |
| `banners` | ❌ Không có gate |
| `flash-sales` | ❌ Không có gate |
| Nội dung trong `content.php` | ❌ Không phân biệt module |

### ❌ Vấn đề 3: Blog CRUD nằm sai chỗ

Blog posts dùng generic `content/{type}` API thay vì routes riêng → người dùng cài plugin Blog nhưng không biết API nào thuộc Blog.

---

## 4. Đề xuất cải thiện

### Phương án: Tách route theo plugin (Recommended)

> Mỗi plugin nên có **1 file route riêng** + **module gate** rõ ràng.

```
routes/tenantModules/
├── system.php          ← CHỈ CÒN: dashboard, auth, notifications, roles, users, config
├── ecom-catalog.php    ← products, categories, brands
├── ecom-commerce.php   ← orders, cart, shop-customers, coupons, invoices
├── blog.php            ← Blog posts CRUD + comments (GỘP content/blog vào)
├── cms.php             ← CMS pages + banners + nav-links (MỚI, có module gate)
├── forms.php           ← ✅ Đã tốt
├── reviews.php         ← ✅ Đã tốt
├── ai.php              ← ✅ Đã tốt
├── live.php            ← ✅ Đã tốt
├── crm.php             ← Thêm middleware('module:crm')
├── marketing.php       ← Tách từ commerce.php (promotions)
├── tax.php             ← Tách từ commerce.php (tax rates)
├── accounting.php      ← Tách từ commerce.php
├── warehouse.php       ← Tách từ commerce.php (stock, suppliers, PO, vouchers)
├── shipping.php        ← Tách từ commerce.php (shipments)
├── seo.php             ← Tách từ system.php (redirects, robots, sitemap)
├── media.php           ← Tách từ content.php (media library)
├── flash-sales.php     ← Tách từ system.php
├── newsletter.php      ← Tách từ StorefrontController
├── languages.php       ← Tách từ system.php
├── custom-fields.php   ← Tách từ system.php
├── analytics.php       ← Tách từ system.php (dashboard analytics)
└── api-keys.php        ← Tách từ system.php
```

### Ưu điểm

1. **Rõ ràng**: Mở file `blog.php` → biết ngay Blog có gì
2. **Module gate chính xác**: Mỗi file có `middleware('module:xxx')` riêng
3. **Dễ maintain**: Thêm/xóa chức năng chỉ sửa 1 file
4. **Document tự động**: Có thể sinh docs từ route file

### Thứ tự ưu tiên thực hiện

| # | Việc cần làm | Effort | Impact |
|---|-------------|--------|--------|
| 1 | Thêm `module:crm` gate vào `crm.php` | 1 dòng | 🔴 Security |
| 2 | Thêm `module:cms` gate vào CMS routes trong `content.php` | 3 dòng | 🔴 Security |
| 3 | Tách marketing, tax, accounting, warehouse, shipping từ `commerce.php` | Medium | 🟠 Tổ chức |
| 4 | Gộp Blog post CRUD vào `blog.php` (thay vì dùng generic content) | Medium | 🟠 Tổ chức |
| 5 | Tách seo, flash-sales, newsletter, languages từ `system.php` | Large | 🟡 Tổ chức |
| 6 | Cập nhật SYSTEM_OVERVIEW.md với feature map mới | Small | 🟢 Docs |
