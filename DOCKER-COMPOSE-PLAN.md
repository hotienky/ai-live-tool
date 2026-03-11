# Phase 9: Docker Compose - Kế hoạch triển khai

## Tổng quan kiến trúc

```
                         ┌─────────────────────────────┐
                         │        Nginx Proxy           │
                         │       (port 80/443)          │
                         └──────────┬──────────────────┘
                                    │
                ┌───────────────────┼───────────────────────┐
                │                   │                       │
    ┌───────────┴──────┐ ┌─────────┴────────┐  ┌──────────┴──────────┐
    │  localhost/api   │ │ master.localhost  │  │ *.cms.localhost     │
    │  backend-adonis  │ │ frontend-master   │  │ s-cart (Laravel)    │
    │  :3333           │ │ :5174             │  │ :8000               │
    └──────────────────┘ └──────────────────┘  └─────────────────────┘
                                                          │
                         ┌────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │  *.localhost        │
              │  storefront         │
              │  :5173              │
              └─────────────────────┘
```

---

## Domain Mapping

| Domain                    | Service           | Container        | Internal Port |
|---------------------------|-------------------|------------------|---------------|
| `localhost/api`           | Backend AdonisJS  | `backend-adonis` | 3333          |
| `master.localhost`        | Master Admin UI   | `frontend-master`| 5174          |
| `{tenant}.cms.localhost`  | S-Cart CMS        | `s-cart`         | 8000          |
| `{tenant}.localhost`      | Storefront        | `storefront`     | 5173          |

---

## Containers cần tạo

### 1. `nginx-proxy`
- **Image:** `nginx:alpine`
- **Vai trò:** Reverse proxy, routing tất cả requests dựa trên domain
- **Port expose:** `80` (và `443` nếu cần SSL sau này)
- **Config:** Mount file `nginx/default.conf` chứa routing rules
- **Depends on:** tất cả service containers khác

### 2. `backend-adonis`
- **Build từ:** `./backend-adonis/Dockerfile`
- **Runtime:** Node.js 20
- **Port internal:** 3333
- **Env:** `.env` của AdonisJS (DB_HOST, REDIS_HOST, ...)
- **Depends on:** `postgres`, `redis`

### 3. `frontend-master`
- **Build từ:** `./frontend-master/Dockerfile`
- **Runtime:** Node.js 20 (Vite dev server hoặc nginx serve static)
- **Port internal:** 5174
- **Env:** `VITE_API_URL=http://localhost/api`

### 4. `storefront`
- **Build từ:** `./storefront/Dockerfile`
- **Runtime:** Node.js 20 (Vite dev server hoặc nginx serve static)
- **Port internal:** 5173
- **Env:** `VITE_API_URL=http://localhost/api`

### 5. `s-cart`
- **Build từ:** `./s-cart/Dockerfile`
- **Runtime:** PHP 8.2 + Apache/Nginx
- **Port internal:** 8000
- **Depends on:** `mysql`
- **Env:** `.env` của Laravel (DB_HOST=mysql, ...)

### 6. `postgres`
- **Image:** `postgres:16-alpine`
- **Port internal:** 5432
- **Volume:** `postgres_data:/var/lib/postgresql/data`
- **Env:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- **Dùng cho:** backend-adonis

### 7. `mysql`
- **Image:** `mysql:8.0`
- **Port internal:** 3306
- **Volume:** `mysql_data:/var/lib/mysql`
- **Env:** `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`
- **Dùng cho:** s-cart

### 8. `redis`
- **Image:** `redis:7-alpine`
- **Port internal:** 6379
- **Volume:** `redis_data:/data`
- **Dùng cho:** backend-adonis (cache, queue, socket)

---

## Nginx Routing Config

