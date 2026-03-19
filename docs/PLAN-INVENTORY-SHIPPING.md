# KẾ HOẠCH TRIỂN KHAI: Quản Lý Kho & Vận Đơn

> Module Quản lý Kho hàng (Inventory) và Quản lý Vận đơn (Shipping) cho hệ thống AI Live Tool.

---

## CONTEXT

Hệ thống hiện có Order Management và Product Management nhưng thiếu:
- **Quản lý tồn kho:** stock tracking, audit log, low stock alerts, bulk import/export
- **Quản lý vận đơn:** tạo vận đơn, tích hợp nhà vận chuyển (GHN/GHTK/Viettel Post), theo dõi giao hàng

**Phát hiện quan trọng từ codebase:**
1. `ProductSchema` trong `schema.ts` ĐÃ có `sku`, `stock`, `lowStockThreshold`, `variants` — không cần tạo lại
2. `inventory_service.ts` ĐÃ có `deductStock`, `addStock`, `checkLowStock` — cần nâng cấp
3. Order items là JSONB `[{name, qty, price}]` — KHÔNG có `productId`, cần backward compatible
4. Migration 0006 và 0012 có thể conflict về `sku`/`stock` columns — cần check `hasColumn()`

---

## PHASE 1: MỞ RỘNG INVENTORY BACKEND (3-4 ngày)

### 1.1 Migration: Bổ sung fields inventory
**Tạo:** `backend-adonis/database/migrations/0014_extend_inventory_fields.ts`
```
products table += cost_price (decimal 12,2), category (string), unit (string, default 'cái'), barcode (string, unique)
```

### 1.2 Migration: Bảng `stock_history` (audit log)
**Tạo:** `backend-adonis/database/migrations/0015_create_stock_history_table.ts`
```
Fields: id, product_id (FK), shop_id (FK), user_id (FK nullable),
        action ('add'|'deduct'|'adjust'|'order_confirmed'|'order_cancelled'),
        quantity_change (int, signed: +10 or -3),
        stock_before, stock_after,
        reason ('Nhập hàng', 'Đơn #123 xác nhận', 'Điều chỉnh kiểm kê'),
        reference_type ('order'|'manual'|'import'), reference_id,
        created_at
```

### 1.3 Migration: Bảng `product_variants`
**Tạo:** `backend-adonis/database/migrations/0016_create_product_variants_table.ts`
```
Fields: id, product_id (FK), name ('Đỏ / Size M'),
        sku, price (nullable = dùng giá product cha), cost_price (nullable),
        stock, attributes (jsonb: {"color": "Đỏ", "size": "M"}),
        is_active, created_at, updated_at
```

### 1.4 Schema & Models
**Sửa:** `backend-adonis/database/schema.ts`
- Thêm `costPrice`, `category`, `unit`, `barcode` vào `ProductSchema`
- Thêm relationships: `hasMany ProductVariantSchema`, `hasMany StockHistorySchema`
- Thêm 2 schema classes mới: `StockHistorySchema`, `ProductVariantSchema`

**Tạo models:**
- `backend-adonis/app/models/stock_history.ts`
- `backend-adonis/app/models/product_variant.ts`

### 1.5 Nâng cấp inventory_service.ts
**Sửa:** `backend-adonis/app/services/inventory_service.ts`

| Function | Mô tả |
|----------|-------|
| `deductStock()` | Nâng cấp: thêm stock history logging + socket `low_stock_alert` |
| `addStock()` | Nâng cấp: thêm logging |
| `adjustStock()` | **MỚI:** Điều chỉnh trực tiếp (kiểm kê) |
| `bulkDeductForOrder()` | **MỚI:** Trừ kho theo order items |
| `bulkRestoreForOrder()` | **MỚI:** Hoàn kho khi hủy đơn |
| `getInventoryStats()` | **MỚI:** totalProducts, totalStockValue, lowStockCount, outOfStockCount |
| `emitLowStockAlert()` | **MỚI:** Socket emit khi tồn kho thấp |

### 1.6 Inventory Actions
**Tạo:**
- `backend-adonis/app/actions/inventory/get_inventory_stats_action.ts` — Stats dashboard kho
- `backend-adonis/app/actions/inventory/adjust_stock_action.ts` — Điều chỉnh kho (với reason)
- `backend-adonis/app/actions/inventory/get_stock_history_action.ts` — Lịch sử thay đổi kho
- `backend-adonis/app/actions/inventory/import_products_action.ts` — CSV parse + bulk create
- `backend-adonis/app/actions/inventory/export_products_action.ts` — Export CSV

