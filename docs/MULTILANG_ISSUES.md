# Báo Cáo Kiểm Tra Tính Năng Đa Ngôn Ngữ

**Ngày kiểm tra:** 2026-03-19
**Cập nhật lần 2:** 2026-03-19
**Kết luận chung:** ✅ Tất cả vấn đề P0 đã được fix. Backend và Frontend đều đã sẵn sàng cho đa ngôn ngữ.

---

## YÊU CẦU CỦA NGƯỜI DÙNG

> Khi tạo 2 ngôn ngữ thì ở quản lý sản phẩm phải có 2 ngôn ngữ để nhập, ngôn ngữ gốc là tiếng việt và thêm 1 tab ngôn ngữ mới. Trang CMS cũng vậy.

**Tức là:** Form sản phẩm và form CMS phải có **tabs ngôn ngữ trực tiếp trong form**, không phải là section phụ phía dưới. Khi có N ngôn ngữ → có N tab để nhập nội dung tương ứng.

---

## BACKEND - TÌNH TRẠNG (ĐÃ SẴN SÀNG)

Backend đã implement đầy đủ, không cần sửa nhiều.

### Database Schema ✅
- Bảng `languages` — quản lý ngôn ngữ per tenant
- Bảng `content_translations` — lưu bản dịch đa hình (polymorphic) cho products, cms_pages, categories, brands, banners, nav_links...
  - Columns: `translatable_type`, `translatable_id`, `locale`, `field`, `value`
- Bảng `language_translations` — i18n cho giao diện admin
- Bảng `supported_languages` (central DB) — master list 25 ngôn ngữ

### API Endpoints ✅
```
GET    /languages                           — Danh sách ngôn ngữ đã cài
GET    /languages/supported                 — Ngôn ngữ có thể thêm
POST   /languages                           — Thêm ngôn ngữ
PUT    /languages/{id}                      — Sửa/đặt default
DELETE /languages/{id}                      — Xóa (không xóa được tiếng Việt)
GET    /languages/content/{table}/{id}      — Lấy bản dịch nội dung
PUT    /languages/content/{table}/{id}      — Lưu bản dịch nội dung
POST   /languages/auto-translate            — Dịch tự động (Google Translate)
```

### Storefront API ✅
- Tất cả endpoints đọc header `Accept-Language`
- Tự động merge translations vào response cho: products, categories, brands, banners, cms_pages, flash_sales
- Storefront gửi `Accept-Language` từ `localStorage` → backend trả về nội dung đã dịch

---

## FRONTEND ADMIN - TRẠNG THÁI SAU KHI FIX (kiểm tra 2026-03-19)

### ✅ Thiết kế đã được sửa đúng

Tất cả các form đã chuyển sang dùng **`LanguageTabs` component** tích hợp trực tiếp trong form, thay thế hoàn toàn `ContentTranslationEditor` độc lập.

**Pattern được áp dụng thống nhất:**
- `LanguageTabs` component hiển thị ngay từ đầu — kể cả khi **tạo mới**
- Computed helper `tField(key)` — khi tab là ngôn ngữ gốc (vi) → bind vào `form[key]`; tab ngôn ngữ phụ → bind vào `form.translations[langCode][key]`
- Payload submit luôn gửi kèm `translations` object trong cùng 1 request

---

### ✅ ProductManager.vue

**File:** `frontend/src/components/ProductManager.vue`

| Điểm kiểm tra | Kết quả |
|---------------|---------|
| LanguageTabs trong form | ✅ Dòng 100 — hiển thị cả khi tạo mới lẫn sửa |
| tField() computed | ✅ Dòng 323–338 — getter/setter reactive theo ngôn ngữ |
| Payload gửi translations | ✅ `form.value` (spread) bao gồm `translations` |
| Load translations khi edit | ✅ `openEdit()` fetch `/languages/content/products/{id}` |
| ContentTranslationEditor | ✅ Không còn dùng |

---

### ✅ CmsPageForm.vue

**File:** `frontend/src/components/CmsPageForm.vue`

