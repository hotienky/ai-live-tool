# Phase 6C: Template Store & Industry-Specific Builder 🏪

> **Priority**: 🔴 Critical — Khách hàng cần "chọn template → có site ngay"  
> **Duration**: 3–4 weeks  
> **Depends on**: Phase 6B (Visual Builder), Phase 6 (Themes)  
> **Revenue**: Template marketplace = nguồn thu quan trọng

---

## Tại sao cần Phase này?

```
Hành trình khách hàng hiện tại:
  Đăng ký → Trang trắng → Phải tự build từ đầu → BỎ CUỘC 😞

Hành trình mong muốn:
  Đăng ký → Chọn lĩnh vực → Chọn template → CÓ SITE NGAY ✨ → Tùy chỉnh thêm
```

**WordPress thành công nhờ theme marketplace.**  
**Shopify thành công nhờ theme store.**  
**Bạn cần Template Store.**

---

## Part 1: Industry-Specific Layout Builder 🔧

### Ý tưởng cốt lõi

Mỗi lĩnh vực có **bộ sections + blocks riêng**, phù hợp nhu cầu:

```
┌────────────────────────────────────────────────────────────────┐
│  🛒 E-commerce Builder                                        │
│  Sections: Banner, Product Grid, Categories, Flash Sale,      │
│            Cart, Checkout, Promotions, Brands, Reviews         │
│                                                                │
│  📝 Blog Builder                                               │
│  Sections: Hero, Latest Posts, Post Grid, Categories,          │
│            Author Bio, Newsletter, Comments, Archive           │
│                                                                │
│  🎓 Course/LMS Builder                                        │
│  Sections: Course Hero, Course Grid, Curriculum, Instructor,   │
│            Pricing Table, Testimonials, FAQ, Enrollment CTA    │
│                                                                │
│  📅 Booking Builder                                            │
│  Sections: Service Hero, Service List, Calendar, Pricing,      │
│            Team/Staff, Before-After Gallery, Reviews, Map      │
│                                                                │
│  🍽️ Restaurant Builder                                        │
│  Sections: Menu Hero, Food Gallery, Menu Categories,           │
│            Table Booking, Delivery, Chef/Team, Reviews, Map    │
│                                                                │
│  🏠 Real Estate Builder                                       │
│  Sections: Search Hero, Listing Grid, Map View, Agent Card,   │
│            Virtual Tour, Neighborhood, Price Calculator        │
│                                                                │
│  💼 Portfolio/Agency Builder                                   │
│  Sections: Creative Hero, Project Gallery, Services,           │
│            Skills/Stats, Client Logos, Contact CTA             │
│                                                                │
│  🏢 Business/Landing Builder                                  │
│  Sections: Landing Hero, Features Grid, Pricing Table,         │
│            Stats, Testimonials, Team, FAQ, CTA                 │
└────────────────────────────────────────────────────────────────┘
```

### Cách hoạt động

**Khi tenant chọn site type (Phase 7 Onboarding) → Builder tự động điều chỉnh:**

