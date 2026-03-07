# ROADMAP PHÁT TRIỂN "AI LIVE TOOL"

> Kế hoạch phát triển các tính năng tiếp theo cho hệ thống quản lý livestream thương mại đa nền tảng.

---

## PHASE 1: CƠ SỞ HẠ TẦNG & ỔN ĐỊNH (3-4 tuần)

### 1.1. Docker Hóa & CI/CD Pipeline ⚡ Critical
- Tạo Dockerfile cho backend + frontend, docker-compose với PostgreSQL + Redis
- CI/CD pipeline cơ bản (GitHub Actions)
- **Files:** Tạo `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.github/workflows/deploy.yml`

### 1.2. Socket.IO Authentication ⚡ Critical
- Hiện tại socket không có auth — bất kỳ client nào cũng join được shop room
- Thêm middleware xác thực token khi connect, verify quyền truy cập shop
- **Files:** `start/socket.ts`, `frontend/src/composables/useSocket.js`, `services/scope_helper.ts`

### 1.3. Environment Config & Secrets Management 🔶 High
- Tạo `.env.example` đầy đủ, document các env vars cần thiết
- **Files:** `.env.example`, `docs/setup.md`

### 1.4. Testing Foundation 🔶 High
- Setup Japa test runner (đã có trong devDependencies)
- Unit tests cho core services (ai_service, spam_filter), integration tests cho API endpoints chính
- **Files:** `tests/unit/`, `tests/functional/`

### 1.5. Persistent Webhook Storage 🔶 High
- Webhook service hiện lưu trong Map in-memory, mất khi restart
- Chuyển sang bảng `webhooks` trong DB
- **Files:** Migration mới, model `webhook.ts`, sửa `services/webhook_service.ts`

---

## PHASE 2: KIỂM SOÁT TRUY CẬP & CỘNG TÁC NHÓM (4-5 tuần)

### 2.1. Hệ thống phân quyền RBAC ⚡ Critical
- Xây dựng roles: Owner, Manager, Operator, Viewer với permissions khác nhau
- **Files:** Migrations `roles`, `permissions`, `role_permissions` tables; middleware `rbac_middleware.ts`; frontend `RoleManagement.vue`

### 2.2. Mời thành viên tham gia Shop ⚡ Critical
- Bảng `shop_members` liên kết User ↔ Shop với role cụ thể
- Thay đổi `scope_helper.ts` từ "user owns shop" sang "user is member of shop"
- **Files:** Migration `shop_members`, model mới, sửa `scope_helper.ts`, tạo `TeamManagement.vue`

### 2.3. Activity Log 🔶 High
- Ghi lại mọi hành động quan trọng (ai sửa lead, ai tạo order, ai kết nối live...)
- **Files:** Migration + model `activity_log`, service `activity_log_service.ts`, frontend `ActivityLog.vue`

### 2.4. Nâng cấp Profile & Account 🔵 Medium
- Thêm avatar upload, timezone, notification preferences, API key management
- **Files:** Sửa `ProfileModal.vue` → tạo `ProfileSettings.vue` full page

---

## PHASE 3: THƯƠNG MẠI & TÍCH HỢP (5-6 tuần)

### 3.1. Quản lý Tồn kho (Inventory) ⚡ Critical
- Product model chưa có `stock`, `sku`, `variants`
- Tự động trừ tồn kho khi tạo order, alert khi low stock
- **Files:** Migration thêm fields vào `products`, tạo `inventory_service.ts`, `InventoryManager.vue`

### 3.2. Tích hợp Cổng thanh toán (VNPay/MoMo/ZaloPay) 🔶 High
- Order đã có `paymentMethod`, `paymentStatus` nhưng chưa có payment processing
- **Files:** `payment_service.ts`, `vnpay_provider.ts`, `momo_provider.ts`, migration `payments` table

### 3.3. Tích hợp Vận chuyển (GHN/GHTK/Viettel Post) 🔶 High
- Tự động tạo vận đơn, tính phí ship, cập nhật trạng thái giao hàng
- **Files:** `shipping_service.ts`, `ghn_provider.ts`, model `shipment.ts`, sửa `OrderManagement.vue`

### 3.4. Tự động tạo Đơn từ Lead (Auto Order) 🔶 High
- AI detect "lấy 2 cái áo đỏ" → tự động tạo draft order với sản phẩm matched
- **Files:** `auto_order_service.ts`, sửa `connection_manager.ts`, sửa `ai_service.ts` thêm `quantity_intent`

### 3.5. Hoàn thiện Platform Connectors (Facebook/YouTube/Shopee) 🔶 High
- Thêm retry logic, token refresh, error handling cho các connector chưa hoàn thiện
- **Files:** Sửa `services/connectors.ts`, tạo `connector_health_service.ts`

---

## PHASE 4: AI NÂNG CAO & TRẢI NGHIỆM NGƯỜI DÙNG (4-5 tuần)

### 4.1. AI Gợi ý Kịch bản Live 🔶 High
- Dựa trên data phiên live trước (top keywords, sản phẩm bán chạy), AI gợi ý kịch bản
- **Files:** `script_suggestion_service.ts`, sửa `ScriptPrompter.vue`, `SchedulePlanner.vue`

### 4.2. Nâng cấp Sentiment Gauge & Pricing Suggestion 🔵 Medium
- Chuyển sang auto-update realtime (mỗi 30s), thêm trending chart
- **Files:** Sửa `SentimentGauge.vue`, `PricingSuggestion.vue`

