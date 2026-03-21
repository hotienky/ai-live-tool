# Phase 6B: Visual Page Builder & Custom UI 🎨✨

> **Priority**: 🔴 Critical — Đa số khách hàng sẽ cần feature này  
> **Duration**: 3–4 weeks  
> **Depends on**: Phase 1 (Hooks), Phase 3 (Content Types)  
> **Integrates with**: Phase 6 (Themes)

---

## Tại sao phase này quan trọng nhất?

```
Khách hàng sẽ chia 3 nhóm:

┌──────────────────────────────────────────────────────────┐
│  70% — Người dùng phổ thông (SMBs, shop online)         │
│  → Cần: Drag-and-drop visual builder, KHÔNG code        │
│  → Giống: Wix, Squarespace, Shopify Theme Editor        │
│                                                          │
│  20% — Developer / Agency                                │
│  → Cần: Custom code, CSS injection, HTML blocks          │
│  → Giống: WordPress + Elementor Pro                      │
│                                                          │
│  10% — Headless developers                               │
│  → Cần: API only, frontend tự build                      │
│  → Giống: Strapi, Contentful                             │
└──────────────────────────────────────────────────────────┘

Phase 5 (API) serves 10%. Phase 6B serves 90%.
```

---

## Current State Analysis

### Đã có trong `StorefrontLayoutBuilder.vue` (81KB, 1636 lines):

| Feature | Status | Mức độ |
|---------|--------|--------|
| Section-based layout | ✅ | Drag-drop sections (banner, products, FAQ...) |
| Section parameters | ✅ | Columns, count, autoplay, colors |
| Wireframe preview | ✅ | ASCII wireframe preview |
| Live preview | ✅ | Iframe live preview |
| Responsive preview | ✅ | Desktop/tablet/mobile toggle |
| Custom CSS | ✅ | Textarea cho custom CSS |
| Section library | ✅ | 14 section types |
| Page configs | ✅ | Products, checkout, auth page settings |
| Undo/Redo | ✅ | Undo stack (20 levels) |
| Templates | ✅ | 4 layout templates |
| Header config | ✅ | Logo, nav, search, sticky |
| Footer config | ✅ | Columns, social, payment badges |
| Promo bar | ✅ | Top notification bar |
| Content items | ✅ | Testimonials, FAQ, gallery items |
| i18n per section | ✅ | Language tabs for section content |
| Draft/Publish | ✅ | Save draft vs publish |

### Thiếu gì cho Visual Page Builder đầy đủ?

| Feature | Status | Cần cho |
|---------|--------|---------|
| Block-level editing | ❌ | Visual editing từng block trong section |
| Inline text editing | ❌ | Click-to-edit trực tiếp trên preview |
| Block drag-drop | ❌ | Kéo thả blocks TRONG section |
| Row/Column layout | ❌ | Chia layout thành rows & columns |
| Spacing controls | ❌ | Margin, padding per block |
| Typography controls | ❌ | Font size, weight, color per block |
| Background controls | ❌ | Background color, image, gradient per section |
| Button/CTA builder | ❌ | Tạo buttons style tùy chỉnh |
| Form builder | ❌ | Contact form, signup form |
| Code block (HTML/JS) | ❌ | Inject custom code |
| Global styles | ❌ | Sitewide CSS variables UI |
| Responsive per block | ❌ | Hide/show blocks per breakpoint |
| Animation presets | ❌ | Fade in, slide up, zoom... |
| Template library | ❌ | Pre-made section templates |
| Page templates | ❌ | Full page templates (landing, about...) |

---

## Architecture

### Block System
```
Page
  └─ Section (full-width row)
       ├─ Row
       │    ├─ Column (1/2, 1/3, 1/4, full)
       │    │    ├─ Block: Heading
       │    │    ├─ Block: Text
       │    │    └─ Block: Image
       │    └─ Column
       │         ├─ Block: Button
       │         └─ Block: Video
       └─ Row
            └─ Column (full)
                 └─ Block: Product Grid
```

