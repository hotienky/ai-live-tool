# Phase 4: Blog Module 📝

> **Priority**: 🟡 High — First non-ecom use case  
> **Duration**: 1–2 weeks  
> **Depends on**: Phase 3 (Content Types)

---

## Mục tiêu

Tạo Blog plugin sử dụng Content Type system từ Phase 3. Chứng minh platform là general-purpose, không chỉ e-commerce.

---

## Tasks

### 4.1 Plugin Structure

```
plugins/blog/
  ├── src/
  │   ├── components/
  │   │   ├── PostEditor.vue          — extends ContentEditor for posts
  │   │   ├── PostList.vue            — post management list
  │   │   ├── CommentManager.vue      — moderate comments
  │   │   └── BlogSettings.vue        — RSS, SEO config
  │   └── index.js
  ├── vite.config.js
  └── package.json
```

### 4.2 Content Type Registration (Backend)

Module config registers content type on install:

```php
// Khi install blog module, ContentTypeRegistry sẽ register:
ContentTypeRegistry::register('post', [
    'label' => 'Bài viết',
    'label_plural' => 'Blog',
    'icon' => 'FileText',
    'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
    'taxonomies' => ['category', 'tag'],
    'has_revisions' => true,
    'has_comments' => true,
    'meta_fields' => [
        ['key' => 'seo_title', 'type' => 'text', 'label' => 'SEO Title'],
        ['key' => 'seo_description', 'type' => 'textarea', 'label' => 'Meta Description'],
        ['key' => 'reading_time', 'type' => 'number', 'label' => 'Reading Time (min)', 'auto' => true],
        ['key' => 'is_featured', 'type' => 'boolean', 'label' => 'Featured Post'],
    ],
]);
```

### 4.3 Frontend Plugin Registration

```javascript
// plugins/blog/src/index.js
const { hooks, t } = window.__APP_BRIDGE__

hooks.addFilter('sidebar_items', (items) => {
  items.push({
    key: 'blog-group', label: 'Blog', icon: 'BookOpen',
    moduleId: 'blog',
    children: [
      { key: 'blog/posts', view: 'blog/posts', label: t('admin.posts', 'Bài viết'), icon: 'FileText' },
      { key: 'blog/categories', view: 'blog/categories', label: t('admin.categories', 'Danh mục'), icon: 'FolderOpen' },
      { key: 'blog/comments', view: 'blog/comments', label: t('admin.comments', 'Bình luận'), icon: 'MessageCircle' },
      { key: 'blog/settings', view: 'blog/settings', label: t('admin.settings', 'Cài đặt'), icon: 'Settings' },
    ]
  })
  return items
})
```

### 4.4 Blog-Specific Features

- [ ] Post scheduling (publish_at future date)
- [ ] Excerpt auto-generation (first 160 chars of body)
- [ ] Reading time calculation (words / 200)
- [ ] Related posts (same categories)
- [ ] Comment system (nested comments, moderation queue)
- [ ] RSS feed: `GET /api/storefront/blog/rss`
- [ ] Social sharing meta tags (Open Graph, Twitter Cards)
- [ ] SEO: auto sitemap entry for published posts

### 4.5 Storefront Blog Components

```
plugins/blog/src/storefront/
  ├── SfBlogSection.vue          — latest posts grid for storefront
  ├── SfPostPage.vue             — single post page
  └── SfPostSidebar.vue          — categories, tags, recent posts
```

Register as storefront section:

```javascript
hooks.addFilter('storefront_sections', (sections) => {
  sections.push({ type: 'blog', label: 'Blog', component: SfBlogSection })
  return sections
})
```

---

## Checklist

- [ ] Create `plugins/blog/` scaffold
- [ ] Register `post` content type
- [ ] Create `PostEditor.vue` (extends `ContentEditor` with blog-specific fields)
- [ ] Create `PostList.vue` with post-specific columns (status, category, date)
- [ ] Create `CommentManager.vue` for moderation
- [ ] Create `BlogSettings.vue` (RSS toggle, comments toggle, posts per page)
- [ ] Backend: RSS feed endpoint
- [ ] Backend: Comment CRUD controller
- [ ] Storefront: `SfBlogSection.vue`
- [ ] Storefront: `SfPostPage.vue` with reading time, author, social sharing
- [ ] Build plugin
- [ ] Test: install blog → sidebar appears, create post → visible on storefront

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `plugins/blog/` (entire plugin ~8 files) |
| **CREATE** | `backend-laravel/app/Http/Controllers/Tenant/CommentController.php` |
| **CREATE** | `backend-laravel/app/Models/Comment.php` |
| **CREATE** | `backend-laravel/database/migrations/modules/blog/` |
| **MODIFY** | `backend-laravel/routes/tenant.php` — blog routes |
| **MODIFY** | Module seeder — add "blog" module to master DB |
