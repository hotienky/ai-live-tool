# AUDIT: Storefront UI Customization & Dynamic Layout

> Ngày kiểm tra: 2026-03-16
> Trạng thái: Phase 3A + 3B + 4 DONE

---

## Tổng quan hệ thống hiện tại

- **Layout Builder** (`StorefrontLayoutBuilder.vue`): Cho phép kéo thả, bật/tắt, cấu hình sections cho trang chủ
- **Theme Customizer** (`ThemeCustomizer.vue`): Cấu hình màu sắc, font, border radius, card style
- **Backend**: Lưu config dạng JSON trong bảng `system_configs` (group: `storefront_layout`)
- **Storefront**: Render dynamic sections dựa trên config từ API

---

## 1. CHỈ CÓ HOMEPAGE ĐƯỢC CUSTOM LAYOUT

### Vấn đề
Hiện tại **chỉ có trang chủ (HomePage)** hỗ trợ dynamic layout với sections. Tất cả các trang khác đều **hardcoded layout cố định**:

| Trang | Trạng thái | Ghi chú |
|-------|-----------|---------|
| `/` (Trang chủ) | Dynamic | Sections kéo thả, bật/tắt |
| `/products` (Sản phẩm) | **Cố định** | Sidebar filter + grid, không custom được |
| `/product/:slug` (Chi tiết SP) | **Cố định** | Layout cứng: ảnh + thông tin + mô tả |
| `/category/:slug` (Danh mục) | **Cố định** | Dùng chung ProductsPage |
| `/cart` (Giỏ hàng) | **Cố định** | Không custom được |
| `/checkout` (Thanh toán) | **Cố định** | Không custom được |
| `/account` (Tài khoản) | **Cố định** | Không custom được |
| `/auth` (Đăng nhập) | **Cố định** | Không custom được |
| `/order-tracking` | **Cố định** | Không custom được |
| `/page/:slug` (CMS) | **Cố định** | Article layout cố định |

### Cần làm
- [x] Cho phép config layout cho **trang danh sách sản phẩm** (sidebar position, grid columns, filters hiển thị) - DONE Phase 4
- [x] Cho phép config layout cho **trang chi tiết sản phẩm** (gallery style, related products, layout ratio, reviews) - DONE Phase 4
- [ ] Cho phép thêm custom sections vào **các trang khác** (ví dụ: banner trên trang sản phẩm)

---

## 2. LIBRARY SECTIONS - THIẾU CONFIG UI HOÀN TOÀN

### Vấn đề
8 section types "Library" (Phase 3) đã có component hiển thị ở storefront nhưng **Layout Builder chỉ cho config tiêu đề**, không có UI để quản lý nội dung:

| Section | Component Storefront | Config hiện tại | Thiếu |
|---------|---------------------|----------------|-------|
| **video_embed** | `HomeSectionVideo.vue` | Chỉ có `title` | Không có chỗ nhập URL video (YouTube/TikTok), không chọn được kích thước embed |
| **testimonials** | `HomeSectionTestimonials.vue` | Chỉ có `title` | Không có UI quản lý danh sách testimonial (tên, nội dung, rating, avatar) |
| **faq** | `HomeSectionFaq.vue` | Chỉ có `title` | Không có UI quản lý câu hỏi/trả lời |
| **image_gallery** | `HomeSectionGallery.vue` | Chỉ có `title` | Không có UI upload/quản lý ảnh, không chọn được số cột |
| **text_block** | `HomeSectionTextBlock.vue` | Chỉ có `title` | Không có rich text editor cho nội dung HTML |
| **newsletter** | `HomeSectionNewsletter.vue` | Chỉ có `title` | Không có config subtitle, placeholder, button text; chưa có API backend xử lý subscribe |
| **social_feed** | `HomeSectionSocial.vue` | Chỉ có `title` | Không có UI quản lý social links (platform, URL) |
| **brands_slider** | `HomeSectionBrands.vue` | Chỉ có `title` | Không có UI quản lý brands (logo, tên, URL) |

### Cần làm cho từng section:

