# Báo Cáo Kiểm Tra Chức Năng Toàn Dự Án

**Ngày kiểm tra:** 2026-03-19
**Phạm vi:** Backend Laravel + Frontend Admin Vue + Storefront Vue

---

## MỨC ĐỘ ƯU TIÊN

| Ký hiệu | Ý nghĩa |
|---------|--------|
| 🔴 Critical | Gây crash / mất dữ liệu / lỗ hổng bảo mật nghiêm trọng — sửa ngay |
| 🟠 High | Logic sai, dữ liệu không nhất quán — sửa sớm |
| 🟡 Medium | Validation thiếu, UX tệ — nên sửa |
| 🟢 Low | Cải thiện nhỏ, performance — sửa khi có thời gian |

---

## PHẦN 1 — BACKEND: CRITICAL BUGS

---

### 🔴 [BE-C1] `stock_histories` thiếu cột `user_id` trong migration

**File:** `database/migrations/tenant/2026_03_18_201500_add_min_stock_and_stock_histories.php`
**File liên quan:** `app/Repositories/Product/ProductRepository.php` dòng 50

**Vấn đề:** Migration tạo bảng `stock_histories` chỉ có các cột: `product_id`, `action`, `quantity_change`, `stock_before`, `stock_after`, `reason`, `created_at`. Nhưng `ProductRepository::adjustStock()` insert thêm `user_id` → **lỗi runtime "Column not found"** mỗi khi điều chỉnh tồn kho.

**Fix:**
```php
// Thêm vào migration:
$table->unsignedBigInteger('user_id')->nullable();
$table->string('reference_type')->nullable(); // 'order', 'receipt', 'manual'
$table->string('reference_id')->nullable();
```

---

### 🔴 [BE-C2] `purchase_orders` không có foreign key constraint cho `supplier_id`

**File:** `database/migrations/tenant/2026_03_18_195400_create_purchase_orders_table.php` dòng 16

**Vấn đề:** Cột `supplier_id` không có foreign key constraint. Khi xóa supplier, tất cả purchase orders liên quan bị orphaned — không thể biết PO đó của supplier nào.

**Fix:**
```php
$table->unsignedBigInteger('supplier_id')->nullable();
$table->foreign('supplier_id')->references('id')->on('suppliers')->nullOnDelete();
```

---

### 🔴 [BE-C3] `wishlists` không có foreign key constraints

**File:** `database/migrations/tenant/2026_03_17_011435_create_wishlists_table.php` dòng 14–15

**Vấn đề:** Bảng tạo cột `customer_id` và `product_id` nhưng không có foreign key. Xóa customer/product → wishlist record bị orphaned, truy vấn JOIN sẽ trả về dữ liệu rác.

**Fix:**
```php
$table->foreign('customer_id')->references('id')->on('shop_customers')->cascadeOnDelete();
$table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
```

---

### 🔴 [BE-C4] Cancel order KHÔNG hoàn trả tồn kho

**File:** `app/Actions/Order/UpdateStatusAction.php`

**Vấn đề:** Khi status order chuyển sang `cancelled`, code không cộng lại stock. Inventory bị thiếu vĩnh viễn. Đây là bug nghiêm trọng nhất về mặt nghiệp vụ.

**Fix:**
```php
// Trong UpdateStatusAction, thêm:
if ($newStatus === 'cancelled' && $oldStatus !== 'cancelled') {
    DB::transaction(function () use ($order) {
        foreach ($order->details as $detail) {
            DB::table('products')
                ->where('id', $detail->product_id)
                ->increment('stock', $detail->quantity);

            DB::table('stock_histories')->insert([
                'product_id'      => $detail->product_id,
                'action'          => 'return',
                'quantity_change' => $detail->quantity,
                'stock_before'    => /* query before increment */,
                'reason'          => 'Order #' . $order->id . ' cancelled',
                'created_at'      => now(),
            ]);
        }
    });
}
```

---