```nginx
# 1. Backend API - exact host "localhost"
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://backend-adonis:3333/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Socket.IO support
    location /socket.io/ {
        proxy_pass http://backend-adonis:3333/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# 2. Master Admin - exact match (ưu tiên cao hơn wildcard)
server {
    listen 80;
    server_name master.localhost;

    location / {
        proxy_pass http://frontend-master:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 3. S-Cart CMS - wildcard *.cms.localhost
server {
    listen 80;
    server_name ~^(?<tenant>.+)\.cms\.localhost$;

    location / {
        proxy_pass http://s-cart:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Tenant $tenant;
    }
}

# 4. Storefront - wildcard *.localhost (catch-all, ưu tiên thấp nhất)
server {
    listen 80;
    server_name ~^(?<tenant>.+)\.localhost$;

    location / {
        proxy_pass http://storefront:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Tenant $tenant;
    }
}
```

**Thứ tự ưu tiên của Nginx:**
1. `localhost` → exact match → API
2. `master.localhost` → exact match → Master Admin
3. `*.cms.localhost` → regex match (kiểm tra trước vì regex cụ thể hơn) → S-Cart
4. `*.localhost` → regex catch-all → Storefront

---

## Cấu trúc file cần tạo

```
read-comment/
├── docker-compose.yml          # File chính
├── nginx/
│   └── default.conf            # Nginx routing config
├── backend-adonis/
│   ├── Dockerfile
│   └── .env.docker             # Env cho Docker
├── frontend-master/
│   ├── Dockerfile
│   └── .env.docker
├── storefront/
│   ├── Dockerfile
│   └── .env.docker
└── s-cart/
    ├── Dockerfile
    └── .env.docker
```

---

## Cách tenant được xác định

### Flow request:
```
User truy cập: shop1.localhost
        │
        ▼
Nginx match *.localhost → extract tenant = "shop1"
        │
        ▼
Proxy tới storefront container
Header: X-Tenant = "shop1"
        │
        ▼
Storefront gọi API: localhost/api/...
Header: X-Tenant = "shop1" (hoặc từ subdomain)
        │
        ▼
Backend-adonis đọc tenant từ header/subdomain
→ Query đúng database/schema của tenant đó
```

### Flow CMS:
```
User truy cập: shop1.cms.localhost
        │
        ▼
Nginx match *.cms.localhost → extract tenant = "shop1"
        │
        ▼
Proxy tới s-cart container
Header: X-Tenant = "shop1"
        │
        ▼
S-Cart đọc tenant → load config/data của shop1
```

---

## Reserved subdomains (không được dùng làm tên tenant)

- `master` → Master Admin Panel
- `cms` → phần của CMS domain pattern
- `api` → dù là path-based nhưng nên reserve
- `admin` → dự phòng
- `www` → dự phòng

---

## Network & Volumes

### Docker Network:
- `app-network` (bridge) - tất cả containers cùng network, giao tiếp qua container name

### Volumes:
- `postgres_data` - dữ liệu PostgreSQL
- `mysql_data` - dữ liệu MySQL
- `redis_data` - dữ liệu Redis

---

## Thứ tự khởi động (depends_on)

```
postgres, mysql, redis          (databases - khởi động trước)
        │
        ▼
backend-adonis, s-cart          (backends - cần database)
        │
        ▼
frontend-master, storefront     (frontends - cần API sẵn sàng)
        │
        ▼
nginx-proxy                     (proxy - cần tất cả services sẵn sàng)
```

---

## Lưu ý khi phát triển (dev mode)

1. **Hot reload:** Mount source code bằng volumes để dev không cần rebuild
   - `./backend-adonis:/app` với `node --watch`
   - `./frontend-master:/app` với Vite HMR
   - `./storefront:/app` với Vite HMR
   - `./s-cart:/var/www/html` với Laravel

2. **DNS localhost:** Trình duyệt hiện đại hỗ trợ `*.localhost` resolve về `127.0.0.1` tự động (Chrome, Firefox). Không cần sửa `/etc/hosts`.

3. **CORS:** Backend-adonis cần cho phép origins:
   - `http://master.localhost`
   - `http://*.localhost` (wildcard cho storefront)
   - `http://*.cms.localhost` (cho CMS gọi API)

4. **Production:** Thay Vite dev server bằng `nginx serve static` cho frontend containers. Thêm SSL với Let's Encrypt / Traefik.