| Điểm kiểm tra | Kết quả |
|---------------|---------|
| LanguageTabs trong form | ✅ Dòng 17 — fields: title, content, meta_title, meta_description |
| meta_title / meta_description init | ✅ Dòng 124–129 — khởi tạo đầy đủ |
| tField() computed | ✅ Dòng 131–146 |
| Payload gửi translations | ✅ `form.value` gửi kèm translations |
| ContentTranslationEditor | ✅ Không còn dùng |

---

### ✅ CategoryManager.vue

**File:** `frontend/src/components/CategoryManager.vue`

| Điểm kiểm tra | Kết quả |
|---------------|---------|
| LanguageTabs trong form | ✅ Dòng 39 — cả create lẫn edit |
| tField() computed | ✅ Dòng 94–109 |
| Payload gửi translations | ✅ |
| ContentTranslationEditor | ✅ Không còn dùng |

---

### ✅ BrandManager.vue

**File:** `frontend/src/components/BrandManager.vue`

| Điểm kiểm tra | Kết quả |
|---------------|---------|
| LanguageTabs trong form | ✅ Dòng 31 |
| tField() computed | ✅ Dòng 74–89 |
| Payload gửi translations | ✅ |
| ContentTranslationEditor | ✅ Không còn dùng |

---

### ✅ NavLinkManager.vue

**File:** `frontend/src/components/NavLinkManager.vue`

| Điểm kiểm tra | Kết quả |
|---------------|---------|
| LanguageTabs trong form | ✅ Dòng 318 — fields: name, url |
| tField() computed | ✅ Dòng 446–459 — `fName`, `fUrl` |
| Payload gửi translations | ✅ `form.value` gửi kèm translations |
| Load translations khi edit | ✅ `openEdit()` fetch `/languages/content/nav_links/{id}` |
| ContentTranslationEditor | ✅ Không còn dùng |

---

### ✅ Backend — Nhận translations trong payload

| File | Kết quả |
|------|---------|
| `StoreAction.php` (Product) | ✅ Dòng 48–50: `syncTranslations('products', $product->id, ...)` |
| `UpdateAction.php` (Product) | ✅ Dòng 53–55 |
| `CmsPagesController::store()` | ✅ Dòng 57–59 |
| `CmsPagesController::update()` | ✅ Dòng 92–94 |
| `mergeIntoItems()` fallback | ✅ Dòng 81–83: locale → fallbackLocale → giữ gốc |
| `mergeIntoSingleItem()` fallback | ✅ Dòng 121–123 |

---

## STOREFRONT - TÌNH TRẠNG (CƠ BẢN ỔN)

| Tính năng | Trạng thái |
|-----------|-----------|
| Language switcher trong header | ✅ Có |
| Lưu ngôn ngữ vào localStorage | ✅ Có |
| Gửi Accept-Language header trong mọi API call | ✅ Có |
| Backend merge translations theo locale | ✅ Có |
| Reload page khi đổi ngôn ngữ | ✅ Có (window.location.reload) |
| Fallback khi translation không tồn tại | ❌ Không có — hiển thị gì không rõ |
| Footer content multi-language | ❌ Không hỗ trợ |

---

## TỔNG HỢP - DANH SÁCH CẦN SỬA

### Đã xử lý (P0 — Done ✅):

| # | File | Trạng thái |
|---|------|-----------|
| 1 | `ProductManager.vue` | ✅ LanguageTabs tích hợp, cả create lẫn edit |
| 2 | `CmsPageForm.vue` | ✅ LanguageTabs tích hợp, meta fields đã init |
| 3 | `CategoryManager.vue` | ✅ LanguageTabs tích hợp |
| 4 | `BrandManager.vue` | ✅ LanguageTabs tích hợp |
| 5 | Backend StoreAction/UpdateAction | ✅ Nhận translations trong cùng payload |
| 6 | Backend mergeIntoItems fallback | ✅ Fallback locale → vi → giữ gốc |

### Đã xử lý thêm (P1 — Done ✅):

