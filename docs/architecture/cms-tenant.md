# Kiến trúc CMS Tenant — Phân chia vai trò

## Tổng quan

Hệ thống CMS tenant chia thành 4 module rõ ràng, mỗi module có vai trò cụ thể:

```
┌──────────────────────────────────────────────────┐
│                 CMS Tenant                       │
├──────────────┬───────────────────────────────────┤
│ Trang CMS    │ Tạo & quản lý dynamic pages      │
├──────────────┼───────────────────────────────────┤
│ Theme        │ Giao diện, màu sắc, dark/light   │
├──────────────┼───────────────────────────────────┤
│ Bố cục       │ Layout các page + Header links    │
│ Cửa Hàng     │ + Footer config + Custom CSS      │
└──────────────┴───────────────────────────────────┘
```

## 1. Trang CMS (`/shop/cms`)

**Vai trò:** Tạo và quản lý dynamic pages (trang nội dung tùy chỉnh).

**Chức năng:**
- Tạo/sửa/xóa trang CMS
- Editor nội dung (title, slug, body, SEO)
- Publish/unpublish/schedule
- Layout builder cho từng trang CMS

**API:** `/cms-pages` (CRUD + publish/unpublish/schedule)

**Composable:** `useCmsPages.js`

---

## 2. Theme (`/shop/appearance`)

**Vai trò:** Cấu hình giao diện site.

**Chức năng:**
- Chọn preset màu (12 presets)
- Tùy chỉnh accent color
- Dark/light mode
- Typography
- Preview trực tiếp

**API:** `/system-config/group/appearance`

---

## 3. Bố cục Cửa Hàng (`/shop/layout`)

**Vai trò:** Trung tâm quản lý layout toàn bộ storefront.

**Component:** `StorefrontLayoutBuilder.vue`

### 3.1 Layout Sections
- Drag-drop sắp xếp sections trang chủ (Banner, Categories, Flash Sale, Featured, New Arrivals, CMS Pages)
- Enable/disable từng section
- Params cho mỗi section (items, columns, etc.)

### 3.2 Page Configs
- Cấu hình chi tiết từng page built-in:
  - Products Page (grid columns, filters, sorting)
  - Product Detail (tabs, reviews, related)
  - Checkout (steps, payment methods)
  - Auth, Account pages

### 3.3 Header Config
- Logo position, sticky, search bar
- Max nav links
- Theme toggle
- **Menu điều hướng Header** — CRUD links với smart page selector:
  - Trang có sẵn (Home, Products, Categories, Brands, Cart, Promotions, Wishlist, Order Tracking, Account, Auth)
  - Trang CMS (load từ API `/cms-pages`)
  - Nhập URL tùy chỉnh

### 3.4 Footer Config
- Columns drag-drop (3 loại: Links, Contact, Text)
- Footer link URL cũng dùng smart page selector (Có sẵn / CMS / Tùy chỉnh)
- Social links (Facebook, Instagram, YouTube, TikTok, Zalo, Twitter, Shopee, Lazada)
- Payment methods (COD, Bank, VISA, MasterCard, MoMo, ZaloPay, VNPay, etc.)
- Badges/Chứng nhận
- Thông tin pháp lý + Copyright
- Màu sắc (nền, tiêu đề, chữ)

### 3.5 Custom CSS
- CSS tùy chỉnh cho toàn bộ storefront

### 3.6 Live Preview
- Preview wireframe (header, sections, footer)
- Preview iframe (live với storefront URL)

**API:** `/system-config/group/storefront_layout`

**Keys:**
| Key | Nội dung |
|-----|----------|
| `layout_sections` | Sections trang chủ |
| `layout_pages` | Enable/disable pages |
| `layout_template` | Template active |
| `layout_custom_css` | CSS tùy chỉnh |
| `layout_page_configs` | Config từng page |
| `layout_header_config` | Header style config |
| `layout_footer_config` | Footer columns + colors |
| `storefront_url` | URL storefront |

---

## Storefront Pages có sẵn

| Page | Route | File |
|------|-------|------|
| Trang chủ | `/` | `HomePage.vue` |
| Sản phẩm | `/products` | `ProductsPage.vue` |
| Chi tiết SP | `/product/:slug` | `ProductDetailPage.vue` |
| Danh mục | `/categories` | `CategoriesPage.vue` |
| Thương hiệu | `/brands` | `BrandsPage.vue` |
| Giỏ hàng | `/cart` | `CartPage.vue` |
| Thanh toán | `/checkout` | `CheckoutPage.vue` |
| Khuyến mãi | `/promotions` | `PromotionsPage.vue` |
| Yêu thích | `/wishlist` | `WishlistPage.vue` |
| Theo dõi đơn | `/order-tracking` | `OrderTrackingPage.vue` |
| Tài khoản | `/account` | `AccountPage.vue` |
| Đăng nhập | `/auth` | `AuthPage.vue` |
| Trang CMS | `/page/:slug` | `CmsPage.vue` |

---

## Smart Page Selector

Khi thêm link (header hoặc footer), user chọn 1 trong 3 mode:

1. **Trang có sẵn** — Dropdown liệt kê tất cả built-in pages
2. **Trang CMS** — Dropdown load danh sách CMS pages đã publish
3. **Nhập tùy chỉnh** — Input tự do (internal path hoặc external URL)

Giúp user không cần nhớ URL, giảm lỗi nhập sai.