```javascript
// frontend/src/core/industry-builder.js

const industryConfigs = {
  ecommerce: {
    label: 'Cửa hàng Online',
    icon: 'ShoppingBag',
    requiredModules: ['ecom'],
    availableSections: [
      'hero_banner', 'product_grid', 'category_grid', 'flash_sale',
      'featured_products', 'new_arrivals', 'brands_slider', 'promotions',
      'testimonials', 'newsletter', 'faq',
    ],
    availableBlocks: [
      // Core blocks + e-com specific
      ...coreBlocks,
      'product_card', 'add_to_cart', 'price_display', 'product_carousel',
      'cart_summary', 'checkout_form', 'promo_banner',
    ],
    pageTypes: ['home', 'products', 'product_detail', 'cart', 'checkout', 'account'],
    sampleSections: [
      { type: 'hero_banner', preset: 'ecom_hero' },
      { type: 'category_grid', preset: 'ecom_categories' },
      { type: 'featured_products', preset: 'trending' },
      { type: 'flash_sale', preset: 'countdown' },
      { type: 'testimonials', preset: 'customer_reviews' },
      { type: 'newsletter', preset: 'signup_cta' },
    ],
  },

  blog: {
    label: 'Blog / Tin tức',
    icon: 'BookOpen',
    requiredModules: ['blog'],
    availableSections: [
      'hero_banner', 'latest_posts', 'post_grid', 'post_carousel',
      'category_list', 'author_spotlight', 'newsletter', 'search_hero',
      'featured_post', 'tag_cloud', 'archive_timeline',
    ],
    availableBlocks: [
      ...coreBlocks,
      'post_card', 'author_bio', 'reading_progress', 'social_share',
      'related_posts', 'comment_section', 'table_of_contents',
    ],
    pageTypes: ['home', 'post_listing', 'single_post', 'category', 'author'],
  },

  lms: {
    label: 'Khóa học Online',
    icon: 'GraduationCap',
    requiredModules: ['lms'],
    availableSections: [
      'hero_banner', 'course_grid', 'course_carousel', 'curriculum_preview',
      'instructor_profile', 'pricing_table', 'testimonials', 'faq',
      'stats_counter', 'enrollment_cta', 'certificate_showcase',
    ],
    availableBlocks: [
      ...coreBlocks,
      'course_card', 'lesson_list', 'progress_bar', 'pricing_card',
      'instructor_card', 'enrollment_button', 'quiz_preview',
    ],
    pageTypes: ['home', 'courses', 'course_detail', 'lesson', 'dashboard'],
  },

  booking: {
    label: 'Đặt lịch / Dịch vụ',
    icon: 'Calendar',
    requiredModules: ['booking'],
    availableSections: [
      'hero_banner', 'service_grid', 'booking_calendar', 'pricing_table',
      'team_showcase', 'before_after_gallery', 'testimonials', 'faq',
      'map_location', 'opening_hours', 'contact_form',
    ],
    availableBlocks: [
      ...coreBlocks,
      'service_card', 'booking_button', 'calendar_widget', 'staff_card',
      'before_after_slider', 'opening_hours_table', 'google_map',
    ],
    pageTypes: ['home', 'services', 'service_detail', 'booking', 'account'],
  },

  restaurant: {
    label: 'Nhà hàng / F&B',
    icon: 'UtensilsCrossed',
    requiredModules: ['restaurant'],
    availableSections: [
      'hero_banner', 'menu_categories', 'food_gallery', 'specials_carousel',
      'table_booking', 'delivery_order', 'chef_team', 'testimonials',
      'map_location', 'opening_hours', 'instagram_feed',
    ],
    availableBlocks: [
      ...coreBlocks,
      'menu_item', 'food_card', 'reservation_form', 'delivery_button',
      'chef_card', 'qr_menu', 'price_tag',
    ],
    pageTypes: ['home', 'menu', 'reservation', 'delivery', 'about'],
  },

  portfolio: {
    label: 'Portfolio / Agency',
    icon: 'Palette',
    requiredModules: [],
    availableSections: [
      'creative_hero', 'project_gallery', 'project_masonry', 'services_grid',
      'skills_bar', 'stats_counter', 'client_logos', 'testimonials',
      'contact_form', 'timeline', 'team_showcase',
    ],
    availableBlocks: [
      ...coreBlocks,
      'project_card', 'skill_bar', 'counter_stat', 'client_logo',
      'timeline_item', 'lightbox_image',
    ],
    pageTypes: ['home', 'projects', 'project_detail', 'about', 'contact'],
  },

  business: {
    label: 'Landing Page / Doanh nghiệp',
    icon: 'Building2',
    requiredModules: [],
    availableSections: [
      'hero_banner', 'features_grid', 'features_alternating', 'pricing_table',
      'stats_counter', 'testimonials', 'client_logos', 'team_showcase',
      'faq', 'cta_banner', 'newsletter', 'contact_form',
    ],
    availableBlocks: [
      ...coreBlocks,
      'feature_card', 'pricing_card', 'cta_button', 'stat_counter',
      'trust_badge',
    ],
    pageTypes: ['home', 'about', 'services', 'pricing', 'contact'],
  },
}
```

### Cập nhật Layout Builder

**File modify**: `frontend/src/components/StorefrontLayoutBuilder.vue`

```javascript
// Hiện tại: tất cả sections hiện cho mọi tenant
const libraryItems = [ ... tất cả sections ... ]

// Sau Phase 6C: sections filter theo industry
const industryType = ref('ecommerce') // loaded from tenant config

const availableSections = computed(() => {
  const config = industryConfigs[industryType.value]
  return allSections.filter(s => config.availableSections.includes(s.type))
})

// Section library chỉ hiển thị sections phù hợp với lĩnh vực
const libraryItems = computed(() => {
  return availableSections.value.map(s => ({
    type: s.type,
    label: sectionMeta[s.type].label,
    icon: sectionMeta[s.type].icon,
    desc: sectionMeta[s.type].desc,
  }))
})
```