| # | File | Trạng thái |
|---|------|-----------|
| 1 | `NavLinkManager.vue` | ✅ LanguageTabs, tField(), translations trong payload |
| 2 | `LanguageTabs.vue` | ✅ Auto-translate, badge % completeness, load từ API, default lang đứng đầu |
| 3 | Backend fallback | ✅ `mergeIntoItems()` fallback: locale → vi → giữ gốc |
| 4 | Category backend `StoreAction`/`UpdateAction` | ✅ `syncTranslations('categories', ...)` |
| 5 | Brand backend `StoreAction`/`UpdateAction` | ✅ `syncTranslations('brands', ...)` |
| 6 | Trait `HasContentTranslations` | ✅ `syncTranslations()` → `ContentTranslation::upsertGrouped()` |

### Ưu tiên thấp (P2 — Nice to have):

| # | File | Vấn đề |
|---|------|--------|
| 1 | `LayoutFooterConfig.vue` | Footer content không có multi-language support |
| 2 | `useContentTranslations.js` | Composable dùng chung chưa được tạo — logic đang nằm lặp lại trong từng component |

---

## HƯỚNG XỬ LÝ TỐT NHẤT — THAM CHIẾU HỆ THỐNG LỚN

---

### So sánh các hệ thống lớn

| Khía cạnh | Shopify Markets | WordPress WPML | Contentful | **Project (hiện tại)** |
|-----------|-----------------|----------------|------------|------------------------|
| **Lưu trữ** | Per-locale trong DB riêng | Bảng translation riêng | Locale field trong JSON | Polymorphic table ✅ |
| **Form UX** | Modal riêng per language | Tab-based trong cùng form | Field selector | Riêng biệt bên dưới ❌ |
| **Ngôn ngữ gốc** | Market-based, dynamic | Default language config | Default locale | Hardcode 'vi' ⚠️ |
| **Auto-translate** | Shopify Translate & Adapt | Không có sẵn | Via third-party | Google Translate ✅ |
| **Fallback** | Tự động về default | Tự động copy từ default | Tự động về default | Không có ❌ |
| **Tạo mới** | Nhập cùng form, save một lần | Nhập cùng form, save một lần | Cùng form | Phải tạo trước, sửa sau ❌ |

---

### Pattern được các hệ thống lớn áp dụng

#### Nguyên tắc 1 — Shopify: "One Form, All Languages"
Shopify cho phép nhập tên/mô tả sản phẩm bằng tất cả ngôn ngữ ngay trong form tạo sản phẩm. Tab ngôn ngữ xuất hiện ngay từ đầu, không cần save trước.

```
┌────────────────────────────────────────────────────────┐
│  [🇻🇳 Tiếng Việt ●]  [🇬🇧 English]  [🇯🇵 日本語]        │
├────────────────────────────────────────────────────────┤
│  Tên sản phẩm *                                        │
│  [Áo thun nam cao cấp                               ]  │
│                                                        │
│  Mô tả                                                 │
│  [Áo thun chất liệu cotton 100%...                  ]  │
│                                                        │
│  Meta Title                                            │
│  [Áo thun nam | Shop ABC                            ]  │
└────────────────────────────────────────────────────────┘
     Trạng thái dịch: VI ✅  EN 2/4  JA 0/4
```

#### Nguyên tắc 2 — Contentful: "Fallback Chain"
Khi locale yêu cầu chưa có bản dịch → tự động fallback về ngôn ngữ gốc. User thấy nội dung thay vì khoảng trống.

```
Request locale='en' → Có en? → Trả về en
                   → Không? → Có vi (default)? → Trả về vi
                             → Không?           → Trả về ''
```

#### Nguyên tắc 3 — WordPress WPML: "Translation Status"
Mỗi field/entity có badge trạng thái dịch: `Chưa dịch` / `Đã dịch` / `Cần cập nhật`. Giúp admin biết cần dịch thêm gì.

#### Nguyên tắc 4 — Strapi: "Save Base + Save Translations in one action"
Khi submit form tạo mới: backend nhận một payload duy nhất gồm cả base data và translations array. Backend tự xử lý lưu vào 2 bảng.

```json
POST /products
{
  "name": "Áo thun nam",
  "price": 299000,
  "translations": {
    "en": { "name": "Men's T-shirt", "description": "100% cotton..." },
    "ja": { "name": "メンズTシャツ", "description": "綿100%..." }
  }
}
```

