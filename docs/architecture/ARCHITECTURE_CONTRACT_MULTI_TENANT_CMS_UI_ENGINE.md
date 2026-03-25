# 🧠 ARCHITECTURE CONTRACT – MULTI-TENANT CMS + UI ENGINE

---

# 1. 🎯 PRINCIPLE (NGUYÊN TẮC BẮT BUỘC)

## P1. Multi-tenant isolation

- Mọi bảng PHẢI có `tenant_id`
- Mọi query PHẢI filter theo `tenant_id`
- Không được phép bypass

---

## P2. UI là JSON (Server-driven UI)

- Không hardcode layout trong frontend
- UI phải được render từ JSON layout

---

## P3. Component whitelist

- Chỉ render component có trong registry
- Không cho phép custom HTML/JS từ CMS

---

## P4. Plugin-based architecture

- Không tạo table theo ngành trong core
- Mọi feature business phải nằm trong plugin/module

---

## P5. Separation of concerns

| Layer     | Responsibility    |
| --------- | ----------------- |
| CMS       | config layout     |
| API       | trả layout + data |
| UI Engine | render            |
| Plugin    | business logic    |

---

# 2. 📦 CORE ARCHITECTURE

## Core Tables (BẮT BUỘC)

- tenants
- users
- pages
- page_versions
- themes
- components
- tenant_plugins

---

## ❌ Forbidden

- Không tạo bảng kiểu:
  - `real_estate_*`
  - `restaurant_*`
  - `hotel_*`

👉 Thay vào đó: Plugin

---

# 3. 🔌 PLUGIN RULES

## Mỗi plugin PHẢI có:

### 1. Database

- migration riêng
- prefix rõ ràng

### 2. API

- route riêng
- controller riêng

### 3. UI

- component riêng
- registry inject

---

## Ví dụ plugin Ecommerce

```
modules/Ecommerce/
  ├── Models/
  ├── Migrations/
  ├── Controllers/
  ├── routes.php
  ├── components/
```

---

# 4. 🧩 UI ENGINE CONTRACT

## Layout JSON chuẩn

```json
{
  "type": "banner",
  "props": {},
  "data": {},
  "children": []
}
```

---

## Renderer rules

- render theo `type`
- không render nếu không có component
- recursive children

---

## Component registry

```js
registry = {
  banner: Banner,
  blog_list: BlogList,
};
```

---

## ❌ Forbidden

- if/else render UI theo logic cứng
- gọi API trực tiếp trong component

---

# 5. 🔌 DATA LAYER (BFF)

## Rule

- Component KHÔNG fetch API
- Laravel phải resolve data trước

---

## Flow

```
Layout JSON
   ↓
Laravel resolve data
   ↓
Inject vào props
   ↓
Frontend render
```

---

# 6. ⚡ CACHE CONTRACT

## Cache key

```
tenant:{tenant_id}:page:{slug}
```

---

## Rule

- Cache layout + data
- Clear cache khi publish

---

# 7. 🎨 THEME SYSTEM

## Theme structure

```json
{
  "colors": {},
  "font": {},
  "spacing": {}
}
```

---

## Rule

- Không hardcode màu trong component
- Phải đọc từ theme

---

# 8. 🛠️ CMS EDITOR RULE

- Edit layout dạng tree
- Không edit raw HTML
- Preview realtime bằng renderer

---

# 9. 🔒 SECURITY RULE

## BẮT BUỘC

- Validate JSON schema
- Không render `v-html`
- Không allow script injection

---

# 10. 🧬 VERSIONING

- Mỗi lần publish → tạo version
- Cho phép rollback

---

# 11. 🚫 ANTI-PATTERN (AI KHÔNG ĐƯỢC LÀM)

❌ Hardcode UI
❌ Tạo table theo ngành
❌ Fetch API trong component
❌ Không filter tenant_id
❌ Không cache
❌ Custom HTML từ CMS

---

# 12. ✅ CODE STYLE RULE

## Backend (Laravel)

- Service layer: xử lý logic
- Controller: chỉ gọi service
- Repository: query DB

---

## Frontend (Vue)

- Component = pure UI
- Không business logic
- Không gọi API trực tiếp

---

# 13. 🎯 ACCEPTANCE CHECKLIST (AI PHẢI PASS)

- [ ] Có tenant_id mọi table
- [ ] Layout render từ JSON
- [ ] Có component registry
- [ ] Có plugin system
- [ ] Không hardcode UI
- [ ] Có cache
- [ ] Có versioning

---

# 14. 🧠 FINAL RULE

👉 Nếu code không tuân theo các rule trên
→ PHẢI refactor lại

---

END.