**Checklist:**
- [ ] Tạo `frontend/src/core/industry-builder.js` — industry configs
- [ ] API: `GET /api/tenant/site-type` → trả về industry type
- [ ] Layout Builder filter sections theo industry
- [ ] Block palette filter blocks theo industry
- [ ] Page types theo industry
- [ ] Tenant có thể switch industry type (warning: sections may change)
- [ ] "All sections" toggle cho advanced users

---

## Part 2: Template Store 🏪

### Concept

```
┌────────────────────────────────────────────────────────────────┐
│                    📦 TEMPLATE STORE                          │
│                                                                │
│  [🔍 Search templates...]   [All ▼] [Free ▼] [Industry ▼]   │
│                                                                │
│  ── 🔥 Trending ──                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ 📸       │ │ 📸       │ │ 📸       │ │ 📸       │          │
│  │          │ │          │ │          │ │          │          │
│  │ ModernX  │ │ Flavor   │ │ Starter  │ │ Academy  │          │
│  │ E-com    │ │ F&B      │ │ Business │ │ LMS      │          │
│  │ ⭐⭐⭐⭐⭐│ │ ⭐⭐⭐⭐  │ │ ⭐⭐⭐⭐⭐│ │ ⭐⭐⭐⭐  │          │
│  │ FREE     │ │ 299k     │ │ FREE     │ │ 499k     │          │
│  │[Preview] │ │[Preview] │ │[Preview] │ │[Preview] │          │
│  │[Install] │ │ [Buy]    │ │[Install] │ │ [Buy]    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│  ── 🛒 E-commerce ──                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Fashion  │ │ TechShop │ │ Organic  │  ... Show All →       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                │
│  ── ✍️ Blog ──                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Magazine │ │ Minimal  │ │ Personal │  ... Show All →       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                │
│  ── 🎓 Courses ──                                              │
│  ── 📅 Booking ──                                              │
│  ── 🍽️ Restaurant ──                                          │
│  ── 💼 Portfolio ──                                            │
│  ── 🏢 Business ──                                             │
└────────────────────────────────────────────────────────────────┘
```

### Template Definition

Mỗi template bao gồm:

```json
{
  "id": "modern-fashion-store",
  "name": "Modern Fashion",
  "version": "1.0.0",
  "author": {
    "name": "KAC Team",
    "avatar": "https://...",
    "url": "https://..."
  },
  "industry": "ecommerce",
  "tags": ["fashion", "clothing", "modern", "minimal"],
  "price": 0,
  "currency": "VND",
  "rating": 4.8,
  "installs": 1250,
  "preview_url": "https://demo.kac-cms.com/modern-fashion",
  "screenshots": [
    "screenshots/home.png",
    "screenshots/products.png",
    "screenshots/product-detail.png",
    "screenshots/cart.png"
  ],
  "description": "Template thời trang hiện đại với layout clean...",
  "features": [
    "Responsive 100%",
    "Dark mode support",
    "6 trang mẫu",
    "Tích hợp Flash Sale"
  ],

  "requires_modules": ["ecom", "marketing"],
  "theme": {
    "colors": { "primary": "#1a1a2e", "accent": "#e94560" },
    "fonts": { "heading": "Playfair Display", "body": "Inter" }
  },

  "pages": {
    "home": {
      "sections": [
        {
          "type": "hero_banner",
          "blocks": [
            { "type": "heading", "content": { "text": "New Collection", "level": 1 }, "style": { "fontSize": "48px", "color": "#fff" } },
            { "type": "text", "content": { "html": "<p>Discover the latest trends</p>" } },
            { "type": "button", "content": { "text": "Shop Now", "url": "/products" }, "style": { "backgroundColor": "#e94560" } }
          ],
          "style": { "backgroundImage": "hero-bg.jpg", "padding": { "top": 120, "bottom": 120 } }
        },
        {
          "type": "category_grid",
          "params": { "columns": 4, "showCount": true }
        },
        {
          "type": "featured_products",
          "params": { "title": "Trending Now", "count": 8, "columns": 4 }
        }
      ]
    },
    "about": {
      "sections": [ /* ... */ ]
    },
    "contact": {
      "sections": [ /* ... */ ]
    }
  },

  "sample_data": {
    "products": [
      { "name": "Classic T-Shirt", "price": 350000, "image": "samples/tshirt.jpg" },
      { "name": "Denim Jacket", "price": 890000, "image": "samples/jacket.jpg" }
    ],
    "categories": [
      { "name": "Áo", "image": "samples/cat-tops.jpg" },
      { "name": "Quần", "image": "samples/cat-bottoms.jpg" }
    ],
    "pages": [
      { "title": "Giới thiệu", "slug": "about", "body": "..." },
      { "title": "Liên hệ", "slug": "contact", "body": "..." }
    ]
  }
}
```