### 1.7 Cập nhật ProductsController
**Sửa:** `backend-adonis/app/controllers/products_controller.ts`
- Thêm methods: `stats()`, `stockHistory()`, `adjustStock()`, `importCsv()`, `exportCsv()`
- Cập nhật `store()` và `update()` xử lý fields mới

### 1.8 Tích hợp Inventory vào Order Flow
**Sửa:** `backend-adonis/app/actions/orders/update_order_action.ts`
```
Khi status → 'confirmed': auto bulkDeductForOrder() (chỉ items có productId)
Khi status → 'cancelled': auto bulkRestoreForOrder()
```
**Sửa:** `backend-adonis/app/actions/orders/create_order_action.ts`
- Cập nhật items format: `[{productId, name, qty, price, variantId}]`

### 1.9 Routes mới
**Sửa:** `backend-adonis/start/routes.ts`
```
GET    /api/inventory/stats              → Thống kê kho hàng
POST   /api/products/:id/adjust-stock    → Điều chỉnh kho (với reason)
GET    /api/products/:id/stock-history   → Lịch sử thay đổi kho
POST   /api/products/import              → Import CSV
GET    /api/products/export              → Export CSV
```

---

## PHASE 2: SHIPPING BACKEND (4-5 ngày)

### 2.1 Migration: Bảng `shipments`
**Tạo:** `backend-adonis/database/migrations/0017_create_shipments_table.ts`
```
Fields:
  id, shop_id (FK), order_id (FK nullable),
  tracking_number, carrier ('ghn'|'ghtk'|'viettel_post'|'manual'),
  carrier_order_code,
  status ('pending'|'picked_up'|'in_transit'|'delivering'|'delivered'|'returned'|'cancelled'),

  # Người gửi
  sender_name, sender_phone, sender_address,

  # Người nhận
  receiver_name, receiver_phone, receiver_address,
  receiver_ward, receiver_district, receiver_province,

  # Chi phí
  shipping_fee (decimal), cod_amount (decimal), insurance_value (decimal), weight (decimal),

  # Khác
  notes, label_url, picked_up_at, delivered_at, created_at, updated_at
```

### 2.2 Migration: Bảng `shipment_history` (timeline)
**Tạo:** `backend-adonis/database/migrations/0018_create_shipment_history_table.ts`
```
Fields: id, shipment_id (FK), status, description ('Đã lấy hàng tại kho HCM'),
        location ('Kho HCM'), occurred_at, created_at
```

### 2.3 Schema & Models
**Sửa:** `backend-adonis/database/schema.ts` — thêm `ShipmentSchema`, `ShipmentHistorySchema`

**Tạo:**
- `backend-adonis/app/models/shipment.ts`
- `backend-adonis/app/models/shipment_history.ts`

### 2.4 Shipping Provider Abstraction (Strategy Pattern)
**Tạo thư mục:** `backend-adonis/app/services/shipping/`

**Interface** (`shipping_provider.ts`):
```typescript
interface ShippingProvider {
  name: string           // 'ghn' | 'ghtk' | 'viettel_post'
  displayName: string    // 'Giao Hàng Nhanh'

  createShipment(req): Promise<CreateShipmentResponse>
  cancelShipment(carrierOrderCode): Promise<boolean>
  getTracking(carrierOrderCode): Promise<TrackingEvent[]>
  calculateFee(req): Promise<{ fee: number, estimatedDays: number }>
  parseWebhookPayload(payload): { trackingNumber, status, description, timestamp } | null
}
```

**Providers:**
| File | Nhà vận chuyển | API Base |
|------|---------------|----------|
| `ghn_provider.ts` | Giao Hàng Nhanh | `online-gateway.ghn.vn/shiip/public-api` |
| `ghtk_provider.ts` | Giao Hàng Tiết Kiệm | `services.giaohangtietkiem.vn` |
| `viettel_post_provider.ts` | Viettel Post | `partner.viettelpost.vn/v2` |
| `manual_provider.ts` | Tự giao / nhập tay | Không gọi API |

**Factory** (`shipping_manager.ts`):
- Registry pattern quản lý providers
- `initializeForShop(shopConfig)` — khởi tạo providers dựa trên API keys của shop
- `getProvider(name)` — lấy provider theo tên
- `getAvailableProviders()` — danh sách providers khả dụng

### 2.5 Shipment Actions
**Tạo:**
- `backend-adonis/app/actions/shipments/create_shipment_action.ts`
  → Validate → Get provider → Call API → Save DB → Log history → Emit socket