---

### KIẾN TRÚC ĐỀ XUẤT CHO PROJECT NÀY

#### Bước 1 — Tạo Composable dùng chung `useContentTranslations.js`

Tạo file mới: `frontend/src/composables/useContentTranslations.js`

```javascript
import { ref, computed } from 'vue'

export function useContentTranslations({ tableName, rowId, fields, apiFetch }) {
  const languages       = ref([])
  const activeLang      = ref(null)
  const translations    = ref({})   // { 'en': { name: '...', description: '...' } }
  const loadingTrans    = ref(false)
  const translatingLang = ref(null)

  // Ngôn ngữ mặc định (lấy từ API, không hardcode 'vi')
  const defaultLang = computed(() => languages.value.find(l => l.is_default))

  // Ngôn ngữ phụ (không phải default)
  const extraLanguages = computed(() => languages.value.filter(l => !l.is_default))

  // Tỷ lệ hoàn thành dịch cho từng ngôn ngữ
  function getCompleteness(langCode) {
    const vals = translations.value[langCode] || {}
    const filled = fields.filter(f => vals[f.key]?.trim()).length
    return Math.round((filled / fields.length) * 100)
  }

  // Getter/setter reactive cho 1 field
  function tField(langCode, fieldKey) {
    return {
      get: () => translations.value[langCode]?.[fieldKey] || '',
      set: (val) => {
        if (!translations.value[langCode]) translations.value[langCode] = {}
        translations.value[langCode][fieldKey] = val
      }
    }
  }

  // Load languages và translations (khi edit)
  async function loadLanguages() {
    const res  = await apiFetch('/languages')
    const data = await res.json()
    languages.value = Array.isArray(data) ? data : (data.data || [])
    if (extraLanguages.value.length) activeLang.value = extraLanguages.value[0].code
  }

  async function loadTranslations() {
    if (!rowId.value || rowId.value === 'new') return
    loadingTrans.value = true
    try {
      const res  = await apiFetch(`/languages/content/${tableName}/${rowId.value}`)
      const data = await res.json()
      translations.value = data?.grouped || {}
    } finally {
      loadingTrans.value = false
    }
  }

  // Dịch tự động tất cả fields cho 1 ngôn ngữ
  async function autoTranslateLang(lang, baseValues) {
    translatingLang.value = lang.code
    try {
      for (const field of fields) {
        const text = baseValues[field.key]
        if (!text?.trim()) continue
        const res  = await apiFetch('/languages/auto-translate', {
          method: 'POST',
          body: JSON.stringify({ text, from: defaultLang.value?.code || 'vi', to: lang.code })
        })
        const data = await res.json()
        if (data?.translated) {
          if (!translations.value[lang.code]) translations.value[lang.code] = {}
          translations.value[lang.code][field.key] = data.translated
        }
      }
    } finally {
      translatingLang.value = null
    }
  }

  // Save translations lên API (dùng sau khi đã có rowId)
  async function saveTranslations(id) {
    if (!Object.keys(translations.value).length) return
    await apiFetch(`/languages/content/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ translations: translations.value })
    })
  }

  return {
    languages, activeLang, translations, loadingTrans, translatingLang,
    defaultLang, extraLanguages,
    getCompleteness, tField,
    loadLanguages, loadTranslations, autoTranslateLang, saveTranslations
  }
}
```

---

#### Bước 2 — Pattern tích hợp vào ProductManager.vue

Thay thế `ContentTranslationEditor` độc lập ở dưới bằng tabs tích hợp trong form:

```vue
<template>
  <!-- Tabs ngôn ngữ — hiển thị ngay kể cả khi tạo mới -->
  <div class="lang-tabs" v-if="extraLanguages.length > 0">
    <button
      :class="['lang-tab', { active: activeLang === defaultLang?.code }]"
      @click="activeLang = defaultLang?.code">
      {{ defaultLang?.name || 'Tiếng Việt' }}
      <span class="badge-default">●</span>
    </button>
    <button
      v-for="lang in extraLanguages" :key="lang.code"
      :class="['lang-tab', { active: activeLang === lang.code }]"
      @click="activeLang = lang.code">
      {{ lang.name }}
      <span class="badge-completeness"
        :class="{ done: getCompleteness(lang.code) === 100 }">
        {{ getCompleteness(lang.code) }}%
      </span>
    </button>
  </div>

  <!-- Tab ngôn ngữ gốc (lưu vào form.name, form.description trực tiếp) -->
  <div v-show="!activeLang || activeLang === defaultLang?.code">
    <div class="form-group">
      <label>Tên sản phẩm *</label>
      <input v-model="form.name" />
    </div>
    <div class="form-group">
      <label>Mô tả</label>
      <textarea v-model="form.description" />
    </div>
  </div>

  <!-- Tab ngôn ngữ phụ (lưu vào translations object) -->
  <template v-for="lang in extraLanguages" :key="lang.code">
    <div v-show="activeLang === lang.code">
      <div class="form-group">
        <label>Tên sản phẩm ({{ lang.name }})</label>
        <input
          :value="translations[lang.code]?.name || ''"
          @input="setTransField(lang.code, 'name', $event.target.value)"
          :placeholder="form.name" />
        <!-- placeholder = giá trị tiếng Việt làm gợi ý -->
      </div>
      <div class="form-group">
        <label>Mô tả ({{ lang.name }})</label>
        <textarea
          :value="translations[lang.code]?.description || ''"
          @input="setTransField(lang.code, 'description', $event.target.value)"
          :placeholder="form.description" />
      </div>
      <!-- Nút dịch tự động cả tab này -->
      <button @click="autoTranslateLang(lang, form)" class="btn-auto-translate"
        :disabled="translatingLang === lang.code">
        {{ translatingLang === lang.code ? 'Đang dịch...' : 'Dịch tự động sang ' + lang.name }}
      </button>
    </div>
  </template>