### Database Schema

```sql
-- Master DB
templates (
  id SERIAL PRIMARY KEY,
  template_id VARCHAR(100) UNIQUE,
  name VARCHAR(255),
  author_id INT,             -- developer who created
  industry VARCHAR(50),      -- ecommerce, blog, lms...
  category VARCHAR(50),      -- fashion, tech, food...
  tags JSONB,
  price DECIMAL(10,0) DEFAULT 0,
  rating DECIMAL(2,1),
  install_count INT DEFAULT 0,
  preview_url VARCHAR(500),
  screenshots JSONB,
  description TEXT,
  features JSONB,
  requires_modules JSONB,
  theme_config JSONB,        -- colors, fonts
  pages_config JSONB,        -- full page structure with sections + blocks
  sample_data JSONB,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  version VARCHAR(20),
  created_at, updated_at
)

template_reviews (
  id, template_id, tenant_id, rating, review_text, created_at
)

template_installs (
  id, template_id, tenant_id, installed_at
)
```

### Backend Service

**File tạo mới**: `backend-laravel/app/Services/TemplateStoreService.php`

```php
class TemplateStoreService
{
    // Browse templates
    public static function list(array $filters = []): LengthAwarePaginator
    {
        $query = Template::where('is_active', true);
        
        if ($filters['industry'] ?? null) $query->where('industry', $filters['industry']);
        if ($filters['category'] ?? null) $query->where('category', $filters['category']);
        if ($filters['price'] ?? null) {
            $filters['price'] === 'free' 
                ? $query->where('price', 0) 
                : $query->where('price', '>', 0);
        }
        if ($filters['search'] ?? null) {
            $query->where('name', 'ilike', "%{$filters['search']}%");
        }
        
        return $query->orderBy($filters['sort'] ?? 'install_count', 'desc')
                     ->paginate($filters['per_page'] ?? 12);
    }
    
    // Install template for tenant
    public static function install(string $tenantId, string $templateId): array
    {
        $template = Template::where('template_id', $templateId)->firstOrFail();
        
        // 1. Check plan limits
        // 2. Check & install required modules
        foreach ($template->requires_modules ?? [] as $moduleId) {
            if (!ModuleRegistry::isInstalled($tenantId, $moduleId)) {
                ModuleRegistry::install($tenantId, $moduleId);
            }
        }
        
        // 3. Apply theme (colors, fonts)
        self::applyTheme($tenantId, $template->theme_config);
        
        // 4. Create pages with sections + blocks
        self::createPages($tenantId, $template->pages_config);
        
        // 5. Import sample data (products, posts...)
        if ($template->sample_data) {
            self::importSampleData($tenantId, $template->sample_data);
        }
        
        // 6. Track install
        $template->increment('install_count');
        TemplateInstall::create([
            'template_id' => $template->id, 
            'tenant_id' => $tenantId,
        ]);
        
        return ['success' => true, 'message' => "Đã cài đặt template: {$template->name}"];
    }
    
    // Preview template (create sandbox)
    public static function preview(string $templateId): string
    {
        // Return preview URL for iframe
    }
    
    // Uninstall (reset to blank)
    public static function uninstall(string $tenantId): array
    {
        // Warning: this will delete all content
        // Archive current content first
    }
}
```

### API Endpoints

```php
// routes/tenant.php
Route::prefix('template-store')->group(function () {
    Route::get('/', [TemplateStoreController::class, 'index']);          // Browse
    Route::get('/{id}', [TemplateStoreController::class, 'show']);       // Detail
    Route::get('/{id}/preview', [TemplateStoreController::class, 'preview']); // Preview URL
    Route::post('/{id}/install', [TemplateStoreController::class, 'install']); // Install
    Route::post('/{id}/review', [TemplateStoreController::class, 'review']);   // Submit review
});

// routes/master.php (admin)
Route::prefix('templates')->group(function () {
    Route::get('/', [TemplateAdminController::class, 'index']);
    Route::post('/', [TemplateAdminController::class, 'store']);         // Upload new
    Route::put('/{id}', [TemplateAdminController::class, 'update']);
    Route::post('/{id}/feature', [TemplateAdminController::class, 'toggleFeatured']);
});
```