- `backend-adonis/app/actions/shipments/update_shipment_status_action.ts`
  → Update status → Log history → If delivered: auto update order → Emit socket
- `backend-adonis/app/actions/shipments/get_shipment_stats_action.ts`
  → totalShipments, deliveryRate, avgDeliveryTime, byCarrier, byStatus
- `backend-adonis/app/actions/shipments/calculate_shipping_fee_action.ts`
  → Get provider → Call calculateFee

### 2.6 Controllers
**Tạo:** `backend-adonis/app/controllers/shipments_controller.ts`

| Method | Mô tả |
|--------|-------|
| `index()` | Danh sách vận đơn (filter: shopId, status, carrier, orderId) |
| `store()` | Tạo vận đơn |
| `show()` | Chi tiết + full history timeline |
| `updateStatus()` | Cập nhật trạng thái |
| `cancel()` | Hủy vận đơn (gọi carrier API nếu có) |
| `stats()` | Thống kê vận đơn |
| `calculateFee()` | Tính phí vận chuyển |
| `providers()` | Danh sách nhà vận chuyển khả dụng |
| `label()` | Lấy/in phiếu gửi hàng |

**Tạo:** `backend-adonis/app/controllers/shipping_webhooks_controller.ts`
- `ghn()`, `ghtk()`, `viettelPost()` — PUBLIC routes (không cần auth)
- Parse webhook → find shipment → update status → emit socket

### 2.7 Routes
**Sửa:** `backend-adonis/start/routes.ts`
```
# Authenticated
GET    /api/shipments                    → Danh sách vận đơn
POST   /api/shipments                    → Tạo vận đơn
GET    /api/shipments/stats              → Thống kê
GET    /api/shipments/providers          → Danh sách NVC
GET    /api/shipments/:id                → Chi tiết + timeline
PUT    /api/shipments/:id/status         → Cập nhật trạng thái
POST   /api/shipments/:id/cancel         → Hủy vận đơn
POST   /api/shipments/calculate-fee      → Tính phí ship
GET    /api/shipments/:id/label          → Phiếu gửi hàng

# Public webhooks (không cần auth)
POST   /api/webhooks/shipping/ghn        → Callback từ GHN
POST   /api/webhooks/shipping/ghtk       → Callback từ GHTK
POST   /api/webhooks/shipping/viettel-post → Callback từ Viettel Post
```

### 2.8 Socket Events
**Sửa:** `backend-adonis/start/socket.ts`
```
Events emitted:
  'shipment_created'  → emit to shop_{shopId}
  'shipment_updated'  → emit to shop_{shopId}
  'low_stock_alert'   → emit to shop_{shopId}
```

---

## PHASE 3: FRONTEND - QUẢN LÝ KHO (3-4 ngày)

### 3.1 InventoryManagement.vue
**Tạo:** `frontend/src/components/InventoryManagement.vue`

```
┌──────────────────────────────────────────────────────────┐
│  📦 Quản Lý Kho          [+ Thêm SP] [Import] [Export]  │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Tổng SP  │ │ Giá trị  │ │ Sắp hết  │ │ Hết hàng │    │
│  │   124    │ │  45.2M   │ │    8     │ │    3     │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├──────────────────────────────────────────────────────────┤
│  [🔍 Tìm kiếm...] [Danh mục ▼] [Trạng thái ▼]         │
├──────────────────────────────────────────────────────────┤
│  # │ Hình │ Tên SP    │ SKU  │ Giá bán │ Giá nhập │     │
│    │      │           │      │         │          │     │
│    │      │           │      │ Tồn kho │ TT       │ ⚙️  │
│  ──┼──────┼───────────┼──────┼─────────┼──────────┼──── │
│  1 │ 📷   │ Áo thun   │ AT01 │ 150,000 │  80,000  │     │
│    │      │           │      │   45    │ 🟢 Còn   │ ✏️📊│
│  2 │ 📷   │ Quần jean │ QJ02 │ 350,000 │ 180,000  │     │
│    │      │           │      │    3    │ 🟡 Sắp   │ ✏️📊│
│  3 │ 📷   │ Váy hoa   │ VH03 │ 250,000 │ 120,000  │     │
│    │      │           │      │    0    │ 🔴 Hết   │ ✏️📊│
└──────────────────────────────────────────────────────────┘
```

