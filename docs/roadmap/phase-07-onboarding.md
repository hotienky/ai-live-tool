# Phase 7: Onboarding & Site Templates 🎯

> **Priority**: 🟠 Medium  
> **Duration**: 1–2 weeks  
> **Depends on**: Phase 6 (Themes)

---

## Mục tiêu

Tenant mới → chọn loại site → auto-install modules + theme + sample data. Trải nghiệm như Shopify/Wix onboarding.

---

## Tasks

### 7.1 Site Templates Definition

```
backend-laravel/database/seeders/templates/
  ├── ecommerce.json
  ├── blog.json
  ├── portfolio.json
  ├── landing-page.json
  ├── restaurant.json
  └── blank.json
```

Template format:
```json
{
  "id": "ecommerce",
  "name": "Online Store",
  "icon": "ShoppingBag",
  "description": "Cửa hàng online đầy đủ tính năng",
  "preview": "ecommerce-preview.png",
  "modules": ["ecom", "shipping", "tax", "marketing", "warehouse", "accounting"],
  "theme": "ecommerce-modern",
  "layout_sections": ["banner", "categories", "featured_products", "new_arrivals", "testimonials"],
  "default_pages": [
    { "title": "Giới thiệu", "slug": "about", "template": "about" },
    { "title": "Liên hệ", "slug": "contact", "template": "contact" },
    { "title": "FAQ", "slug": "faq", "template": "faq" },
    { "title": "Chính sách bảo mật", "slug": "privacy", "template": "privacy" }
  ],
  "sample_data": {
    "products": 12,
    "categories": 5,
    "banners": 3
  }
}
```

### 7.2 SiteTemplateService (Backend)

**Tạo mới**: `backend-laravel/app/Services/SiteTemplateService.php`

```php
class SiteTemplateService
{
    public static function listTemplates(): array { /* load from JSON files */ }
    
    public static function applyTemplate(string $tenantId, string $templateId): void
    {
        $template = self::getTemplate($templateId);
        
        // 1. Install required modules
        foreach ($template['modules'] as $moduleId) {
            ModuleRegistry::install($tenantId, $moduleId);
        }
        
        // 2. Set theme
        ThemeEngine::setTenantTheme($tenantId, $template['theme']);
        
        // 3. Create default pages
        foreach ($template['default_pages'] as $page) {
            self::createPage($tenantId, $page);
        }
        
        // 4. Set storefront layout
        self::setStorefrontLayout($tenantId, $template['layout_sections']);
        
        // 5. Seed sample data (if enabled)
        if ($template['sample_data']) {
            self::seedSampleData($tenantId, $template['sample_data']);
        }
    }
}
```

### 7.3 Onboarding Wizard (Frontend)

**Tạo mới**: `frontend/src/components/OnboardingWizard.vue`

4-step wizard:

```
Step 1: Chọn loại site
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ 🛒      │ │ ✍️      │ │ 🎨      │ │ 📋      │
│ Online  │ │ Blog    │ │ Portfolio│ │ Blank   │
│ Store   │ │         │ │         │ │         │
└─────────┘ └─────────┘ └─────────┘ └─────────┘

Step 2: Thông tin cơ bản
- Tên site
- Upload logo
- Mô tả ngắn

Step 3: Chọn theme variant
- Color palette selection
- Font pairing selection
- Preview

Step 4: Done!
- Redirect to admin dashboard
- Show quickstart guide
```

### 7.4 Custom Domain Setup

**Flow**: Tenant mua plan có custom domain →
1. Nhập domain trong admin
2. Backend tạo domain entry
3. Nginx auto-reload config
4. SSL auto-provision (Let's Encrypt via certbot)

**Tạo mới**: `backend-laravel/app/Services/DomainManager.php`

### 7.5 Modify Tenant Creation Flow

**File modify**: `frontend-master/` (Master admin)

Khi tạo tenant mới:
1. Chọn plan
2. Chọn site template
3. Create tenant → apply template → onboarding wizard

---

## Checklist

- [ ] Create template JSON files (5 templates)
- [ ] Backend `SiteTemplateService`
- [ ] API: `GET /api/templates`, `POST /api/templates/apply`
- [ ] Frontend `OnboardingWizard.vue` (4 steps)
- [ ] Sample data seeders per template
- [ ] Custom domain management
- [ ] First-time login → show onboarding wizard
- [ ] Test: new tenant → ecommerce template → all modules installed + theme applied

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `backend-laravel/database/seeders/templates/` (5 JSON files) |
| **CREATE** | `backend-laravel/app/Services/SiteTemplateService.php` |
| **CREATE** | `backend-laravel/app/Services/DomainManager.php` |
| **CREATE** | `frontend/src/components/OnboardingWizard.vue` |
| **MODIFY** | `frontend-master/` — tenant creation flow |
| **MODIFY** | `frontend/src/App.vue` — first-time onboarding detection |
| **MODIFY** | `nginx/` — dynamic domain config |
