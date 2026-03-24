<?php

require __DIR__.'/../backend-laravel/vendor/autoload.php';
$app = require_once __DIR__.'/../backend-laravel/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\TenantModuleSubscription;
use Illuminate\Support\Facades\Artisan;

$tenantModules = [
    33 => ['blog', 'cms', 'banners', 'marketing', 'languages'], // blog
    34 => ['ecom', 'cms', 'banners', 'marketing', 'languages', 'flash-sales', 'shipping'], // shop
    35 => ['events', 'cms', 'banners', 'marketing', 'languages'], // event
    36 => ['booking', 'cms', 'banners', 'marketing', 'languages'], // service
    37 => ['realestate', 'cms', 'banners', 'marketing', 'languages'], // bds
    38 => ['ecom', 'restaurant', 'cms', 'banners', 'marketing', 'languages'], // restaurant
    39 => ['ecom', 'salon', 'cms', 'banners', 'marketing', 'languages'], // spa
];

foreach ($tenantModules as $tenantId => $modules) {
    foreach ($modules as $moduleId) {
        TenantModuleSubscription::updateOrCreate(
            ['tenant_id' => $tenantId, 'module_id' => $moduleId],
            ['is_active' => true, 'status' => 'active']
        );
    }
    echo "Tenant $tenantId subscribed to modules: " . implode(', ', $modules) . "\n";
}

Artisan::call('cache:clear');
echo "Cache cleared. Done.\n";
