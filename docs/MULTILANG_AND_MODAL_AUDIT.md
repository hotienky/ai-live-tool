# Multi-Language & Modal vs Page Audit
> Date: 2026-03-19 | Branch: develop

---

## PHẦN 1: MULTI-LANGUAGE CONTENT (LanguageTabs + tField)

### ✅ ĐÃ IMPLEMENT ĐẦY ĐỦ
Các component sau đã dùng đúng pattern: `LanguageTabs` + `useContentTranslations` + `tField` + gửi `translations` trong payload:

| Component | Fields được dịch |
|-----------|-----------------|
| `ProductForm.vue` | name, description, meta_title, meta_description |
| `CategoryForm.vue` | name, description, meta_title, meta_description |
| `BrandForm.vue` | name, description, meta_title, meta_description |
| `CmsPageForm.vue` | title, content, meta_title, meta_description |
| `NavLinkManager.vue` | name, url (cho nav links) + footer content |

---

### ⚠️ PARTIAL — CÓ TRANSLATIONS NHƯNG KHÔNG DÙNG `LanguageTabs` COMPONENT

#### `plugins/marketing/src/components/FlashSaleForm.vue`
- **Trạng thái**: Có `form.value.translations` và gửi payload đúng, nhưng dùng inline computed thay vì `LanguageTabs` UI component → người dùng không thấy tab chuyển ngôn ngữ
- **Cần fix**: Thêm `<LanguageTabs>` component vào template, import `useContentTranslations`, thay inline computed bằng `tField()`
- **Fields**: `name` (tên flash sale)

---

### ❌ THIẾU MULTI-LANGUAGE — CẦN IMPLEMENT

Những entity này hiển thị trên **storefront** nên cần có bản dịch:

#### 1. `PromotionManager.vue`
- **Vấn đề**: Tên promotion/coupon description hardcoded, không có LanguageTabs
- **Pattern hiện tại**: Inline form trực tiếp trong component (không tách Form riêng)
- **Cần làm**:
  - Tách thành `PromotionForm.vue` (separate page, không modal)
  - Thêm `LanguageTabs` + `tField` cho fields: `name`, `description`
  - Backend: thêm `syncTranslations('promotions', $id, $request->translations)` trong `UpdatePromotion` action

#### 2. `FlashSaleForm.vue` (plugin)
- **Cần làm**: Thêm `<LanguageTabs>` UI, dùng `tField()` thay inline computed getter/setter

---

### ℹ️ KHÔNG CẦN DỊCH (Internal/Operational Data)
Các entity sau là dữ liệu nội bộ B2B, không hiển thị ra storefront:

| Component | Lý do không cần |
|-----------|----------------|
| `SupplierManager.vue` | Dữ liệu nhà cung cấp nội bộ |
| `PurchaseOrderManager.vue` | Đơn đặt hàng nội bộ |
| `StockReceiptManager.vue` | Phiếu nhập kho nội bộ |
| `PaymentVoucherManager.vue` | Phiếu chi nội bộ |
| `CustomerManager.vue` | Dữ liệu cá nhân khách hàng |
| `RoleManager.vue` | Tên role/permission system |
| `ShippingManagement.vue` | Thông tin vận chuyển operational |
| `InventoryManagement.vue` | Quản lý tồn kho operational |

---

## PHẦN 2: MODAL → SEPARATE PAGE CONVERSION

### Yêu cầu: Tất cả màn hình TẠO MỚI / CẬP NHẬT phải là màn hình riêng, KHÔNG dùng modal

### ✅ ĐÃ ĐÚNG — Separate Page Pattern
| Component | Pattern |
|-----------|---------|
| `ProductManager.vue` | `v-if="showForm"` → render `<ProductForm>` full page |
| `CategoryManager.vue` | `v-if="showForm"` → render `<CategoryForm>` full page |
| `BrandManager.vue` | `v-if="showForm"` → render `<BrandForm>` full page |
| `CmsManager.vue` + `CmsPageForm.vue` | List → separate `<CmsPageForm>` full page |
| `FlashSaleManager.vue` | `v-if="showForm"` → render `<FlashSaleForm>` full page |

---

### ❌ DÙNG MODAL — CẦN REFACTOR SANG SEPARATE PAGE

#### 1. `CustomerManager.vue` — **PRIORITY: HIGH**
- **Hiện tại**: Modal overlay cho Create/Edit customer (tên, email, phone, địa chỉ)
- **Cần làm**:
  - Tạo `CustomerForm.vue` (separate page component)
  - `CustomerManager.vue` chỉ giữ list + `v-if="showForm"` toggle
  - Truyền `editId` prop vào `CustomerForm`

#### 2. `SupplierManager.vue` — **PRIORITY: HIGH**
- **Hiện tại**: `<div class="modal-overlay">` cho create/edit supplier (tên, địa chỉ, thông tin liên hệ)
- **Cần làm**:
  - Tạo `SupplierForm.vue` (separate page)
  - Manager giữ list + toggle

#### 3. `PurchaseOrderManager.vue` — **PRIORITY: HIGH**
- **Hiện tại**: Modal lớn (~780px) cho create PO + modal khác để view detail + modal để receive goods
- **Cần làm**:
  - Tạo `PurchaseOrderForm.vue` (full page create/edit)
  - Tạo `PurchaseOrderDetail.vue` (full page view chi tiết)
  - `ReceiveGoods` có thể giữ là modal nhỏ (action đơn giản)

