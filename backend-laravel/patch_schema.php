<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\Tenant;
use Stancl\Tenancy\Facades\Tenancy;

$tenant = Tenant::first();
if (!$tenant) { die("No tenant found.\n"); }
Tenancy::initialize($tenant);
echo "Initialized tenant: " . $tenant->id . "\n";

$connection = Schema::connection('tenant');

echo "Patching BANNERS...\n";
if ($connection->hasTable('banners')) {
    $connection->table('banners', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('banners', 'link')) $table->string('link')->nullable();
        if (!$connection->hasColumn('banners', 'sort_order')) $table->integer('sort_order')->default(0);
        if (!$connection->hasColumn('banners', 'is_active')) $table->boolean('is_active')->default(true);
        if (!$connection->hasColumn('banners', 'position')) $table->string('position')->nullable();
        if (!$connection->hasColumn('banners', 'start_date')) $table->datetime('start_date')->nullable();
        if (!$connection->hasColumn('banners', 'end_date')) $table->datetime('end_date')->nullable();
    });
}

echo "Patching CMS_PAGES...\n";
if ($connection->hasTable('cms_pages')) {
    $connection->table('cms_pages', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('cms_pages', 'published_at')) $table->datetime('published_at')->nullable();
        if (!$connection->hasColumn('cms_pages', 'created_by')) $table->unsignedBigInteger('created_by')->nullable();
        if (!$connection->hasColumn('cms_pages', 'updated_by')) $table->unsignedBigInteger('updated_by')->nullable();
        if (!$connection->hasColumn('cms_pages', 'meta_keywords')) $table->text('meta_keywords')->nullable();
    });
}

echo "Patching CUSTOMERS...\n";
if ($connection->hasTable('customers')) {
    $connection->table('customers', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('customers', 'name')) $table->string('name')->nullable();
        if (!$connection->hasColumn('customers', 'note')) $table->text('note')->nullable();
        if (!$connection->hasColumn('customers', 'source')) $table->string('source')->nullable();
        if (!$connection->hasColumn('customers', 'status')) $table->string('status')->nullable();
        if (!$connection->hasColumn('customers', 'tags')) $table->jsonb('tags')->nullable();
    });
}

echo "Patching LEADS...\n";
if ($connection->hasTable('leads')) {
    $connection->table('leads', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('leads', 'name')) $table->string('name')->nullable();
        if (!$connection->hasColumn('leads', 'email')) $table->string('email')->nullable();
        if (!$connection->hasColumn('leads', 'phone')) $table->string('phone')->nullable();
        if (!$connection->hasColumn('leads', 'message')) $table->text('message')->nullable();
        if (!$connection->hasColumn('leads', 'source')) $table->string('source')->nullable();
        if (!$connection->hasColumn('leads', 'assigned_to')) $table->unsignedBigInteger('assigned_to')->nullable();
        if (!$connection->hasColumn('leads', 'note')) $table->text('note')->nullable();
    });
}

echo "Patching ORDERS...\n";
if ($connection->hasTable('orders')) {
    $connection->table('orders', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('orders', 'note')) $table->text('note')->nullable();
    });
}

echo "Patching PRODUCTS...\n";
if ($connection->hasTable('products')) {
    $connection->table('products', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('products', 'content')) $table->longText('content')->nullable();
        if (!$connection->hasColumn('products', 'sort_order')) $table->integer('sort_order')->default(0);
        if (!$connection->hasColumn('products', 'meta_keywords')) $table->text('meta_keywords')->nullable();
    });
}

echo "Patching PROMOTIONS...\n";
if ($connection->hasTable('promotions')) {
    $connection->table('promotions', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('promotions', 'name')) $table->string('name')->nullable();
        if (!$connection->hasColumn('promotions', 'code')) $table->string('code')->nullable();
        if (!$connection->hasColumn('promotions', 'type')) $table->string('type')->nullable();
        if (!$connection->hasColumn('promotions', 'value')) $table->decimal('value', 12, 2)->nullable();
        if (!$connection->hasColumn('promotions', 'min_order_amount')) $table->decimal('min_order_amount', 12, 2)->nullable();
        if (!$connection->hasColumn('promotions', 'max_discount')) $table->decimal('max_discount', 12, 2)->nullable();
        if (!$connection->hasColumn('promotions', 'usage_limit')) $table->integer('usage_limit')->nullable();
        if (!$connection->hasColumn('promotions', 'used_count')) $table->integer('used_count')->default(0);
        if (!$connection->hasColumn('promotions', 'start_date')) $table->datetime('start_date')->nullable();
        if (!$connection->hasColumn('promotions', 'end_date')) $table->datetime('end_date')->nullable();
        if (!$connection->hasColumn('promotions', 'is_active')) $table->boolean('is_active')->default(true);
        if (!$connection->hasColumn('promotions', 'description')) $table->text('description')->nullable();
    });
}

echo "Patching SHOPS...\n";
if ($connection->hasTable('shops')) {
    $connection->table('shops', function (Blueprint $table) use ($connection) {
        if (!$connection->hasColumn('shops', 'domain')) $table->string('domain')->nullable();
        if (!$connection->hasColumn('shops', 'email')) $table->string('email')->nullable();
        if (!$connection->hasColumn('shops', 'phone')) $table->string('phone')->nullable();
        if (!$connection->hasColumn('shops', 'address')) $table->text('address')->nullable();
        if (!$connection->hasColumn('shops', 'settings')) $table->jsonb('settings')->nullable();
        if (!$connection->hasColumn('shops', 'user_id')) $table->unsignedBigInteger('user_id')->nullable();
    });
}

echo "All schemas successfully synchronized!\n";