#### 2.1 Video Embed - DONE
- [x] Thêm UI nhập danh sách video URLs (url + caption)
- [x] Hỗ trợ YouTube, TikTok (storefront component đã có)
- [ ] Config: autoplay, muted, kích thước (sm/md/lg/full)
- [x] Cho phép thêm caption cho mỗi video
- [ ] Preview video trong builder

#### 2.2 Testimonials - DONE
- [x] UI CRUD danh sách testimonial trong builder
- [x] Mỗi item: tên khách, nội dung, rating (1-5 sao), avatar URL
- [x] Config: columns (2-4)
- [ ] Config: layout style (card/minimal/quote)

#### 2.3 FAQ - DONE
- [x] UI CRUD danh sách câu hỏi/trả lời
- [ ] Hỗ trợ reorder (kéo thả)
- [ ] Config: mở mặc định item đầu tiên hay đóng hết
- [ ] Config: cho phép mở nhiều item cùng lúc

#### 2.4 Image Gallery - DONE
- [x] UI quản lý ảnh (URL + caption)
- [x] Config: columns (2-5)
- [ ] Config: aspect ratio (1:1, 4:3, 16:9, auto)
- [ ] Config: lightbox on/off
- [ ] Config: gap size

#### 2.5 Text Block - DONE
- [x] Textarea HTML editor (chưa rich editor)
- [ ] Tích hợp rich text editor (TipTap/Quill) - enhancement
- [ ] Config: text alignment, max-width
- [ ] Config: background color

#### 2.6 Newsletter - DONE
- [x] Config: subtitle text, button text
- [ ] Config: background style (transparent/gradient/solid)
- [ ] Backend API endpoint để lưu email subscriber
- [ ] Model `Subscriber` và migration

#### 2.7 Social Feed - DONE
- [x] UI quản lý danh sách social links
- [x] Dropdown chọn platform (Facebook, Instagram, YouTube, TikTok, Zalo, Twitter/X)
- [x] Auto-detect icon theo platform (storefront component đã có)
- [ ] Config: layout style (icon-only / icon+text / card)
- [ ] Config: icon size

#### 2.8 Brands Slider - DONE
- [x] UI quản lý brands (tên, logo URL, website URL)
- [ ] Config: animation speed
- [ ] Config: grayscale on/off
- [ ] Config: items per view
- [ ] Config: pause on hover

---

## 3. CORE SECTIONS - THIẾU CONFIG

Các section "core" (Phase 2) đã có config nhưng vẫn thiếu một số tùy chọn:

### 3.1 Banner
- [x] Config: autoplay, interval, height
- [ ] **Thiếu**: Không link trực tiếp đến quản lý banner từ builder (phải vào trang Banner riêng)
- [ ] **Thiếu**: Preview banner thật trong builder (hiện chỉ wireframe)
- [ ] **Thiếu**: Config số lượng banner hiển thị
- [ ] **Thiếu**: Config hiệu ứng chuyển (fade/slide/zoom)

### 3.2 Categories
- [x] Config: columns, showDescription
- [ ] **Thiếu**: Config chọn categories nào hiển thị (hiện show tất cả)
- [ ] **Thiếu**: Config layout style (grid/carousel/list)
- [ ] **Thiếu**: Config show/hide image, show count products

### 3.3 Flash Sale
- [x] Config: showTimer, showProgress
- [ ] **Thiếu**: Config số lượng sản phẩm hiển thị (hardcoded 8 ở storefront)
- [ ] **Thiếu**: Config columns
- [ ] **Thiếu**: Config hiển thị khi không có flash sale đang chạy (ẩn section hoặc show placeholder)

### 3.4 Featured Products
- [x] Config: title, count, columns
- [ ] **Thiếu**: Config filter theo category/tag
- [ ] **Thiếu**: Config sort order (bán chạy, mới nhất, giá, random)
- [ ] **Thiếu**: Config layout style (grid/carousel)

### 3.5 New Arrivals
- [x] Config: title, count
- [ ] **Thiếu**: Config columns (có ở featured nhưng thiếu ở new arrivals)
- [ ] **Thiếu**: Config "mới" = bao nhiêu ngày gần đây
- [ ] **Thiếu**: Config layout style (grid/carousel)

