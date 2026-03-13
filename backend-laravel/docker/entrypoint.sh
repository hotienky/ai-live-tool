#!/bin/sh
set -e

# Clear cached config/views/routes to ensure fresh .env is read
php artisan config:clear 2>/dev/null || true
php artisan route:clear 2>/dev/null || true
php artisan view:clear 2>/dev/null || true

# Generate APP_KEY if missing
if ! grep -q "^APP_KEY=base64:" /app/.env 2>/dev/null; then
    php artisan key:generate --force
fi

# Set permissions
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

exec "$@"