</template>

<script setup>
import { useContentTranslations } from '../composables/useContentTranslations.js'

const {
  languages, activeLang, translations, extraLanguages, defaultLang,
  translatingLang, getCompleteness,
  loadLanguages, loadTranslations, autoTranslateLang, saveTranslations
} = useContentTranslations({
  tableName: 'products',
  rowId: computed(() => editId.value),
  fields: [
    { key: 'name', label: 'Tên sản phẩm' },
    { key: 'description', label: 'Mô tả' },
    { key: 'meta_title', label: 'Meta Title' },
    { key: 'meta_description', label: 'Meta Description' },
  ],
  apiFetch
})

function setTransField(langCode, fieldKey, value) {
  if (!translations.value[langCode]) translations.value[langCode] = {}
  translations.value[langCode][fieldKey] = value
}

// Khi submit (cả tạo mới lẫn sửa):
async function handleSave() {
  // 1. Lưu entity chính
  const product = isEditing.value
    ? await updateProduct(editId.value, form.value)
    : await createProduct(form.value)

  // 2. Lưu translations ngay sau (trong cùng 1 action)
  if (product?.id && Object.keys(translations.value).length > 0) {
    await saveTranslations(product.id)
  }
}

onMounted(async () => {
  await loadLanguages()
  if (editId.value) await loadTranslations()
  // activeLang tự động set về tab ngôn ngữ gốc
  activeLang.value = defaultLang.value?.code
})
</script>
```

---

#### Bước 3 — Cải thiện Backend: Nhận translations trong cùng 1 request

Sửa `ProductsController` / `StoreAction` để nhận `translations` trong payload tạo/sửa:

```php
// app/Actions/Product/StoreAction.php
public function execute(Request $request): JsonResponse
{
    $data = $request->except('translations');
    $product = $this->productRepo->store($data);

    // Lưu translations nếu có trong payload
    if ($request->has('translations')) {
        ContentTranslation::upsertGrouped(
            'products',
            $product->id,
            $request->input('translations')
        );
    }

    return response()->json(['data' => $product]);
}