### Frontend — Template Store Page

**File tạo mới**: `frontend/src/components/TemplateStore.vue`

```
┌──── Template Store ──────────────────────────────────────────┐
│                                                              │
│  Header: Search + Filters (Industry, Price, Sort)           │
│                                                              │
│  Featured Carousel: 3-4 featured templates                  │
│                                                              │
│  Grid: Template cards with:                                  │
│    - Preview screenshot                                      │
│    - Name, author, rating, install count                    │
│    - Price badge (FREE / 299k)                              │
│    - [Preview] [Install/Buy] buttons                        │
│                                                              │
│  Industry tabs: All | E-com | Blog | LMS | Booking | ...   │
│                                                              │
│  Load more / pagination                                      │
└──────────────────────────────────────────────────────────────┘
```

**File tạo mới**: `frontend/src/components/TemplateDetail.vue`

```
┌──── Template Detail ─────────────────────────────────────────┐
│                                                              │
│  ┌─ Screenshots Carousel ──────────────────────────────┐    │
│  │  [📸 Home] [📸 Products] [📸 Detail] [📸 Cart]    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                              │
│  Modern Fashion Store                          [Install]     │
│  By: KAC Team  ⭐ 4.8 (120 reviews)  📦 1,250 installs    │
│                                                              │
│  Description: ...                                            │
│                                                              │
│  ✅ Features:                                                │
│  • Responsive 100%                                           │
│  • Dark mode support                                         │
│  • 6 trang mẫu                                              │
│                                                              │
│  📦 Requires: E-commerce, Marketing                         │
│                                                              │
│  [Live Preview ↗]                                            │
│                                                              │
│  ── Reviews ──                                               │
│  ⭐⭐⭐⭐⭐ "Template đẹp, dễ customize" — Shop ABC          │
│  ⭐⭐⭐⭐  "Tốt nhưng cần thêm section" — Blog XYZ           │
└──────────────────────────────────────────────────────────────┘
```

### Template Builder (cho Developer/Admin tạo template)

**File tạo mới**: `frontend/src/components/TemplateBuilder.vue`

Cho phép:
- Design template bằng visual builder
- Export thành template package
- Set metadata (name, industry, screenshots)
- Submit lên Template Store
- Preview URL generation

---

## Part 3: Tenant có thể tạo & bán templates 🎨

Mở rộng ecosystem:
- Tenant/developer build template bằng visual builder
- Export → submit lên Template Store
- Review queue (admin duyệt)
- Pricing: miễn phí hoặc trả phí (revenue share 70/30)

```
Developer Flow:
  Design in Builder → Export Template → Submit → Admin Review → Published ✅
  
Revenue: Template price × 70% → Developer, 30% → Platform
```

---

## Part 4: Industry Starter Kits

Khi tenant **đăng ký mới**, hiện wizard:

```
┌──── Chào mừng! Bạn muốn tạo site loại nào? ──────────────────┐
│                                                                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  🛒      │ │  ✍️      │ │  🎓      │ │  📅      │          │
│  │ Cửa hàng │ │  Blog    │ │ Khóa học │ │ Đặt lịch │          │
│  │  Online  │ │ Tin tức  │ │  Online  │ │ Dịch vụ  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │  🍽️      │ │  💼      │ │  🏠      │ │  ⬜      │          │
│  │ Nhà hàng │ │Portfolio │ │Bất động  │ │  Trống   │          │
│  │   F&B    │ │ Agency   │ │   sản    │ │ (Blank)  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                │
│  ─── Sau khi chọn lĩnh vực ───                                │
│                                                                │
│  Chọn template cho cửa hàng của bạn:                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                       │
│  │ Modern   │ │ Classic  │ │ Minimal  │                       │
│  │ Fashion  │ │ Store    │ │ Market   │                       │
│  │  FREE    │ │  FREE    │ │  299k    │                       │
│  │[Chọn ✓] │ │[Chọn]   │ │  [Mua]   │                       │
│  └──────────┘ └──────────┘ └──────────┘                       │
│                                                                │
│  ─── Tiếp theo ───                                             │
│                                                                │
│  Tên site: [_________________]                                │
│  Logo:     [📎 Upload]                                        │
│  Màu chủ đạo: [🔴] [🔵] [🟢] [🟡] [Custom]                  │
│                                                                │
│  [← Quay lại]                          [Tạo site ngay →]     │
└────────────────────────────────────────────────────────────────┘
```

