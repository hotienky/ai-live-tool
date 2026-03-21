# Phase 5: Public REST API v1 🌐

> **Priority**: 🟡 High — Enables headless CMS mode  
> **Duration**: 2–3 weeks  
> **Depends on**: Phase 3 (Content Types)

---

## Mục tiêu

Tạo public REST API versioned, cho phép khách hàng dùng headless mode — chỉ dùng admin panel để quản lý nội dung, frontend tự build bằng Next.js/Nuxt/Flutter.

---

## API Design

### Endpoint Structure

```
/api/v1/                                    ← Public API prefix
  ├── site                                  ← Site config, theme settings
  ├── content/{type}                        ← Generic content CRUD
  │   ├── GET    /                          ← List (paginated, filterable)
  │   ├── GET    /{slug}                    ← Single by slug
  │   ├── POST   /                          ← Create (auth required)
  │   ├── PUT    /{id}                      ← Update (auth required)
  │   └── DELETE /{id}                      ← Delete (auth required)
  ├── taxonomies/{type}                     ← Categories, tags
  ├── media                                 ← Media files
  │   ├── GET    /{id}                      ← File info + URL
  │   └── POST   /                          ← Upload (auth required)
  ├── menus/{location}                      ← Navigation menus
  └── search?q=                             ← Full-text search

/api/v1/ecom/                               ← E-commerce API (if ecom installed)
  ├── products                       
  ├── products/{slug}                
  ├── categories                     
  ├── cart                           
  └── checkout                       
```

### Authentication

```
# Public reads: API key in header
X-API-Key: pk_live_xxxxxxxxxxxx

# Authenticated writes: Bearer token
Authorization: Bearer sk_live_xxxxxxxxxxxx

# API key types:
#   pk_* = Public key (read-only)
#   sk_* = Secret key (read + write)
```

### Response Format

```json
{
  "data": { ... },           // single item or array
  "meta": {                  // pagination (for lists)
    "current_page": 1,
    "per_page": 20,
    "total": 150,
    "last_page": 8
  },
  "links": {
    "next": "/api/v1/content/post?page=2",
    "prev": null
  }
}
```

---

## Backend Tasks

### 5.1 API Controllers

**Tạo mới:**
```
backend-laravel/app/Http/Controllers/Api/V1/
  ├── SiteController.php
  ├── ContentApiController.php
  ├── TaxonomyController.php
  ├── MediaApiController.php
  ├── MenuController.php
  └── SearchController.php
```

### 5.2 API Key Authentication

**File modify**: `backend-laravel/app/Models/ApiKey.php`

Hiện tại ApiKey model đã tồn tại. Cần thêm:
- `type` field: `public` (read-only) vs `secret` (read+write)
- `rate_limit` field: requests per hour
- `last_used_at` tracking
- `usage_count` tracking

**Tạo mới**: `backend-laravel/app/Http/Middleware/ApiKeyAuth.php`

```php
class ApiKeyAuth
{
    public function handle($request, Closure $next)
    {
        $key = $request->header('X-API-Key');
        if (!$key) return response()->json(['error' => 'API key required'], 401);
        
        $apiKey = ApiKey::where('key', $key)->where('is_active', true)->first();
        if (!$apiKey) return response()->json(['error' => 'Invalid API key'], 401);
        
        // Rate limiting check
        if ($this->isRateLimited($apiKey)) {
            return response()->json(['error' => 'Rate limit exceeded'], 429);
        }
        
        // Set tenant context from API key
        tenancy()->initialize($apiKey->tenant);
        $request->merge(['_api_key' => $apiKey]);
        
        $apiKey->increment('usage_count');
        $apiKey->update(['last_used_at' => now()]);
        
        return $next($request);
    }
}
```

### 5.3 Rate Limiting

Tier-based rate limiting:
```php
// Based on tenant's subscription plan
Free:       100 requests/hour
Starter:    1,000 requests/hour
Pro:        10,000 requests/hour
Business:   100,000 requests/hour
Enterprise: unlimited
```

