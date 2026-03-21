# Phase 9B: Module Ecosystem & Plugin Architecture Spec 🧩

> **Priority**: 🔴 Critical — Nền tảng cho ecosystem bền vững  
> **Duration**: 2–3 weeks (spec + core modules)  
> **Depends on**: Phase 1 (Hooks), Phase 3 (Content Types), Phase 9 (SDK)

---

## Mục tiêu

1. Định nghĩa **chuẩn plugin architecture** — bất kỳ developer nào cũng build module tương thích  
2. Cover **MỌI lĩnh vực** WordPress cover — e-com, blog, LMS, booking, forum, job board, directory, membership...
3. Plugin = **self-contained package** — install/uninstall không ảnh hưởng core

---

## Part 1: Plugin Architecture Specification 📐

### 1.1 Plugin Directory Structure (BẮT BUỘC)

Bất kỳ plugin nào cũng PHẢI tuân theo cấu trúc này:

```
plugins/{module-id}/
  ├── manifest.json              ← BẮT BUỘC: Plugin metadata
  ├── src/
  │   ├── index.js               ← BẮT BUỘC: Frontend entry point
  │   ├── components/            ← Vue components
  │   │   ├── {Feature}Manager.vue
  │   │   ├── {Feature}Form.vue
  │   │   └── {Feature}List.vue
  │   ├── storefront/            ← Public-facing components
  │   │   └── Sf{Feature}.vue
  │   └── helpers.js             ← Utility functions
  ├── backend/                   ← OPTIONAL: Backend code (PHP)
  │   ├── Controllers/
  │   ├── Models/
  │   ├── Services/
  │   ├── migrations/            ← Database migrations
  │   ├── seeders/               ← Sample data
  │   └── routes.php             ← API routes
  ├── locales/                   ← OPTIONAL: Translations
  │   ├── vi.json
  │   ├── en.json
  │   └── ja.json
  ├── assets/                    ← OPTIONAL: Images, icons
  ├── tests/                     ← OPTIONAL: Test files
  ├── vite.config.js             ← Build config
  ├── package.json
  └── README.md
```

### 1.2 `manifest.json` — Plugin Metadata (BẮT BUỘC)