---

## Checklist tổng hợp

### Industry-Specific Builder
- [ ] Tạo `frontend/src/core/industry-builder.js` — 8 industry configs
- [ ] Layout Builder filter sections/blocks theo industry
- [ ] Tenant chọn industry type trong onboarding
- [ ] Backend lưu industry type trong tenant config
- [ ] "Show all sections" toggle cho power users
- [ ] Mỗi industry có bộ sample sections mặc định

### Template Store — Backend
- [ ] Database: `templates`, `template_reviews`, `template_installs` tables
- [ ] Model: `Template`, `TemplateReview`, `TemplateInstall`
- [ ] `TemplateStoreService` — browse, install, preview, review
- [ ] `TemplateStoreController` — API endpoints
- [ ] `TemplateAdminController` — master admin management
- [ ] Template import/export format (JSON + assets zip)
- [ ] Template preview sandbox (isolated iframe)
- [ ] Install flow: modules → theme → pages → sample data

### Template Store — Frontend
- [ ] `TemplateStore.vue` — browse page with search, filters, grid
- [ ] `TemplateDetail.vue` — detail page with screenshots, reviews
- [ ] `TemplateBuilder.vue` — create/export templates
- [ ] Integrate vào admin sidebar: "Template Store" menu item
- [ ] Template install confirmation modal
- [ ] "Đang cài đặt..." progress indicator
- [ ] After install → redirect to homepage builder

### Industry Starter Kits
- [ ] 3+ free templates per industry (tự tạo sẵn)
- [ ] Onboarding wizard integration (Phase 7)
- [ ] Sample data per industry (realistic products, posts, etc.)
- [ ] One-click demo generation

### Template Marketplace (Revenue)
- [ ] Developer submit template flow
- [ ] Admin review queue
- [ ] Pricing: free vs paid templates
- [ ] Revenue share tracking (70/30)
- [ ] Developer earnings dashboard
- [ ] Payout system

---

## Built-in Templates (tạo sẵn)

### Free Templates (Phase 1 launch)

| # | Template | Industry | Pages |
|---|----------|----------|-------|
| 1 | Modern Fashion | E-commerce | Home, Products, Detail, Cart, About, Contact |
| 2 | Tech Shop | E-commerce | Home, Products, Detail, Cart, Compare, Support |
| 3 | Organic Market | E-commerce | Home, Products, Detail, Cart, Farm Story |
| 4 | Clean Blog | Blog | Home, Posts, Single Post, Categories, About, Contact |
| 5 | Magazine | Blog | Home, Posts, Authors, Categories, Newsletter |
| 6 | Starter Business | Business | Home, About, Services, Team, Contact |
| 7 | Portfolio Minimal | Portfolio | Home, Projects, About, Contact |
| 8 | Simple Landing | Business | Single page: Hero + Features + CTA |

### Premium Templates (future, paid)

| # | Template | Industry | Price |
|---|----------|----------|-------|
| 1 | Academy Pro | LMS | 499k |
| 2 | Flavor | Restaurant | 299k |
| 3 | BookIt | Booking | 399k |
| 4 | Estate Pro | Real Estate | 499k |
| 5 | Multi-vendor | Marketplace | 699k |

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `frontend/src/core/industry-builder.js` |
| **CREATE** | `frontend/src/components/TemplateStore.vue` |
| **CREATE** | `frontend/src/components/TemplateDetail.vue` |
| **CREATE** | `frontend/src/components/TemplateBuilder.vue` |
| **CREATE** | `backend-laravel/app/Models/Template.php` |
| **CREATE** | `backend-laravel/app/Models/TemplateReview.php` |
| **CREATE** | `backend-laravel/app/Models/TemplateInstall.php` |
| **CREATE** | `backend-laravel/app/Services/TemplateStoreService.php` |
| **CREATE** | `backend-laravel/app/Http/Controllers/Tenant/TemplateStoreController.php` |
| **CREATE** | `backend-laravel/app/Http/Controllers/Master/TemplateAdminController.php` |
| **CREATE** | `backend-laravel/database/migrations/xxxx_create_templates_table.php` |
| **CREATE** | `templates/` — 8 built-in templates (JSON + assets) |
| **MODIFY** | `frontend/src/components/StorefrontLayoutBuilder.vue` — industry filtering |
| **MODIFY** | `frontend/src/App.vue` — add Template Store route |
| **MODIFY** | `backend-laravel/routes/tenant.php` — template store API |