### Block Types (mở rộng bằng plugins)
```
Core Blocks:
  ├─ heading        → H1-H6 với style controls
  ├─ text           → Rich text paragraph
  ├─ image          → Image với alt, link, size
  ├─ button         → CTA button với style
  ├─ spacer         → Vertical spacing
  ├─ divider        → Horizontal line
  ├─ video          → YouTube, Vimeo, TikTok embed
  ├─ icon           → Lucide icon với size, color
  ├─ html           → Raw HTML/JS code
  └─ columns        → Layout columns (2, 3, 4 cols)

Content Blocks (tích hợp với Content Types):
  ├─ product-grid   → Dynamic product listing
  ├─ post-list      → Blog posts listing
  ├─ category-grid  → Category cards
  ├─ testimonial    → Customer reviews
  └─ form           → Contact/signup form

Plugin blocks (đăng ký qua hooks):
  ├─ ecom:cart       → Mini cart widget
  ├─ blog:recent     → Recent posts widget
  └─ newsletter:signup → Email signup
```

---

## Detailed Tasks

### 6B.1 Block Engine — Core Data Model

**File tạo mới**: `frontend/src/core/blocks.js`

```javascript
// Block definition
const blockSchema = {
  id: 'uuid',           // unique block ID
  type: 'heading',      // block type
  content: {},          // type-specific content
  style: {              // visual styling
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    padding: { top: 16, right: 16, bottom: 16, left: 16 },
    backgroundColor: '',
    backgroundImage: '',
    borderRadius: 0,
    textAlign: 'left',
    // Typography (for text blocks)
    fontSize: '',
    fontWeight: '',
    color: '',
    lineHeight: '',
  },
  responsive: {
    hideOnMobile: false,
    hideOnTablet: false,
    hideOnDesktop: false,
  },
  animation: '',        // 'fade-in', 'slide-up', 'zoom-in', null
}

// Block Type Registry — plugins register new block types
class BlockRegistry {
  types = {}
  
  register(type, config) {
    // config = { label, icon, category, component, defaultContent, settings }
    this.types[type] = config
  }
  
  get(type) { return this.types[type] }
  all() { return this.types }
  byCategory(cat) { return Object.entries(this.types).filter(([, c]) => c.category === cat) }
}

export const blockRegistry = new BlockRegistry()

// Register core blocks
blockRegistry.register('heading', {
  label: 'Heading',
  icon: 'Type',
  category: 'basic',
  defaultContent: { text: 'Heading Text', level: 2 },
  settings: [
    { key: 'text', type: 'text', label: 'Text' },
    { key: 'level', type: 'select', label: 'Level', options: [1,2,3,4,5,6] },
  ],
})

blockRegistry.register('text', {
  label: 'Text',
  icon: 'AlignLeft',
  category: 'basic',
  defaultContent: { html: '<p>Your text here...</p>' },
  settings: [
    { key: 'html', type: 'richtext', label: 'Content' },
  ],
})

// ... more core blocks
```

**Checklist:**
- [ ] Create `frontend/src/core/blocks.js`
- [ ] Define block schema (content + style + responsive + animation)
- [ ] Create `BlockRegistry` class
- [ ] Register 10 core block types
- [ ] Expose via hooks for plugin block registration

### 6B.2 Visual Block Editor Component

**File tạo mới**: `frontend/src/components/builder/BlockEditor.vue`