### 🔴 [BE-C5] Order status transition không được validate (method `canTransitionTo()` định nghĩa nhưng không dùng)

**File:** `app/Models/Order.php` dòng 78–82 / `app/Actions/Order/UpdateStatusAction.php`

**Vấn đề:** `Order` model có method `canTransitionTo()` kiểm tra flow hợp lệ (`pending → confirmed → shipping → delivered`) nhưng `UpdateStatusAction` không gọi nó. Có thể đổi order từ `delivered` → `pending` → không hợp lý về nghiệp vụ.

**Fix:**
```php
// UpdateStatusAction.php — thêm trước khi update:
if (!$order->canTransitionTo($newStatus)) {
    return response()->json([
        'message' => "Không thể chuyển trạng thái từ {$order->status} sang {$newStatus}"
    ], 422);
}
```

---

### 🔴 [BE-C6] Password reset trả về plain-text password trong response JSON

**File:** `app/Http/Controllers/Shop/ShopAuthController.php` dòng 150–164

**Vấn đề:** `resetPassword()` sinh mật khẩu ngẫu nhiên 8 ký tự rồi trả thẳng vào response `{ "temporary_password": "abc12345" }`. Bất kỳ ai log được API response (proxy, monitoring tool) sẽ thấy password.

**Fix:**
```php
// Thay vì return password, gửi email:
Mail::to($customer->email)->send(new PasswordResetMail($newPassword));
return $this->successResponse(null, 'Mật khẩu tạm đã được gửi qua email');

// Nếu chưa có mail, tối thiểu:
// Không return password trong response — log server-side hoặc gửi SMS
```

---

### 🔴 [BE-C7] `UpdateAction` của Products và Categories không validate input — mass assignment risk

**File:** `app/Actions/Product/UpdateAction.php` / `app/Actions/Category/UpdateAction.php`

**Vấn đề:** Cả hai đều dùng `$data = $request->all()` không qua `validate()`. Attacker có thể gửi bất kỳ field nào (kể cả `is_deleted`, `created_at`) để override dữ liệu.

**Fix:**
```php
// UpdateAction.php — thêm validation:
$data = $request->validate([
    'name'             => 'sometimes|string|max:255',
    'price'            => 'sometimes|numeric|min:0',
    'cost_price'       => 'sometimes|numeric|min:0',
    'stock'            => 'sometimes|integer|min:0',
    'description'      => 'sometimes|nullable|string',
    'meta_title'       => 'sometimes|nullable|string|max:255',
    'meta_description' => 'sometimes|nullable|string',
    'is_active'        => 'sometimes|boolean',
    'translations'     => 'sometimes|array',
]);
```

---

### 🔴 [BE-C8] `StockReceiptController::confirm()` không dùng DB Transaction — stock inconsistent nếu crash giữa chừng

**File:** `app/Http/Controllers/Tenant/StockReceiptController.php` dòng 149–249

**Vấn đề:** Vòng lặp update stock cho nhiều sản phẩm không có `DB::transaction()`. Nếu server crash ở sản phẩm thứ 3 trong 5, 2 sản phẩm đã cộng stock, 3 sản phẩm chưa — dữ liệu không nhất quán vĩnh viễn.

**Fix:**
```php
public function confirm(Request $request, $id)
{
    DB::transaction(function () use ($id) {
        // toàn bộ logic update stock nằm trong đây
        foreach ($items as $item) {
            $product->stock += $qtyChange;
            $product->save();
            DB::table('stock_histories')->insert([...]);
        }
        $receipt->status = 'confirmed';
        $receipt->save();
    });
}
```

---

### 🔴 [BE-C9] `forgotPassword()` là giả — không thực sự gửi email

**File:** `app/Http/Controllers/Shop/ShopAuthController.php` dòng 145–147

**Vấn đề:** Hàm chỉ return `"Password reset instructions sent"` mà không làm gì cả. Người dùng nghĩ email đã gửi nhưng thực tế không.

