# Phase 3: Content Type System 📐

> **Priority**: 🟡 High — Enables Blog, LMS, Booking, etc.  
> **Duration**: 2 weeks  
> **Depends on**: Phase 1 (Hooks)  
> **Blocks**: Phase 4 (Blog), Phase 5 (Public API)

---

## Mục tiêu

Tạo hệ thống Content Types động, cho phép plugins đăng ký loại nội dung mới (posts, courses, listings...) mà không cần tạo tables/controllers riêng. Giống WordPress Custom Post Types.

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              ContentTypeRegistry            │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │  page    │ │  post    │ │  course  │    │
│  │ (core)   │ │ (blog)   │ │ (lms)    │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                     │                       │
│              ┌──────┴──────┐                │
│              │  contents   │  ← generic DB  │
│              │  table      │     table       │
│              └──────┬──────┘                │
│                     │                       │
│  ┌─────────────┐ ┌─────────────┐           │
│  │ taxonomies  │ │   meta      │           │
│  │ (categories)│ │ (JSONB)     │           │
│  └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────┘
```

---

## Backend Tasks

### 3.1 Database Schema

**File tạo mới**: `backend-laravel/database/migrations/tenant/xxxx_create_contents_table.php`

```php
Schema::create('contents', function (Blueprint $table) {
    $table->id();
    $table->string('type', 50)->index();        // 'post', 'course', 'listing'
    $table->string('slug')->index();
    $table->string('title');
    $table->longText('body')->nullable();
    $table->string('excerpt', 500)->nullable();
    $table->string('featured_image')->nullable();
    $table->string('status', 20)->default('draft'); // draft, published, archived
    $table->unsignedBigInteger('author_id')->nullable();
    $table->jsonb('meta')->nullable();           // flexible field storage
    $table->timestamp('published_at')->nullable();
    $table->timestamps();
    $table->softDeletes();
    
    $table->unique(['type', 'slug']);
});

Schema::create('content_taxonomies', function (Blueprint $table) {
    $table->id();
    $table->foreignId('content_id')->constrained()->cascadeOnDelete();
    $table->string('taxonomy', 50);  // 'category', 'tag'
    $table->string('term');
    $table->timestamps();
    
    $table->index(['taxonomy', 'term']);
});

Schema::create('content_revisions', function (Blueprint $table) {
    $table->id();
    $table->foreignId('content_id')->constrained()->cascadeOnDelete();
    $table->string('title');
    $table->longText('body')->nullable();
    $table->jsonb('meta')->nullable();
    $table->unsignedBigInteger('revised_by')->nullable();
    $table->timestamps();
});
```

### 3.2 Content Model

**File tạo mới**: `backend-laravel/app/Models/Content.php`

```php
class Content extends Model
{
    use SoftDeletes;
    
    protected $fillable = [
        'type', 'slug', 'title', 'body', 'excerpt', 
        'featured_image', 'status', 'author_id', 'meta', 'published_at',
    ];
    
    protected $casts = [
        'meta' => 'array',
        'published_at' => 'datetime',
    ];
    
    public function taxonomies() { return $this->hasMany(ContentTaxonomy::class); }
    public function revisions() { return $this->hasMany(ContentRevision::class); }
    
    public function scopeOfType($query, string $type) { return $query->where('type', $type); }
    public function scopePublished($query) { 
        return $query->where('status', 'published')
                     ->where('published_at', '<=', now()); 
    }
}
```

### 3.3 ContentTypeRegistry Service

**File tạo mới**: `backend-laravel/app/Services/ContentTypeRegistry.php`

```php
class ContentTypeRegistry
{
    protected static array $types = [];
    
    public static function register(string $type, array $config): void
    {
        static::$types[$type] = array_merge([
            'name' => $type,
            'label' => ucfirst($type),
            'label_plural' => ucfirst($type) . 's',
            'icon' => 'FileText',
            'fields' => [],
            'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
            'taxonomies' => [],       // ['category', 'tag']
            'has_revisions' => true,
            'has_comments' => false,
            'meta_fields' => [],      // custom fields stored in meta JSONB
        ], $config);
    }
    
    public static function get(string $type): ?array { return static::$types[$type] ?? null; }
    public static function all(): array { return static::$types; }
    public static function exists(string $type): bool { return isset(static::$types[$type]); }
    