**Modals:**
- **Create/Edit Product:** name, sku, price, costPrice, category, unit, barcode, stock, lowStockThreshold, imageUrl, variants
- **Stock Adjustment:** quantity input, action (thêm/trừ), reason → preview stock sau điều chỉnh
- **Stock History:** Timeline hiển thị ngày, action, qty change, reason, user
- **Import CSV:** Upload file → preview table → confirm

### 3.2 Đăng ký tab trong App.vue
**Sửa:** `frontend/src/App.vue`
- Thêm tab: `{ key: 'inventory', label: 'Kho hàng', icon: Package }`
- Import + render `<InventoryManagement v-if="activeView === 'inventory'" :shopId="currentShop?.id" />`

### 3.3 Socket listener
**Sửa:** `frontend/src/composables/useSocket.js`
```javascript
socket.on('low_stock_alert', (data) => {
  showToast(`Sắp hết hàng: ${data.name} (còn ${data.stock})`, 'warning', 8000)
})
```

---

## PHASE 4: FRONTEND - QUẢN LÝ VẬN ĐƠN (3-4 ngày)

### 4.1 ShippingManagement.vue
**Tạo:** `frontend/src/components/ShippingManagement.vue`

```
┌──────────────────────────────────────────────────────────┐
│  🚚 Quản Lý Vận Đơn                  [+ Tạo vận đơn]    │
├──────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Tổng VĐ  │ │ Giao TC  │ │ TG TB    │ │ Đang VC  │    │
│  │   89     │ │  94.5%   │ │  2.3d    │ │   12     │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘    │
├──────────────────────────────────────────────────────────┤
│  [🔍 Mã VĐ...] [NVC ▼] [Trạng thái ▼]                  │
├──────────────────────────────────────────────────────────┤
│  Mã VĐ   │ Đơn hàng │ NVC  │ Người nhận │ Phí │ TT     │
│  ─────────┼──────────┼──────┼────────────┼─────┼──────  │
│  GHN-001  │ #ORD-45  │ GHN  │ Nguyễn A   │ 25k │ 🟢 Đã │
│  VTP-002  │ #ORD-46  │ VTP  │ Trần B     │ 30k │ 🟡 VC  │
│  GHTK-003 │ #ORD-47  │ GHTK │ Lê C       │ 22k │ 🔵 Chờ │
└──────────────────────────────────────────────────────────┘
```

**Modal tạo vận đơn (3 bước):**
1. **Chọn đơn hàng** → dropdown/search → auto fill thông tin người nhận
2. **Chọn nhà vận chuyển** → GHN/GHTK/VTP/Tự giao → tính phí ship
3. **Xác nhận** → review thông tin → Tạo

