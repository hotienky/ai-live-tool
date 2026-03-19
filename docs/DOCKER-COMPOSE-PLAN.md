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
    │  backend-laravel │ │ frontend-master   │  │ frontend-cms (Vue)  │
    │  :3333           │ │ :5174             │  │ :5175               │
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

| Domain                    | Service           | Container          | Internal Port |
|---------------------------|-------------------|--------------------|---------------|
| `localhost/api`           | Backend Laravel   | `rc-backend`       | 3333          |
| `master.localhost`        | Master Admin UI   | `rc-frontend-master`| 5174         |
| `{tenant}.cms.localhost`  | Tenant CMS (Vue)  | `rc-frontend-cms`  | 5175          |
| `{tenant}.localhost`      | Storefront        | `rc-storefront`    | 5173          |

---

## Containers

### 1. `nginx-proxy`
- **Image:** `nginx:alpine`
- **Vai trò:** Reverse proxy, routing tất cả requests dựa trên domain
- **Port expose:** `80` (và `443` nếu cần SSL sau này)
- **Config:** Mount file `nginx/default.conf` chứa routing rules
- **Depends on:** tất cả service containers khác

### 2. `backend-laravel`
- **Build từ:** `./backend-laravel/Dockerfile`
- **Runtime:** PHP 8.x
- **Port internal:** 3333
- **Env:** `.env.docker` (DB_HOST=postgres, REDIS_HOST=redis, ...)
- **Depends on:** `postgres`, `redis`

### 3. `frontend-master`
- **Build từ:** `./frontend-master/Dockerfile`
- **Runtime:** Node.js 20 (Vite dev server)
- **Port internal:** 5174
- **Env:** `VITE_API_URL=http://localhost/api`

### 4. `frontend-cms`
- **Build từ:** `./frontend/Dockerfile`
- **Runtime:** Node.js 20 (Vite dev server)
- **Port internal:** 5175
- **Env:** `VITE_API_URL=http://localhost/api`

### 5. `storefront`
- **Build từ:** `./storefront/Dockerfile`
- **Runtime:** Node.js 20 (Vite dev server)
- **Port internal:** 5173
- **Env:** `VITE_API_URL=http://localhost/api`

### 6. `postgres`
- **Image:** `postgres:16-alpine`
- **Port internal:** 5432 (host: 5433)
- **Volume:** `postgres_data:/var/lib/postgresql/data`
- **Env:** `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`

### 7. `redis`
- **Image:** `redis:7-alpine`
- **Port internal:** 6379 (host: 6380)
- **Volume:** `redis_data:/data`
- **Dùng cho:** backend-laravel (cache, queue, session)

---

## Nginx Routing Config

```nginx
# 1. Backend API - exact host "localhost"
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://backend-laravel:3333/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 2. Master Admin - exact match
server {
    listen 80;
    server_name master.localhost;

    location / {
        proxy_pass http://frontend-master:5174;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}

# 3. Tenant CMS - wildcard *.cms.localhost
server {
    listen 80;
    server_name ~^(?<tenant>.+)\.cms\.localhost$;

    location / {
        proxy_pass http://frontend-cms:5175;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Tenant $tenant;
    }
}

# 4. Storefront - wildcard *.localhost (catch-all)
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
3. `*.cms.localhost` → regex match → Tenant CMS
4. `*.localhost` → regex catch-all → Storefront

---

## Network & Volumes

### Docker Network:
- `app-network` (bridge) - tất cả containers cùng network, giao tiếp qua container name

### Volumes:
- `postgres_data` - dữ liệu PostgreSQL
- `redis_data` - dữ liệu Redis

---

## Thứ tự khởi động (depends_on)

```
postgres, redis                 (databases - khởi động trước)
        │
        ▼
backend-laravel                 (backend - cần database)
        │
        ▼
frontend-master, frontend-cms, storefront  (frontends - cần API)
        │
        ▼
nginx-proxy                     (proxy - cần tất cả services)
```

---

## Reserved subdomains

- `master` → Master Admin Panel
- `cms` → phần của CMS domain pattern
- `api` → dự phòng (path-based)
- `admin` → dự phòng
- `www` → dự phòng

---

## Lưu ý khi phát triển (dev mode)

1. **Hot reload:** Mount source code bằng volumes
   - `./backend-laravel:/app`
   - `./frontend-master:/app` với Vite HMR
   - `./frontend:/app` với Vite HMR
   - `./storefront:/app` với Vite HMR

2. **DNS localhost:** `*.localhost` resolve về `127.0.0.1` tự động trên Chrome/Firefox.

3. **CORS:** Backend cần cho phép origins:
   - `http://master.localhost`
   - `http://*.localhost`
   - `http://*.cms.localhost`

4. **Production:** Thay Vite dev server bằng `nginx serve static`. Thêm SSL với Let's Encrypt / Traefik.