    public static function getValidationRules(string $type): array
    {
        $config = static::get($type);
        if (!$config) return [];
        
        $rules = ['title' => 'required|string|max:255'];
        foreach ($config['meta_fields'] as $field) {
            if ($field['required'] ?? false) {
                $rules["meta.{$field['key']}"] = "required|{$field['validation']}";
            }
        }
        return $rules;
    }
}
```

### 3.4 Generic ContentController

**File tạo mới**: `backend-laravel/app/Http/Controllers/Tenant/ContentController.php`

```php
class ContentController extends Controller
{
    public function index(Request $request, string $type)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }
        
        $query = Content::ofType($type)->with('taxonomies');
        
        // Filters
        if ($request->status) $query->where('status', $request->status);
        if ($request->search) $query->where('title', 'ilike', "%{$request->search}%");
        if ($request->category) {
            $query->whereHas('taxonomies', fn($q) => 
                $q->where('taxonomy', 'category')->where('term', $request->category)
            );
        }
        
        // Sort
        $sort = $request->input('sort', 'created_at');
        $order = $request->input('order', 'desc');
        $query->orderBy($sort, $order);
        
        return $this->successResponse($query->paginate($request->input('per_page', 20)));
    }
    
    public function store(Request $request, string $type) { /* ... */ }
    public function show(string $type, $id) { /* ... */ }
    public function update(Request $request, string $type, $id) { /* ... */ }
    public function destroy(string $type, $id) { /* ... */ }
}
```

**Route registration**:
```php
// routes/tenant.php
Route::prefix('content/{type}')->group(function () {
    Route::get('/', [ContentController::class, 'index']);
    Route::post('/', [ContentController::class, 'store']);
    Route::get('/{id}', [ContentController::class, 'show']);
    Route::put('/{id}', [ContentController::class, 'update']);
    Route::delete('/{id}', [ContentController::class, 'destroy']);
});
```

### 3.5 Register Core Content Type: `page`

```php
// AppServiceProvider or dedicated ContentTypeServiceProvider
ContentTypeRegistry::register('page', [
    'label' => 'Trang',
    'label_plural' => 'Trang CMS',
    'icon' => 'FileText',
    'supports' => ['title', 'body', 'slug', 'featured_image'],
    'taxonomies' => [],
    'has_revisions' => true,
    'meta_fields' => [
        ['key' => 'seo_title', 'type' => 'text', 'label' => 'SEO Title'],
        ['key' => 'seo_description', 'type' => 'textarea', 'label' => 'SEO Description'],
    ],
]);
```

---

## Frontend Tasks

### 3.6 `ContentList.vue` — Generic List Component

**File tạo mới**: `frontend/src/components/ContentList.vue`

Dynamic list cho bất kỳ content type nào:
- Table view với columns auto-generated từ type config
- Search, filter by status, filter by taxonomy
- Bulk actions (delete, change status)
- Create / Edit buttons

### 3.7 `ContentEditor.vue` — Generic Editor

**File tạo mới**: `frontend/src/components/ContentEditor.vue`

Dynamic form:
- Title, slug (auto-generate), body (RichTextEditor)
- Meta fields rendered based on type config
- Taxonomy selector (categories, tags)
- Status selector + publish scheduling
- Revision history sidebar
- Preview

### 3.8 `ContentFieldRenderer.vue` — Field Type Components

**File tạo mới**: `frontend/src/components/ContentFieldRenderer.vue`

Renders field input based on `type`:
- `text` → `<input type="text">`
- `textarea` → `<textarea>`
- `richtext` → `<RichTextEditor>`
- `number` → `<input type="number">`
- `currency` → `<CurrencyInput>`
- `date` → `<input type="date">`
- `media` → `<MediaPicker>`
- `select` → `<select>` with options
- `relation` → Searchable dropdown linking to other content
- `json` → JSON editor

---

## Checklist

- [ ] Create `contents`, `content_taxonomies`, `content_revisions` migrations
- [ ] Create `Content`, `ContentTaxonomy`, `ContentRevision` models
- [ ] Create `ContentTypeRegistry` service
- [ ] Create `ContentController` with full CRUD
- [ ] Register core content type: `page`
- [ ] API endpoint: `GET /api/content/{type}`
- [ ] Create `ContentList.vue` generic list component
- [ ] Create `ContentEditor.vue` generic editor
- [ ] Create `ContentFieldRenderer.vue` dynamic field renderer
- [ ] Integrate with Custom Fields module
- [ ] Test: register content type → CRUD works
- [ ] Test: custom meta fields saved/loaded correctly
- [ ] Test: taxonomy filtering works
- [ ] Test: revision history works

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `backend-laravel/database/migrations/tenant/xxxx_create_contents_table.php` |
| **CREATE** | `backend-laravel/app/Models/Content.php` |
| **CREATE** | `backend-laravel/app/Models/ContentTaxonomy.php` |
| **CREATE** | `backend-laravel/app/Models/ContentRevision.php` |
| **CREATE** | `backend-laravel/app/Services/ContentTypeRegistry.php` |
| **CREATE** | `backend-laravel/app/Http/Controllers/Tenant/ContentController.php` |
| **CREATE** | `frontend/src/components/ContentList.vue` |
| **CREATE** | `frontend/src/components/ContentEditor.vue` |
| **CREATE** | `frontend/src/components/ContentFieldRenderer.vue` |
| **MODIFY** | `backend-laravel/routes/tenant.php` — add content routes |
| **MODIFY** | `backend-laravel/app/Providers/AppServiceProvider.php` — register page type |