**Modal chi tiết vận đơn:**
- Thông tin vận đơn (tracking#, carrier, phí, COD)
- **Tracking Timeline** (vertical timeline):
  ```
  ● 07/03 14:30  Đã giao hàng thành công
  │
  ● 07/03 08:15  Đang giao hàng - Shipper Nguyễn Văn A
  │
  ● 06/03 16:00  Đang vận chuyển - Kho HCM → Kho HN
  │
  ● 06/03 10:30  Đã lấy hàng tại kho HCM
  │
  ○ 05/03 20:00  Chờ lấy hàng
  ```
- Actions: Cập nhật trạng thái, In phiếu gửi

### 4.2 Tích hợp vào OrderManagement
**Sửa:** `frontend/src/components/OrderManagement.vue`
- Thêm nút 🚚 "Tạo vận đơn" cho orders có status `confirmed`
- Click → navigate sang tab shipping với order pre-selected

### 4.3 Đăng ký tab + Socket
**Sửa:** `frontend/src/App.vue`
- Thêm tab: `{ key: 'shipping', label: 'Vận đơn', icon: Truck }`

**Sửa:** `frontend/src/composables/useSocket.js`
```javascript
socket.on('shipment_created', (data) => showToast(`Vận đơn mới: ${data.trackingNumber}`, 'info'))
socket.on('shipment_updated', (data) => showToast(`VĐ ${data.trackingNumber}: ${data.statusText}`, 'info'))
```

---

## PHASE 5: TÍCH HỢP & POLISH (2-3 ngày)

### 5.1 Auto-flows
- **Order confirmed** → auto tạo draft shipment (carrier = 'manual', pre-fill receiver info)
- **Shipment delivered** → auto update order status → 'delivered'
- **Order confirmed** → auto deduct stock (items có productId)
- **Order cancelled** → auto restore stock

### 5.2 Cập nhật services
- `activity_log_service.ts` → thêm actions: `SHIPMENT_CREATED`, `SHIPMENT_UPDATED`, `STOCK_ADJUSTED`, `PRODUCTS_IMPORTED`
- `notification_service.ts` → thêm types: `low_stock`, `shipment_update`

### 5.3 Migration: Shipping config cho shops
**Tạo:** `backend-adonis/database/migrations/0019_add_shipping_config_to_shops.ts`
```
shops table += ghn_token, ghn_shop_id, ghtk_token, viettel_post_token,
               default_sender_name, default_sender_phone, default_sender_address
```

---

## TÓM TẮT FILES

### Tạo mới (28 files)

| # | File | Mục đích |
|---|------|----------|
| 1 | `database/migrations/0014_extend_inventory_fields.ts` | Thêm cost_price, category, unit, barcode |
| 2 | `database/migrations/0015_create_stock_history_table.ts` | Bảng audit log kho |
| 3 | `database/migrations/0016_create_product_variants_table.ts` | Bảng variants sản phẩm |
| 4 | `database/migrations/0017_create_shipments_table.ts` | Bảng vận đơn |
| 5 | `database/migrations/0018_create_shipment_history_table.ts` | Timeline vận đơn |
| 6 | `database/migrations/0019_add_shipping_config_to_shops.ts` | Config NVC cho shops |
| 7 | `app/models/stock_history.ts` | Model StockHistory |
| 8 | `app/models/product_variant.ts` | Model ProductVariant |
| 9 | `app/models/shipment.ts` | Model Shipment |
| 10 | `app/models/shipment_history.ts` | Model ShipmentHistory |
| 11 | `app/actions/inventory/get_inventory_stats_action.ts` | Stats dashboard kho |
| 12 | `app/actions/inventory/adjust_stock_action.ts` | Điều chỉnh kho |
| 13 | `app/actions/inventory/get_stock_history_action.ts` | Lịch sử kho |
| 14 | `app/actions/inventory/import_products_action.ts` | Import CSV |
| 15 | `app/actions/inventory/export_products_action.ts` | Export CSV |
| 16 | `app/actions/shipments/create_shipment_action.ts` | Tạo vận đơn |
| 17 | `app/actions/shipments/update_shipment_status_action.ts` | Cập nhật trạng thái |
| 18 | `app/actions/shipments/get_shipment_stats_action.ts` | Stats vận đơn |
| 19 | `app/actions/shipments/calculate_shipping_fee_action.ts` | Tính phí ship |
| 20 | `app/controllers/shipments_controller.ts` | Controller vận đơn |
| 21 | `app/controllers/shipping_webhooks_controller.ts` | Webhook từ NVC |
| 22 | `app/services/shipping/shipping_provider.ts` | Interface abstract |
| 23 | `app/services/shipping/shipping_manager.ts` | Factory/Registry |
| 24 | `app/services/shipping/ghn_provider.ts` | Provider GHN |
| 25 | `app/services/shipping/ghtk_provider.ts` | Provider GHTK |
| 26 | `app/services/shipping/viettel_post_provider.ts` | Provider Viettel Post |
| 27 | `app/services/shipping/manual_provider.ts` | Provider tự giao |
| 28 | `frontend/src/components/InventoryManagement.vue` | UI quản lý kho |
| 29 | `frontend/src/components/ShippingManagement.vue` | UI quản lý vận đơn |

### Sửa (12 files)

| # | File | Nội dung sửa |
|---|------|-------------|
| 1 | `database/schema.ts` | Thêm fields ProductSchema + 4 schema classes mới |
| 2 | `app/services/inventory_service.ts` | Nâng cấp: stock history, bulk ops, socket alerts |
| 3 | `app/controllers/products_controller.ts` | Thêm 5 methods mới |
| 4 | `app/actions/orders/update_order_action.ts` | Auto deduct/restore stock + auto create shipment |
| 5 | `app/actions/orders/create_order_action.ts` | Items format thêm productId |
| 6 | `start/routes.ts` | Thêm inventory + shipping + webhook routes |
| 7 | `start/socket.ts` | Thêm shipment events |
| 8 | `frontend/src/App.vue` | Thêm 2 tabs (Kho hàng, Vận đơn) |
| 9 | `frontend/src/composables/useSocket.js` | Thêm 3 event listeners |
| 10 | `frontend/src/components/OrderManagement.vue` | Thêm nút "Tạo vận đơn" |
| 11 | `app/services/activity_log_service.ts` | Thêm actions constants |
| 12 | `app/services/notification_service.ts` | Thêm notification types |

---

## API ENDPOINTS TỔNG HỢP

### Inventory (authenticated)
| Method | Path | Mục đích |
|--------|------|----------|
| GET | `/api/products` | Danh sách SP (đã có) |
| POST | `/api/products` | Tạo SP (cập nhật thêm fields) |
| PUT | `/api/products/:id` | Cập nhật SP (cập nhật thêm fields) |
| DELETE | `/api/products/:id` | Xóa SP (đã có) |
| GET | `/api/inventory/stats` | Thống kê kho hàng |
| GET | `/api/inventory/low-stock` | SP sắp hết (đã có) |
| PUT | `/api/products/:id/stock` | Thêm/trừ kho nhanh (đã có) |
| POST | `/api/products/:id/adjust-stock` | Điều chỉnh kho (với reason) |
| GET | `/api/products/:id/stock-history` | Lịch sử thay đổi kho |
| POST | `/api/products/import` | Import CSV |
| GET | `/api/products/export` | Export CSV |

### Shipping (authenticated)
| Method | Path | Mục đích |
|--------|------|----------|
| GET | `/api/shipments` | Danh sách vận đơn |
| POST | `/api/shipments` | Tạo vận đơn |
| GET | `/api/shipments/:id` | Chi tiết + timeline |
| PUT | `/api/shipments/:id/status` | Cập nhật trạng thái |
| POST | `/api/shipments/:id/cancel` | Hủy vận đơn |
| GET | `/api/shipments/stats` | Thống kê vận đơn |
| GET | `/api/shipments/providers` | Danh sách NVC |
| POST | `/api/shipments/calculate-fee` | Tính phí vận chuyển |
| GET | `/api/shipments/:id/label` | Phiếu gửi hàng |

### Webhooks (public)
| Method | Path | Mục đích |
|--------|------|----------|
| POST | `/api/webhooks/shipping/ghn` | Callback GHN |
| POST | `/api/webhooks/shipping/ghtk` | Callback GHTK |
| POST | `/api/webhooks/shipping/viettel-post` | Callback Viettel Post |

---

## THỨ TỰ TRIỂN KHAI

```
Phase 1 (3-4d)   Inventory Backend
    │  1.1-1.3  Migrations
    │  1.4      Schema & Models
    │  1.5      Inventory Service upgrade
    │  1.6-1.7  Actions & Controller
    │  1.8-1.9  Order integration & Routes
    ▼
Phase 2 (4-5d)   Shipping Backend
    │  2.1-2.3  Migrations, Schema & Models
    │  2.4      Provider abstraction (Strategy Pattern)
    │  2.5-2.6  Actions & Controllers
    │  2.7-2.8  Routes & Socket events
    ▼
Phase 3 (3-4d)   Frontend Inventory
    │  3.1      InventoryManagement.vue
    │  3.2-3.3  App.vue tab + Socket listener
    ▼
Phase 4 (3-4d)   Frontend Shipping
    │  4.1      ShippingManagement.vue
    │  4.2-4.3  OrderManagement update + App.vue tab + Socket
    ▼
Phase 5 (2-3d)   Tích hợp & Polish
    │  5.1      Auto-flows (order ↔ inventory ↔ shipping)
    │  5.2-5.3  Services update + Shipping config
    ▼
    ✅ DONE
```

**Tổng thời gian ước tính: 15-20 ngày**

---

## LƯU Ý QUAN TRỌNG

1. **Migration conflict:** File 0006 đã có `sku` và `stock`, file 0012 cũng thêm lại. Cần dùng `hasColumn()` check trước khi thêm
2. **Backward compatible:** Order items cũ không có `productId` → code mới phải check `if (item.productId)` trước khi deduct stock
3. **Shipping API keys:** Lưu per-shop trong bảng `shops` (migration 0019)
4. **Error handling:** Tất cả calls tới carrier API cần try/catch + retry logic
5. **Mock mode:** Mỗi shipping provider nên có mock mode để test không cần API key thật

---

## KIỂM THỬ

1. **Inventory flow:** Tạo SP → điều chỉnh stock → xác nhận đơn → verify stock giảm → hủy đơn → verify stock phục hồi → check history log
2. **Shipping flow:** Tạo VĐ từ đơn hàng → verify carrier API → cập nhật trạng thái → verify order auto-update khi delivered → test webhook callback
3. **Real-time:** Giảm stock dưới threshold → verify toast warning hiển thị
4. **Edge cases:** Đơn hàng cũ không có productId → verify không lỗi khi confirm/cancel