### 4.3. Smart Customer Segmentation 🔵 Medium
- Tự động phân loại: VIP, Frequent Viewer, Price Sensitive, New Customer
- **Files:** Migration thêm `segment`, `lifetime_value` vào customers; `customer_segmentation_service.ts`

### 4.4. Đa ngôn ngữ / i18n 🔵 Medium
- Tách text ra file locale, hỗ trợ tiếng Anh cho seller quốc tế
- **Files:** `locales/vi.json`, `locales/en.json`, `composables/useI18n.js`

### 4.5. Realtime Collaboration Indicators 🔵 Medium
- Hiển thị ai đang online, ai đang xem lead nào — tránh trùng lặp công việc
- **Files:** Sửa `start/socket.ts` thêm presence events, frontend avatar indicators

---

## PHASE 5: MỞ RỘNG & TỐI ƯU (4-5 tuần)

### 5.1. Redis Integration ⚡ Critical
- Chuyển cache/queue từ in-memory sang Redis (tiền đề cho horizontal scaling)
- **Files:** `config/redis.ts`, sửa `ai_queue.ts`, `auto_reply_service.ts`, `reply_service.ts`

### 5.2. Webhook API cho Tích hợp Bên ngoài 🔶 High
- RESTful Webhook API: CRUD, retry logic, delivery logs, HMAC signature
- **Files:** Rewrite `webhook_service.ts`, tạo `webhooks_controller.ts`, `WebhookSettings.vue`

### 5.3. Performance Optimization 🔶 High
- Database indexes, batch insert cho chat_logs, virtual scrolling cho comment list, lazy loading components
- **Files:** Migration thêm indexes, sửa `connection_manager.ts` (batch save), sửa `ChatStream.vue`

### 5.4. Mobile Responsive & PWA 🔶 High
- PWA manifest + service worker, push notifications trên mobile, bottom tab navigation
- **Files:** `manifest.json`, `sw.js`, `MobileNav.vue`, sửa tất cả components responsive

### 5.5. Export Nâng cao & Báo cáo Tự động 🔵 Medium
- Excel (xlsx), PDF report với charts, scheduled auto-report gửi qua email/Telegram
- **Files:** Thêm `exceljs`/`pdfkit`, `scheduled_report_service.ts`, `email_service.ts`

---

## PHASE 6: LỢI THẾ CẠNH TRANH (4-6 tuần)

### 6.1. AI Coaching Realtime 🔶 High
- AI phân tích engagement realtime và gợi ý: "Nên nhắc lại giá sản phẩm X, có 5 người hỏi trong 2 phút qua"
- **Files:** `coaching_service.ts`, `CoachingTips.vue`, socket event `coaching_tip`

### 6.2. Multi-Stream Dashboard 🔶 High
- Dashboard tổng hợp xem tất cả live sessions đang chạy, so sánh performance
- **Files:** `MultiStreamView.vue`, sửa `useSocket.js` hỗ trợ nhiều shop rooms

### 6.3. Customer Remarketing 🔵 Medium
- Tự động gửi thông báo cho khách hàng cũ khi có live session mới (Zalo OA, Messenger, SMS)
- **Files:** `remarketing_service.ts`, `zalo_oa_service.ts`, `RemarketingCampaign.vue`

### 6.4. AI Product Recommendations 🔵 Medium
- Khi khách hỏi chung chung, AI gợi ý sản phẩm dựa trên lịch sử mua hàng
- **Files:** `recommendation_service.ts`, sửa `connection_manager.ts`

### 6.5. Post-Live Analytics Report 🔶 High
- Kết thúc live → auto generate báo cáo chi tiết: peak time, sản phẩm hot, conversion rate
- **Files:** `post_live_report_service.ts`, sửa `connection_manager.ts`, `PostLiveReport.vue`

---

## TÓM TẮT

| Phase | Thời gian | Critical | High | Medium |
|-------|-----------|----------|------|--------|
| 1. Cơ sở hạ tầng | 3-4 tuần | 2 | 3 | 0 |
| 2. RBAC & Team | 4-5 tuần | 2 | 1 | 1 |
| 3. Thương mại | 5-6 tuần | 1 | 4 | 0 |
| 4. AI & UX | 4-5 tuần | 0 | 1 | 4 |
| 5. Scale & Tối ưu | 4-5 tuần | 1 | 3 | 1 |
| 6. Lợi thế cạnh tranh | 4-6 tuần | 0 | 3 | 2 |

**Tổng: ~24-31 tuần (6-8 tháng)**

---

## THỨ TỰ ƯU TIÊN (nếu 1 developer)

1. Docker + Socket Auth (Phase 1.1 + 1.2) — 2 tuần
2. Persistent Webhooks (1.5) — 3 ngày
3. RBAC + Team (2.1 + 2.2) — 4 tuần
4. Inventory (3.1) — 2 tuần
5. Auto Order from Leads (3.4) — 2 tuần, USP chính
6. Complete connectors (3.5) — 1 tuần
7. Redis (5.1) — 1 tuần
8. AI Coaching (6.1) — 2 tuần, tính năng "wow"
9. Post-Live Report (6.5) — 1 tuần, giá trị cao/effort thấp

---

## 5 FILES QUAN TRỌNG NHẤT

- `backend-adonis/app/services/connection_manager.ts` — Orchestrator trung tâm
- `backend-adonis/database/schema.ts` — Master schema definition
- `backend-adonis/start/routes.ts` — Tất cả API routes
- `backend-adonis/start/socket.ts` — Socket.IO setup
- `frontend/src/App.vue` — Main application shell