**Fix:**
```php
public function forgotPassword(Request $request)
{
    $request->validate(['email' => 'required|email']);
    $customer = ShopCustomer::where('email', $request->email)->first();
    if (!$customer) {
        // Return generic message (không lộ email tồn tại không)
        return $this->successResponse(null, 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn');
    }
    $token = Str::random(64);
    // Lưu token vào password_reset_tokens hoặc cache
    Cache::put("password_reset_{$token}", $customer->id, now()->addHours(1));
    // Gửi email
    Mail::to($customer->email)->send(new ForgotPasswordMail($token));
    return $this->successResponse(null, 'Nếu email tồn tại, chúng tôi đã gửi hướng dẫn');
}
```

---

## PHẦN 2 — BACKEND: HIGH PRIORITY BUGS

---

### 🟠 [BE-H1] `price`, `cost_price` không validate `numeric` — có thể lưu string

**File:** `app/Actions/Product/StoreAction.php` dòng 15–16

**Vấn đề:** Validation chỉ `'price' => 'nullable'` — accept string, âm, hoặc bất kỳ giá trị nào.

**Fix:**
```php
'price'       => 'required|numeric|min:0',
'cost_price'  => 'nullable|numeric|min:0',
'stock'       => 'nullable|integer|min:0',
```

---

### 🟠 [BE-H2] `slug`/`alias` không validate unique khi create/update CMS và Product

**File:** `app/Http/Controllers/Tenant/CmsPagesController.php` dòng 39–40 / `app/Actions/Product/StoreAction.php`

**Vấn đề:** Slug auto-gen từ tên nhưng không check unique. 2 sản phẩm tên giống nhau → 2 slug giống nhau → conflict URL, SEO sai, có thể gây lỗi DB.

**Fix:**
```php
// Helper trong repository:
function generateUniqueSlug(string $name, ?int $excludeId = null): string {
    $slug = Str::slug($name);
    $base = $slug;
    $i = 1;
    while (DB::table('products')
        ->where('slug', $slug)
        ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
        ->exists()
    ) {
        $slug = "{$base}-{$i}";
        $i++;
    }
    return $slug;
}
```

---

### 🟠 [BE-H3] Category — không check circular parent (A là cha của B, B là cha của A)

**File:** `app/Actions/Category/UpdateAction.php`

**Vấn đề:** Có thể tạo vòng lặp vô hạn trong cây danh mục, khiến bất kỳ query nào cần traverse tree bị infinite loop.

**Fix:**
```php
function isCircularParent(int $categoryId, ?int $parentId): bool {
    if ($parentId === null) return false;
    if ($parentId === $categoryId) return true;
    $parent = ProductCategory::find($parentId);
    return $parent ? isCircularParent($categoryId, $parent->parent_id) : false;
}

// Trong UpdateAction:
if (isCircularParent($id, $request->input('parent_id'))) {
    return response()->json(['message' => 'Circular parent reference detected'], 422);
}
```

---

### 🟠 [BE-H4] Xóa product không check product đang có trong order chưa hoàn thành

**File:** `app/Actions/Product/DestroyAction.php`

**Vấn đề:** Nếu xóa product đang có trong order pending/shipping, order items sẽ tham chiếu đến product không tồn tại.

**Fix:**
```php
$activeOrders = DB::table('orders_detail')
    ->join('orders', 'orders.id', '=', 'orders_detail.order_id')
    ->where('orders_detail.product_id', $id)
    ->whereNotIn('orders.status', ['cancelled', 'delivered', 'refunded'])
    ->count();

if ($activeOrders > 0) {
    return response()->json([
        'message' => "Không thể xóa sản phẩm đang có trong {$activeOrders} đơn hàng chưa hoàn thành"
    ], 422);
}
```

---

### 🟠 [BE-H5] `StorefrontController::products()` không filter `is_active` — sản phẩm đã tắt vẫn hiện trên storefront

**File:** `app/Http/Controllers/Tenant/StorefrontController.php` dòng 45–66

