# Layout Template JSON — Tài liệu cấu trúc

> **Schema:** `storefront-layout-template` · **Version:** `2`  
> **Cập nhật:** 2026-04-04  
> **Trạng thái:** Production-grade spec

---

## Mục lục

1. [Tổng quan & Triết lý thiết kế](#1-tổng-quan--triết-lý-thiết-kế)
2. [Cấu trúc top-level](#2-cấu-trúc-top-level)
3. [version & schema](#3-version--schema)
4. [theme](#4-theme)
5. [globalSettings](#5-globalsettings)
6. [sections\[\]](#6-sections)
   - [SectionObject schema](#61-sectionobject-schema)
   - [layout (spacing & background)](#62-layout)
   - [visibility (responsive)](#63-visibility)
   - [dataSource](#64-datasource)
   - [conditions (personalization)](#65-conditions)
   - [meta (builder UI)](#66-meta)
   - [Danh sách section types](#67-danh-sách-section-types)
   - [defaultParams theo type](#68-defaultparams-theo-type)
7. [headerConfig](#7-headerconfig)
   - [navLinks với children (mega menu)](#72-navlinks-với-children)
8. [footerConfig](#8-footerconfig)
9. [promoConfig](#9-promoconfig)
10. [pages](#10-pages)
11. [pageConfigs](#11-pageconfigs)
12. [template](#12-template)
13. [Validation rules](#13-validation-rules)
14. [Kiến trúc platform-level (Shopify-grade)](#14-kiến-trúc-platform-level)
15. [File JSON mẫu đầy đủ (v2)](#15-file-json-mẫu-đầy-đủ-v2)
16. [Migration guide v1 → v2](#16-migration-guide-v1--v2)

---

## 1. Tổng quan & Triết lý thiết kế

File JSON template là **nguồn cấu hình duy nhất (Single Source of Truth)** cho toàn bộ storefront. Kiến trúc này tương đương với:

| Platform | Tương đương |
|----------|-------------|
| Shopify | JSON Templates (`sections/*.json`) |
| Builder.io | Page JSON |
| Webflow | Site export |
| Contentful | Content model |

### Nguyên tắc core

```
params   → behavior config (HOW to display)
content  → data content  (WHAT to display)
dataSource → dynamic query (WHERE to fetch data)
```

Tách biệt ba tầng này giữ cho `SectionRenderer` clean:

```
SectionRenderer(type, params, content, dataSource)
         ↑
   Builder JSON
```

### Luồng dữ liệu

```
JSON file
   │
   ▼  Import vào Builder
StorefrontLayoutBuilder (editor state: sections + meta)
   │
   ▼  Xuất bản (Publish)
Backend: layout_pages.layout_json  +  layout_pages.meta
   │
   ▼  GET /site-config  (single mega-endpoint)
Storefront: SiteHeader · SiteFooter · PromoBar · SectionRenderer
```

> **Quan trọng:** Import chỉ cập nhật editor state — phải bấm **Xuất bản** để push lên server và live storefront.

---

## 2. Cấu trúc top-level

```json
{
  "_schema":       "storefront-layout-template",
  "_version":      2,
  "_exported_at":  "2026-04-04T10:00:00.000Z",
  "_page":         "home",

  "version":       2,
  "template":      "pharmacy",
  "customCss":     "",
  "storefrontUrl": "",

  "theme":          { ... },
  "globalSettings": { ... },
  "sections":       [ ... ],
  "headerConfig":   { ... },
  "footerConfig":   { ... },
  "promoConfig":    { ... },
  "pages":          { ... },
  "pageConfigs":    { ... }
}
```

| Field | Bắt buộc | Kiểu | Mô tả |
|-------|----------|------|-------|
| `_schema` | Không | string | Identifier file. Phải là `"storefront-layout-template"` |
| `_version` | Không | number | Version schema trong file metadata |
| `_exported_at` | Không | ISO string | Timestamp export — chỉ để tham khảo |
| `_page` | Không | string | Trang đã export (`"home"`, `"products"`...) |
| `version` | Không | number | **Schema version** — dùng để migrate khi upgrade. Hiện tại: `2` |
| `template` | Không | string | Preset template đã chọn |
| `customCss` | Không | string | CSS tùy chỉnh inject vào storefront |
| `storefrontUrl` | Không | string | URL preview |
| `theme` | Không | object | Hệ màu sắc trung tâm của toàn site |
| `globalSettings` | Không | object | Thiết lập layout toàn cục (container, spacing, font...) |
| `sections` | **Có** | array | Mảng section layout — **trường bắt buộc duy nhất** |
| `headerConfig` | Không | object | Cấu hình header |
| `footerConfig` | Không | object | Cấu hình footer |
| `promoConfig` | Không | object | Cấu hình promo bar |
| `pages` | Không | object | Bật/tắt route pages |
| `pageConfigs` | Không | object | Config chi tiết từng trang hệ thống |

---

## 3. version & schema

### Tại sao cần `version`

Version cho phép builder tự động **migrate** khi schema thay đổi, thay vì crash hoặc mất dữ liệu.

```
v1 → banner.params.height = "sm" | "md" | "lg"
v2 → banner.params.height = số px (400, 500, 600)
v3 → banner.params.height = { desktop: 600, tablet: 400, mobile: 300 }
```

Builder đọc `version` và chạy migration pipeline phù hợp.

### Migration strategy

```
importedJson.version === currentVersion  → load trực tiếp
importedJson.version < currentVersion    → chạy migratev1→v2(), migratev2→v3()...
importedJson.version > currentVersion    → cảnh báo "file mới hơn builder, cập nhật builder"
importedJson.version === undefined       → coi là v1 (legacy)
```

---

## 4. theme

Tập trung toàn bộ hệ màu sắc vào một object duy nhất. Các section, header, footer đều **kế thừa từ đây** và chỉ override khi cần thiết.

```json
{
  "theme": {
    "primary":    "#7c3aed",
    "secondary":  "#111827",
    "accent":     "#10b981",
    "background": "#ffffff",
    "surface":    "#f9fafb",
    "border":     "#e5e7eb",
    "text":       "#111827",
    "textMuted":  "#6b7280",
    "danger":     "#ef4444",
    "warning":    "#f59e0b",
    "success":    "#10b981",
    "mode":       "light"
  }
}
```

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `primary` | hex | Màu chính — nút CTA, link active, accent |
| `secondary` | hex | Màu phụ |
| `accent` | hex | Màu nhấn (flash sale, badge...) |
| `background` | hex | Màu nền toàn trang |
| `surface` | hex | Màu nền card, panel |
| `border` | hex | Màu viền |
| `text` | hex | Màu chữ chính |
| `textMuted` | hex | Màu chữ phụ, placeholder |
| `danger` | hex | Màu lỗi, xóa |
| `warning` | hex | Màu cảnh báo |
| `success` | hex | Màu thành công |
| `mode` | string | `"light"` hoặc `"dark"` — chế độ màu mặc định |

### Cách section sử dụng theme

Section **không cần khai báo màu** nếu dùng màu theme. Chỉ override khi cần màu riêng:

```json
{
  "type": "flash_sale",
  "params": {
    "accentColor": "#ff4757"
  }
}
```

Nếu `accentColor` không có → dùng `theme.accent` → dùng CSS variable `--sf-accent`.

---

## 5. globalSettings

Các thiết lập layout áp dụng cho **toàn bộ storefront**. Giữ cho giao diện consistent.

```json
{
  "globalSettings": {
    "containerWidth":  1280,
    "gridGap":         24,
    "sectionGap":      48,
    "borderRadius":    12,
    "fontFamily":      "Inter",
    "headingFont":     "Inter",
    "buttonStyle":     "rounded",
    "cardShadow":      "soft",
    "imageAspectRatio": "auto",
    "animationsEnabled": true
  }
}
```

| Field | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `containerWidth` | number (px) | `1280` | Max-width của container chính |
| `gridGap` | number (px) | `24` | Khoảng cách giữa các items trong grid |
| `sectionGap` | number (px) | `48` | Khoảng cách padding top/bottom giữa các section |
| `borderRadius` | number (px) | `12` | Border radius mặc định cho card, button |
| `fontFamily` | string | `"Inter"` | Font chữ body — phải là Google Font hoặc system font |
| `headingFont` | string | `"Inter"` | Font chữ heading (h1–h6) |
| `buttonStyle` | string | `"rounded"` | `"rounded"` \| `"square"` \| `"pill"` |
| `cardShadow` | string | `"soft"` | `"none"` \| `"soft"` \| `"medium"` \| `"hard"` |
| `imageAspectRatio` | string | `"auto"` | `"auto"` \| `"square"` \| `"4/3"` \| `"16/9"` \| `"3/4"` |
| `animationsEnabled` | boolean | `true` | Bật/tắt AOS scroll animations toàn site |

---

## 6. sections[]

Mảng các section hiển thị trên trang. Thứ tự trong mảng = thứ tự render (field `order` ghi đè nếu có).

### 6.1 SectionObject schema

```json
{
  "id":           "banner-hero-1",
  "type":         "banner",
  "enabled":      true,
  "order":        0,

  "params":       {},
  "tabletParams": {},
  "mobileParams": {},
  "content":      [],

  "layout":     {},
  "visibility": {},
  "dataSource": {},
  "conditions": {},
  "meta":       {}
}
```

| Field | Bắt buộc | Kiểu | Mặc định | Mô tả |
|-------|----------|------|----------|-------|
| `id` | Không | string | auto-generated | ID duy nhất trong page, tự sinh nếu thiếu |
| `type` | **Có** | string | — | Loại section — xem [danh sách đầy đủ](#67-danh-sách-section-types) |
| `enabled` | Không | boolean | `true` | Ẩn/hiện section |
| `order` | Không | number | array index | Thứ tự render — số nhỏ hơn hiển thị trước |
| `params` | Không | object | `{}` | Config behavior cho section (khác nhau theo `type`) |
| `tabletParams` | Không | object | `{}` | Override `params` cho tablet ≤1024px |
| `mobileParams` | Không | object | `{}` | Override `params` cho mobile ≤768px |
| `content` | Không | array | `[]` | Nội dung động: banner slides, FAQ items, gallery... |
| `layout` | Không | object | `{}` | Spacing, background, container của section — xem [6.2](#62-layout) |
| `visibility` | Không | object | all true | Hiện/ẩn theo device — xem [6.3](#63-visibility) |
| `dataSource` | Không | object | `{}` | Query dữ liệu động từ API — xem [6.4](#64-datasource) |
| `conditions` | Không | object | `{}` | Điều kiện hiển thị (login state, country...) — xem [6.5](#65-conditions) |
| `meta` | Không | object | `{}` | Metadata cho builder UI (label, icon, locked) — xem [6.6](#66-meta) |

---

### 6.2 layout

Kiểm soát spacing và background cho từng section. Override `globalSettings` tại section level.

```json
{
  "layout": {
    "container":      "boxed",
    "paddingTop":     40,
    "paddingBottom":  40,
    "paddingLeft":    0,
    "paddingRight":   0,
    "background":     "#ffffff",
    "backgroundImage": "",
    "backgroundOverlay": 0,
    "fullWidth":      false
  }
}
```

| Field | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `container` | string | `"boxed"` | `"boxed"` (max-width từ globalSettings) \| `"full"` (100vw) \| `"narrow"` (800px) |
| `paddingTop` | number (px) | từ `globalSettings.sectionGap` | Padding trên |
| `paddingBottom` | number (px) | từ `globalSettings.sectionGap` | Padding dưới |
| `paddingLeft` | number (px) | `0` | Padding trái (chỉ dùng khi `container: "full"`) |
| `paddingRight` | number (px) | `0` | Padding phải |
| `background` | hex/string | `""` | Màu nền section. Trống = dùng `theme.background` |
| `backgroundImage` | string (URL) | `""` | Ảnh nền section |
| `backgroundOverlay` | number (0-1) | `0` | Độ mờ overlay đen lên ảnh nền |
| `fullWidth` | boolean | `false` | Bỏ qua container, kéo section ra 100% viewport width |

---

### 6.3 visibility

Hiện/ẩn section theo device. Mặc định hiện trên tất cả.

```json
{
  "visibility": {
    "desktop": true,
    "tablet":  true,
    "mobile":  false
  }
}
```

| Field | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `desktop` | boolean | `true` | Hiển thị trên desktop (≥1025px) |
| `tablet` | boolean | `true` | Hiển thị trên tablet (768px–1024px) |
| `mobile` | boolean | `true` | Hiển thị trên mobile (≤767px) |

**Ví dụ dùng thực tế:**

```json
{
  "type": "brands_slider",
  "visibility": { "desktop": true, "tablet": true, "mobile": false }
}
```
→ Ẩn brand slider trên mobile để tránh lộn xộn.

---

### 6.4 dataSource

Định nghĩa **nơi lấy dữ liệu** cho section động. Tách biệt hoàn toàn khỏi `params` (config UI).

```json
{
  "dataSource": {
    "type":     "products",
    "query": {
      "category": "thuoc-ho",
      "brand":    "",
      "tag":      "",
      "limit":    8,
      "sort":     "best_selling",
      "inStock":  true
    },
    "cache":    300
  }
}
```

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `type` | string | Loại data: `"products"` \| `"categories"` \| `"blog_posts"` \| `"cms_pages"` \| `"brands"` \| `"custom_api"` |
| `query` | object | Tham số query — khác nhau theo `type` |
| `cache` | number (giây) | TTL cache. `0` = không cache. Mặc định `300` (5 phút) |

**query cho `"products"`:**

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `category` | string/array | Slug danh mục hoặc mảng slugs |
| `brand` | string/array | Slug thương hiệu |
| `tag` | string | Tag sản phẩm |
| `limit` | number | Số lượng (1–48) |
| `sort` | string | `"newest"` \| `"best_selling"` \| `"top_rated"` \| `"price_asc"` \| `"price_desc"` |
| `inStock` | boolean | Chỉ lấy sản phẩm còn hàng |
| `ids` | array | Danh sách product IDs cụ thể — override tất cả filter khác |

**query cho `"blog_posts"`:**

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `tag` | string | Tag bài viết |
| `category` | string | Danh mục blog |
| `limit` | number | Số lượng |
| `sort` | string | `"newest"` \| `"popular"` \| `"featured"` |

---

### 6.5 conditions

Hiển thị section có điều kiện — dùng cho **personalization** và **A/B testing**.

```json
{
  "conditions": {
    "userLoggedIn":   true,
    "userGroup":      ["vip", "wholesale"],
    "country":        ["VN", "JP"],
    "dateFrom":       "2026-12-01",
    "dateTo":         "2026-12-31",
    "cartItemCount":  { "min": 1 },
    "operator":       "AND"
  }
}
```

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `userLoggedIn` | boolean | `true` = chỉ hiện khi đã login, `false` = chỉ hiện khi chưa login |
| `userGroup` | array\<string\> | Nhóm khách hàng (VIP, bán sỉ...) |
| `country` | array\<string\> | Mã quốc gia ISO 3166-1 |
| `dateFrom` | ISO date | Hiện từ ngày này |
| `dateTo` | ISO date | Hiện đến ngày này (flash campaign) |
| `cartItemCount` | object | `{ "min": 1 }` = chỉ hiện khi có sản phẩm trong giỏ |
| `operator` | string | `"AND"` (tất cả điều kiện đúng) \| `"OR"` (ít nhất một đúng). Mặc định: `"AND"` |

**Ví dụ dùng thực tế:**

```json
{
  "type": "newsletter",
  "conditions": {
    "userLoggedIn": false
  }
}
```
→ Ẩn form newsletter với user đã đăng nhập (họ đã subscribe rồi).

```json
{
  "type": "flash_sale",
  "conditions": {
    "dateFrom": "2026-12-24",
    "dateTo":   "2026-12-26"
  }
}
```
→ Flash sale chỉ hiện trong 3 ngày Giáng sinh.

---

### 6.6 meta

Metadata cho **builder UI** — không ảnh hưởng đến storefront rendering.

```json
{
  "meta": {
    "label":       "Banner hero chính",
    "icon":        "image",
    "locked":      false,
    "description": "Banner fullwidth đầu trang chủ",
    "group":       "hero",
    "tags":        ["homepage", "hero", "banner"]
  }
}
```

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `label` | string | Tên hiển thị trong builder layer panel |
| `icon` | string | Icon Lucide cho layer panel |
| `locked` | boolean | Khi `true` → không thể xóa trong builder UI |
| `description` | string | Ghi chú nội bộ |
| `group` | string | Nhóm section để collapse trong layer panel |
| `tags` | array\<string\> | Tags tìm kiếm trong builder |

---

### 6.7 Danh sách section types

#### Thương mại điện tử

| type | Label | pvHeight |
|------|-------|---------|
| `banner` | Banner/Slider | 50px |
| `image_banner` | Promo Banner | 40px |
| `feature_links` | Tính năng nhanh | 25px |
| `categories` | Danh mục sản phẩm | 25px |
| `flash_sale` | Flash Sale | 35px |
| `featured_products` | Sản phẩm nổi bật | 60px |
| `new_arrivals` | Hàng mới về | 60px |
| `brands_slider` | Thương hiệu | 30px |
| `trust_badges` | Trust Badges | 25px |

#### Nội dung

| type | Label | pvHeight |
|------|-------|---------|
| `cms_pages` | Trang CMS | 30px |
| `blog_posts` | Bài viết gần đây | 45px |
| `testimonials` | Đánh giá khách hàng | 45px |
| `faq` | FAQ | 40px |
| `image_gallery` | Thư viện ảnh | 50px |
| `video_embed` | Video | 55px |
| `text_block` | Khối văn bản | 35px |
| `newsletter` | Đăng ký email | 30px |
| `social_feed` | Mạng xã hội | 25px |
| `grid` | Lưới bố cục | 50px |
| `custom_block` | Visual Builder | 60px |

#### Theo ngành

| type | Label | Ngành |
|------|-------|-------|
| `restaurant_menu` | Thực đơn Nhà Hàng | F&B |
| `booking_services` | Dịch vụ Đặt lịch | Dịch vụ |
| `salon_services` | Dịch vụ Spa & Salon | Beauty |
| `property_listings` | Bất Động Sản | Realestate |
| `upcoming_events` | Sự Kiện Sắp Tới | Events |

#### Trang hệ thống (built-in pages)

| type | Dùng ở trang |
|------|-------------|
| `system_page_content` | Tất cả built-in pages |
| `page_breadcrumb` | Mọi trang |
| `page_heading` | Mọi trang |
| `product_grid` | `/products` |
| `product_detail_view` | `/products/:slug` |
| `product_reviews` | `/products/:slug` |
| `related_products` | `/products/:slug` |
| `cart_summary` | `/cart` |
| `checkout_form` | `/checkout` |
| `auth_form` | `/auth` |
| `account_dashboard` | `/account` |
| `order_history` | `/account` |
| `blog_listing` | `/blog` |
| `wishlist_grid` | `/account?tab=wishlist` |

---

### 6.8 defaultParams theo type

Chỉ khai báo field cần override, còn lại builder tự merge với defaults.

#### `banner`
```json
{ "autoplay": true, "interval": 4000, "height": "md" }
```
> `height`: `"sm"` | `"md"` | `"lg"` | `"full"` | number (px)

#### `categories`
```json
{
  "columns": 6, "showDescription": false,
  "layoutStyle": "grid", "showCount": false,
  "selectedCategoryIds": []
}
```
> `layoutStyle`: `"grid"` | `"list"` | `"scroll"`

#### `flash_sale`
```json
{ "showTimer": true, "showProgress": true, "count": 8, "columns": 4 }
```

#### `featured_products`
```json
{
  "title": "Sản phẩm nổi bật", "count": 8, "columns": 4,
  "filterCategory": "", "sortOrder": "newest",
  "slidesPerView": 2, "autoplay": true, "autoplaySpeed": 4000
}
```
> `sortOrder`: `"newest"` | `"best_selling"` | `"top_rated"` | `"price_asc"` | `"price_desc"`

#### `new_arrivals`
```json
{
  "title": "Hàng mới về", "count": 6, "columns": 4,
  "sortOrder": "newest", "slidesPerView": 2,
  "autoplay": true, "autoplaySpeed": 5000
}
```

#### `testimonials`
```json
{ "title": "Khách hàng nói gì", "columns": 3 }
```

#### `faq`
```json
{ "title": "Câu hỏi thường gặp" }
```

#### `newsletter`
```json
{
  "title": "Đăng ký nhận tin",
  "subtitle": "Nhận thông tin khuyến mãi và sản phẩm mới nhất",
  "buttonText": "Đăng ký"
}
```

#### `brands_slider`
```json
{ "title": "Thương hiệu", "animationSpeed": 20 }
```

#### `product_grid`
```json
{
  "columns": 4, "itemsPerPage": 12,
  "sidebarPosition": "left",
  "showFilters_category": true, "showFilters_brand": true, "showFilters_price": true,
  "sortDefault": "newest", "cardStyle": "default"
}
```

#### `product_detail_view`
```json
{
  "galleryStyle": "thumbnails", "layoutRatio": "50-50",
  "showBreadcrumb": true, "showSKU": true, "showStock": true, "showShare": true
}
```
> `layoutRatio`: `"50-50"` | `"40-60"` | `"60-40"` (ảnh : thông tin)

#### `checkout_form`
```json
{ "layout": "two-column", "showCoupon": true, "showNotes": true, "showSteps": true }
```

---

## 7. headerConfig

Cấu hình toàn bộ khu vực header.

```json
{
  "logoPosition":     "left",
  "maxNavLinks":      5,
  "showSearch":       true,
  "sticky":           true,
  "showThemeToggle":  true,
  "showAnnouncement": false,
  "announcementText": "",
  "announcementLink": "",
  "announcementBg":   "",
  "announcementColor": "",
  "topbarLinks":      [],
  "navLinks":         [],
  "translations":     {}
}
```

| Field | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `logoPosition` | string | `"left"` | `"left"` hoặc `"center"` |
| `maxNavLinks` | number | `5` | Số link hiển thị trực tiếp (3–10). Link vượt quá vào dropdown "Thêm" |
| `showSearch` | boolean | `true` | Hiện thanh search |
| `sticky` | boolean | `true` | Header cố định khi scroll |
| `showThemeToggle` | boolean | `true` | Hiện nút Dark/Light mode |
| `showAnnouncement` | boolean | `false` | Bật/tắt announcement bar phía trên header |
| `announcementText` | string | `""` | Nội dung thông báo |
| `announcementLink` | string | `""` | URL khi click thông báo |
| `announcementBg` | hex | theme accent | Màu nền announcement bar |
| `announcementColor` | hex | `"#fff"` | Màu chữ |
| `topbarLinks` | array | `[]` | Link tiện ích phải announcement bar (Hotline, App...) |
| `navLinks` | array | `[]` | Menu điều hướng — **nguồn dữ liệu ưu tiên** |
| `translations` | object | `{}` | Dịch đa ngôn ngữ |

### Thứ tự ưu tiên navLinks

```
headerConfig.navLinks (JSON config)  ← ưu tiên 1
  → nav_links table trong DB          ← ưu tiên 2
    → fallbackLinks (hardcoded)        ← fallback
```

### topbarLinks item

```json
{ "label": "Hotline 1800 6821", "url": "tel:18006821" }
```

### 7.2 navLinks với children

Hỗ trợ **mega menu** / dropdown thông qua `children[]`.

```json
{
  "name":   "Thuốc",
  "url":    "/products?category=thuoc",
  "type":   "collection",
  "sort":   1,
  "icon":   "",
  "target": "_self",
  "children": [
    {
      "name": "Thuốc ho & cảm",
      "url":  "/products?category=thuoc-ho-cam",
      "sort": 0
    },
    {
      "name": "Thuốc đau đầu",
      "url":  "/products?category=thuoc-dau-dau",
      "sort": 1
    },
    {
      "name": "Thuốc kháng sinh",
      "url":  "/products?category=khang-sinh",
      "sort": 2,
      "badge": "Cần đơn"
    }
  ],
  "translations": { "en": { "name": "Medicine" } }
}
```

**navLinks item fields:**

| Field | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `name` | string | — | Tên hiển thị |
| `url` | string | `"/"` | Đường dẫn |
| `type` | string | `"single"` | `"single"` = link đơn, `"collection"` = có dropdown |
| `target` | string | `"_self"` | `"_self"` hoặc `"_blank"` |
| `sort` | number | index | Thứ tự |
| `icon` | string | `""` | Tên icon Lucide (VD: `"Home"`, `"ShoppingBag"`) |
| `badge` | string | `""` | Badge text nhỏ bên cạnh tên (VD: `"Mới"`, `"Hot"`) |
| `children` | array | `[]` | Sub-links khi `type: "collection"` — render dropdown |
| `translations` | object | `{}` | Override `name` theo ngôn ngữ |

> **Giới hạn:** children chỉ hỗ trợ 1 cấp sâu (không nested tiếp). Nếu cần multi-level → dùng `custom_block` section với mega menu template.

---

## 8. footerConfig

```json
{
  "columns":        [],
  "social":         [],
  "paymentMethods": ["cod", "bank"],
  "badges":         [],
  "copyrightText":  "",
  "legalText":      "",
  "bgColor":        "",
  "textColor":      "",
  "headingColor":   "",
  "translations":   {}
}
```

| Field | Kiểu | Mô tả |
|-------|------|--------|
| `columns` | **array\*** | Cột footer. **Phải là array** — xem FooterColumn |
| `social` | array | Social links |
| `paymentMethods` | array\<string\> | Phương thức thanh toán được chấp nhận |
| `badges` | array | Huy hiệu chứng nhận |
| `copyrightText` | string | Text bản quyền. Mặc định: `© {năm} {tên shop}` |
| `legalText` | string | Văn bản pháp lý. Dùng `\n` để xuống dòng |
| `bgColor` | hex | Màu nền |
| `textColor` | hex | Màu chữ nội dung |
| `headingColor` | hex | Màu tiêu đề cột |
| `translations` | object | Dịch đa ngôn ngữ |

### FooterColumn

```json
{
  "title": "Về chúng tôi",
  "type":  "links",
  "links": [
    { "label": "Giới thiệu", "url": "/page/gioi-thieu" }
  ]
}
```

| `type` | Field dùng | Mô tả |
|--------|-----------|-------|
| `"links"` | `links[]` | Danh sách link text |
| `"contact"` | `items[]` | Thông tin liên hệ có icon |
| `"text"` | `content` | Nội dung HTML/text tự do |

**contact items:** `{ "icon": "phone", "label": "Hotline", "value": "1800 6821" }`
> `icon`: `"phone"` | `"email"` | `"map"` | `"clock"`

### Social platforms

| platform | Màu hover |
|----------|-----------|
| `facebook` | #1877f2 |
| `instagram` | #e1306c |
| `tiktok` | #000000 |
| `youtube` | #ff0000 |
| `zalo` | #0068ff |
| `twitter` | #1da1f2 |
| `linkedin` | #0077b5 |
| `pinterest` | #e60023 |

### paymentMethods — giá trị hợp lệ

`"cod"` `"bank"` `"momo"` `"vnpay"` `"zalopay"` `"visa"` `"mastercard"` `"jcb"` `"paypal"`

### Badges item

```json
{ "imageUrl": "/uploads/bct-badge.png", "title": "Bộ Công Thương", "url": "https://..." }
```

---

## 9. promoConfig

Thanh quảng cáo **trên cùng** trang, phía trên header.

```json
{
  "enabled":     true,
  "text":        "🎉 Miễn phí vận chuyển cho đơn từ 500K!",
  "link":        "/products",
  "ctaText":     "Mua sắm",
  "bgColor":     "#7c3aed",
  "textColor":   "#ffffff",
  "fontSize":    "13px",
  "dismissible": true
}
```

| Field | Kiểu | Mặc định | Mô tả |
|-------|------|----------|-------|
| `enabled` | boolean | `true` | Bật/tắt promo bar |
| `text` | string | — | Nội dung thông báo |
| `link` | string | `"/products"` | URL khi click CTA |
| `ctaText` | string | `"Mua sắm"` | Text nút CTA |
| `bgColor` | hex | `"#7c3aed"` | Màu nền — **ghi đè gradient mặc định hoàn toàn** |
| `textColor` | hex | `"#ffffff"` | Màu chữ |
| `fontSize` | css string | `"13px"` | `"12px"` \| `"13px"` \| `"14px"` \| `"15px"` |
| `dismissible` | boolean | `true` | Hiện nút X. Khi đóng lưu vào `sessionStorage` — mở tab mới thì hiện lại |

---

## 10. pages

Bật/tắt route page. Khi `false` → redirect về trang chủ.

```json
{
  "cart":           true,
  "account":        true,
  "auth":           true,
  "order_tracking": true,
  "products":       true
}
```

| Key | Route | Ghi chú |
|-----|-------|---------|
| `cart` | `/cart` | |
| `account` | `/account` | |
| `auth` | `/auth` | |
| `order_tracking` | `/order-tracking` | |
| `products` | `/products` | Tắt = ẩn cả link ecom trong menu |

---

## 11. pageConfigs

Config chi tiết từng trang hệ thống.

### products
```json
{
  "sidebarPosition": "left",
  "gridColumns": 4,
  "itemsPerPage": 12,
  "showFilters": { "category": true, "brand": true, "price": true },
  "pageTitle": "Sản phẩm",
  "pageDescription": "",
  "translations": {}
}
```

### productDetail
```json
{
  "galleryStyle": "thumbnails",
  "layoutRatio": "50-50",
  "showBreadcrumb": true,
  "showRelatedProducts": true,
  "relatedCount": 6,
  "showReviews": true,
  "pageTitle": "Chi tiết sản phẩm",
  "pageDescription": "",
  "translations": {}
}
```

### checkout
```json
{
  "showCoupon": true,
  "showNotes": true,
  "showSteps": true,
  "layout": "two-column",
  "pageTitle": "Thanh toán",
  "pageDescription": "",
  "translations": {}
}
```

### auth
```json
{
  "allowRegister": true,
  "allowForgotPassword": true,
  "showSocialLogin": false,
  "cardMaxWidth": 440,
  "pageTitle": "Đăng nhập / Đăng ký",
  "pageDescription": "",
  "translations": {}
}
```

### account
```json
{
  "showOrders": true,
  "showAddresses": true,
  "showPasswordChange": true,
  "sidebarPosition": "left",
  "pageTitle": "Tài khoản",
  "pageDescription": "",
  "translations": {}
}
```

### blog
```json
{
  "gridColumns": 3,
  "postsPerPage": 9,
  "layout": "grid",
  "pageTitle": "Blog",
  "pageDescription": "",
  "translations": {}
}
```

---

## 12. template

| Giá trị | Tên | Mô tả |
|---------|-----|-------|
| `"full_store"` | Full Store | Template mặc định đa ngành |
| `"pharmacy"` | Nhà Thuốc / Y Tế | Dược phẩm |
| `"fashion"` | Thời Trang | Quần áo, phụ kiện |
| `"restaurant"` | Nhà Hàng / F&B | Menu, đặt bàn |
| `"spa"` | Spa & Salon | Dịch vụ, lịch hẹn |
| `"realestate"` | Bất Động Sản | Dự án, tin tức |

---

## 13. Validation rules

### Bắt buộc
- `sections` phải là **array** — không phải `null` hay object
- Mỗi section phải có `type` là string hợp lệ

### footerConfig
- `footerConfig.columns` **phải là array** — không phải số
- Nếu là số → toàn bộ footerConfig reset về default

### Màu sắc
- ✅ Hợp lệ: `"#1b51a3"`, `"#fff"`, `"#ffffff"`
- ❌ Không dùng: `"1b51a3"` (thiếu `#`), `"rgb(27,81,163)"`

### Merge với defaults
Import thiếu field → builder tự merge với defaultHeaderConfig / defaultFooterConfig / defaultPromoConfig. Không cần khai báo 100% fields.

### Version migration
```
version undefined  → v1 (legacy array-only import)
version 1          → chạy migrate_v1_to_v2()
version 2          → load trực tiếp (current)
version > 2        → cảnh báo "cập nhật builder"
```

---

## 14. Kiến trúc platform-level

Đây là roadmap kiến trúc khi scale lên Shopify-grade Enterprise Builder.

### Tầng 1 — Schema & Registry

```
Section Registry
├── type: "banner"
│   ├── component: BannerSection.vue
│   ├── defaultParams: { autoplay: true, height: "md" }
│   ├── schema: JSONSchema (validation)
│   └── migrations: [ v1→v2, v2→v3 ]
├── type: "featured_products"
│   └── ...
└── ...
```

**Mỗi section type đăng ký:**
- Component render
- defaultParams
- JSON Schema (validation)
- Migration handlers
- Builder UI config panel

### Tầng 2 — File tách (layout ≠ content ≠ theme)

Khi scale multi-store / template marketplace, nên tách thành 3 file:

```
store-config/
├── layout.json      → sections[], pages, pageConfigs, globalSettings
├── theme.json       → theme colors, typography, spacing
└── content.json     → headerConfig, footerConfig, promoConfig (data content)
```

**Lợi ích:**

| Thao tác | Chỉ update |
|----------|-----------|
| Đổi màu sắc | `theme.json` |
| Đổi menu / footer text | `content.json` |
| Thêm/xóa section | `layout.json` |
| Clone layout sang store khác | `layout.json` (không kèm branding) |
| Bán template | `layout.json` + `theme.json` (không kèm nội dung riêng) |

### Tầng 3 — Template Marketplace

```
Template
├── metadata.json     → name, author, preview, tags, price
├── layout.json       → sections, globalSettings
├── theme.json        → colors, fonts
├── preview.png       → ảnh preview
└── changelog.md      → version history
```

**Template inheritance:** Store có thể kế thừa base template và override từng phần:

```
base-template/layout.json
      ↑ inherit
my-store/layout.json      → chỉ ghi đè sections cần thay đổi
```

### Tầng 4 — Render Engine

```
SectionRenderer
├── Input:  { type, params, tabletParams, mobileParams, content, dataSource, conditions, layout, visibility }
├── Step 1: Check conditions → skip nếu không thỏa
├── Step 2: Check visibility theo device → skip nếu ẩn
├── Step 3: Fetch dataSource (nếu có) → inject vào content
├── Step 4: Merge params + responsive overrides
├── Step 5: Apply layout (padding, background, container)
└── Output: Rendered Vue component
```

### Tầng 5 — Builder State Machine

```
Builder State
├── undoStack[]          → history (Ctrl+Z)
├── redoStack[]          → redo (Ctrl+Y)
├── sections (reactive)  → live preview
├── meta (reactive)      → header/footer/promo config
└── dirty flag           → unsaved changes warning

Events:
├── section.add(type, position)
├── section.update(id, patch)
├── section.move(id, newIndex)
├── section.delete(id)
└── section.duplicate(id)
```

### Sơ đồ kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────┐
│                    BUILDER (Admin)                       │
│                                                         │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Section  │  │   Config     │  │ Template        │  │
│  │ Registry │  │   Panels     │  │ Marketplace     │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬────────┘  │
│       │               │                   │            │
│       └───────────────┴───────────────────┘            │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │  Builder State  │◄─── Import JSON        │
│              │  (Reactive)     │───► Export JSON         │
│              └────────┬────────┘                        │
│                       │ Publish                         │
└───────────────────────┼─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                   BACKEND (Laravel)                      │
│                                                         │
│  layout_pages.layout_json  +  layout_pages.meta         │
│  system_configs (legacy fallback)                       │
│  Cache: Redis (TTL 5 min)                               │
└───────────────────────┬─────────────────────────────────┘
                        │
                        │ GET /site-config
                        ▼
┌─────────────────────────────────────────────────────────┐
│                  STOREFRONT (Vue)                        │
│                                                         │
│  App.vue → provide(headerConfig, footerConfig, navLinks)│
│       │                                                 │
│       ├── SiteHeader (navLinks, headerCfg)              │
│       ├── PromoBar (promoConfig)                        │
│       ├── SectionRenderer (sections[])                  │
│       │       └── BannerSection, ProductGrid, FAQ...    │
│       └── SiteFooter (footerConfig)                     │
└─────────────────────────────────────────────────────────┘
```

---

## 15. File JSON mẫu đầy đủ (v2)

```json
{
  "_schema": "storefront-layout-template",
  "_version": 2,
  "_exported_at": "2026-04-04T00:00:00.000Z",
  "_page": "home",

  "version": 2,
  "template": "pharmacy",
  "customCss": "",

  "theme": {
    "primary":    "#1b51a3",
    "secondary":  "#00a651",
    "accent":     "#ff4757",
    "background": "#ffffff",
    "surface":    "#f8fafc",
    "text":       "#1e293b",
    "textMuted":  "#64748b",
    "mode":       "light"
  },

  "globalSettings": {
    "containerWidth": 1280,
    "gridGap":        24,
    "sectionGap":     48,
    "borderRadius":   10,
    "fontFamily":     "Inter",
    "buttonStyle":    "rounded",
    "cardShadow":     "soft",
    "animationsEnabled": true
  },

  "sections": [
    {
      "id":      "banner-hero",
      "type":    "banner",
      "enabled": true,
      "order":   0,
      "params":  { "autoplay": true, "interval": 4000, "height": "md" },
      "layout":  { "container": "full", "paddingTop": 0, "paddingBottom": 0 },
      "visibility": { "desktop": true, "tablet": true, "mobile": true },
      "meta":    { "label": "Banner hero chính", "locked": true },
      "content": [
        {
          "imageUrl": "/uploads/banner-pharmacity.jpg",
          "title":    "Chào mừng đến Nhà Thuốc Pharmacity",
          "subtitle": "Thuốc chính hãng, giao nhanh 2 giờ",
          "ctaText":  "Mua ngay",
          "ctaUrl":   "/products"
        }
      ]
    },
    {
      "id":      "categories-main",
      "type":    "categories",
      "enabled": true,
      "order":   1,
      "params":  { "columns": 6, "layoutStyle": "grid", "showCount": false }
    },
    {
      "id":         "flash-sale",
      "type":       "flash_sale",
      "enabled":    true,
      "order":      2,
      "params":     { "showTimer": true, "showProgress": true, "count": 8, "columns": 4 },
      "conditions": { "dateFrom": "2026-12-01", "dateTo": "2026-12-31" },
      "meta":       { "label": "Flash Sale tháng 12" }
    },
    {
      "id":      "featured-products",
      "type":    "featured_products",
      "enabled": true,
      "order":   3,
      "params":  { "title": "Sản phẩm nổi bật", "count": 8, "columns": 4 },
      "dataSource": {
        "type": "products",
        "query": { "sort": "best_selling", "limit": 8, "inStock": true },
        "cache": 300
      }
    },
    {
      "id":      "newsletter-section",
      "type":    "newsletter",
      "enabled": true,
      "order":   4,
      "params":  { "title": "Đăng ký nhận tin", "subtitle": "Ưu đãi độc quyền mỗi tuần" },
      "layout":  { "background": "#eff6ff", "paddingTop": 60, "paddingBottom": 60 },
      "conditions": { "userLoggedIn": false }
    }
  ],

  "headerConfig": {
    "logoPosition":    "left",
    "maxNavLinks":     8,
    "showSearch":      false,
    "sticky":          true,
    "showThemeToggle": false,
    "showAnnouncement": true,
    "announcementText": "Miễn phí vận chuyển cho đơn hàng từ 500.000đ!",
    "announcementBg":   "#ffffff",
    "announcementColor": "#1b51a3",
    "announcementLink": "/promotions",
    "topbarLinks": [
      { "label": "Tải ứng dụng",        "url": "#" },
      { "label": "Hotline 1800 6821",    "url": "tel:18006821" },
      { "label": "Góc sức khỏe",         "url": "/blog" },
      { "label": "Hệ thống nhà thuốc",   "url": "/stores" }
    ],
    "navLinks": [
      { "name": "Trang Chủ", "url": "/", "type": "single", "sort": 0 },
      {
        "name": "Thuốc",
        "url":  "/products?category=thuoc",
        "type": "collection",
        "sort": 1,
        "children": [
          { "name": "Thuốc ho & cảm",  "url": "/products?category=thuoc-ho-cam",  "sort": 0 },
          { "name": "Thuốc đau đầu",   "url": "/products?category=thuoc-dau-dau", "sort": 1 },
          { "name": "Vitamin & khoáng","url": "/products?category=vitamin",        "sort": 2 }
        ]
      },
      { "name": "Thực phẩm BVSK",        "url": "/products?category=thuc-pham-chuc-nang", "type": "single", "sort": 2 },
      { "name": "Mẹ và bé",              "url": "/products?category=me-va-be",             "type": "single", "sort": 3 },
      { "name": "Nhãn hàng Pharmacity",  "url": "/products?brand=pharmacity",              "type": "single", "sort": 4 },
      { "name": "Khuyến mãi",            "url": "/promotions",                             "type": "single", "sort": 5, "badge": "Hot" }
    ]
  },

  "footerConfig": {
    "bgColor":       "#1b51a3",
    "textColor":     "#ffffff",
    "headingColor":  "#ffffff",
    "copyrightText": "© 2026 Pharmacity. Bảo lưu mọi quyền.",
    "legalText":     "Giấy phép kinh doanh: 0303609652\nĐịa chỉ: 248A Nơ Trang Long, P.12, Q.Bình Thạnh, TP.HCM",
    "columns": [
      {
        "title": "Về Pharmacity",
        "type":  "links",
        "links": [
          { "label": "Giới thiệu",          "url": "/page/gioi-thieu" },
          { "label": "Hệ thống cửa hàng",   "url": "/stores" },
          { "label": "Chính sách đổi trả",  "url": "/page/chinh-sach-doi-tra" },
          { "label": "Chính sách giao hàng","url": "/page/chinh-sach-giao-hang" },
          { "label": "Câu hỏi thường gặp",  "url": "/page/faq" }
        ]
      },
      {
        "title": "Danh mục",
        "type":  "links",
        "links": [
          { "label": "Thuốc",                 "url": "/products?category=thuoc" },
          { "label": "Thực phẩm BVSK",        "url": "/products?category=thuc-pham-chuc-nang" },
          { "label": "Mẹ và bé",              "url": "/products?category=me-va-be" },
          { "label": "Nhãn hàng Pharmacity",  "url": "/products?brand=pharmacity" }
        ]
      },
      {
        "title": "Liên hệ",
        "type":  "contact",
        "items": [
          { "icon": "phone", "label": "Hotline",       "value": "1800 6821 (miễn phí)" },
          { "icon": "email", "label": "Email",         "value": "support@pharmacity.vn" },
          { "icon": "clock", "label": "Giờ làm việc",  "value": "7:00 – 22:00 hàng ngày" }
        ]
      }
    ],
    "social": [
      { "platform": "facebook",  "url": "https://facebook.com/pharmacity" },
      { "platform": "instagram", "url": "https://instagram.com/pharmacity" },
      { "platform": "zalo",      "url": "https://zalo.me/pharmacity" },
      { "platform": "youtube",   "url": "https://youtube.com/@pharmacity" }
    ],
    "paymentMethods": ["cod", "bank", "momo", "vnpay", "zalopay", "visa", "mastercard"],
    "badges": [
      { "imageUrl": "/uploads/badge-bct.png",  "title": "Đã đăng ký Bộ Công Thương" },
      { "imageUrl": "/uploads/badge-dmca.png", "title": "DMCA Protected", "url": "https://www.dmca.com" }
    ]
  },

  "promoConfig": {
    "enabled":     false,
    "text":        "🎉 Giảm 15% toàn bộ vitamin — Nhập mã VITAMIN15",
    "link":        "/promotions",
    "ctaText":     "Xem ngay",
    "bgColor":     "#1b51a3",
    "textColor":   "#ffffff",
    "fontSize":    "13px",
    "dismissible": true
  },

  "pages": {
    "cart":           true,
    "account":        true,
    "auth":           true,
    "order_tracking": true,
    "products":       true
  },

  "pageConfigs": {
    "products": {
      "sidebarPosition": "left",
      "gridColumns":     4,
      "itemsPerPage":    12,
      "showFilters":     { "category": true, "brand": true, "price": true }
    },
    "productDetail": {
      "galleryStyle":        "thumbnails",
      "layoutRatio":         "50-50",
      "showBreadcrumb":      true,
      "showRelatedProducts": true,
      "relatedCount":        6,
      "showReviews":         true
    },
    "checkout": {
      "showCoupon": true, "showNotes": true,
      "showSteps":  true, "layout": "two-column"
    },
    "auth": {
      "allowRegister": true, "allowForgotPassword": true,
      "showSocialLogin": false, "cardMaxWidth": 440
    },
    "account": {
      "showOrders": true, "showAddresses": true,
      "showPasswordChange": true, "sidebarPosition": "left"
    },
    "blog": {
      "gridColumns": 3, "postsPerPage": 9, "layout": "grid"
    }
  }
}
```

---

## 16. Migration guide v1 → v2

### Những gì thay đổi

| v1 | v2 |
|----|-----|
| `_schema: "storefront-layout-template-v1"` | `_schema: "storefront-layout-template"` + `version: 2` |
| Không có `theme` | Thêm `theme {}` — màu sắc tập trung |
| Không có `globalSettings` | Thêm `globalSettings {}` |
| Section không có `layout`, `visibility`, `dataSource`, `conditions`, `meta` | Thêm 5 fields mới (tất cả optional) |
| `navLinks` không có `children` | Thêm `children[]` cho mega menu |

### Builder tự động migrate

Khi import file v1:
1. Set `version = 1` (hoặc `undefined`)
2. Builder chạy `migrate_v1_to_v2()`:
   - Giữ nguyên `sections`, `headerConfig`, `footerConfig`, `promoConfig`, `pages`, `pageConfigs`
   - Inject `theme` từ `defaultThemeConfig`
   - Inject `globalSettings` từ `defaultGlobalSettings`
   - Set `version = 2`
3. Load vào editor state

File v1 **vẫn import được** — không cần sửa thủ công.

---

*Tài liệu được viết từ source code thực tế. Mọi thay đổi codebase cần cập nhật docs tương ứng.*  
*Xem source: `useBuilderConstants.js`, `useBuilderPersistence.js`, `SiteHeader.vue`, `PromoBar.vue`*
