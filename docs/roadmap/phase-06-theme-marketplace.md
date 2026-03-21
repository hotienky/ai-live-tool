# Phase 6: Theme Marketplace 🎨

> **Priority**: 🟠 Medium  
> **Duration**: 2–3 weeks  
> **Depends on**: Phase 2 (E-com extraction)

---

## Mục tiêu

Cho phép tenant chọn, preview, switch themes. Mỗi theme là 1 bộ sections + styles + layouts, phù hợp cho loại site khác nhau (e-commerce, blog, portfolio...).

---

## Tasks

### 6.1 Theme Spec (`theme.json`)

```json
{
  "id": "modern-shop",
  "name": "Modern Shop",
  "version": "1.0.0",
  "author": "KAC Team",
  "description": "Clean, modern e-commerce theme",
  "preview": "preview.png",
  "requires_modules": ["ecom"],
  "category": "ecommerce",
  "sections": [
    { "type": "banner", "component": "SfBanner" },
    { "type": "categories", "component": "SfCategories" },
    { "type": "product_grid", "component": "SfProductGrid" },
    { "type": "testimonials", "component": "SfTestimonials" }
  ],
  "colors": {
    "primary": "#7c3aed",
    "secondary": "#1e293b",
    "accent": "#ff8c42",
    "background": "#ffffff",
    "surface": "#f8fafc"
  },
  "fonts": {
    "heading": "Inter",
    "body": "Inter"
  },
  "layouts": ["full-width", "sidebar-left", "sidebar-right"]
}
```

### 6.2 Theme Directory Structure

```
themes/
  ├── starter/                  → Blank/minimal
  ├── ecommerce-modern/         → E-commerce
  ├── blog-magazine/            → Blog
  ├── portfolio-minimal/        → Portfolio
  └── saas-landing/             → SaaS landing page
```

Each theme:
```
themes/{theme-id}/
  ├── theme.json
  ├── preview.png
  ├── sections/
  │   ├── SfBanner.vue
  │   ├── SfCategories.vue
  │   └── ...
  ├── layouts/
  │   ├── FullWidth.vue
  │   └── Sidebar.vue
  └── style.css
```

### 6.3 Backend — ThemeEngine Service

**Tạo mới**: `backend-laravel/app/Services/ThemeEngine.php`

```php
class ThemeEngine
{
    public static function listThemes(): array { /* scan themes/ dir */ }
    public static function getTheme(string $themeId): ?array { /* read theme.json */ }
    public static function setTenantTheme(string $tenantId, string $themeId): void { /* update config */ }
    public static function getTenantTheme(string $tenantId): string { /* default: 'starter' */ }
}
```

### 6.4 Frontend — Theme Selector UI

**File mới**: `frontend/src/components/ThemeSelector.vue`

- Grid of theme cards with preview images
- "Preview" button → sandbox iframe
- "Apply" button → switch theme
- Show required modules warning
- Color override panel

### 6.5 Storefront — Theme-Agnostic Rendering

**File modify**: `frontend/src/components/StorefrontHome.vue`

Refactor: sections loaded from active theme, not hardcoded.

**File modify**: `frontend/src/components/StorefrontLayoutBuilder.vue`

Available sections = theme sections + module-provided sections.

---

## Checklist

- [ ] Define `theme.json` spec
- [ ] Create 3–5 built-in themes
- [ ] Backend `ThemeEngine` service
- [ ] Theme API: list, get, set
- [ ] Frontend `ThemeSelector.vue`
- [ ] Theme preview iframe
- [ ] Storefront refactor: theme-driven section loading
- [ ] Layout builder: respect theme available sections
- [ ] CSS variable injection from theme config
- [ ] Tenant can override theme colors without losing theme

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `themes/` directory (3-5 themes) |
| **CREATE** | `backend-laravel/app/Services/ThemeEngine.php` |
| **CREATE** | `frontend/src/components/ThemeSelector.vue` |
| **MODIFY** | `frontend/src/components/StorefrontHome.vue` — theme-agnostic |
| **MODIFY** | `frontend/src/components/StorefrontLayoutBuilder.vue` — theme sections |
| **MODIFY** | `frontend/src/components/ThemeCustomizer.vue` — integrate with engine |