**Vấn đề:** API public `GET /storefront/products` không filter `is_active = true`. Sản phẩm bị disable vẫn xuất hiện trên trang bán hàng.

**Fix:**
```php
// Trong ProductRepository::getProducts():
$query->where('is_active', true);

// Hoặc trong StorefrontController:
$paginated = $this->productRepo->getActiveProducts($perPage);
```

---

### 🟠 [BE-H6] Shop Auth: response register/login trả về object customer có chứa `password` hash

**File:** `app/Http/Controllers/Shop/ShopAuthController.php` dòng 58

**Vấn đề:** Tenant auth (dòng 97–98) đã làm `unset($user->password)` trước khi return. Shop auth thì không — `password` hash bị trả về trong JSON response.

**Fix:**
```php
// Sau khi load $customer:
unset($customer->password);
return $this->successResponse(['customer' => $customer, 'token' => $token]);
```

---

### 🟠 [BE-H7] `PromotionsController` dùng sai model — đang update `promotion_price` trực tiếp trên products thay vì dùng `Promotions` table

**File:** `app/Http/Controllers/Tenant/PromotionsController.php` dòng 18–84

**Vấn đề:** Hệ thống có bảng `promotions` riêng trong migration nhưng controller thực ra đang update field `promotion_price` và `promotion_start/end` trực tiếp trên bảng `products`. Bảng `promotions` không được dùng. Gây confusion và feature promotion không đầy đủ (không có: usage_limit, customer_group, etc.).

**Fix đề xuất:** Thống nhất về 1 approach:
- **Option A:** Dùng bảng `promotions` thực sự, controller tạo Promotion records
- **Option B:** Bỏ bảng `promotions`, dùng hẳn fields trên `products` (hiện tại) — nhưng cần document rõ

---

### 🟠 [BE-H8] Webhook infrastructure: table tồn tại nhưng không có code trigger webhook

**File:** `app/Http/Controllers/Tenant/WebhooksController.php`

**Vấn đề:** Admin có thể tạo webhook URLs nhưng hệ thống không bao giờ gọi chúng. Feature hoàn toàn không hoạt động.

**Fix:**
```php
// Tạo WebhookDispatcher service:
class WebhookDispatcher
{
    public static function dispatch(string $event, array $payload): void
    {
        $webhooks = Webhook::where('event', $event)->where('is_active', true)->get();
        foreach ($webhooks as $webhook) {
            $signature = hash_hmac('sha256', json_encode($payload), $webhook->secret);
            Http::timeout(5)->withHeaders([
                'X-Webhook-Signature' => $signature,
                'Content-Type'        => 'application/json',
            ])->post($webhook->url, $payload);
        }
    }
}

// Dùng trong OrdersController sau khi update status:
WebhookDispatcher::dispatch('order.status_changed', ['order_id' => $id, 'status' => $newStatus]);
```

---

### 🟠 [BE-H9] `TokenAuth` middleware — fallback grant full access khi RBAC table lỗi

**File:** `app/Http/Middleware/TokenAuth.php` dòng 91–94

**Vấn đề:** Nếu bảng roles/permissions bị lỗi, middleware tự grant `permissions = ['*']` cho mọi user → mọi người thành superadmin.

**Fix:**
```php
} catch (\Exception $e) {
    // Fail secure — nếu không đọc được permission, DENY thay vì ALLOW
    Log::error('RBAC permission load failed: ' . $e->getMessage());
    return response()->json(['message' => 'Authorization unavailable'], 503);
}
```

---

### 🟠 [BE-H10] `StockReceiptController::cancel()` không reverse `cost_price` đã tính

**File:** `app/Http/Controllers/Tenant/StockReceiptController.php` dòng 254–298

**Vấn đề:** Khi confirm nhập hàng, system tính lại `cost_price` theo weighted average. Khi hủy receipt, system chỉ trừ lại stock nhưng không restore cost_price. Báo cáo lợi nhuận sẽ sai.