// app/Actions/Product/UpdateAction.php — tương tự
public function execute(Request $request, int $id): JsonResponse
{
    $data = $request->except('translations');
    $product = $this->productRepo->update($data, $id);

    if ($request->has('translations')) {
        ContentTranslation::upsertGrouped('products', $id, $request->input('translations'));
    }

    return response()->json(['data' => $product]);
}
```

Làm tương tự cho `CmsPagesController`, `CategoriesController`, `BrandsController`.

---

#### Bước 4 — Thêm Fallback Backend (theo Contentful pattern)

Sửa `StorefrontController::getLocale()` và `mergeIntoItems()` để có fallback:

```php
// ContentTranslation.php — Thêm method mergeWithFallback
public static function mergeIntoItems(
    array $items,
    string $type,
    ?string $locale,
    array $fields,
    string $fallbackLocale = 'vi'   // <-- thêm fallback
): array {
    if (!$locale || empty($items)) return $items;

    // Lấy cả locale yêu cầu lẫn fallback trong 1 query
    $rows = static::where('translatable_type', $type)
        ->whereIn('translatable_id', array_column($items, 'id'))
        ->whereIn('locale', array_unique([$locale, $fallbackLocale]))
        ->whereIn('field', $fields)
        ->get();

    $map = [];
    foreach ($rows as $row) {
        $map[$row->translatable_id][$row->locale][$row->field] = $row->value;
    }

    return array_map(function ($item) use ($map, $locale, $fallbackLocale, $fields) {
        $id = $item['id'] ?? ($item->id ?? null);
        foreach ($fields as $field) {
            // Ưu tiên locale yêu cầu, fallback về tiếng Việt nếu chưa dịch
            $val = $map[$id][$locale][$field]
                ?? $map[$id][$fallbackLocale][$field]
                ?? null;
            if ($val !== null) {
                is_array($item) ? ($item[$field] = $val) : ($item->$field = $val);
            }
        }
        return $item;
    }, $items);
}
```

---

### ROADMAP THỰC HIỆN

| Phase | Việc cần làm | Độ ưu tiên | File liên quan |
|-------|-------------|-----------|----------------|
| **Phase 1** | Tạo `useContentTranslations.js` composable | P0 | `frontend/src/composables/` |
| **Phase 1** | Tích hợp lang tabs vào `ProductManager.vue` | P0 | `ProductManager.vue` |
| **Phase 1** | Tích hợp lang tabs vào `CmsPageForm.vue` + fix meta fields | P0 | `CmsPageForm.vue` |
| **Phase 1** | Backend nhận `translations` trong payload create/update | P0 | `StoreAction`, `UpdateAction` |
| **Phase 2** | Tích hợp lang tabs vào `CategoryManager.vue` | P1 | `CategoryManager.vue` |
| **Phase 2** | Tích hợp lang tabs vào `BrandManager.vue` | P1 | `BrandManager.vue` |
| **Phase 2** | Thêm fallback logic trong `ContentTranslation::mergeIntoItems()` | P1 | `ContentTranslation.php` |
| **Phase 3** | Translation completeness badge per ngôn ngữ | P2 | composable + UI |
| **Phase 3** | NavLinkManager — thêm URL translation | P2 | `NavLinkManager.vue` |
| **Phase 3** | Footer content multi-language | P2 | `LayoutFooterConfig.vue` |

---

## KẾT LUẬN

**Backend Laravel đã implement đầy đủ** — không cần thay đổi cấu trúc database hay API endpoints cơ bản.

**Frontend cần refactor theo 3 điểm chính:**

1. **Tạo composable `useContentTranslations.js`** để tái sử dụng logic quản lý tab ngôn ngữ, tránh lặp code ở mỗi component.

2. **Tích hợp tab ngôn ngữ trực tiếp vào form** (không phải section phụ bên dưới), áp dụng ngay kể cả khi tạo mới — đây là cách Shopify, WPML, Strapi đang làm.

3. **Backend nhận `translations` trong payload create/update** để chỉ cần 1 API call thay vì 2 (tạo entity → save translations).

**Ước tính công việc thực hiện Phase 1:**
- `useContentTranslations.js`: ~2 giờ
- `ProductManager.vue` refactor: ~3 giờ
- `CmsPageForm.vue` refactor + fix bug: ~3 giờ
- Backend actions: ~1 giờ