```json
{
  "$schema": "https://kac-cms.com/schemas/plugin-manifest-v1.json",
  "id": "lms",
  "name": "Learning Management System",
  "version": "1.0.0",
  "description": "Full-featured LMS: courses, lessons, quizzes, certificates",
  "author": {
    "name": "Developer Name",
    "email": "dev@example.com",
    "url": "https://developer-site.com"
  },
  "license": "MIT",
  "icon": "GraduationCap",
  
  "category": "education",
  "tags": ["lms", "courses", "education", "e-learning"],
  "industry": ["lms", "education"],
  
  "compatibility": {
    "platform": ">=1.0.0",
    "php": ">=8.2",
    "node": ">=18"
  },
  
  "requires": [],
  "optional": ["ecom"],
  "conflicts": [],
  
  "permissions": [
    "content.read",
    "content.write",
    "media.read",
    "media.write",
    "users.read"
  ],
  
  "content_types": [
    {
      "type": "course",
      "label": "Khóa học",
      "label_plural": "Khóa học",
      "icon": "BookOpen",
      "supports": ["title", "body", "excerpt", "featured_image", "slug"],
      "taxonomies": ["category", "level", "tag"],
      "meta_fields": [
        { "key": "price", "type": "currency", "label": "Giá", "required": true },
        { "key": "duration_hours", "type": "number", "label": "Thời lượng (giờ)" },
        { "key": "max_students", "type": "number", "label": "Số học viên tối đa" },
        { "key": "instructor_id", "type": "relation", "label": "Giảng viên", "relation_type": "user" },
        { "key": "difficulty", "type": "select", "label": "Độ khó", "options": ["beginner", "intermediate", "advanced"] },
        { "key": "certificate_enabled", "type": "boolean", "label": "Cấp chứng chỉ" }
      ]
    },
    {
      "type": "lesson",
      "label": "Bài học",
      "label_plural": "Bài học",
      "icon": "FileText",
      "parent_type": "course",
      "supports": ["title", "body", "slug"],
      "meta_fields": [
        { "key": "video_url", "type": "text", "label": "Video URL" },
        { "key": "duration_minutes", "type": "number", "label": "Thời lượng (phút)" },
        { "key": "is_preview", "type": "boolean", "label": "Cho xem miễn phí" },
        { "key": "attachments", "type": "media_multiple", "label": "Tài liệu đính kèm" }
      ]
    },
    {
      "type": "quiz",
      "label": "Bài kiểm tra",
      "label_plural": "Bài kiểm tra",
      "icon": "ClipboardCheck",
      "parent_type": "course",
      "meta_fields": [
        { "key": "time_limit", "type": "number", "label": "Thời gian (phút)" },
        { "key": "pass_score", "type": "number", "label": "Điểm đạt (%)" },
        { "key": "questions", "type": "json", "label": "Câu hỏi" }
      ]
    }
  ],
  
  "sidebar": [
    {
      "key": "lms-group",
      "label": "Khóa học",
      "icon": "GraduationCap",
      "children": [
        { "key": "lms/courses", "view": "lms/courses", "label": "Khóa học", "icon": "BookOpen" },
        { "key": "lms/lessons", "view": "lms/lessons", "label": "Bài học", "icon": "FileText" },
        { "key": "lms/students", "view": "lms/students", "label": "Học viên", "icon": "Users" },
        { "key": "lms/certificates", "view": "lms/certificates", "label": "Chứng chỉ", "icon": "Award" },
        { "key": "lms/settings", "view": "lms/settings", "label": "Cài đặt", "icon": "Settings" }
      ]
    }
  ],
  
  "routes": {
    "admin": [
      { "path": "lms/courses", "tab": "lms-courses" },
      { "path": "lms/courses/edit", "tab": "lms-courses" },
      { "path": "lms/lessons", "tab": "lms-lessons" },
      { "path": "lms/students", "tab": "lms-students" },
      { "path": "lms/certificates", "tab": "lms-certificates" },
      { "path": "lms/settings", "tab": "lms-settings" }
    ],
    "storefront": [
      { "path": "/courses", "component": "SfCourseList" },
      { "path": "/courses/:slug", "component": "SfCourseDetail" },
      { "path": "/courses/:slug/learn", "component": "SfLessonViewer" }
    ],
    "api": [
      { "method": "GET", "path": "/api/v1/courses", "auth": "api_key" },
      { "method": "GET", "path": "/api/v1/courses/:slug", "auth": "api_key" },
      { "method": "POST", "path": "/api/v1/courses/:id/enroll", "auth": "bearer" }
    ]
  },
  
  "storefront_sections": [
    { "type": "course_grid", "label": "Course Grid", "icon": "Grid3x3" },
    { "type": "course_carousel", "label": "Course Carousel", "icon": "Presentation" },
    { "type": "instructor_spotlight", "label": "Instructor Spotlight", "icon": "UserCircle" },
    { "type": "enrollment_cta", "label": "Enrollment CTA", "icon": "Zap" }
  ],
  
  "blocks": [
    { "type": "course_card", "label": "Course Card", "category": "lms", "icon": "BookOpen" },
    { "type": "lesson_list", "label": "Lesson List", "category": "lms", "icon": "List" },
    { "type": "progress_bar", "label": "Progress Bar", "category": "lms", "icon": "BarChart" },
    { "type": "enrollment_button", "label": "Enroll Button", "category": "lms", "icon": "UserPlus" }
  ],
  
  "dashboard_widgets": [
    { "type": "lms_stats", "label": "LMS Overview", "size": "half" },
    { "type": "recent_enrollments", "label": "Recent Enrollments", "size": "half" }
  ],
  
  "settings": [
    { "key": "enrollment_enabled", "type": "boolean", "label": "Cho phép đăng ký", "default": true },
    { "key": "certificate_template", "type": "select", "label": "Mẫu chứng chỉ", "options": ["classic", "modern", "minimal"] },
    { "key": "payment_required", "type": "boolean", "label": "Yêu cầu thanh toán", "default": false }
  ],
  
  "migrations": [
    "backend/migrations/001_create_enrollments_table.php",
    "backend/migrations/002_create_certificates_table.php",
    "backend/migrations/003_create_quiz_attempts_table.php"
  ]
}
```