**Fix:** Lưu `cost_price` trước khi tính lại vào receipt detail, restore lại khi cancel.

---

### 🟠 [BE-H11] Không có rate limiting cho Tenant Auth endpoints

**File:** `routes/api.php` dòng 81–82 / Middleware `RateLimitShopAuth`

**Vấn đề:** Shop auth có `RateLimitShopAuth` middleware nhưng Tenant admin login (`/auth/login`, `/auth/register`) không có. Brute force attack được.

**Fix:**
```php
// routes/api.php:
Route::middleware(['throttle:10,1'])->group(function () {
    Route::post('/auth/login', [...]);
    Route::post('/auth/register', [...]);
});
```

---

### 🟠 [BE-H12] `language_translations` dùng cả `language_code` lẫn `language_id` — dữ liệu có thể không đồng bộ

**File:** `database/migrations/tenant/2026_03_19_fix_languages_tables.php` dòng 25–39

**Vấn đề:** Migration thêm `language_id` vào bảng `language_translations` nhưng không xóa cột `language_code` cũ. Unique constraint vẫn dùng `language_code`. Hai cột tồn tại song song → risk không đồng bộ.

**Fix:** Chọn 1 approach dứt khoát:
```php
// Nếu dùng language_id, update unique constraint:
$table->dropUnique(['language_code', 'key']);
$table->unique(['language_id', 'key']);
// Thêm nullable() cho language_code hoặc xóa hẳn
```

---

## PHẦN 3 — FRONTEND ADMIN: BUGS

---

### 🔴 [FE-C1] `CustomerManager.vue` — nút xóa địa chỉ dùng sai biến

**File:** `frontend/src/components/CustomerManager.vue` dòng 80

**Vấn đề:** `@click="handleDelete(c)"` — `c` là biến của vòng lặp customer, không phải address. Hàm `handleDelete` mong nhận address object → crash runtime.

**Fix:**
```vue
<!-- Sửa c thành a (address) -->
<button @click="handleDelete(a)">Xóa</button>
```

---

### 🔴 [FE-C2] `RoleManager.vue` — xóa role không check role đang có users

**File:** `frontend/src/components/RoleManager.vue` dòng 312–320

**Vấn đề:** Xóa role không hỏi backend xem có user nào đang dùng role này không. Xóa xong → users mất role → không vào được admin.

**Fix:**
```javascript
async function deleteRole(roleId) {
    // Gọi API check trước
    const res = await apiFetch(`/roles/${roleId}/users-count`);
    const { count } = await res.json();
    if (count > 0) {
        alert(`Role đang được gán cho ${count} user. Không thể xóa.`);
        return;
    }
    if (!confirm('Xác nhận xóa role này?')) return;
    await apiFetch(`/roles/${roleId}`, { method: 'DELETE' });
}
```
Hoặc backend trả về 422 với message rõ ràng.

---

### 🟠 [FE-H1] `FlashSaleManager.vue` — không validate `end_date > start_date`

**File:** `frontend/src/components/FlashSaleManager.vue` dòng 374–375

**Vấn đề:** Có thể tạo flash sale với thời gian kết thúc trước thời gian bắt đầu.

**Fix:**
```javascript
function validate() {
    if (new Date(form.value.end_date) <= new Date(form.value.start_date)) {
        showToast('Thời gian kết thúc phải sau thời gian bắt đầu', 'error');
        return false;
    }
    return true;
}
```

---

### 🟠 [FE-H2] `FlashSaleManager.vue` — không validate discount percent (0–100)

**File:** `frontend/src/components/FlashSaleManager.vue` dòng 363

**Vấn đề:** Sale price có thể lớn hơn giá gốc → sản phẩm bán lỗ hoặc "giảm giá" mà thực ra đắt hơn.