### 3.6 CMS Pages
- [x] Config: layout (grid/list), maxPages
- [ ] **Thiếu**: Config chọn pages cụ thể thay vì show tất cả
- [ ] **Thiếu**: Config columns cho grid
- [ ] **Thiếu**: Config show/hide image, show/hide date

---

## 4. HEADER & FOOTER - KHÔNG CÓ CUSTOMIZATION

### Vấn đề
Header và Footer có layout cố định, không cho phép customize.

### Cần làm - Header
- [ ] Config logo position (left/center)
- [ ] Config hiển thị/ẩn: search bar, language switcher, theme toggle
- [ ] Config background color/transparent
- [ ] Config sticky on/off
- [ ] Config max visible nav links (hiện hardcoded 5)
- [ ] Config layout style (centered/spread/minimal)

### Cần làm - Footer
- [ ] Config hiển thị/ẩn các cột (brand, contact, links, social)
- [ ] Config số cột (2-4)
- [ ] Config background color
- [ ] Config copyright text (hiện lấy từ store info, nhưng không có UI rõ ràng)
- [ ] Config thêm payment icons (Visa, MasterCard, COD...)

---

## 5. THEME CUSTOMIZER - CHƯA KẾT NỐI VỚI STOREFRONT

### Vấn đề
`ThemeCustomizer.vue` lưu settings vào group `theme` trong `system_configs`, nhưng **storefront dùng CSS variables riêng** (`--sf-*`), không đọc theme config từ backend một cách đầy đủ.

### Cần làm
- [ ] Đồng bộ theme settings từ backend xuống storefront CSS variables
- [ ] Kiểm tra: `theme.accent` → `--sf-accent` có hoạt động không?
- [ ] Kiểm tra: `theme.font` → font-family storefront có thay đổi không?
- [ ] Kiểm tra: `theme.radius` → `--sf-radius-*` có cập nhật không?
- [ ] Kiểm tra: `theme.mode` (dark/light) → storefront có respect không?
- [ ] Kiểm tra: `theme.card_style` → có áp dụng vào storefront không?

---

## 6. HARDCODED VALUES CẦN CONFIGURABLE

Các giá trị đang hardcode trong storefront cần được chuyển thành config:

| File | Giá trị | Hardcoded | Nên là |
|------|---------|-----------|--------|
| `BannerSlider.vue` | Auto-rotate interval | 5000ms | ~~FIXED~~ Dùng `props.interval` + `props.autoplay` |
| `FlashSale.vue` | Số SP hiển thị | 8 items | ~~FIXED~~ Dùng `props.params.count` |
| `SiteHeader.vue` | Max visible links | 5 | Configurable |
| `HomeSectionBrands.vue` | Animation duration | 20s | Configurable |
| `ProductsPage.vue` | Grid min column width | 240px | Configurable |
| `HomePage.vue` | Featured default count | 8 | Đã dùng `section.params?.count \|\| 8` (OK) |
| `HomePage.vue` | New arrivals default count | 4 | Đã dùng `section.params?.count \|\| 4` (OK) |

---

## 7. THIẾU TÍNH NĂNG QUAN TRỌNG KHÁC

### 7.1 Preview & Draft
- [ ] Chưa có hệ thống **draft/publish** cho layout (thay đổi apply ngay lập tức)
- [ ] Preview mode chỉ qua URL param, không có nút "Preview" rõ ràng trong builder
- [ ] Không có **undo/redo** khi chỉnh sửa layout

### 7.2 Responsive / Mobile
- [ ] Không có config riêng cho mobile layout
- [ ] Không thể ẩn/hiện section theo breakpoint (mobile/tablet/desktop)
- [ ] Không có config số columns riêng cho mobile

### 7.3 SEO per Section
- [ ] Sections không có schema markup riêng
- [ ] Không có config `id` attribute cho anchor links (ví dụ: `#flash-sale` cho nav link)

### 7.4 Section Spacing & Styling
- [ ] Không có config padding/margin cho từng section
- [ ] Không có config background color/image cho từng section
- [ ] Không có config section width (full-width vs container)

### 7.5 Duplicate Section
- [ ] Không thể duplicate 1 section (ví dụ: 2 featured products với filter khác nhau)

---

## 8. BACKEND API GAPS