### 1.3 `src/index.js` — Frontend Entry (BẮT BUỘC)

```javascript
// plugins/lms/src/index.js
// Platform sẽ inject __APP_BRIDGE__ trước khi load plugin

import CourseManager from './components/CourseManager.vue'
import CourseForm from './components/CourseForm.vue'
import LessonManager from './components/LessonManager.vue'
import StudentManager from './components/StudentManager.vue'
import CertificateManager from './components/CertificateManager.vue'
import LmsSettings from './components/LmsSettings.vue'

// Storefront sections
import SfCourseGrid from './storefront/SfCourseGrid.vue'
import SfCourseDetail from './storefront/SfCourseDetail.vue'

const bridge = window.__APP_BRIDGE__
const { hooks, t } = bridge

// ══════════════════════════════════════
// 1. Register sidebar items via hooks
// ══════════════════════════════════════
hooks.addFilter('sidebar_items', (items) => {
  items.push({
    key: 'lms-group',
    label: t('lms.courses', 'Khóa học'),
    icon: 'GraduationCap',
    moduleId: 'lms',
    children: [
      { key: 'lms/courses', view: 'lms/courses', label: t('lms.courses', 'Khóa học'), icon: 'BookOpen' },
      { key: 'lms/students', view: 'lms/students', label: t('lms.students', 'Học viên'), icon: 'Users' },
      { key: 'lms/certificates', view: 'lms/certificates', label: t('lms.certificates', 'Chứng chỉ'), icon: 'Award' },
    ]
  })
  return items
})

// ══════════════════════════════════════
// 2. Register routes via hooks
// ══════════════════════════════════════
hooks.addFilter('admin_routes', (config) => {
  Object.assign(config.routeToTab, {
    'lms/courses': 'lms-courses',
    'lms/courses/edit': 'lms-courses',
    'lms/lessons': 'lms-lessons',
    'lms/students': 'lms-students',
    'lms/certificates': 'lms-certificates',
    'lms/settings': 'lms-settings',
  })
  return config
})

// ══════════════════════════════════════
// 3. Register dashboard widgets
// ══════════════════════════════════════
hooks.addFilter('dashboard_widgets', (widgets) => {
  widgets.push({
    type: 'lms_stats',
    label: 'LMS Overview',
    component: () => import('./components/LmsStatsWidget.vue'),
    size: 'half',
  })
  return widgets
})

// ══════════════════════════════════════
// 4. Register storefront sections
// ══════════════════════════════════════
hooks.addFilter('storefront_sections', (sections) => {
  sections.push(
    { type: 'course_grid', label: 'Course Grid', component: SfCourseGrid, icon: 'Grid3x3' },
  )
  return sections
})

// ══════════════════════════════════════
// 5. Register components
// ══════════════════════════════════════
window.__PLUGIN_REGISTRY__['lms'] = {
  components: {
    'lms-courses': CourseManager,
    'lms-courses-form': CourseForm,
    'lms-lessons': LessonManager,
    'lms-students': StudentManager,
    'lms-certificates': CertificateManager,
    'lms-settings': LmsSettings,
  }
}
```

### 1.4 Plugin Lifecycle

```
┌────────────────────────────────────────────────────────┐
│                  PLUGIN LIFECYCLE                       │
│                                                        │
│  1. DISCOVER                                           │
│     → Platform reads manifest.json                     │
│     → Validates schema & compatibility                 │
│     → Shows in Module Store / Manager                  │
│                                                        │
│  2. INSTALL                                            │
│     → Run migrations (create tables)                   │
│     → Register content types                           │
│     → Copy assets (if any)                             │
│     → Record in tenant_module_subscriptions            │
│     → Fire ModuleInstalled event                       │
│                                                        │
│  3. ACTIVATE                                           │
│     → Load src/index.js bundle                         │
│     → Plugin registers hooks (sidebar, routes, etc.)   │
│     → Backend loads routes.php                         │
│     → Sidebar items appear                             │
│                                                        │
│  4. RUNTIME                                            │
│     → Hooks fire on user actions                       │
│     → Plugin components render                         │
│     → API routes accessible                            │
│     → Storefront sections available                    │
│                                                        │
│  5. DEACTIVATE                                         │
│     → Remove hooks                                     │
│     → Unload routes                                    │
│     → Hide sidebar items                               │
│     → Data preserved in DB                             │
│                                                        │
│  6. UNINSTALL                                          │
│     → Deactivate first                                 │
│     → Optionally: rollback migrations (delete data)    │
│     → Or: keep data (can reinstall later)              │
│     → Fire ModuleUninstalled event                     │
└────────────────────────────────────────────────────────┘
```