**Fix:**
```javascript
if (form.value.sale_price >= product.price) {
    showToast('Giá sale phải nhỏ hơn giá gốc', 'error');
    return;
}
if (form.value.sale_price <= 0) {
    showToast('Giá sale phải lớn hơn 0', 'error');
    return;
}
```

---

### 🟠 [FE-H3] `OrderManagement.vue` — `updateStatus()` không có try-catch, lỗi im lặng

**File:** `frontend/src/components/OrderManagement.vue` dòng 456–464

**Vấn đề:** API call thất bại mà không thông báo gì → user click mà không biết đã lưu hay chưa.

**Fix:**
```javascript
async function updateStatus(orderId, status) {
    try {
        await apiFetch(`/orders/${orderId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
        showToast('Cập nhật trạng thái thành công', 'success');
        await fetchOrders();
    } catch (e) {
        showToast('Lỗi cập nhật trạng thái: ' + e.message, 'error');
    }
}
```

---

### 🟠 [FE-H4] `OrderManagement.vue` — pagination không thực sự phân trang (chỉ limit=50)

**File:** `frontend/src/components/OrderManagement.vue` dòng 368

**Vấn đề:** API call dùng `?limit=50`, không gửi `page` hay `offset` param → luôn lấy 50 đơn đầu tiên, không xem được đơn cũ.

**Fix:**
```javascript
const currentPage = ref(1);
const perPage = 20;

async function fetchOrders() {
    const offset = (currentPage.value - 1) * perPage;
    const res = await apiFetch(`/orders?limit=${perPage}&offset=${offset}&status=${filter.value}`);
    // ...
}
```

---

### 🟠 [FE-H5] `PurchaseOrderManager.vue` — tổng tiền có thể âm khi discount > subtotal

**File:** `frontend/src/components/PurchaseOrderManager.vue` dòng 321–323

**Vấn đề:** `total = subtotal + tax - discount` không clamp về 0. Nếu discount lớn hơn subtotal → total âm → xuất hóa đơn âm tiền.

**Fix:**
```javascript
const totalAmount = computed(() =>
    Math.max(0, subtotal.value + taxAmount.value - discountAmount.value)
);
```

---

### 🟡 [FE-M1] `PaymentVoucherManager.vue` — không validate amount > 0

**File:** `frontend/src/components/PaymentVoucherManager.vue` dòng 218

**Fix:** `if (!form.value.amount || form.value.amount <= 0) { showError... }`

---

### 🟡 [FE-M2] `InventoryManagement.vue` — import CSV không xử lý quoted values

**File:** `frontend/src/components/InventoryManagement.vue` dòng 612

**Vấn đề:** `row.split(',')` — nếu tên sản phẩm có dấu phẩy (ví dụ: `"Áo, váy, quần"`) → parse sai.

**Fix:** Dùng thư viện CSV parser (Papa Parse) hoặc xử lý quoted strings.

---

### 🟡 [FE-M3] `RoleManager.vue` — `:indeterminate.prop` không hoạt động đúng trên standard HTML checkbox

**File:** `frontend/src/components/RoleManager.vue` dòng 55

**Fix:**
```javascript
// Dùng ref callback hoặc onMounted để set:
checkboxEl.indeterminate = isPartiallyChecked;
```

---

## PHẦN 4 — STOREFRONT: BUGS

---

### 🔴 [SF-C1] Checkout — không ngăn double submit

**File:** `storefront/src/views/CheckoutPage.vue` dòng 430–433

**Vấn đề:** Nếu API chậm, user có thể click submit nhiều lần → tạo nhiều đơn hàng trùng nhau.

**Fix:**
```javascript
const submitting = ref(false);

