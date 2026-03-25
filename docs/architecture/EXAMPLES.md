# 🧩 EXAMPLES – ÁP DỤNG ARCHITECTURE CONTRACT (MULTI-TENANT CMS + UI ENGINE)

---

# 1. 🎯 Ví dụ tổng thể (1 trang Home hoàn chỉnh)

## CMS lưu layout JSON

```json
{
  "layout": [
    {
      "id": "banner_1",
      "type": "banner",
      "props": {
        "variant": "carousel"
      },
      "data": {
        "endpoint": "/banners"
      }
    },
    {
      "id": "grid_1",
      "type": "grid",
      "props": {
        "columns": 2
      },
      "children": [
        {
          "type": "blog_list",
          "props": {
            "limit": 5
          },
          "data": {
            "endpoint": "/blogs"
          }
        },
        {
          "type": "form",
          "props": {
            "form_id": "contact"
          }
        }
      ]
    }
  ]
}
```

---

# 2. ⚙️ Laravel – Resolve + Cache

## Controller

```php
public function show($slug)
{
    $tenant = app('tenant');

    $cacheKey = "tenant:{$tenant->id}:page:$slug";

    $page = Cache::remember($cacheKey, 60, function () use ($tenant, $slug) {
        return Page::where('tenant_id', $tenant->id)
            ->where('slug', $slug)
            ->where('status', 'published')
            ->firstOrFail();
    });

    $layout = (new LayoutResolver())->resolve($page->layout_json);

    return response()->json([
        'layout' => $layout
    ]);
}
```

---

# 3. 🔌 Laravel – Data Resolver

```php
class LayoutResolver
{
    public function resolve($nodes)
    {
        return collect($nodes)->map(function ($node) {

            if (isset($node['data'])) {
                $node['props']['data'] = $this->fetch($node['data']);
            }

            if (isset($node['children'])) {
                $node['children'] = $this->resolve($node['children']);
            }

            return $node;
        });
    }

    private function fetch($data)
    {
        switch ($data['endpoint']) {
            case '/blogs':
                return Blog::latest()->limit(5)->get();

            case '/banners':
                return Banner::all();

            default:
                return [];
        }
    }
}
```

---

# 4. 🎨 Vue – Renderer

```vue
<template>
  <component :is="getComponent(node.type)" v-bind="node.props">
    <Renderer
      v-if="node.children"
      v-for="child in node.children"
      :key="child.id"
      :node="child"
    />
  </component>
</template>

<script setup>
import { registry } from "@/registry";

const props = defineProps({
  node: Object,
});

const getComponent = (type) => registry[type] || null;
</script>
```

---

# 5. 🧩 Vue – Component Registry

```js
import Banner from "@/components/Banner.vue";
import BlogList from "@/components/BlogList.vue";
import Grid from "@/components/Grid.vue";

export const registry = {
  banner: Banner,
  blog_list: BlogList,
  grid: Grid,
};
```

---

# 6. 🔌 Plugin Example – Ecommerce

## 6.1 Migration

```php
Schema::create('products', function (Blueprint $table) {
    $table->id();
    $table->uuid('tenant_id');
    $table->string('name');
    $table->decimal('price', 10, 2);
});
```

---

## 6.2 Plugin route

```php
Route::middleware(['tenant'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
});
```

---

## 6.3 UI usage

```json
{
  "type": "product_list",
  "data": {
    "endpoint": "/products"
  }
}
```

---

## 6.4 Registry inject

```js
registry["product_list"] = ProductList;
```

---

# 7. 🎨 Theme Example

## DB

```json
{
  "primary_color": "#ff0000",
  "font": "Inter"
}
```

---

## Vue component

```vue
<style>
.button {
  background-color: var(--primary-color);
}
</style>
```

---

## Inject theme

```js
document.documentElement.style.setProperty(
  "--primary-color",
  theme.primary_color,
);
```

---

# 8. ⚠️ Anti-pattern vs Correct

## ❌ Sai (hardcode UI)

```vue
<div v-if="page === 'home'">
  <Banner />
  <BlogList />
</div>
```

---

## ✅ Đúng (dynamic)

```vue
<Renderer :node="layout" />
```

---

# 9. ❌ Sai vs ✅ Đúng (fetch data)

## ❌ Sai

```js
onMounted(async () => {
  const res = await fetch("/blogs");
});
```

---

## ✅ Đúng

👉 Laravel inject data:

```json
{
  "type": "blog_list",
  "props": {
    "data": [...]
  }
}
```

---

# 10. 🔒 Tenant Isolation Example

## ❌ Sai

```php
Page::where('slug', $slug)->first();
```

---

## ✅ Đúng

```php
Page::where('tenant_id', $tenant->id)
    ->where('slug', $slug)
    ->first();
```

---

# 11. ⚡ Cache Example

```php
Cache::remember(
  "tenant:{$tenant->id}:page:home",
  60,
  fn() => $page
);
```

---

# 12. 🧬 Advanced – Nested Layout

```json
{
  "type": "grid",
  "props": { "columns": 3 },
  "children": [
    { "type": "banner" },
    { "type": "product_list" },
    { "type": "blog_list" }
  ]
}
```

---

# 13. 🧠 CMS Editor State Example

```js
const layout = [
  {
    id: "1",
    type: "banner",
    props: {},
  },
];
```

---

# 14. 🎯 Final Flow Example

```
CMS (Vue)
   ↓
Save JSON layout
   ↓
Laravel API
   ↓
Resolve tenant + cache + data
   ↓
Return layout JSON
   ↓
Vue Renderer
   ↓
Render UI
```

---

# 15. 🔥 KẾT LUẬN

Các ví dụ trên thể hiện:

- Dynamic UI (JSON-driven)
- Multi-tenant isolation
- Plugin-based architecture
- BFF data injection
- Vue renderer

👉 Đây là “chuẩn production” để AI hoặc dev phải follow.

---

END.