### 1.5 Plugin API Bridge — Full Interface

```typescript
// sdk/types/bridge.d.ts — Mọi plugin đều access qua window.__APP_BRIDGE__

interface AppBridge {
  // ── Core utilities ──
  apiFetch: (url: string, options?: RequestInit) => Promise<Response>
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
  showConfirm: (message: string) => Promise<boolean>
  showModal: (component: Component, props?: object) => void
  
  // ── i18n ──
  t: (key: string, fallback?: string) => string
  currentLang: Ref<string>
  formatCurrency: (amount: number) => string
  formatDate: (date: string | Date) => string
  formatNumber: (num: number) => string
  
  // ── Hooks ──
  hooks: {
    addAction: (name: string, callback: Function, priority?: number) => void
    addFilter: (name: string, callback: Function, priority?: number) => void
    doAction: (name: string, ...args: any[]) => Promise<void>
    applyFilters: (name: string, value: any, ...args: any[]) => any
    removeAction: (name: string, callback: Function) => void
    removeFilter: (name: string, callback: Function) => void
  }
  
  // ── Content Types ──
  content: {
    register: (type: string, config: ContentTypeConfig) => void
    list: (type: string, filters?: object) => Promise<PaginatedResponse>
    get: (type: string, idOrSlug: string) => Promise<ContentItem>
    create: (type: string, data: object) => Promise<ContentItem>
    update: (type: string, id: number, data: object) => Promise<ContentItem>
    delete: (type: string, id: number) => Promise<void>
  }
  
  // ── Media ──
  media: {
    openPicker: (options?: { multiple?: boolean }) => Promise<MediaItem[]>
    upload: (file: File) => Promise<MediaItem>
  }
  
  // ── Auth ──
  auth: {
    currentUser: () => User
    can: (permission: string) => boolean
    tenantId: () => string
  }
  
  // ── Router ──
  router: {
    navigate: (view: string) => void
    currentView: () => string
  }
  
  // ── Store (shared state) ──
  store: {
    get: (key: string) => any
    set: (key: string, value: any) => void
    subscribe: (key: string, callback: Function) => void
  }
}
```

---

## Part 2: Complete Module Catalog 📚

### Tất cả lĩnh vực WordPress cover → platform phải cover

```
┌────────────────────────────────────────────────────────────────┐
│                    MODULE CATALOG                              │
│                                                                │
│  🟢 = Tự build (core team)                                    │
│  🟡 = Community / 3rd-party developers                        │
│  🔵 = Premium (paid module)                                   │
│  ✅ = Đã có                                                   │
└────────────────────────────────────────────────────────────────┘
```

#### 🛒 E-commerce & Sales

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **E-commerce Core** | `ecom` | 🟢 Phase 2 | ✅ In core | Products, orders, cart, checkout |
| **Shipping** | `shipping` | 🟢 Phase 2 | ✅ In core | Shipments, carriers, tracking |
| **Warehouse** | `warehouse` | 🟢 | ✅ Plugin | Inventory, POs, stock receipts |
| **Accounting** | `accounting` | 🟢 | ✅ Plugin | Journal, invoices, P&L |
| **Tax** | `tax` | 🟢 | ✅ Plugin | Tax rates, tax reports |
| **Marketing** | `marketing` | 🟢 | ✅ Plugin | Promotions, flash sales, coupons |
| **Multi-currency** | `multicurrency` | 🟡 | ❌ | Auto currency conversion |
| **Subscriptions** | `subscriptions` | 🟡 | ❌ | Recurring orders, box subscriptions |
| **Digital Products** | `digital-products` | 🟡 | ❌ | Downloads, license keys |
| **Affiliate** | `affiliate` | 🟡 | ❌ | Referral links, commission |
| **POS** | `pos` | 🟡 | ❌ | Point of sale, barcode scanner |
| **Multi-vendor** | `marketplace` | 🔵 | ❌ | Multiple vendors per tenant |
| **Dropshipping** | `dropshipping` | 🟡 | ❌ | Supplier sync, auto-fulfillment |
| **Reviews & Ratings** | `reviews` | 🟢 | ❌ | Product reviews, star ratings |