async function placeOrder() {
    if (submitting.value) return; // Guard
    submitting.value = true;
    try {
        await submitOrder();
    } finally {
        submitting.value = false;
    }
}
```
Kết hợp với backend idempotency key.

---

### 🔴 [SF-C2] `ProductDetailPage` — `variant_id` không được gửi kèm khi add to cart

**File:** `storefront/src/views/ProductDetailPage.vue` dòng 590–598

**Vấn đề:** `handleAddToCart()` lấy variant object nhưng thiếu `.id`. Backend không biết variant nào được chọn → order sai variant (sai màu, sai size).

**Fix:**
```javascript
const variant = selectedVariant.value !== null ? variants.value[selectedVariant.value] : null;
addToCart({
    id:         product.value.id,
    variantId:  variant?.id ?? null,   // ← quan trọng
    variantSku: variant?.sku ?? null,
    name:       product.value.name,
    price:      variant?.price ?? product.value.price,
    qty:        qty.value,
});
```

---

### 🔴 [SF-C3] `api.js` — không xử lý 401 Unauthorized → không redirect về trang login

**File:** `storefront/src/api.js` dòng 33–43

**Vấn đề:** Khi token hết hạn, API trả về 401, nhưng app không redirect về login → user bị stuck với giao diện lỗi.

**Fix:**
```javascript
async function apiFetch(path, options = {}) {
    const res = await fetch(BASE_URL + path, options);
    if (res.status === 401) {
        localStorage.removeItem('sf_token');
        localStorage.removeItem('sf_customer');
        window.location.href = '/auth?redirect=' + encodeURIComponent(window.location.pathname);
        return;
    }
    // ...
}
```

---

### 🟠 [SF-H1] `CartPage` — không validate quantity max (tồn kho)

**File:** `storefront/src/views/CartPage.vue` / `storefront/src/composables/useCart.js` dòng 74–80

**Vấn đề:** Nhấn "+" mãi không có giới hạn. User có thể thêm 9999 sản phẩm vào cart dù chỉ còn 1 cái.

**Fix:**
```javascript
function updateQty(key, newQty) {
    const item = cart.value.find(i => i.key === key);
    if (!item) return;
    const maxQty = item.stock ?? 999;
    const clamped = Math.min(Math.max(1, newQty), maxQty);
    item.qty = clamped;
    saveCart();
}
```
Và truyền `stock` vào cart item khi add.

---

### 🟠 [SF-H2] Cart guest không merge với cart user sau khi login

**File:** `storefront/src/composables/useCart.js` dòng 9–16

**Vấn đề:** Nếu user thêm hàng rồi login, toàn bộ cart bị mất hoặc không hợp nhất.

**Fix:**
```javascript
// Trong useAuth.login():
async function login(credentials) {
    const customer = await doLogin(credentials);
    // Merge local cart với server cart:
    const localCart = JSON.parse(localStorage.getItem('sf_cart') || '[]');
    if (localCart.length > 0) {
        await apiPost('/storefront/cart/merge', { items: localCart });
        localStorage.removeItem('sf_cart');
    }
    await loadCart(); // Reload cart từ server
}
```

---

### 🟠 [SF-H3] `AuthPage` — không có "Confirm Password" field khi đăng ký

**File:** `storefront/src/views/AuthPage.vue` dòng 28–55

**Fix:** Thêm field `confirmPassword`, validate `password === confirmPassword` trước submit.

---

### 🟠 [SF-H4] `AuthPage` — login redirect về `/` cứng, không check `?redirect=` param

**File:** `storefront/src/views/AuthPage.vue` dòng 98–101

**Fix:**
```javascript
const redirectTo = route.query.redirect || '/';
router.push(redirectTo);
```

---

### 🟠 [SF-H5] `AccountPage` — cho phép cancel order dù status là `shipping`

**File:** `storefront/src/views/AccountPage.vue` dòng 136–143

**Fix:** Disable nút cancel nếu status = `shipping` hoặc `delivered`.
```javascript
const canCancel = computed(() =>
    ['pending', 'confirmed'].includes(order.status)
);
```

---

### 🟡 [SF-M1] `useAuth.js` — token từ localStorage không verify còn valid hay không

**File:** `storefront/src/composables/useAuth.js` dòng 8–9

**Vấn đề:** Load token từ localStorage khi khởi động nhưng không ping `/auth/me` để verify → user thấy mình đang đăng nhập nhưng thực ra token đã hết hạn.

**Fix:**
```javascript
onMounted(async () => {
    if (token.value) {
        try {
            const me = await apiGet('/storefront/auth/me');
            customer.value = me;
        } catch {
            // Token invalid — clear
            logout();
        }
    }
});
```

---

### 🟡 [SF-M2] `CartPage` — coupon không re-validate khi thay đổi quantity

**File:** `storefront/src/views/CartPage.vue`

**Vấn đề:** Coupon được áp dụng với số tiền cũ. Sau khi thay đổi số lượng, coupon không cập nhật lại.

**Fix:** Gọi `revalidateCoupon()` sau mỗi lần `updateQty()`.

---

### 🟡 [SF-M3] `CheckoutPage` — không có watcher tự động recalculate shipping khi đổi địa chỉ

**File:** `storefront/src/views/CheckoutPage.vue` dòng 283–318

**Fix:**
```javascript
watch([selectedProvince, selectedWard], async () => {
    if (selectedProvince.value && selectedWard.value) {
        await fetchShippingOptions();
    }
});
```

---

### 🟡 [SF-M4] `api.js` — không có timeout cho fetch calls

**File:** `storefront/src/api.js`

**Vấn đề:** Nếu server không phản hồi, user chờ mãi.

**Fix:**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

const res = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeoutId);
```