#### 4. `StockReceiptManager.vue` — **PRIORITY: HIGH**
- **Hiện tại**: Modal lớn cho create receipt + modal view detail
- **Cần làm**:
  - Tạo `StockReceiptForm.vue` (full page create)
  - Tạo `StockReceiptDetail.vue` (full page view chi tiết)

#### 5. `PaymentVoucherManager.vue` — **PRIORITY: MEDIUM**
- **Hiện tại**: `<div class="modal-overlay">` cho create voucher
- **Cần làm**:
  - Tạo `PaymentVoucherForm.vue` (full page)
  - Manager giữ list + toggle

#### 6. `RoleManager.vue` — **PRIORITY: MEDIUM**
- **Hiện tại**: `<Teleport to="body">` modal cho create/edit role + assign users
- **Cần làm**:
  - Tạo `RoleForm.vue` (full page create/edit role + permissions)
  - Manager giữ list + toggle

#### 7. `ShippingManagement.vue` — **PRIORITY: MEDIUM**
- **Hiện tại**: Multi-step modal (3 bước) cho create shipment + modal update status + modal view tracking
- **Cần làm**:
  - Tạo `ShipmentForm.vue` (full page, stepper vẫn dùng được)
  - `ShipmentDetail.vue` (full page view + update status)
  - Modal xem tracking log có thể giữ lại (chỉ xem, không edit)

#### 8. `InventoryManagement.vue` — **PRIORITY: MEDIUM**
- **Hiện tại**: Modal cho stock adjustment + import CSV
- **Cần làm**:
  - `StockAdjustForm.vue` (full page hoặc dedicated section)
  - Import CSV có thể giữ modal (wizard đơn giản)

#### 9. `NavLinkManager.vue` — **PRIORITY: LOW**
- **Hiện tại**: Modal nhỏ cho create/edit nav link (name + url + icon)
- **Cân nhắc**: Form rất nhỏ (3 fields), nhưng theo yêu cầu phải là separate page
- **Cần làm**: Chuyển sang panel mở rộng hoặc dedicated form section thay vì modal overlay

#### 10. `PromotionManager.vue` — **PRIORITY: MEDIUM** (xem phần 1)
- **Hiện tại**: Inline form trong cùng component (không phải modal nhưng không phải separate page)
- **Cần làm**:
  - Tạo `PromotionForm.vue` (full page)
  - Manager giữ list + `v-if="showForm"` toggle

---

## TÓM TẮT VIỆC CẦN LÀM

### Multi-language content (i18n)
| # | Việc cần làm | File | Priority |
|---|-------------|------|----------|
| 1 | Thêm LanguageTabs UI vào FlashSaleForm | `plugins/marketing/src/components/FlashSaleForm.vue` | HIGH |
| 2 | Tách PromotionForm + thêm LanguageTabs | `PromotionManager.vue` → `PromotionForm.vue` (mới) | MEDIUM |

### Modal → Separate Page
| # | Việc cần làm | Files cần tạo/sửa | Priority |
|---|-------------|-------------------|----------|
| 3 | CustomerManager → CustomerForm | `CustomerForm.vue` (mới), `CustomerManager.vue` | HIGH |
| 4 | SupplierManager → SupplierForm | `SupplierForm.vue` (mới), `SupplierManager.vue` | HIGH |
| 5 | PurchaseOrderManager → PO Form + Detail | `PurchaseOrderForm.vue`, `PurchaseOrderDetail.vue` (mới) | HIGH |
| 6 | StockReceiptManager → Form + Detail | `StockReceiptForm.vue`, `StockReceiptDetail.vue` (mới) | HIGH |
| 7 | PaymentVoucherManager → VoucherForm | `PaymentVoucherForm.vue` (mới), `PaymentVoucherManager.vue` | MEDIUM |
| 8 | RoleManager → RoleForm | ✅ DONE | MEDIUM |
| 9 | ShippingManagement → Form + Detail | ✅ DONE | MEDIUM |
| 10 | InventoryManagement → StockAdjustForm | ✅ DONE | MEDIUM |
| 11 | NavLinkManager → Panel/Section thay modal | `NavLinkManager.vue` refactor | LOW |
| 12 | PromotionManager → PromotionForm | `PromotionForm.vue` (mới), `PromotionManager.vue` | MEDIUM |

---

## PATTERN CHUẨN ĐỂ IMPLEMENT

### Manager component (List view):
```vue
<template>
  <!-- Form view (full page) -->
  <XxxForm v-if="showForm" :edit-id="editId" @saved="onSaved" @back="showForm = false" />

  <!-- List view -->
  <div v-else class="manager">
    <!-- header + table + pagination -->
    <button @click="openCreate">+ Thêm</button>
    <tr v-for="item in items">
      <button @click="openEdit(item)">Sửa</button>
      <button @click="handleDelete(item)">Xóa</button>
    </tr>
  </div>
</template>

<script setup>
const showForm = ref(false)
const editId = ref(null)
function openCreate() { editId.value = null; showForm.value = true }
function openEdit(item) { editId.value = item.id; showForm.value = true }
function onSaved() { showForm.value = false; fetchItems() }
</script>
```

### Form component (Full page):
```vue
<script setup>
const props = defineProps({ editId: { type: Number, default: null } })
const emit = defineEmits(['saved', 'back'])
const isEditing = computed(() => !!props.editId)

// Nếu có content cần dịch:
import LanguageTabs from './LanguageTabs.vue'
import { useContentTranslations } from '../composables/useContentTranslations.js'
const currentLang = ref('vi')
const { tField } = useContentTranslations(form, currentLang, 'vi')
const fName = tField('name')
const fDescription = tField('description')
</script>
```