#### ✍️ Content & Publishing

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **Blog** | `blog` | 🟢 Phase 4 | ❌ | Posts, comments, RSS |
| **CMS Pages** | core | — | ✅ Core | Pages, rich text, SEO |
| **News/Magazine** | `news` | 🟡 | ❌ | Multi-author, breaking news, editions |
| **Wiki/Knowledge Base** | `wiki` | 🟡 | ❌ | Articles, categories, search |
| **Podcast** | `podcast` | 🟡 | ❌ | Episodes, feeds, audio player |
| **Newsletter** | `newsletter` | 🟢 | ❌ | Email templates, subscribers, campaigns |
| **Social Feed** | `social` | 🟡 | ❌ | Activity stream, social sharing |

#### 🎓 Education & Learning

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **LMS** | `lms` | 🟢 Phase 10 | ❌ | Courses, lessons, quizzes |
| **Certificates** | `certificates` | 🟡 | ❌ | Auto-generate certificates |
| **Assignments** | `assignments` | 🟡 | ❌ | Student submissions, grading |
| **Webinar** | `webinar` | 🟡 | ❌ | Live classes, recordings |
| **Student Dashboard** | `student-portal` | 🟡 | ❌ | Progress, grades, schedule |

#### 📅 Booking & Services

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **Booking** | `booking` | 🟢 Phase 10 | ❌ | Services, appointments, calendar |
| **Events** | `events` | 🟡 | ❌ | Event management, ticketing, RSVP |
| **Table Reservation** | `reservation` | 🟡 | ❌ | Restaurant table booking |
| **Rental** | `rental` | 🟡 | ❌ | Equipment/property rental, availability |
| **Scheduling** | `scheduling` | 🟡 | ❌ | Staff scheduling, shifts |

#### 🏠 Directory & Listings

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **Real Estate** | `realestate` | 🟡 | ❌ | Property listings, search, map |
| **Business Directory** | `directory` | 🟡 | ❌ | Business listings, categories, reviews |
| **Job Board** | `jobboard` | 🟡 | ❌ | Job posts, applications, resumes |
| **Classified Ads** | `classifieds` | 🟡 | ❌ | User-posted ads, categories, pricing |
| **Service Marketplace** | `services-market` | 🔵 | ❌ | Service providers, quotes, reviews |

#### 👥 Community & Social

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **Forum** | `forum` | 🟢 Phase 10 | ❌ | Threads, replies, moderation |
| **Membership** | `membership` | 🟡 | ❌ | Member areas, content gating, tiers |
| **Social Network** | `social-network` | 🔵 | ❌ | Profiles, friends, messages |
| **Q&A** | `qa` | 🟡 | ❌ | Questions, answers, voting (like StackOverflow) |
| **Groups** | `groups` | 🟡 | ❌ | User groups, group content, discussions |

#### 🍽️ Industry-Specific

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **Restaurant** | `restaurant` | 🟡 | ❌ | Menu, online order, table booking |
| **Fitness/Gym** | `fitness` | 🟡 | ❌ | Classes, memberships, trainer profiles |
| **Medical/Clinic** | `clinic` | 🟡 | ❌ | Appointments, doctors, patients |
| **Salon/Spa** | `salon` | 🟡 | ❌ | Services, bookings, stylists |
| **Hotel** | `hotel` | 🔵 | ❌ | Room booking, rates, amenities |
| **Travel Agency** | `travel` | 🔵 | ❌ | Tour packages, bookings, itineraries |
| **Car Dealer** | `automotive` | 🟡 | ❌ | Vehicle listings, comparison, inquiry |
| **Law Firm** | `legal` | 🟡 | ❌ | Practice areas, attorneys, case studies |
| **Construction** | `construction` | 🟡 | ❌ | Projects, services, gallery |
| **Wedding** | `wedding` | 🟡 | ❌ | Vendors, planning, galleries |