---

## PHẦN 5 — DATABASE: THIẾU INDEXES

---

### 🟡 [DB-M1] Thiếu index trên các cột foreign key quan trọng

**Các bảng cần thêm index:**

```php
// orders table:
$table->index('customer_id');
$table->index('status');
$table->index('created_at');

// orders_detail table:
$table->index('product_id');
$table->index('order_id');

// products table:
$table->index('category_id');
$table->index('brand_id');
$table->index('is_active');
$table->index(['is_active', 'is_featured']); // Composite cho storefront

// stock_histories table:
$table->index('product_id');
$table->index('created_at');
```

---

## TỔNG HỢP THEO MỨC ĐỘ

### 🔴 Critical (Sửa ngay — có thể gây crash hoặc mất dữ liệu)

| ID | Khu vực | Mô tả ngắn |
|----|---------|-----------|
| BE-C1 | Backend Migration | `stock_histories` thiếu cột `user_id` → crash khi điều chỉnh tồn kho |
| BE-C2 | Backend Migration | `purchase_orders` thiếu FK supplier |
| BE-C3 | Backend Migration | `wishlists` thiếu FK constraints |
| BE-C4 | Backend Logic | Cancel order không hoàn trả tồn kho |
| BE-C5 | Backend Logic | Order status transition không validate (canTransitionTo không dùng) |
| BE-C6 | Backend Security | Password reset trả về plain-text password |
| BE-C7 | Backend Security | UpdateAction Product/Category không validate → mass assignment |
| BE-C8 | Backend Logic | StockReceipt confirm không dùng DB::transaction |
| BE-C9 | Backend UX | forgotPassword là fake — không gửi email |
| FE-C1 | Frontend Storefront | Checkout double submit tạo đơn trùng |
| FE-C2 | Frontend Storefront | variant_id không gửi khi add to cart |
| FE-C3 | Frontend Storefront | 401 không redirect về login |
| FE-A1 | Frontend Admin | CustomerManager xóa địa chỉ dùng sai biến → crash |
| FE-A2 | Frontend Admin | RoleManager xóa role không check users |

### 🟠 High (12 issues) — sửa trong sprint tới

BE-H1 đến BE-H12, SF-H1 đến SF-H5

### 🟡 Medium/Low (15 issues) — backlog

FE-M1 đến FE-M3, SF-M1 đến SF-M4, DB-M1

---

**Tổng cộng: ~41 issues được phát hiện**
- 🔴 Critical: 14
- 🟠 High: 17
- 🟡 Medium/Low: 10