| Thiếu | Mô tả |
|-------|-------|
| Newsletter API | Không có endpoint lưu email subscriber |
| Section content API | Testimonials/FAQ/Gallery content chỉ lưu inline JSON, không có CRUD riêng |
| Layout versioning | Không có lịch sử thay đổi layout |
| Page-specific layout | API chỉ trả 1 layout chung (homepage), không hỗ trợ layout per page |
| Media library | Không có API upload ảnh cho gallery/brands section |

---

## 9. THỐNG NHẤT UI CONFIG

### Vấn đề
Config UI giữa các section không đồng nhất:

1. **Core sections** (banner, categories, flash_sale, featured_products, new_arrivals, cms_pages): Có config form chi tiết với nhiều tùy chọn
2. **Library sections** (testimonials, faq, gallery, video, text, newsletter, social, brands): Chỉ có 1 ô nhập tiêu đề
3. **Không có tab chung** cho: spacing, visibility (responsive), background, CSS class

### Cần làm
- [ ] Mỗi section nên có **tabs config thống nhất**: Content | Style | Advanced
  - **Content tab**: Config đặc trưng của section (hiện tại)
  - **Style tab**: Background, padding, margin, text color
  - **Advanced tab**: Custom CSS class, anchor ID, responsive visibility
- [ ] Tất cả sections nên có config `title` (đã có) + `subtitle`
- [ ] Tất cả product sections nên có cùng set config: count, columns, sort, filter

---

## 10. ĐỀ XUẤT ƯU TIÊN THỰC HIỆN

### Phase 3A - Hoàn thiện Library Sections - DONE
1. ~~Video Embed config~~ DONE
2. ~~Testimonials content CRUD~~ DONE
3. ~~FAQ content CRUD~~ DONE
4. ~~Social Feed links management~~ DONE
5. ~~Brands management~~ DONE
6. ~~Image Gallery~~ DONE
7. ~~Text Block editor~~ DONE (textarea, chưa rich editor)
8. ~~Newsletter config~~ DONE (subtitle, buttonText)

### Phase 3B - Fix hardcoded values - DONE
1. ~~BannerSlider interval~~ DONE - dùng props.interval
2. ~~FlashSale count~~ DONE - dùng props.params.count
3. ~~Theme sync~~ - Đã hoạt động (useTheme.js load từ /theme API)
4. [ ] Section config tabs (Content/Style/Advanced) - chưa làm, enhancement

### Phase 4 - Multi-page Layout - DONE
1. ~~Product listing page config (sidebar, grid, filters)~~ DONE
2. ~~Product detail page config (gallery style, layout ratio, breadcrumb, related products, reviews)~~ DONE
3. ~~Per-page config UI trong StorefrontLayoutBuilder~~ DONE
4. ~~Backend API + Seeder defaults~~ DONE
5. [ ] Per-page custom sections support (enhancement)

### Phase 5 - Header/Footer Customization
1. Header layout config
2. Footer layout config
3. Navigation management tích hợp vào builder

### Phase 6 - Advanced Features
1. Draft/Publish cho layout
2. Undo/Redo
3. Mobile-specific layout config
4. Section spacing/background config
5. Layout versioning

---

## Files liên quan

### Frontend (Admin)
- `frontend/src/components/StorefrontLayoutBuilder.vue` - Layout builder chính
- `frontend/src/components/ThemeCustomizer.vue` - Theme settings
- `frontend/src/components/ShopSettings.vue` - Shop settings container

### Storefront (Customer-facing)
- `storefront/src/App.vue` - Layout injection
- `storefront/src/views/HomePage.vue` - Render dynamic sections
- `storefront/src/components/SiteHeader.vue` - Header
- `storefront/src/components/SiteFooter.vue` - Footer
- `storefront/src/components/sections/` - Tất cả section components

### Backend
- `backend-laravel/app/Http/Controllers/Tenant/StorefrontController.php` - API layout
- `backend-laravel/app/Http/Controllers/Tenant/SystemConfigController.php` - Config CRUD
- `backend-laravel/app/Models/SystemConfig.php` - Config model
- `backend-laravel/database/seeders/ClothingTenantSeeder.php` - Default data