#### 🔧 Utilities & Tools

| Module | ID | Priority | Status | Description |
|--------|----|----------|--------|-------------|
| **SEO** | `seo` | 🟢 | ❌ | Sitemap, meta tags, schema, analytics |
| **Analytics** | `analytics` | 🟢 | ❌ | Visitor stats, conversion tracking |
| **Live Chat** | `livechat` | 🟡 | ❌ | Customer chat, chatbot |
| **Email Marketing** | `email` | 🟡 | ❌ | Campaigns, templates, automation |
| **CRM** | `crm-module` | 🟡 | ❌ | Contact management, pipeline |
| **Forms** | `forms` | 🟢 Phase 6B | ❌ | Form builder, submissions |
| **Popup Builder** | `popups` | 🟡 | ❌ | Modals, banners, exit intent |
| **Social Proof** | `social-proof` | 🟡 | ❌ | "X vừa mua sản phẩm Y" notifications |
| **Multi-language Content** | `multilang-content` | 🟢 | ❌ | Content translation (different from UI i18n) |
| **Import/Export** | `import-export` | 🟢 | ❌ | CSV, Excel import/export for all content |
| **Backup/Restore** | `backup` | 🟢 | ❌ | Manual backup, restore point |
| **Custom Code** | `custom-code` | 🟡 | ❌ | Inject HTML/CSS/JS, header/footer scripts |
| **AI Assistant** | `ai` | 🟢 Phase 10 | ❌ | Content generation, SEO suggestions |

#### 📊 Total Count

| Category | Count | 🟢 Core | 🟡 Community | 🔵 Premium |
|----------|-------|---------|-------------|-----------|
| E-commerce | 14 | 7 | 5 | 2 |
| Content | 7 | 3 | 4 | 0 |
| Education | 5 | 1 | 4 | 0 |
| Booking | 5 | 1 | 4 | 0 |
| Directory | 5 | 0 | 4 | 1 |
| Community | 5 | 1 | 3 | 1 |
| Industry | 10 | 0 | 8 | 2 |
| Utilities | 14 | 5 | 8 | 1 |
| **TOTAL** | **65** | **18** | **40** | **7** |

---

## Part 3: Module Development Flow 🔄

### Cho 3rd-party Developer

```
1. SCAFFOLD
   $ npx create-kac-plugin my-booking-module
   → Generates full directory structure + manifest.json

2. DEVELOP
   $ cd plugins/my-booking-module
   $ npm run dev
   → Hot-reload development server
   → Connects to local platform instance
   → Changes reflect in real-time

3. DEFINE MANIFEST
   → Edit manifest.json:
     - content_types (what data to store)
     - sidebar (admin navigation)
     - routes (admin + storefront + API)
     - storefront_sections (builder blocks)
     - settings (configurable options)

4. BUILD COMPONENTS
   → Admin: Vue components for CRUD
   → Storefront: Public-facing components
   → All using window.__APP_BRIDGE__

5. BUILD BACKEND (optional)
   → PHP controllers, models, services
   → Database migrations
   → API routes

6. TEST
   $ npm run test
   → Unit tests for components
   → Integration tests with platform

7. BUILD
   $ npm run build
   → Creates production bundle
   → Validates manifest.json
   → Generates .kac-plugin package

8. SUBMIT
   → Upload to Template Store
   → OR share .kac-plugin file directly
   → Admin review (if marketplace)

9. PUBLISH
   → Available in module store
   → Tenants can install
```

### Cho Platform Owner (Core modules)

```
1. Create plugin in plugins/ directory
2. Follow same manifest.json structure
3. Build: cd plugins && node build-all.js
4. Auto-included in platform distribution
5. Marked as "Official" in store
```

---

## Part 4: Plugin Validation & Security 🔒

### Auto-validation khi submit plugin:

