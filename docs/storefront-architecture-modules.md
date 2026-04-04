# Storefront Platform Architecture: Core Modules

Tài liệu này định nghĩa 3 module cốt lõi nâng cao để biến Storefront Builder thành một SaaS Storefront Platform chuẩn Enterprise (Shopify-grade), tối ưu cho hệ sinh thái Vue 3 / Nuxt 3 mà dự án đang sử dụng.

---

## 1️⃣ Section Renderer Runtime Architecture (Vue 3 / Nuxt 3)

Kiến trúc Runtime Renderer đóng vai trò "phiên dịch" file JSON (`storefront-layout-template`) thành giao diện HTML thực tế. Để đạt hiệu suất tối đa (rendering cực nhanh, hỗ trợ Server-Side Rendering - SSR), kiến trúc được thiết kế như sau:

### Core Concepts
- **Dynamic Component Resolution**: Tự động bind type của section json thành Vue Component.
- **Data Hydration**: Fetch dữ liệu độc lập hoặc song song (Parallel Data Fetching) trước khi render.
- **Provider Pattern**: Bọc toàn bộ trang bằng Provider chứa `themeConfig`, `globalSettings` và `currentLang`, các sections bên dưới chỉ cần Inject.

### Kiến trúc luồng chạy (Runtime Flow)
1. **Fetch Config**: Lấy JSON page config từ API `GET /api/storefront/pages/:slug`
2. **Pre-fetch DataGraph**: Tìm tất cả `dataSource` trong JSON và fetch data tập trung hoặc bằng Suspense.
3. **Parse & Render**: Dùng `<Component :is="..."/>` duyệt mảng `sections`.

### Code Implementation (Vue 3 / Nuxt 3)