### 5.4 Routes

```php
// routes/api-v1.php
Route::prefix('v1')->middleware('api.key')->group(function () {
    // Public (read-only with pk_ key)
    Route::get('site', [SiteController::class, 'index']);
    Route::get('content/{type}', [ContentApiController::class, 'index']);
    Route::get('content/{type}/{slug}', [ContentApiController::class, 'show']);
    Route::get('taxonomies/{type}', [TaxonomyController::class, 'index']);
    Route::get('media/{id}', [MediaApiController::class, 'show']);
    Route::get('menus/{location}', [MenuController::class, 'show']);
    Route::get('search', [SearchController::class, 'search']);
    
    // Authenticated (sk_ key required)
    Route::middleware('api.secret')->group(function () {
        Route::post('content/{type}', [ContentApiController::class, 'store']);
        Route::put('content/{type}/{id}', [ContentApiController::class, 'update']);
        Route::delete('content/{type}/{id}', [ContentApiController::class, 'destroy']);
        Route::post('media', [MediaApiController::class, 'upload']);
    });
});
```

### 5.5 Webhooks Enhancement

**File modify**: `backend-laravel/app/Models/Webhook.php`

Thêm:
- Event types: `content.created`, `content.updated`, `content.deleted`, `media.uploaded`
- Delivery retry (3 attempts, exponential backoff)
- Delivery logs (last 100 deliveries)
- HMAC signing with webhook secret

**Tạo mới**: `backend-laravel/app/Services/WebhookDelivery.php`

### 5.6 CORS Configuration

Per-tenant CORS: tenant cấu hình domain nào được phép call API.

---

## Frontend Tasks

### 5.7 API Key Management UI Enhancement

**File modify**: `frontend/src/components/ApiKeyManager.vue`

- Show public vs secret key type
- Usage stats (requests today, this month)
- Rate limit status
- Copy button
- Regenerate key

### 5.8 API Documentation Page

**Tạo mới**: `frontend/src/components/ApiDocsPage.vue`

Built-in API playground:
- Endpoint explorer (like Swagger UI)
- Try-it-out with tenant's own API key
- Code snippets (JavaScript, Python, cURL)

---

## Checklist

- [ ] Create API v1 controller directory structure
- [ ] Create `SiteController` — site config endpoint
- [ ] Create `ContentApiController` — generic content CRUD
- [ ] Create `TaxonomyController`
- [ ] Create `MediaApiController`
- [ ] Create `MenuController`
- [ ] Create `SearchController`
- [ ] API key auth middleware (public vs secret keys)
- [ ] Rate limiting per plan tier
- [ ] Response format standardization
- [ ] Pagination (cursor-based option)
- [ ] Filtering: `?filter[status]=published`
- [ ] Field selection: `?fields=title,slug,excerpt`
- [ ] Include relations: `?include=author,categories`
- [ ] Caching: ETags, Cache-Control headers
- [ ] CORS per tenant
- [ ] Webhook delivery service with retries
- [ ] API docs page in admin
- [ ] OpenAPI spec auto-generation

---

## Files Changed Summary

| Action | File |
|--------|------|
| **CREATE** | `backend-laravel/app/Http/Controllers/Api/V1/` (6 controllers) |
| **CREATE** | `backend-laravel/app/Http/Middleware/ApiKeyAuth.php` |
| **CREATE** | `backend-laravel/app/Services/WebhookDelivery.php` |
| **CREATE** | `backend-laravel/routes/api-v1.php` |
| **CREATE** | `frontend/src/components/ApiDocsPage.vue` |
| **MODIFY** | `backend-laravel/app/Models/ApiKey.php` — add type, rate_limit |
| **MODIFY** | `backend-laravel/app/Models/Webhook.php` — enhance delivery |
| **MODIFY** | `frontend/src/components/ApiKeyManager.vue` — usage stats |
| **MODIFY** | `backend-laravel/routes/tenant.php` — include api-v1 routes |