```javascript
// sdk/scripts/validate-plugin.js
const checks = {
  // Structure checks
  'manifest.json exists': () => fs.existsSync('manifest.json'),
  'manifest.json valid JSON': () => JSON.parse(fs.readFileSync('manifest.json')),
  'manifest has required fields': (m) => m.id && m.name && m.version,
  'src/index.js exists': () => fs.existsSync('src/index.js'),
  
  // Security checks
  'no eval() usage': () => !grep('eval(', 'src/'),
  'no document.cookie access': () => !grep('document.cookie', 'src/'),
  'no external script loading': () => !grep('createElement("script")', 'src/'),
  'no fetch to external domains': () => !grepExternalFetch('src/'),
  'uses bridge.apiFetch only': () => !grep('fetch(', 'src/') || grep('apiFetch(', 'src/'),
  
  // Compatibility checks
  'platform version compatible': (m) => semver.satisfies(PLATFORM_VERSION, m.compatibility.platform),
  'no conflicting modules': (m) => !hasConflicts(m.conflicts),
  
  // Build checks
  'builds successfully': () => exec('npm run build').exitCode === 0,
  'bundle size < 2MB': () => getBundleSize() < 2 * 1024 * 1024,
}
```

### Permission System

Plugins declare permissions in `manifest.json`. Platform enforces:

```
content.read    → Can read content via bridge.content.list/get
content.write   → Can create/update/delete content
media.read      → Can access media library
media.write     → Can upload media
users.read      → Can read user profiles
users.write     → Can create/modify users (admin modules only)
settings.read   → Can read tenant settings
settings.write  → Can modify tenant settings
billing.read    → Can read billing info (marketplace modules)
```

Tenant sees permissions before installing:

```
┌─── Install "LMS Module"? ────────────────┐
│                                           │
│  This module requests:                    │
│  ✅ Read content                          │
│  ✅ Write content (create courses)        │
│  ✅ Read media library                    │
│  ✅ Upload media (lesson attachments)     │
│  ✅ Read user profiles (students)         │
│                                           │
│  [Cancel]                    [Install]    │
└───────────────────────────────────────────┘
```

---

## Checklist

### Plugin Architecture
- [ ] Define `manifest.json` v1 schema (JSON Schema)
- [ ] Plugin loader reads manifest.json on activation
- [ ] Auto-register content types from manifest
- [ ] Auto-register sidebar items from manifest
- [ ] Auto-register routes from manifest
- [ ] Auto-register storefront sections from manifest
- [ ] Auto-register blocks from manifest
- [ ] Auto-register dashboard widgets from manifest
- [ ] Auto-run migrations on install
- [ ] Auto-rollback migrations on uninstall (optional flag)
- [ ] Plugin permission system
- [ ] Plugin validation script

### Module Catalog Seeding
- [ ] Seed master DB với 65+ module definitions
- [ ] Module categories in admin
- [ ] Module search & filter
- [ ] Module detail page (screenshots, description, reviews)
- [ ] "Community" vs "Official" vs "Premium" badges
- [ ] Module dependency resolution (auto-install required modules)

### Developer Experience
- [ ] `create-kac-plugin` CLI scaffolding
- [ ] Hot-reload development mode
- [ ] Plugin validation CLI: `npx kac-plugin validate`
- [ ] Plugin build CLI: `npx kac-plugin build`
- [ ] Plugin test runner
- [ ] Developer documentation (10+ guides)
- [ ] Example plugins (3 complete examples)

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `sdk/schemas/plugin-manifest-v1.json` — JSON Schema |
| **CREATE** | `sdk/scripts/validate-plugin.js` — Validation script |
| **CREATE** | `sdk/examples/minimal-plugin/` — Minimal example |
| **CREATE** | `sdk/examples/lms-plugin/` — Full LMS example |
| **CREATE** | `sdk/examples/booking-plugin/` — Booking example |
| **CREATE** | `sdk/docs/plugin-architecture.md` — Architecture guide |
| **CREATE** | `sdk/docs/manifest-reference.md` — Manifest reference |
| **CREATE** | `sdk/docs/bridge-api.md` — Bridge API reference |
| **MODIFY** | `frontend/src/composables/usePluginLoader.js` — manifest-based loading |
| **MODIFY** | `backend-laravel/app/Services/ModuleRegistry.php` — manifest parsing |
| **MODIFY** | `backend-laravel/database/seeders/ModuleSeeder.php` — 65+ modules |