Main visual editor:
```
┌────────────────────────────────────────────────────────────┐
│ [+ Add Block]  [Row Layout: 1|2|3|4 cols]  [Undo] [Redo] │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─ Section: Hero Banner ──────────────────── [≡] [🗑]──┐ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  [H1] Welcome to Our Store          ← click edit │ │ │
│  │  │  [P]  Shop the latest trends        ← click edit │ │ │
│  │  │  [BTN] Shop Now                     ← click edit │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └──────────────────────────────────────────────────────┘ │
│                    ⬇ [+ Add Section]                       │
│  ┌─ Section: Features ─────────────────────── [≡] [🗑]──┐ │
│  │  ┌─ Row (3 columns) ──────────────────────────────┐  │ │
│  │  │  [COL 1/3]    │  [COL 1/3]    │  [COL 1/3]    │  │ │
│  │  │  🚚 Free Ship │  💰 Best Price │  🔒 Secure    │  │ │
│  │  └────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Features:
- Click on any block → settings panel opens on right
- Drag to reorder blocks within section
- Drag to reorder sections
- Hover highlight with toolbar (move up, move down, duplicate, delete)
- Add block: opens block palette

**Checklist:**
- [ ] Create `BlockEditor.vue` — main editor canvas
- [ ] Create `BlockRenderer.vue` — renders single block based on type
- [ ] Create `BlockSettings.vue` — right panel for selected block settings
- [ ] Create `BlockPalette.vue` — add block modal (grid of block types)
- [ ] Inline text editing (contenteditable on text/heading blocks)
- [ ] Block drag-and-drop (reorder within section)
- [ ] Section drag-and-drop (reorder sections)

### 6B.3 Style Controls Panel

**File tạo mới**: `frontend/src/components/builder/StyleControls.vue`

```
┌─── Block Settings ──────────────────────┐
│                                          │
│ 📝 Content          🎨 Style            │
│                                          │
│ ┌─ Spacing ────────────────────────────┐ │
│ │     ┌─────────┐                      │ │
│ │     │ margin  │                      │ │
│ │     ├─────────┤                      │ │
│ │     │ padding │                      │ │
│ │     └─────────┘                      │ │
│ │ Top: [16] Right: [16]               │ │
│ │ Bottom: [16] Left: [16]             │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ Typography ─────────────────────────┐ │
│ │ Font Size: [16px ▼]                  │ │
│ │ Font Weight: [Normal ▼]              │ │
│ │ Color: [🔴] Line Height: [1.5]      │ │
│ │ Text Align: [L] [C] [R] [J]         │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ Background ─────────────────────────┐ │
│ │ Type: [Color ▼]                      │ │
│ │ Color: [#ffffff]                     │ │
│ │ Or: Upload Image  [Choose]           │ │
│ │ Or: Gradient [🔴→🔵]                │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ Border ─────────────────────────────┐ │
│ │ Radius: [──●──] 8px                 │ │
│ │ Width: [0] Color: [#eee]            │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ Animation ──────────────────────────┐ │
│ │ [None ▼] [Fade In] [Slide Up]       │ │
│ │          [Zoom In] [Bounce]          │ │
│ └──────────────────────────────────────┘ │
│                                          │
│ ┌─ Responsive ─────────────────────────┐ │
│ │ ☐ Hide on Mobile                    │ │
│ │ ☐ Hide on Tablet                    │ │
│ │ ☐ Hide on Desktop                   │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

**Checklist:**
- [ ] Spacing controls (margin + padding, visual box model)
- [ ] Typography controls (size, weight, color, alignment, line-height)
- [ ] Background controls (solid, gradient, image, overlay)
- [ ] Border controls (radius, width, color)
- [ ] Animation presets (fade, slide, zoom, bounce)
- [ ] Responsive toggles (hide per breakpoint)
- [ ] Box shadow control
- [ ] CSS class injection (advanced users add custom classes)

### 6B.4 Row/Column Layout System

**File tạo mới**: `frontend/src/components/builder/RowEditor.vue`

```
Choose layout:
[████████████]   1 column (full)
[██████|██████]  2 columns (50/50)
[████|████|████] 3 columns (33/33/33)
[██|██|██|██]    4 columns (25/25/25/25)
[████████|████]  2 columns (66/33)
[████|████████]  2 columns (33/66)
```

Each column can contain blocks (heading, text, image, button...).

**Checklist:**
- [ ] Create `RowEditor.vue`
- [ ] 6 column presets
- [ ] Custom column widths (drag to resize)
- [ ] Drag blocks between columns
- [ ] Responsive: columns stack on mobile

### 6B.5 Form Builder Block

**File tạo mới**: `frontend/src/components/builder/FormBlock.vue`

Drag-and-drop form builder:
- Text input, textarea, email, phone, select, checkbox, radio
- Submit action: email notification, save to DB, webhook
- Form validation rules
- Success/error messages
- CAPTCHA option

Backend support:
- **File tạo mới**: `backend-laravel/app/Http/Controllers/Tenant/FormSubmissionController.php`
- **File tạo mới**: `backend-laravel/app/Models/FormSubmission.php`

**Checklist:**
- [ ] Create `FormBlock.vue` — visual form builder
- [ ] Create `FormFieldEditor.vue` — edit individual form fields
- [ ] Backend: `FormSubmission` model + controller
- [ ] Email notification on form submit
- [ ] Form submissions list in admin
- [ ] Export submissions to CSV

### 6B.6 Global Style Editor

**File tạo mới**: `frontend/src/components/builder/GlobalStyles.vue`

Sitewide design controls (thay vì chỉ CSS textarea):
```
┌─── Site Styles ─────────────────────────┐
│                                          │
│ 🎨 Colors                               │
│ Primary:    [██] #7c3aed                │
│ Secondary:  [██] #1e293b                │
│ Accent:     [██] #ff8c42                │
│ Background: [██] #ffffff                │
│ Text:       [██] #334155                │
│                                          │
│ 🔤 Fonts                                │
│ Heading: [Inter ▼]                      │
│ Body:    [Inter ▼]                      │
│  Preview: Aa Bb Cc 123                  │
│                                          │
│ 📐 Layout                               │
│ Max width: [1200px ▼]                   │
│ Container padding: [──●──] 16px         │
│ Section spacing: [──●──] 64px           │
│                                          │
│ 🌓 Dark Mode                            │
│ ○ Light only                            │
│ ○ Dark only                             │
│ ● Auto (follows system)                 │
│                                          │
│ 📱 Breakpoints                           │
│ Mobile: ≤768px   Tablet: ≤1024px        │
└──────────────────────────────────────────┘
```

**Checklist:**
- [ ] Color palette editor (generates CSS variables)
- [ ] Font selector (Google Fonts integration)
- [ ] Layout settings (max-width, spacing)
- [ ] Dark mode toggle
- [ ] Export/import styles as JSON
- [ ] Generate CSS variables from settings

### 6B.7 Pre-made Section Templates

Thêm template library cho sections. Thay vì tạo section trống, chọn từ pre-designed templates:

```
┌── Section Templates ──────────────────────────┐
│                                                │
│ 🌟 Hero Sections                               │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │ CTA │ │Split│ │Video│ │Slide│               │
│ │ hero│ │image│ │hero │ │show │               │
│ └─────┘ └─────┘ └─────┘ └─────┘               │
│                                                │
│ 📦 Feature Sections                             │
│ ┌─────┐ ┌─────┐ ┌─────┐                        │
│ │3-col│ │Icon │ │Stats│                        │
│ │grid │ │list │ │bar  │                        │
│ └─────┘ └─────┘ └─────┘                        │
│                                                │
│ 💬 Social Proof                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐                        │
│ │Testi│ │Logo │ │Case │                        │
│ │mons│ │strip│ │study│                        │
│ └─────┘ └─────┘ └─────┘                        │
│                                                │
│ 📱 CTA Sections                                 │
│ ┌─────┐ ┌─────┐ ┌─────┐                        │
│ │CTA  │ │News │ │Down │                        │
│ │band │ │leter│ │load │                        │
│ └─────┘ └─────┘ └─────┘                        │
└────────────────────────────────────────────────┘
```

**Checklist:**
- [ ] 20+ pre-designed section templates
- [ ] Template categories (hero, features, CTA, testimonials, pricing, team, contact)
- [ ] Each template is a pre-configured section with blocks + styling
- [ ] One-click insert, then customize
- [ ] Tenant can save custom sections as templates

### 6B.8 Page Templates

Full page templates for common page types:

| Template | Blocks included |
|----------|----------------|
| Landing Page | Hero → Features → Testimonials → CTA |
| About Us | Hero → Team → Story → Stats |
| Contact | Hero → Contact Form → Map → FAQ |
| Pricing | Hero → Pricing Table → FAQ → CTA |
| Portfolio | Hero → Gallery → About → Contact |
| Blog Home | Hero → Latest Posts → Categories → Newsletter |
| Product Landing | Hero → Features → Gallery → Reviews → CTA |

**Checklist:**
- [ ] 7+ page templates
- [ ] One-click apply to any CMS page
- [ ] Customize after applying

### 6B.9 Integrate with Existing StorefrontLayoutBuilder

**File modify**: `frontend/src/components/StorefrontLayoutBuilder.vue` (1636 lines)

Thay vì rewrite, **mở rộng** builder hiện tại:

1. Mỗi section hiện tại → thêm block-level editing
2. "Custom Section" → full block editor
3. Global styles → thay CSS textarea bằng visual editor
4. Section library → thêm pre-made templates

```javascript
// Thêm vào sectionMeta (L725-L741)
sectionMeta['custom'] = { label: 'Custom Block Section', icon: Blocks, pvHeight: '40px' }

// Khi section type === 'custom' → render BlockEditor thay vì fixed controls
```

**Checklist:**
- [ ] Keep existing section-based system (backward compatible)
- [ ] Add "Custom Section" type using block editor
- [ ] Replace CSS textarea with GlobalStyles component
- [ ] Add section template picker to library modal
- [ ] Add page template picker

---

## Migration Strategy

```
Phase hiện tại (sections only):
  Section → params + content items → preview

Phase 6B (sections + blocks):
  Section → blocks (each with content + style) → preview
  
Backward compatible:
  Old sections (banner, products, etc.) → render như cũ
  New "custom" sections → render via block engine
```

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `frontend/src/core/blocks.js` — block registry + schema |
| **CREATE** | `frontend/src/components/builder/BlockEditor.vue` — main editor |
| **CREATE** | `frontend/src/components/builder/BlockRenderer.vue` — renders blocks |
| **CREATE** | `frontend/src/components/builder/BlockSettings.vue` — settings panel |
| **CREATE** | `frontend/src/components/builder/BlockPalette.vue` — add block modal |
| **CREATE** | `frontend/src/components/builder/StyleControls.vue` — style editor |
| **CREATE** | `frontend/src/components/builder/RowEditor.vue` — column layouts |
| **CREATE** | `frontend/src/components/builder/FormBlock.vue` — form builder |
| **CREATE** | `frontend/src/components/builder/GlobalStyles.vue` — sitewide styles |
| **CREATE** | `frontend/src/components/builder/SectionTemplates.vue` — template picker |
| **CREATE** | `frontend/src/components/builder/blocks/` — individual block components |
| **CREATE** | `backend-laravel/app/Http/Controllers/Tenant/FormSubmissionController.php` |
| **CREATE** | `backend-laravel/app/Models/FormSubmission.php` |
| **MODIFY** | `frontend/src/components/StorefrontLayoutBuilder.vue` — integrate block editor |
| **MODIFY** | `frontend/src/composables/usePluginLoader.js` — expose block registry |

---

## Checklist Summary

### Core Engine
- [ ] Block schema definition (content + style + responsive + animation)
- [ ] Block registry (plugins register custom blocks via hooks)
- [ ] 10 core block types (heading, text, image, button, spacer, divider, video, icon, HTML, columns)

### Visual Editor
- [ ] Block editor canvas with live preview
- [ ] Click-to-select blocks with settings panel
- [ ] Inline text editing (contenteditable)
- [ ] Block drag-and-drop reordering
- [ ] Add block palette (categorized grid)
- [ ] Row/column layout system (6 presets + custom)

### Style Controls
- [ ] Spacing (margin/padding visual box model)
- [ ] Typography (font size, weight, color, alignment)
- [ ] Background (solid, gradient, image)
- [ ] Border & shadow
- [ ] Animation presets
- [ ] Responsive visibility toggles

### Templates
- [ ] 20+ pre-designed section templates
- [ ] 7+ full page templates
- [ ] Save custom sections as templates
- [ ] Template categories

### Forms
- [ ] Visual form builder (drag-drop fields)
- [ ] Form field types (text, email, phone, select, checkbox)
- [ ] Form submission handler (email + DB)
- [ ] Submission list + CSV export

### Global Styles
- [ ] Color palette editor → CSS variables
- [ ] Font selector (Google Fonts)
- [ ] Layout settings (max-width, spacing)
- [ ] Dark mode control

### Integration
- [ ] Backward compatible with existing sections
- [ ] Plugins register custom block types via hooks
- [ ] Content blocks pull dynamic data (products, posts)
