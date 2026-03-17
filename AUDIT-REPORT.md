# BÁO CÁO KIỂM TRA TOÀN DIỆN & KẾ HOẠCH CẢI THIỆN
## Dự án Multi-Tenant E-Commerce (ReadComment)
> Ngày tạo: 2026-03-16 | Kiểm tra bởi: 3 AI Agents song song

---

## MỤC LỤC

1. [Tổng quan](#1-tổng-quan)
2. [PHẦN A: Backend / Tenant CMS](#2-phần-a-backend--tenant-cms)
3. [PHẦN B: Storefront & Frontend](#3-phần-b-storefront--frontend)
4. [PHẦN C: SEO](#4-phần-c-seo)
5. [Kế hoạch hành động theo Phase](#5-kế-hoạch-hành-động-theo-phase)
6. [Bảng tổng hợp tất cả Issues](#6-bảng-tổng-hợp-tất-cả-issues)

---

## 1. TỔNG QUAN

| Khu vực | Critical | High | Medium | Low | Tổng |
|---------|----------|------|--------|-----|------|
| Backend/Tenant CMS | 5 | 5 | 9 | 3 | **22** |
| Storefront/Frontend | 4 | 8 | 20 | 6 | **38** |
| SEO | 6 | 8 | 8 | 3 | **25** |
| **Tổng cộng** | **15** | **21** | **37** | **12** | **85** |

> **Cập nhật lần 2:** Báo cáo đã được bổ sung thêm **23 issues** từ kết quả chi tiết của 3 agents.

**Đánh giá chung:** Hệ thống đang ở giai đoạn phát triển sớm với nhiều tính năng chưa hoàn thiện. Các vấn đề chính:
- Controllers thiếu CRUD cơ bản (show methods)
- Routes bị mismatch với controller methods
- Frontend gọi API không đúng cách (double parsing)
- Auth flow giữa storefront và backend không nhất quán
- SEO gần như chưa được triển khai (~5% hoàn thành)
- Các features chưa kết nối với nhau (Flash Sales, Coupons, NavLinks)

---

## 2. PHẦN A: BACKEND / TENANT CMS

### 🔴 CRITICAL ISSUES

#### A1. Controllers thiếu `show()` method — CRUD không hoàn chỉnh
**Files bị ảnh hưởng:**
- `app/Http/Controllers/Tenant/ProductsController.php` — Không có `show()` method
- `app/Http/Controllers/Tenant/BannersController.php` — Không có `show()` method
- `app/Http/Controllers/Tenant/CategoriesController.php` — Không có `show()` method
- `app/Http/Controllers/Tenant/BrandsController.php` — Không có `show()` method

**Vấn đề:** Chỉ có `index()`, `store()`, `update()`, `destroy()` — thiếu khả năng xem chi tiết 1 record
**Ảnh hưởng:** Admin panel không thể fetch dữ liệu chi tiết để hiển thị form edit. Frontend phải dựa vào data từ list API.

**Hướng giải quyết:**
```php
// Thêm vào mỗi controller:
public function show($id)
{
    $item = $this->repo->find($id);
    if (!$item) {
        return $this->errorResponse('Not found', 404);
    }
    return $this->successResponse($item);
}
```
Đồng thời thêm routes tương ứng trong `routes/tenantModules/catalog.php` và `content.php`.

---

#### A2. Route `pages/{id}` bị mismatch parameter
**File:** `routes/storefrontModules/storefront.php:11`

**Vấn đề:**
```php
// Route truyền {id} nhưng controller tìm theo 'alias' (slug)
Route::get('/pages/{id}', [StorefrontController::class, 'pageDetail']);

// StorefrontController::pageDetail()
public function pageDetail($slug) {
    $page = $this->cmsPageRepo->findBy('alias', $slug);
}
```
Route parameter tên `{id}` nhưng thực tế dùng như `{slug}`.

**Hướng giải quyết:**
```php
// Đổi route thành:
Route::get('/pages/{slug}', [StorefrontController::class, 'pageDetail']);
```

---

#### A3. NavLinksController thiếu `flat()` method
**File:** `routes/tenantModules/content.php:23`

**Vấn đề:**
```php
Route::get('/nav-links/flat', [NavLinksController::class, 'flat']);
// NavLinksController KHÔNG CÓ method flat()
```
Gây lỗi 405 Method Not Allowed khi frontend gọi endpoint này.

**Hướng giải quyết:**
```php
// Thêm vào NavLinksController:
public function flat()
{
    $links = $this->repo->all();
    return $this->successResponse($links->map(function($link) {
        return [
            'id' => $link->id,
            'label' => $link->label,
            'url' => $link->url,
            'parent_id' => $link->parent_id,
        ];
    }));
}
```

---

#### A4. CmsPage thiếu publishing workflow
**Files:**
- `app/Models/CmsPage.php` — Model quá minimal
- `app/Http/Controllers/Tenant/CmsPagesController.php`

**Vấn đề:** Không có:
- Field `is_published` / `status` (draft/published)
- Field `published_at` / `scheduled_at` cho scheduling
- Revision/versioning system
- Author tracking (`created_by`, `updated_by`)

**Hướng giải quyết:**
1. Tạo migration thêm columns: `status`, `published_at`, `created_by`, `updated_by`
2. Update CmsPage model với casts và scopes
3. Update CmsPagesController để xử lý status workflow

---

### 🟠 HIGH ISSUES

#### A5. Thiếu input validation ở nhiều controllers
**Files bị ảnh hưởng:**
| Controller | Thiếu validation ở methods |
|-----------|---------------------------|
| `TemplatesController.php` | `store()` |
| `BannersController.php` | `store()`, `update()` |
| `NavLinksController.php` | `store()`, `update()` |

**Hướng giải quyết:** Thêm `$request->validate([...])` với rules phù hợp cho từng controller.

---

#### A6. Thiếu error handling & resource existence check
**Files bị ảnh hưởng:**
- `TemplatesController.php` — Không có try-catch ở `store()`, `index()`, `destroy()`
- `BannersController.php:32-36` — `update()` không check resource exists
- `CategoriesController.php:35-39` — `update()/destroy()` không check resource exists

**Hướng giải quyết:** Wrap tất cả methods trong try-catch, kiểm tra `$resource = $this->repo->find($id)` trước khi update/delete.

---

#### A7. Hard-coded values trong StorefrontController
**File:** `app/Http/Controllers/Tenant/StorefrontController.php`

| Dòng | Vấn đề |
|------|--------|
| 190 | `'payment_status' => 'unpaid'` hardcoded |
| 194 | `'status' => 'pending'` hardcoded |
| 142 | So sánh string `=== 'true'` thay vì boolean |
| 380 | `'Khách hàng'` hardcoded Vietnamese string |

**Hướng giải quyết:** Tạo Enums cho Order status/payment status. Dùng `filter_var()` cho boolean config.

---

#### A8. TemplatesController thiếu `update()` và `show()` methods
**File:** `app/Http/Controllers/Tenant/TemplatesController.php`

Chỉ có `index()`, `store()`, `destroy()` — không thể edit template.

---

### 🟡 MEDIUM ISSUES

#### A9. Models quá minimal — thiếu relationships, casts, scopes
| Model | Thiếu |
|-------|-------|
| `CmsPage.php` | fillable, casts, relationships |
| `Banner.php` | relationships, casts |
| `NavLink.php` | parent/children relationships |
| `Lead.php` | casts, scopes |
| `Customer.php` | relationships |
| `Promotion.php` | relationships to products |
| `Shop.php` | relationships |

#### A10. Các features chưa kết nối với nhau
| Kết nối | Trạng thái |
|---------|-----------|
| Banners → CmsPages | ❌ Không có FK/relationship |
| Flash Sales → Products | ❌ Không có pivot table |
| Coupons → Orders | ❌ `validateCoupon()` tồn tại nhưng không dùng trong checkout |
| NavLinks → Pages/Categories | ❌ Không validate URL targets |

#### A11. Pipelines/Filters chưa đầy đủ
- `OrderFilterPipeline.php` — Thiếu: date range, payment status, customer, amount filters
- `ProductFilterPipeline.php` — Thiếu: SKU filter

#### A12. ExportController::report() là stub
**File:** `app/Http/Controllers/Tenant/ExportController.php:37-40`
```php
public function report() {
    return $this->successResponse(['message' => 'Report generated']); // Stub!
}
```

#### A13. Repository method naming không nhất quán
- Một số repos dùng `findOne()`, một số dùng `find()`

#### A14. Storefront products endpoint không có pagination
**File:** `app/Http/Controllers/Tenant/StorefrontController.php:34-37`
```php
public function products(Request $request)
{
    return $this->successResponse($this->productRepo->getProducts());
    // Trả về ALL products, không phân trang
}
```
Khi catalog lớn → response nặng → chậm frontend.

**Hướng giải quyết:** Thêm `->paginate($perPage)` với `$request->input('per_page', 20)`.

#### A15. Hardcoded Vietnamese string không qua i18n
**File:** `app/Http/Controllers/Tenant/StorefrontController.php:380`
```php
'customer_name' => ... ?: 'Khách hàng',  // Hardcoded Vietnamese
```
**Hướng giải quyết:** Dùng `__('messages.customer_default_name')`.

#### A16. ExportController dùng raw DB::table() thay vì Repository
**File:** `app/Http/Controllers/Tenant/ExportController.php:26-30`
```php
DB::table('chat_logs')->orderByDesc('created_at')->limit(500)->get()
```
Vi phạm repository pattern → khó test, khó maintain.

#### A17. NavLink model thiếu parent/children relationships chi tiết
**File:** `app/Models/NavLink.php:5`
Có `parent_id` field nhưng model không define `parent()`, `children()`, `childrenRecursive()` methods → N+1 queries khi build menu.

---

## 3. PHẦN B: STOREFRONT & FRONTEND

### 🔴 CRITICAL ISSUES

#### B1. ProductManager — Double JSON parsing
**File:** `frontend/src/components/ProductManager.vue:330-340`

**Vấn đề:** `apiFetch()` đã return parsed data, nhưng code lại gọi `.then(res => res.json())` → double parsing → crash.
**Ảnh hưởng:** Products list, Categories, Brands dropdowns đều bị trống.

**Hướng giải quyết:**
```javascript
// Sửa từ:
const data = await apiFetch('/products').then(res => res.json());
// Thành:
const data = await apiFetch('/products');
```

---

#### B2. Auth endpoints không nhất quán
**Files:**
- `storefront/src/composables/useAuth.js:48` — Dùng `/api/shop/auth`
- `storefront/src/views/AccountPage.vue:300` — Dùng `authFetch('/addresses')` cũng qua `/api/shop/auth`

**Vấn đề:** Storefront auth dùng path khác với shop auth → customer account operations fail.

**Hướng giải quyết:** Thống nhất tất cả auth endpoints qua 1 base URL duy nhất. Tạo constant `AUTH_BASE_URL`.

---

### 🟠 HIGH ISSUES

#### B3. CheckoutPage — Order status mất khi refresh
**File:** `storefront/src/views/CheckoutPage.vue:365`

Sau khi tạo order, data lưu vào `orderData.value` nhưng khi refresh page, fetch lại qua `/orders/{orderId}` yêu cầu auth mà không gửi auth header.

**Hướng giải quyết:** Dùng `authFetch()` hoặc tạo public order tracking endpoint.

---

#### B4. OrderTrackingPage — Phone format mismatch
**File:** `storefront/src/views/OrderTrackingPage.vue:174`

```javascript
data.customer_phone !== phone.value  // Strict string comparison
```
Phone có spaces, dashes, country codes sẽ fail.

**Hướng giải quyết:** Normalize phone numbers trước khi so sánh:
```javascript
const normalizePhone = (p) => p.replace(/[\s\-\+]/g, '').slice(-9);
```

---

#### B5. ProductDetailPage — Review submission thiếu auth
**File:** `storefront/src/views/ProductDetailPage.vue:411`

Gọi `/api/storefront/products/{id}/reviews` với raw Bearer token mà không verify.

---

#### B6. ProductManager — Categories/Brands loading bị double-parse
**File:** `frontend/src/components/ProductManager.vue:351-356`

Cùng vấn đề với B1, ảnh hưởng dropdowns.

---

#### B7. Admin App — Không có error boundaries
**File:** `frontend/src/App.vue`

1 API call fail → crash toàn bộ admin panel.

---

#### B8. ProductManager — Thiếu promotion date range fields
**File:** `frontend/src/components/ProductManager.vue:411-437`

Form không có fields cho `promotion_start` và `promotion_end` mà StorefrontController cần.

---

#### B9. ProductManager — Stock adjustment chỉ +1/-1
**File:** `frontend/src/components/ProductManager.vue:463`

Không có bulk stock adjustment. Response handling không check structure.

---

### 🟡 MEDIUM ISSUES

#### B10. ProductDetailPage — Image JSON parse không có try-catch
**File:** `storefront/src/views/ProductDetailPage.vue:264-267`

Malformed JSON sẽ crash view.

#### B11. AccountPage — Address operations dùng raw fetch
**File:** `storefront/src/views/AccountPage.vue:344, 346, 357`

Không dùng `authFetch()` → có thể thiếu auth headers.

#### B12. SiteHeader — Language switcher có thể undefined
**File:** `storefront/src/components/SiteHeader.vue:42`

`currentLang` có thể undefined trước khi i18n init.

#### B13. CartPage — Không handle localStorage corrupted
**File:** `storefront/src/views/CartPage.vue:76`

JSON parse fail → cart trống không có error message.

#### B14. Product filtering — field names có thể mismatch
**File:** `storefront/src/views/ProductsPage.vue:266-276`

Frontend gửi `price_min/price_max` nhưng backend có thể expect `minPrice/maxPrice`.

#### B15. Theme config không apply đúng
**File:** `storefront/src/composables/useTheme.js:127-144`

Load từ `/api/storefront/theme` nhưng components không dùng CSS variables đúng cách.

#### B16. Flash Sale component chưa implement
**File:** `storefront/src/components/FlashSale.vue`

Import trong HomePage nhưng component rỗng/skeleton.

#### B17. CmsPage — Silent error catching
**File:** `storefront/src/views/CmsPage.vue:65-67`

Error bị catch nhưng không log hay thông báo user.

#### B18. Checkout flow silent error handling
**File:** `storefront/src/views/CheckoutPage.vue:300-308`

Load addresses fail → catch rỗng → user không biết.

#### B19. Không có global error handler
Cả storefront và admin đều dùng individual try-catch không nhất quán.

#### B20. API Base URL không thống nhất
**File:** `frontend/src/composables/useApi.js`

Một số dùng `/api/shop/auth`, một số `/api/storefront`, một số direct `/products`.

#### B21. ProductDetailPage — Race condition reviews load khi product fail
**File:** `storefront/src/views/ProductDetailPage.vue:364`
```javascript
await loadProduct().then(() => loadReviews())
// loadReviews() chạy kể cả khi product.value = null sau 3 retries
```
Gây lỗi 404 cho reviews endpoint với null product ID.

#### B22. ProductCard — Slug fallback có thể gây 404
**File:** `storefront/src/components/ProductCard.vue:2`
```javascript
:to="`/product/${product.slug || product.sku || product.id}`"
```
Nếu thiếu slug, link sẽ dùng SKU/ID nhưng ProductDetailPage expects slug → 404.

#### B23. CheckoutPage — Không validate format phone/email trước submit
**File:** `storefront/src/views/CheckoutPage.vue:321-323`
Chỉ check truthy, không validate phone format hay email format → invalid data gửi lên backend.

#### B24. ProductManager — Image URL không validate
**File:** `frontend/src/components/ProductManager.vue:282-288`
Thêm image URLs không kiểm tra valid URL hay valid image → broken images trên storefront.

#### B25. Order status transitions không validate
**File:** Backend + Frontend
Orders có thể bị đổi trạng thái ngược (delivered → pending) vì không có state machine validation.

#### B26. Cart → Checkout → Order thiếu stock reservation
Cart items không check stock availability khi checkout. Có thể overselling.

#### B27. Search debounce race condition
**File:** `storefront/src/views/ProductsPage.vue:251-255`
Rapid filter + search → requests fire out of order → stale data overwrite fresh results.

#### B28. HomePage — Mixed response structure handling
**File:** `storefront/src/views/HomePage.vue:121`
```javascript
products.value = prodData.data || prodData  // Fallback pattern
```
Một số endpoints trả `{data: [...]}`, một số trả `[...]` trực tiếp → inconsistent.

#### B29. BannerSlider/CategoryGrid/SiteFooter — Components chưa verify
**Files:** `storefront/src/components/BannerSlider.vue`, `CategoryGrid.vue`, `SiteFooter.vue`
Import trong HomePage nhưng implementation chưa được verify đầy đủ.

#### B30. Admin ShopSettings — Chưa audit đầy đủ
**File:** `frontend/src/components/ShopSettings.vue`
Multiple tabs (Products, Categories, Brands, Promotions, Banners, CMS, NavLinks, Appearance, Config, Languages) nhưng chưa verify từng tab hoạt động đúng.

---

## 4. PHẦN C: SEO

### 🔴 CRITICAL ISSUES

#### C1. KHÔNG CÓ Meta Tags (description, keywords)
**Trạng thái hiện tại:** Chỉ có `document.title` được set.

**Thiếu hoàn toàn:**
- `<meta name="description">` — Ảnh hưởng CTR trên Google nghiêm trọng
- `<meta name="keywords">`
- `<meta name="robots">`
- OpenGraph tags (`og:title`, `og:description`, `og:image`)
- Twitter Card tags

**Database cũng thiếu columns:**
- `products` — thiếu `meta_title`, `meta_description`, `meta_keywords`
- `product_categories` — thiếu `meta_description`
- `product_brands` — thiếu `meta_description`
- `cms_pages` — thiếu `meta_description`

**Hướng giải quyết:**
1. Migration thêm SEO columns vào các tables
2. Install `@unhead/vue` cho storefront
3. Implement `useHead()` trong mỗi page view
4. Thêm SEO fields vào admin forms

---

#### C2. KHÔNG CÓ Structured Data / JSON-LD
**Trạng thái:** Zero implementation

**Thiếu:**
- Product schema (price, rating, availability) → Không có rich snippets
- Organization schema → Google không hiểu business
- BreadcrumbList schema → Breadcrumbs chỉ là UI, không có structured data
- AggregateRating schema

**Hướng giải quyết:**
```html
<!-- Cần thêm vào ProductDetailPage.vue -->
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "...",
  "image": "...",
  "brand": { "@type": "Brand", "name": "..." },
  "offers": {
    "@type": "Offer",
    "price": "...",
    "priceCurrency": "VND",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "...",
    "ratingCount": "..."
  }
}
</script>
```

---

#### C3. KHÔNG CÓ Sitemap
**Trạng thái:** Không có sitemap.xml, không có route serve sitemap.

**Hướng giải quyết:**
1. Tạo `SitemapController` với route `/sitemap.xml`
2. Generate XML từ products, categories, CMS pages
3. Thêm `Sitemap: /sitemap.xml` vào robots.txt
4. Implement lastmod timestamps

---

#### C4. Storefront là SPA thuần — Không có SSR
**Trạng thái:** Vue 3 + Vite, KHÔNG có Nuxt/SSR

**Vấn đề nghiêm trọng:**
- HTML ban đầu gần như rỗng → crawlers không thấy content
- Meta tags chỉ được set bằng JavaScript → Googlebot có thể không index
- Slow First Paint → ảnh hưởng Core Web Vitals

**Hướng giải quyết (chọn 1):**
| Phương án | Ưu điểm | Nhược điểm |
|-----------|---------|-----------|
| **A. Migrate sang Nuxt 3** | SSR built-in, SEO tốt nhất | Effort lớn, viết lại nhiều |
| **B. Vite SSR Plugin** | Ít thay đổi hơn | Setup phức tạp |
| **C. Pre-rendering (vite-plugin-ssr)** | Dễ nhất | Không dynamic, cần rebuild khi data đổi |
| **D. Headless CMS + API** | Keep SPA + add meta via server | Cần proxy layer |

**Khuyến nghị:** Phương án A (Nuxt 3) cho long-term hoặc phương án C cho quick win.

---

#### C5. KHÔNG CÓ Canonical URLs
**Trạng thái:** Zero implementation

**Rủi ro:** Duplicate content từ:
- `/product/:slug` vs `/product/:id`
- Multiple query parameter variations (filters, sort, page)

---

### 🟠 HIGH ISSUES

#### C6. KHÔNG CÓ Open Graph / Social Meta Tags
Sharing products trên Facebook, Zalo → không có preview image/title.

#### C7. KHÔNG CÓ Pagination SEO
ProductsPage.vue dùng client-side pagination, không có `rel="next/prev"`.

#### C8. robots.txt quá lỏng lẻo
```
User-agent: *
Disallow:
```
Cho phép crawl tất cả, kể cả `/api`, `/admin`, `/checkout`.

**Hướng giải quyết:**
```
User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Allow: /api/storefront/sitemap

Sitemap: https://domain.com/sitemap.xml
```

#### C9. Admin không có giao diện nhập SEO fields
Không controller nào xử lý `meta_description`, `meta_keywords` input.

#### C10. Không có Redirect Management (301/302)
Khi đổi URL sản phẩm → mất traffic cũ, không có hệ thống quản lý redirects.

---

### 🟡 MEDIUM ISSUES

#### C11. Image optimization chưa đầy đủ
- ✅ Có: lazy loading, alt text
- ❌ Thiếu: responsive images (`srcset`), WebP format, `<picture>` element

#### C12. Không có internal linking strategy
- Không có "related products"
- Không có cross-linking categories/brands

#### C13. Keywords system bị "mồ côi"
`shop_keywords` table tồn tại, KeywordsController có CRUD nhưng không liên kết với products nào.

#### C14. H1 tag structure cần review
- ProductDetailPage ✅ có `<h1>`
- CmsPage ✅ có `<h1>`
- HomePage ❌ không có `<h1>` chính

#### C15. Không có SEO config trong .env
Thiếu: `SITEMAP_ENABLED`, `ANALYTICS_ID`, domain config cho canonical URLs.

#### C16. `storefront/index.html` thiếu essential head tags
**File:** `storefront/index.html`
Thiếu `<meta charset="UTF-8">`, `<meta name="viewport">`, `<meta name="theme-color">`.
→ Mobile rendering issues, CLS problems.

#### C17. Không có hreflang tags cho multi-language
Hệ thống support languages (Language model) nhưng không có `<link rel="alternate" hreflang="...">`.
→ Google không biết có phiên bản ngôn ngữ khác.

#### C18. Không có AggregateRating / Review schema riêng
**File:** `storefront/src/views/ProductDetailPage.vue:145-211`
Reviews section chỉ là HTML, không có JSON-LD cho AggregateRating.
→ Không có star ratings trong Google search results.

#### C19. Image tags thiếu width/height attributes
**Files:** Tất cả components có `<img>` tags.
→ Gây CLS (Cumulative Layout Shift) khi images load → ảnh hưởng Core Web Vitals score.

#### C20. Không có Core Web Vitals monitoring
Không có: LCP, CLS, FID/INP tracking. Không biết performance score hiện tại.

#### C21. Slug/ID inconsistency trong route handling
**File:** `storefront/src/views/ProductDetailPage.vue:342`
Route dùng `:slug` nhưng API call có thể dùng product ID. Backend accepts cả hai → URL confusion.

---

## 5. KẾ HOẠCH HÀNH ĐỘNG THEO PHASE

### 📌 PHASE 1: CRITICAL FIXES (Tuần 1-2)

**Mục tiêu:** Fix tất cả Critical issues, hệ thống hoạt động ổn định cơ bản.

| # | Task | Files | Issue Ref |
|---|------|-------|-----------|
| 1 | Thêm `show()` method vào ProductsController, BannersController, CategoriesController, BrandsController | 4 controllers + routes | A1 |
| 2 | Fix route parameter mismatch `pages/{slug}` | `routes/storefrontModules/storefront.php` | A2 |
| 3 | Thêm `flat()` method vào NavLinksController | `NavLinksController.php` | A3 |
| 4 | Thêm pagination cho storefront products endpoint | `StorefrontController.php` | A5 |
| 5 | Fix ProductManager double JSON parsing (products + categories + brands + stock) | `frontend/src/components/ProductManager.vue` | B1, B7, B10 |
| 6 | Thống nhất auth endpoints + fix checkout order refresh | `useAuth.js`, `useApi.js`, `AccountPage.vue`, `CheckoutPage.vue` | B2, B3 |
| 7 | Fix review submission auth structure | `ProductDetailPage.vue` | B4 |
| 8 | Migration thêm SEO columns (meta_title, meta_description, meta_keywords, canonical_url) | Tạo migration mới | C1, C6 |
| 9 | Install `@unhead/vue` và implement basic meta tags | `storefront/package.json`, tất cả views | C1 |
| 10 | Tạo SitemapController + route `/sitemap.xml` | Backend mới | C3 |
| 11 | Fix storefront index.html head tags (charset, viewport, theme-color) | `storefront/index.html` | C21 |

---

### 📌 PHASE 2: STABILITY & CONNECTIONS (Tuần 3-4)

**Mục tiêu:** Kết nối các features, thêm validation, error handling.

| # | Task | Files | Issue Ref |
|---|------|-------|-----------|
| 9 | Thêm validation vào TemplatesController, BannersController, NavLinksController | 3 controllers | A5 |
| 10 | Thêm error handling + resource existence checks | 5+ controllers | A6 |
| 11 | Tạo Enums cho Order status/payment status | Tạo `app/Enums/` | A7 |
| 12 | Hoàn thiện TemplatesController (update, show) | `TemplatesController.php` | A8 |
| 13 | Kết nối Flash Sales → Products (pivot table) | Migration + Model | A10 |
| 14 | Kết nối Coupons → Checkout (apply coupon logic) | `StorefrontController.php` | A10 |
| 15 | Fix CheckoutPage order status persistence | `CheckoutPage.vue` | B3 |
| 16 | Fix phone normalization OrderTracking | `OrderTrackingPage.vue` | B4 |
| 17 | Thêm error boundaries cho admin app | `frontend/src/App.vue` | B7 |
| 18 | Thêm promotion date fields vào ProductManager | `ProductManager.vue` | B8 |

---

### 📌 PHASE 3: SEO FOUNDATION (Tuần 5-6)

**Mục tiêu:** SEO cơ bản hoạt động, structured data, social meta.

| # | Task | Files | Issue Ref |
|---|------|-------|-----------|
| 19 | Implement JSON-LD cho Product pages | `ProductDetailPage.vue` | C2 |
| 20 | Implement JSON-LD cho BreadcrumbList | Tất cả pages có breadcrumb | C2 |
| 21 | Implement JSON-LD cho Organization | `App.vue` | C2 |
| 22 | Thêm Open Graph + Twitter Card tags | Tất cả page views | C6 |
| 23 | Implement canonical URLs | Tất cả page views | C5 |
| 24 | Fix robots.txt | `backend-laravel/public/robots.txt` | C8 |
| 25 | Thêm SEO fields vào admin forms | Admin controllers + frontend forms | C9 |
| 26 | Thêm pagination SEO (rel next/prev) | `ProductsPage.vue` | C7 |

---

### 📌 PHASE 4: CMS & ADVANCED FEATURES (Tuần 7-8)

**Mục tiêu:** CMS publishing workflow, model improvements, advanced SEO.

| # | Task | Files | Issue Ref |
|---|------|-------|-----------|
| 27 | Implement CMS publish/draft workflow | Migration + CmsPage model + Controller | A4 |
| 28 | Enrich models (relationships, casts, scopes) | 8+ model files | A9 |
| 29 | Thêm filters cho OrderFilterPipeline | `OrderFilterPipeline.php` + QueryBuilders | A11 |
| 30 | Implement FlashSale component | `storefront/src/components/FlashSale.vue` | B16 |
| 31 | Implement related products / internal linking | `ProductDetailPage.vue` + API | C12 |
| 32 | Implement redirect management system (301/302) | Tạo Migration + Controller + Model | C10 |
| 33 | Image optimization (responsive, WebP) | Storefront components | C11 |

---

### 📌 PHASE 5: SSR & PERFORMANCE (Tuần 9-12)

**Mục tiêu:** Giải quyết vấn đề SPA không thân thiện SEO.

| # | Task | Files | Issue Ref |
|---|------|-------|-----------|
| 34 | Evaluate và chọn SSR strategy (Nuxt 3 hoặc Vite SSR) | Architecture decision | C4 |
| 35 | Migrate storefront sang SSR | Toàn bộ storefront | C4 |
| 36 | Setup Core Web Vitals monitoring | Config + third-party | C4 |
| 37 | SEO scoring system trong admin | Backend + Frontend | C15 |

---

## 6. BẢNG TỔNG HỢP TẤT CẢ ISSUES

### Backend Issues (22 issues)
| ID | Mô tả | Severity | File | Phase |
|----|-------|----------|------|-------|
| A1 | Controllers thiếu show() method | 🔴 CRITICAL | 4 controllers | 1 |
| A2 | Route pages/{id} mismatch parameter | 🔴 CRITICAL | storefront.php:11 | 1 |
| A3 | NavLinksController thiếu flat() | 🔴 CRITICAL | content.php:23 | 1 |
| A4 | CmsPage thiếu publishing workflow | 🔴 CRITICAL | CmsPage model + controller | 4 |
| A5 | Storefront products không pagination | 🔴 CRITICAL | StorefrontController:34 | 1 |
| A6 | Thiếu input validation | 🟠 HIGH | 3 controllers | 2 |
| A7 | Thiếu error handling | 🟠 HIGH | 5+ controllers | 2 |
| A8 | Hard-coded values + boolean string compare | 🟠 HIGH | StorefrontController | 2 |
| A9 | TemplatesController thiếu update/show | 🟠 HIGH | TemplatesController | 2 |
| A10 | Hardcoded Vietnamese string (i18n) | 🟠 HIGH | StorefrontController:380 | 2 |
| A11 | Models quá minimal | 🟡 MEDIUM | 8+ models | 4 |
| A12 | Features chưa kết nối | 🟡 MEDIUM | Multiple | 2 |
| A13 | Pipelines/Filters chưa đủ | 🟡 MEDIUM | OrderFilterPipeline | 4 |
| A14 | ExportController::report() stub | 🟡 MEDIUM | ExportController:37 | 4 |
| A15 | ExportController dùng raw DB::table() | 🟡 MEDIUM | ExportController:26 | 4 |
| A16 | NavLink thiếu parent/children relationships | 🟡 MEDIUM | NavLink.php | 4 |
| A17 | CmsPage thiếu scheduled_for, expires_at | 🟡 MEDIUM | CmsPage model | 4 |
| A18 | Missing type hints toàn bộ controllers | 🟡 MEDIUM | All controllers | 4 |
| A19 | Guarded=['id'] thay vì fillable array | 🟡 MEDIUM | All models | 4 |
| A20 | Repository naming không nhất quán | 🟢 LOW | Multiple repos | 4 |
| A21 | Missing storefront response pagination | 🟢 LOW | StorefrontController | 2 |
| A22 | Mixed abstraction levels (DB + Repo) | 🟢 LOW | ExportController | 4 |

### Frontend/Storefront Issues (38 issues)
| ID | Mô tả | Severity | File | Phase |
|----|-------|----------|------|-------|
| B1 | ProductManager double JSON parse | 🔴 CRITICAL | ProductManager.vue:330 | 1 |
| B2 | Auth endpoints không nhất quán | 🔴 CRITICAL | useAuth.js, AccountPage.vue | 1 |
| B3 | Checkout order refresh mất auth | 🔴 CRITICAL | CheckoutPage.vue:279-290 | 1 |
| B4 | Review submission auth structure sai | 🔴 CRITICAL | ProductDetailPage.vue:406-433 | 1 |
| B5 | Checkout order status mất khi refresh | 🟠 HIGH | CheckoutPage.vue:365 | 2 |
| B6 | Phone format mismatch | 🟠 HIGH | OrderTrackingPage.vue:174 | 2 |
| B7 | Categories/Brands double-parse | 🟠 HIGH | ProductManager.vue:351 | 1 |
| B8 | Không có error boundaries | 🟠 HIGH | App.vue (frontend) | 2 |
| B9 | Thiếu promotion date fields | 🟠 HIGH | ProductManager.vue:411 | 2 |
| B10 | Stock adjustment double-parse | 🟠 HIGH | ProductManager.vue:461-473 | 2 |
| B11 | AccountPage address dùng raw fetch | 🟠 HIGH | AccountPage.vue:344 | 2 |
| B12 | SiteHeader language race condition | 🟠 HIGH | SiteHeader.vue:39-54 | 2 |
| B13 | Image JSON parse không try-catch | 🟡 MEDIUM | ProductDetailPage.vue:264 | 3 |
| B14 | ProductCard slug fallback gây 404 | 🟡 MEDIUM | ProductCard.vue:2 | 2 |
| B15 | Cart localStorage corrupt silent | 🟡 MEDIUM | CartPage.vue:76 | 3 |
| B16 | Filter field names mismatch | 🟡 MEDIUM | ProductsPage.vue:266 | 2 |
| B17 | Theme config không apply | 🟡 MEDIUM | useTheme.js:127 | 3 |
| B18 | FlashSale component rỗng | 🟡 MEDIUM | FlashSale.vue | 4 |
| B19 | CmsPage silent error | 🟡 MEDIUM | CmsPage.vue:65 | 3 |
| B20 | Checkout silent error handling | 🟡 MEDIUM | CheckoutPage.vue:300-308 | 2 |
| B21 | Không có global error handler | 🟡 MEDIUM | Multiple | 3 |
| B22 | API Base URL không thống nhất | 🟡 MEDIUM | useApi.js | 2 |
| B23 | ProductDetail race condition reviews | 🟡 MEDIUM | ProductDetailPage.vue:364 | 2 |
| B24 | Checkout form thiếu phone/email validate | 🟡 MEDIUM | CheckoutPage.vue:321 | 2 |
| B25 | Image URL không validate trong admin | 🟡 MEDIUM | ProductManager.vue:282 | 3 |
| B26 | Order status transitions không validate | 🟡 MEDIUM | Backend + Frontend | 4 |
| B27 | Cart → Checkout thiếu stock reservation | 🟡 MEDIUM | StorefrontController | 2 |
| B28 | Search debounce race condition | 🟡 MEDIUM | ProductsPage.vue:251 | 3 |
| B29 | HomePage mixed response structure | 🟡 MEDIUM | HomePage.vue:121 | 2 |
| B30 | ProductManager image URL validate | 🟡 MEDIUM | ProductManager.vue:215 | 3 |
| B31 | Admin fetchShops() no error handling | 🟡 MEDIUM | frontend/App.vue:600 | 2 |
| B32 | Admin route parsing hardcoded regex | 🟡 MEDIUM | frontend/App.vue:409 | 3 |
| B33 | BannerSlider/CategoryGrid chưa verify | 🟢 LOW | storefront/components/ | 4 |
| B34 | SiteFooter chưa verify | 🟢 LOW | SiteFooter.vue | 4 |
| B35 | ProductManager thiếu bulk operations | 🟢 LOW | ProductManager.vue | 4 |
| B36 | AccountPage chưa audit đầy đủ | 🟢 LOW | AccountPage.vue | 3 |
| B37 | AuthPage chưa audit đầy đủ | 🟢 LOW | AuthPage.vue | 3 |
| B38 | ShopSettings chưa audit đầy đủ | 🟢 LOW | ShopSettings.vue | 3 |

### SEO Issues (25 issues)
| ID | Mô tả | Severity | File | Phase |
|----|-------|----------|------|-------|
| C1 | Không có meta tags (description, keywords) | 🔴 CRITICAL | All views + DB schema | 1 |
| C2 | Không có JSON-LD / structured data | 🔴 CRITICAL | All views | 3 |
| C3 | Không có sitemap | 🔴 CRITICAL | Backend | 1 |
| C4 | SPA không có SSR | 🔴 CRITICAL | Storefront architecture | 5 |
| C5 | Không có canonical URLs | 🔴 CRITICAL | All views | 3 |
| C6 | Database thiếu SEO columns | 🔴 CRITICAL | 4 tables | 1 |
| C7 | Không có OG/Social meta | 🟠 HIGH | All views | 3 |
| C8 | Không có Twitter Card tags | 🟠 HIGH | All views | 3 |
| C9 | Không có pagination SEO | 🟠 HIGH | ProductsPage.vue | 3 |
| C10 | robots.txt quá lỏng | 🟠 HIGH | robots.txt | 3 |
| C11 | Admin thiếu SEO input fields | 🟠 HIGH | Admin controllers | 3 |
| C12 | API responses thiếu SEO fields | 🟠 HIGH | ProductTransformer.php | 3 |
| C13 | Không có redirect management | 🟠 HIGH | Backend | 4 |
| C14 | Không có responsive images (srcset) | 🟠 HIGH | All image components | 4 |
| C15 | Không có Review/AggregateRating schema | 🟡 MEDIUM | ProductDetailPage.vue:145 | 3 |
| C16 | Image optimization thiếu (WebP, srcset) | 🟡 MEDIUM | Components | 4 |
| C17 | Không có internal linking | 🟡 MEDIUM | ProductDetailPage.vue | 4 |
| C18 | Keywords system mồ côi | 🟡 MEDIUM | KeywordsController | 4 |
| C19 | H1 structure cần review | 🟡 MEDIUM | HomePage.vue | 3 |
| C20 | Thiếu SEO config .env | 🟡 MEDIUM | .env | 3 |
| C21 | Storefront index.html thiếu head tags | 🟡 MEDIUM | index.html | 1 |
| C22 | Không có hreflang tags (multi-lang) | 🟡 MEDIUM | Frontend | 4 |
| C23 | Image tags thiếu width/height → CLS | 🟢 LOW | All img tags | 3 |
| C24 | Không có Core Web Vitals monitoring | 🟢 LOW | Frontend | 5 |
| C25 | Slug/ID inconsistency trong routes | 🟢 LOW | ProductDetailPage.vue:342 | 2 |

---

## GHI CHÚ CUỐI

- **Ưu tiên #1:** Fix 15 Critical issues ở Phase 1 trước, vì chúng ảnh hưởng trực tiếp đến hoạt động cơ bản của hệ thống.
- **Ưu tiên #2:** SEO meta tags và sitemap nên được triển khai sớm nhất có thể để Google bắt đầu index.
- **Quyết định lớn nhất:** Chọn strategy cho SSR (Phase 5) — nên quyết định sớm vì ảnh hưởng kiến trúc toàn bộ storefront.
- **Tổng effort ước tính:** ~12 tuần cho toàn bộ 5 phases.
- **SEO Maturity hiện tại:** ~10-15% (theo đánh giá của Agent 3).
- **Báo cáo chi tiết từ agents:** Xem output đầy đủ của từng agent trong conversation history.

---

> **Phiên bản:** v2.0 | Cập nhật: 2026-03-16 | Tổng: 85 issues (15 Critical, 21 High, 37 Medium, 12 Low)
