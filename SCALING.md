# Hướng dẫn Scale Server theo số lượng Tenant

> Tài liệu này dành cho hệ thống **AI Live Commerce** — multi-tenant Laravel + PostgreSQL + Redis + pgBouncer chạy trên Docker.

---

## Mục lục

- [Công thức tính tải](#công-thức-tính-tải)
- [Mốc 5–20 tenant](#mốc-5–20-tenant)
- [Mốc 50–100 tenant](#mốc-50–100-tenant)
- [Mốc 200–500 tenant](#mốc-200–500-tenant)
- [Mốc 500–1000 tenant](#mốc-500–1000-tenant)
- [Checklist deploy server mới](#checklist-deploy-server-mới)
- [Monitoring & dấu hiệu cần nâng cấp](#monitoring--dấu-hiệu-cần-nâng-cấp)
- [Nhà cung cấp gợi ý](#nhà-cung-cấp-gợi-ý)

---

## Công thức tính tải

```
Giả định mỗi tenant: 3.000 request/ngày, peak trong 4 giờ cao điểm

req/giây peak = (số tenant × 3.000) ÷ (4 giờ × 3.600 giây)

Ví dụ:
  100 tenant → 300.000 ÷ 14.400 ≈ 21 req/giây peak
  500 tenant → 1.500.000 ÷ 14.400 ≈ 104 req/giây peak

Workers PHP-FPM cần = req/giây peak × thời gian xử lý trung bình (0,15s)
  100 tenant → 21 × 0,15 ≈ 4 workers tối thiểu → 20 workers (×5 buffer)
  500 tenant → 104 × 0,15 ≈ 16 workers tối thiểu → 50 workers (×3 buffer)
```

---

## Mốc 5–20 tenant

### Cấu hình server

| Thành phần | Spec |
|------------|------|
| CPU | 1 vCPU |
| RAM | 2 GB |
| Disk | 20 GB SSD |
| Bandwidth | 1 TB/tháng |

### Ước tính tài nguyên

```
Traffic peak        : ~1 req/giây
PHP-FPM workers     : 5
RAM thực tế dùng    :
  PHP-FPM (5×30MB)  =  150 MB
  PostgreSQL        =  200 MB
  Redis             =  100 MB
  pgBouncer         =   20 MB
  Nginx + OS        =  400 MB
  Docker overhead   =  200 MB
  ─────────────────────────────
  Tổng              ≈ 1.070 MB  → 2 GB là đủ thoải mái
```

### Cấu hình docker-compose cần chỉnh

```yaml
# docker-compose.yml — không cần thay đổi gì so với mặc định
```

### Cấu hình PHP-FPM

```ini
# backend-laravel/docker/php-fpm.conf
[www]
pm = dynamic
pm.max_children = 10
pm.start_servers = 3
pm.min_spare_servers = 2
pm.max_spare_servers = 5
pm.max_requests = 500
```

### Cấu hình pgBouncer

```yaml
# docker-compose.yml — pgbouncer service
PGBOUNCER_DEFAULT_POOL_SIZE: 10
PGBOUNCER_MAX_CLIENT_CONN: 100
```

### Chi phí tham khảo

| Nhà cung cấp | Gói | Giá/tháng |
|---|---|---|
| Vultr (Singapore) | 1 vCPU / 2GB | ~$12 |
| DigitalOcean (Singapore) | 1 vCPU / 2GB | ~$12 |
| VCCloud (Việt Nam) | 1 vCPU / 2GB | ~150.000 VND |
| Viettel IDC (Việt Nam) | 1 vCPU / 2GB | ~180.000 VND |

### Việc cần làm

- [x] `docker compose up -d`
- [x] `php artisan migrate --force`
- [ ] Setup backup: crontab dump postgres mỗi đêm 2h sáng
- [ ] Cấu hình Nginx HTTPS (Let's Encrypt)

---

## Mốc 50–100 tenant

### Cấu hình server

| Thành phần | Spec |
|------------|------|
| CPU | 2 vCPU |
| RAM | 4 GB |
| Disk | 40 GB SSD |
| Bandwidth | 3 TB/tháng |

### Ước tính tài nguyên

```
Traffic peak        : ~21 req/giây
PHP-FPM workers     : 20
RAM thực tế dùng    :
  PHP-FPM (20×30MB) =  600 MB
  PostgreSQL        =  400 MB
  Redis             =  200 MB
  pgBouncer         =   20 MB
  Nginx + OS        =  500 MB
  Docker overhead   =  400 MB
  ─────────────────────────────
  Tổng              ≈ 2.120 MB  → 4 GB để còn headroom
```

### Cấu hình PHP-FPM

```ini
[www]
pm = dynamic
pm.max_children = 20
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 8
pm.max_requests = 500
```

### Cấu hình pgBouncer

```yaml
PGBOUNCER_DEFAULT_POOL_SIZE: 25
PGBOUNCER_MIN_POOL_SIZE: 5
PGBOUNCER_MAX_CLIENT_CONN: 300
```

### Cấu hình PostgreSQL

```yaml
# docker-compose.yml — postgres service
command: >
  postgres
  -c max_connections=100
  -c shared_buffers=256MB
  -c work_mem=4MB
  -c maintenance_work_mem=64MB
  -c effective_cache_size=1GB
```

### Chi phí tham khảo

| Nhà cung cấp | Gói | Giá/tháng |
|---|---|---|
| Vultr (Singapore) | 2 vCPU / 4GB | ~$24 |
| DigitalOcean (Singapore) | 2 vCPU / 4GB | ~$24 |
| VCCloud (Việt Nam) | 2 vCPU / 4GB | ~300.000 VND |
| Viettel IDC (Việt Nam) | 2 vCPU / 4GB | ~350.000 VND |

### Việc cần làm

- [ ] Tăng `pm.max_children = 20` trong PHP-FPM
- [ ] Bật Laravel config + route cache:
  ```bash
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
  ```
- [ ] Setup **Cloudflare** (free) phía trước: cache static assets, bảo vệ DDoS
- [ ] Setup **backup tự động** hằng ngày + kiểm tra restore mỗi tuần
- [ ] Bật **Horizon** để monitor queue jobs

---

## Mốc 200–500 tenant

### Cấu hình server

| Thành phần | Spec |
|------------|------|
| CPU | 4 vCPU |
| RAM | 8 GB |
| Disk | 80 GB SSD NVMe |
| Bandwidth | 5 TB/tháng |

### Ước tính tài nguyên

```
Traffic peak        : ~104 req/giây
PHP-FPM workers     : 50
RAM thực tế dùng    :
  PHP-FPM (50×30MB) = 1.500 MB
  PostgreSQL        =   800 MB
  Redis             =   300 MB
  pgBouncer         =    30 MB
  Nginx + OS        =   500 MB
  Docker overhead   =   500 MB
  ─────────────────────────────
  Tổng              ≈ 3.630 MB  → 8 GB để còn buffer
```

### Cấu hình PHP-FPM

```ini
[www]
pm = dynamic
pm.max_children = 50
pm.start_servers = 10
pm.min_spare_servers = 5
pm.max_spare_servers = 15
pm.max_requests = 300
pm.process_idle_timeout = 10s
```

### Cấu hình pgBouncer

```yaml
PGBOUNCER_DEFAULT_POOL_SIZE: 40
PGBOUNCER_MIN_POOL_SIZE: 10
PGBOUNCER_RESERVE_POOL_SIZE: 10
PGBOUNCER_MAX_CLIENT_CONN: 600
```

### Cấu hình PostgreSQL

```yaml
command: >
  postgres
  -c max_connections=150
  -c shared_buffers=512MB
  -c work_mem=8MB
  -c maintenance_work_mem=128MB
  -c effective_cache_size=3GB
  -c random_page_cost=1.1
  -c checkpoint_completion_target=0.9
  -c wal_buffers=16MB
```

### Cấu hình Redis

```yaml
command: >
  redis-server
  --maxmemory 512mb
  --maxmemory-policy allkeys-lru
  --save 900 1
  --save 300 10
```

### Chi phí tham khảo

| Nhà cung cấp | Gói | Giá/tháng |
|---|---|---|
| Vultr (Singapore) | 4 vCPU / 8GB | ~$48 |
| DigitalOcean (Singapore) | 4 vCPU / 8GB | ~$48 |
| VCCloud (Việt Nam) | 4 vCPU / 8GB | ~600.000 VND |
| AWS EC2 ap-southeast-1 | t3.large (2vCPU/8GB) | ~$65 |

### Việc cần làm

- [ ] Tăng PHP-FPM lên 50 workers
- [ ] Cài **OPcache** và tuning:
  ```ini
  ; php.ini
  opcache.enable=1
  opcache.memory_consumption=256
  opcache.max_accelerated_files=20000
  opcache.validate_timestamps=0   ; tắt trên production
  opcache.revalidate_freq=0
  ```
- [ ] Setup **Cloudflare Pro** ($20/tháng): WAF rules, tiered cache
- [ ] Setup alert khi CPU >70% hoặc RAM >80% (dùng UptimeRobot hoặc Grafana)
- [ ] Cân nhắc chạy **Laravel Octane** (Swoole) thay PHP-FPM: tăng 3–5x throughput

---

## Mốc 500–1000 tenant

### Kiến trúc: 2 server (tách DB)

```
Internet
    │
    ▼
[Cloudflare CDN]
    │
    ▼
[Nginx Reverse Proxy]
    │
    ├──► [App Server] — Laravel + Redis + pgBouncer + Horizon
    │
    └──► [DB Server]  — PostgreSQL (private network)
```

### Cấu hình App Server

| Thành phần | Spec |
|------------|------|
| CPU | 4 vCPU |
| RAM | 8 GB |
| Disk | 60 GB SSD (app + logs) |

### Cấu hình DB Server

| Thành phần | Spec |
|------------|------|
| CPU | 4 vCPU |
| RAM | 16 GB |
| Disk | 300 GB SSD NVMe (data) |

### Ước tính tài nguyên

```
Traffic peak        : ~208 req/giây
PHP-FPM workers     : 80

App Server RAM:
  PHP-FPM (80×30MB) = 2.400 MB
  Redis             =   500 MB
  pgBouncer         =    50 MB
  Nginx + OS        =   500 MB
  Docker            =   400 MB
  ─────────────────────────────
  Tổng              ≈ 3.850 MB → 8 GB

DB Server RAM:
  PostgreSQL        = 10.000 MB
  OS                =  1.000 MB
  ─────────────────────────────
  Tổng              ≈ 11 GB   → 16 GB
```

### Cấu hình PHP-FPM

```ini
[www]
pm = dynamic
pm.max_children = 80
pm.start_servers = 15
pm.min_spare_servers = 10
pm.max_spare_servers = 25
pm.max_requests = 200
```

### Cấu hình pgBouncer

```yaml
PGBOUNCER_DEFAULT_POOL_SIZE: 50
PGBOUNCER_MIN_POOL_SIZE: 15
PGBOUNCER_RESERVE_POOL_SIZE: 15
PGBOUNCER_MAX_CLIENT_CONN: 1000
```

### Cấu hình PostgreSQL (DB Server)

```yaml
command: >
  postgres
  -c max_connections=200
  -c shared_buffers=4GB
  -c work_mem=16MB
  -c maintenance_work_mem=512MB
  -c effective_cache_size=12GB
  -c random_page_cost=1.1
  -c checkpoint_completion_target=0.9
  -c wal_buffers=64MB
  -c max_wal_size=4GB
  -c min_wal_size=1GB
  -c autovacuum_vacuum_scale_factor=0.05
  -c autovacuum_analyze_scale_factor=0.02
```

### Cấu hình Redis

```yaml
command: >
  redis-server
  --maxmemory 1gb
  --maxmemory-policy allkeys-lru
  --activerehashing yes
  --hz 20
```

### Kết nối App Server → DB Server

```yaml
# .env trên App Server
DB_HOST=<private-ip-db-server>     # dùng private network, không phải public IP
DB_PORT=5432
MASTER_DB_HOST=<private-ip-db-server>
```

```yaml
# docker-compose.yml — chỉ chạy PostgreSQL trên DB Server
# App Server chỉ chạy: backend-laravel, redis, pgbouncer, nginx-proxy, frontends
```

### Chi phí tham khảo

| Server | Nhà cung cấp | Spec | Giá/tháng |
|--------|---|---|---|
| App Server | Vultr (SG) | 4 vCPU / 8GB | ~$48 |
| DB Server | Vultr (SG) | 4 vCPU / 16GB / 300GB NVMe | ~$96 |
| **Tổng** | | | **~$144/tháng** |

| Server | Nhà cung cấp | Spec | Giá/tháng |
|--------|---|---|---|
| App Server | VCCloud (VN) | 4 vCPU / 8GB | ~600K VND |
| DB Server | VCCloud (VN) | 4 vCPU / 16GB / 300GB | ~1.200K VND |
| **Tổng** | | | **~1.800.000 VND/tháng** |

### Việc cần làm

- [ ] Provision 2 server trong cùng **datacenter / private network** (để kết nối nội bộ miễn phí, latency <1ms)
- [ ] Tách PostgreSQL ra DB Server, cập nhật `DB_HOST` trong `.env`
- [ ] Bật **PostgreSQL read replica** (optional, nếu nhiều query đọc):
  ```bash
  # Trên DB Server — cấu hình streaming replication
  # App đọc từ replica, ghi vào primary
  ```
- [ ] Setup **daily backup** PostgreSQL ra object storage (S3/Backblaze):
  ```bash
  pg_dumpall | gzip | aws s3 cp - s3://bucket/backup-$(date +%Y%m%d).sql.gz
  ```
- [ ] Cân nhắc dùng **managed PostgreSQL** (RDS, Supabase, Neon) thay tự quản lý

---

## Checklist deploy server mới

```bash
# 1. Cài Docker
curl -fsSL https://get.docker.com | sh
usermod -aG docker $USER

# 2. Cài Docker Compose plugin
apt install docker-compose-plugin -y

# 3. Clone repo
git clone <repo-url> /app
cd /app

# 4. Cấu hình env
cp backend-laravel/.env.docker backend-laravel/.env.production
# Chỉnh: APP_ENV=production, APP_DEBUG=false, domain thực, DB credentials

# 5. Khởi động
docker compose up -d

# 6. Migrate database
docker compose exec backend-laravel php artisan migrate --force
docker compose exec backend-laravel php artisan db:seed --class=SystemSeeder  # nếu có

# 7. Tối ưu Laravel
docker compose exec backend-laravel php artisan config:cache
docker compose exec backend-laravel php artisan route:cache
docker compose exec backend-laravel php artisan view:cache

# 8. Kiểm tra
docker compose ps                    # tất cả services healthy
curl http://localhost:3333/api/health  # backend OK
docker compose logs backend-laravel --tail=50  # không có error

# 9. Setup SSL (Certbot)
apt install certbot python3-certbot-nginx -y
certbot --nginx -d yourdomain.com
```

---

## Monitoring & dấu hiệu cần nâng cấp

### Metrics cần theo dõi

```bash
# CPU usage
docker stats --no-stream

# PHP-FPM active workers (nếu gần max_children → cần nâng)
docker compose exec backend-laravel bash -c "php-fpm -t && cat /var/log/php-fpm/www.log | tail -20"

# PostgreSQL connections
docker compose exec postgres psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"

# Redis memory
docker compose exec redis redis-cli info memory | grep used_memory_human

# pgBouncer stats
docker compose exec pgbouncer psql -p 5432 -U postgres pgbouncer -c "SHOW POOLS;"
```

### Dấu hiệu cần nâng cấp ngay

| Dấu hiệu | Nguyên nhân | Hành động |
|----------|-------------|-----------|
| Response time >500ms liên tục | PHP-FPM đầy worker | Tăng `max_children` hoặc nâng CPU/RAM |
| CPU >80% liên tục >10 phút | Tải thực tế vượt dự kiến | Nâng lên tier tiếp theo |
| RAM >85% | Cần thêm bộ nhớ | Nâng RAM hoặc giảm worker |
| PostgreSQL connections >80% `max_connections` | pgBouncer pool đầy | Tăng `default_pool_size` |
| Redis evictions > 0 | Cache bị đẩy ra sớm | Tăng `maxmemory` |
| Horizon queue depth tăng liên tục | Worker không xử lý kịp | Tăng `maxProcesses` trong horizon.php |

---

## Tóm tắt chi phí theo mốc

```
Mốc tenant    Server                    Giá/tháng (VN)      Giá/tháng (Vultr SG)
────────────────────────────────────────────────────────────────────────────────
5–20          1 server: 1vCPU/2GB       ~150.000 VND        ~$12
50–100        1 server: 2vCPU/4GB       ~300.000 VND        ~$24
200–500       1 server: 4vCPU/8GB       ~600.000 VND        ~$48
500–1000      2 server: 4vCPU/8GB       ~1.800.000 VND      ~$144
              + 4vCPU/16GB DB
```

> **Khuyến nghị:** Chọn nhà cung cấp Việt Nam (VCCloud, Viettel IDC) nếu khách hàng chủ yếu ở Việt Nam — ping từ TP.HCM/Hà Nội xuống còn <5ms thay vì 30–50ms khi đặt server ở Singapore.

---

*Cập nhật lần cuối: 2026-03-20*