```vue
<!-- StorefrontPageRenderer.vue (Trái tim của Runtime) -->
<template>
  <div class="storefront-page" :style="cssVariables">
    <Component 
      v-for="section in activeSections" 
      :key="section.id"
      :is="resolveSectionComponent(section.type)"
      :params="mergeResponsiveParams(section)"
      :content="section.content"
      :resolved-data="prefetchedData[section.id]"
    />
  </div>
</template>

<script setup>
import { computed, provide, defineAsyncComponent } from 'vue'

const props = defineProps({
  pageConfig: Object,
  themeConfig: Object,
  lang: String
})

// Bọc Provider để components con dễ dàng truy xuất thông số Theme
provide('themeConfig', props.themeConfig)
provide('currentLang', props.lang)

// Tự động lazy-load Component dựa trên cấu trúc type
const resolveSectionComponent = (type) => {
  // VD: type = 'featured_products' -> SfFeaturedProducts
  const componentName = `Sf${type.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`
  return defineAsyncComponent(() => import(`../sections/${componentName}.vue`))
}

const activeSections = computed(() => {
  return props.pageConfig.sections
    .filter(s => s.enabled)
    .filter(s => evaluateConditions(s.conditions)) // Rule engine (Personalization)
    .sort((a,b) => a.order - b.order)
})

// Chuyển đổi responsive params tuỳ theo thiết bị hiện tại ở runtime
const mergeResponsiveParams = (section) => {
  // Logic apply tabletParams, mobileParams đè lên params gốc
  return useResponsiveConfig(section).responsiveConfig.value;
}
</script>
```

---

## 2️⃣ Storefront API /site-config (Scale cho 100.000 Shops)

Khi hệ thống có 100k tenant (shop), endpoint `GET /api/storefront/site-config` sẽ phải chịu hàng chục triệu request mỗi ngày. Để giải quyết, API layer phải được tối ưu mạnh bằng Cache và Edge Network.

### Hierarchy & Cache Strategy

Sử dụng mô hình Cache nhiều lớp (Multi-layer Caching):
1. **Lớp 1: CDN / Edge Cache (Cloudflare / AWS CloudFront)**: Cache dựa trên Header `x-tenant-id` hoặc Domain. TTL 5-15 phút. Hit rate mục tiêu: > 85%.
2. **Lớp 2: Redis In-memory (Centralized Cache)**: Cache dữ liệu query sẵn. Hit rate: 14%.
3. **Lớp 3: Database (PostgreSQL / MySQL)**: Chứa dữ liệu gốc. Hit rate: < 1%.

### Cấu trúc API Response chuẩn (Storefront Payload Payload)
Phải gọn nhẹ, chỉ trả những gì runtime cần để render, bỏ bớt những meta của builder.

```json
// GET https://api.mebifarm.com/v1/storefront/site-config
// Header: x-tenant-code: "shop_alpha"

{
  "theme": {
    "colors": { "primary": "#6366f1", "accent": "#10b981" },
    "fonts": "Inter, sans-serif"
  },
  "globalContext": {
    "currency": "VND",
    "languages": ["vi", "en"],
    "defaultLang": "vi"
  },
  "layouts": {
    "header": { "type": "header_v1", "params": { "sticky": true }, "nav": [...] },
    "footer": { "type": "footer_v2", "params": { "columns": 4 }, "content": [...] }
  },
  "routes": {
    // Để Next/Nuxt tự động build routing map
    "home": "/",
    "products": "/collections/*",
    "cart": "/cart"
  }
}
```

### Data Graph Layer (Batching Data Request)
Thay vì API `/site-config` trả cả data sản phẩm, nó chỉ trả layout JSON.
Storefront Runtime/App sẽ collect toàn bộ `dataSource` list từ JSON và gọi **1 batch request duy nhất** để lấy data:

```json
// POST /api/storefront/graphql-batch hoặc /api/storefront/resolve-data
{
  "queries": [
    { "id": "sec_1", "type": "bestselling_products", "limit": 8 },
    { "id": "sec_2", "type": "blog_posts", "category": "news", "limit": 4 }
  ]
}
```
**=> Lợi ích:** Giảm tải Server (ngăn chặn N+1 queries), tăng tốc độ FCP (First Contentful Paint).

---

## 3️⃣ Database Schema cho Layout Builder (Shopify-grade)

Để lưu trữ hàng trăm ngàn Layout JSON an toàn, hỗ trợ Versioning (publish/draft), Rollback và A/B Testing, kiến trúc Database (Relational - PostgreSQL/MySQL) được thiết kế như sau:

### 3.1. Bảng `storefront_themes`
Chứa framework của giao diện (như các gói giao diện tĩnh có thể cài đặt).
- `id` (PK)
- `tenant_id` (FK) - Null nếu là Global Theme
- `name` (varchar) - VD: "Đăng Quang Watch Theme"
- `version` (varchar) - VD: "1.2.0"
- `status` (enum: active, inactive)
- `settings_schema` (JSONB) - Schema mô tả các setting field
- `settings_data` (JSONB) - Giá trị setting thực tế mà shop cấu hình

### 3.2. Bảng `storefront_pages`
Chứa URL và metadata của các trang tĩnh & động.
- `id` (PK)
- `tenant_id` (FK, Index)
- `slug` (varchar, Unique per tenant) - VD: `home`, `about-us`
- `page_type` (enum: homepage, product_detail, collection, custom, blog_post)
- `title` (varchar)

### 3.3. Bảng `storefront_layouts` (Trái tim của Builder)
Mỗi page type sẽ được liên kết với một layout tĩnh. Hỗ trợ hệ thống Draft / Publish.
- `id` (PK)
- `tenant_id` (FK, Index)
- `theme_id` (FK)
- `page_id` (FK) - Trỏ về `storefront_pages`
- `status` (enum: draft, published, archived)
- `version_id` (varchar) - UID cho version
- `layout_data` (JSONB) - Chứa toàn bộ cây `sections`, `params`, `content` cấu trúc v2.
- `created_at` (timestamp)
- `published_at` (timestamp, Nullable)

*(**Lý do Schema này mạnh**: Khi user lưu nháp trong Builder, ta insert/update 1 row `draft`. Khi bấm xuất bản, row `draft` biến thành `published`, row đang `published` đổi thành `archived`. Do đó cực kì dễ Version History Rollback hoặc A/B Testing.)*

### 3.4. Bảng `storefront_assets`
Chứa custom CSS, JS, logo mà builder sinh ra để serve qua API hoặc Sync lên CDN.
- `id`
- `tenant_id`
- `asset_type` (css, js, image)
- `key` (varchar) - VD: "theme.custom.css"
- `content` (text) - hoặc S3 URL
- `content_hash` (varchar) - Phục vụ Cache invalidation

---

### Tổng kết

3 Module này kết hợp lại sẽ mở khoá toàn bộ vòng đời của một Storefront SaaS Platform:
- **Database Schema**: Cung cấp Storage vĩnh viễn, an toàn, có Version History, phục hồi Rollback.
- **Storefront API & Caching Layer**: Xử lý tải cao (High Traffic), phân tách rõ JSON layout và Data Content qua tính năng Batch Payload.
- **Runtime Renderer (Vue/Nuxt Framework)**: Tự động hoá resolve code, hỗ trợ SSR chuẩn SEO và mang lại tốc độ load nhanh ấn tượng.
