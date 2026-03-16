<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comprehensive tenant database schema migration.
 * Creates all tenant-level tables if they don't already exist.
 * Safe to run on both fresh DBs and existing production DBs.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Users (tenant admin/staff) ──
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('role')->default('admin');
                $table->boolean('is_active')->default(true);
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // ── Product Categories ──
        if (!Schema::hasTable('product_categories')) {
            Schema::create('product_categories', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->unsignedBigInteger('parent_id')->nullable();
                $table->integer('sort_order')->default(0);
                $table->boolean('is_active')->default(true);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();
            });
        }

        // ── Product Brands ──
        if (!Schema::hasTable('product_brands')) {
            Schema::create('product_brands', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('logo')->nullable();
                $table->boolean('is_active')->default(true);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();
            });
        }

        // ── Products ──
        if (!Schema::hasTable('products')) {
            Schema::create('products', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('sku')->unique();
                $table->string('slug')->unique();
                $table->decimal('price', 12, 2);
                $table->decimal('cost_price', 12, 2)->nullable();
                $table->decimal('promotion_price', 12, 2)->nullable();
                $table->timestamp('promotion_start')->nullable();
                $table->timestamp('promotion_end')->nullable();
                $table->string('image_url')->nullable();
                $table->json('images')->nullable();
                $table->text('description')->nullable();
                $table->string('keywords')->nullable();
                $table->string('category')->nullable();
                $table->unsignedBigInteger('category_id')->nullable();
                $table->unsignedBigInteger('brand_id')->nullable();
                $table->integer('stock')->default(0);
                $table->string('unit')->default('cái');
                $table->string('barcode')->nullable();
                $table->decimal('weight', 8, 2)->nullable();
                $table->json('variants')->nullable();
                $table->boolean('is_active')->default(true);
                $table->boolean('is_featured')->default(false);
                $table->integer('low_stock_threshold')->default(5);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();

                $table->foreign('category_id')->references('id')->on('product_categories')->nullOnDelete();
                $table->foreign('brand_id')->references('id')->on('product_brands')->nullOnDelete();
            });
        }

        // ── Product Variants ──
        if (!Schema::hasTable('product_variants')) {
            Schema::create('product_variants', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->string('name');
                $table->string('sku')->nullable();
                $table->decimal('price', 12, 2);
                $table->decimal('cost_price', 12, 2)->nullable();
                $table->decimal('promotion_price', 12, 2)->nullable();
                $table->integer('stock')->default(0);
                $table->boolean('is_active')->default(true);
                $table->json('attributes')->nullable();
                $table->timestamps();

                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // ── Banners ──
        if (!Schema::hasTable('banners')) {
            Schema::create('banners', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->string('url')->nullable();
                $table->string('type')->default('main');
                $table->integer('sort')->default(0);
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        // ── CMS Pages ──
        if (!Schema::hasTable('cms_pages')) {
            Schema::create('cms_pages', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('alias')->unique();
                $table->string('image')->nullable();
                $table->longText('content')->nullable();
                $table->integer('sort')->default(0);
                $table->boolean('status')->default(true);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();
            });
        }

        // ── Customers (CRM / Social) ──
        if (!Schema::hasTable('customers')) {
            Schema::create('customers', function (Blueprint $table) {
                $table->id();
                $table->string('unique_id')->nullable();
                $table->string('nickname')->nullable();
                $table->string('platform')->nullable();
                $table->integer('total_comments')->default(0);
                $table->integer('hot_count')->default(0);
                $table->string('last_label')->nullable();
                $table->string('phone')->nullable();
                $table->string('email')->nullable();
                $table->text('address')->nullable();
                $table->timestamps();
            });
        }

        // ── Shop Customers (Auth/Login) ──
        if (!Schema::hasTable('shop_customers')) {
            Schema::create('shop_customers', function (Blueprint $table) {
                $table->id();
                $table->string('first_name')->nullable();
                $table->string('last_name')->nullable();
                $table->string('email')->unique();
                $table->string('phone')->nullable();
                $table->string('password');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Leads ──
        if (!Schema::hasTable('leads')) {
            Schema::create('leads', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('customer_id')->nullable();
                $table->string('unique_id')->nullable();
                $table->string('nickname')->nullable();
                $table->text('comment')->nullable();
                $table->string('label')->nullable();
                $table->string('status')->default('new');
                $table->string('product_intent')->nullable();
                $table->timestamps();

                $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
            });
        }

        // ── Orders ──
        if (!Schema::hasTable('orders')) {
            Schema::create('orders', function (Blueprint $table) {
                $table->id();
                $table->string('order_number')->nullable();
                $table->unsignedBigInteger('customer_id')->nullable();
                $table->string('customer_name');
                $table->string('customer_phone');
                $table->text('customer_address');
                $table->string('customer_email')->nullable();
                $table->string('status')->default('pending');
                $table->decimal('total_amount', 12, 2)->default(0);
                $table->decimal('discount_amount', 12, 2)->default(0);
                $table->decimal('shipping_fee', 12, 2)->default(0);
                $table->string('coupon_code')->nullable();
                $table->string('payment_method')->default('cod');
                $table->string('payment_status')->default('unpaid');
                $table->json('items')->nullable();
                $table->text('notes')->nullable();
                $table->string('tracking_number')->nullable();
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->timestamp('confirmed_at')->nullable();
                $table->timestamp('shipped_at')->nullable();
                $table->timestamp('delivered_at')->nullable();
                $table->timestamps();
            });
        }

        // ── Order Details ──
        if (!Schema::hasTable('order_details')) {
            Schema::create('order_details', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('order_id');
                $table->unsignedBigInteger('product_id')->nullable();
                $table->unsignedBigInteger('variant_id')->nullable();
                $table->string('name');
                $table->string('sku')->nullable();
                $table->decimal('price', 12, 2);
                $table->integer('qty')->default(1);
                $table->decimal('total_price', 12, 2);
                $table->timestamp('created_at')->nullable();

                $table->foreign('order_id')->references('id')->on('orders')->cascadeOnDelete();
            });
        }

        // ── Coupons ──
        if (!Schema::hasTable('coupons')) {
            Schema::create('coupons', function (Blueprint $table) {
                $table->id();
                $table->string('code')->unique();
                $table->string('type')->default('percent'); // percent or fixed
                $table->decimal('value', 12, 2)->default(0);
                $table->decimal('min_order', 12, 2)->default(0);
                $table->decimal('min_order_amount', 12, 2)->default(0);
                $table->integer('max_uses')->nullable();
                $table->integer('usage_limit')->nullable();
                $table->integer('used_count')->default(0);
                $table->integer('times_used')->default(0);
                $table->timestamp('date_start')->nullable();
                $table->timestamp('date_end')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Nav Links ──
        if (!Schema::hasTable('nav_links')) {
            Schema::create('nav_links', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('url');
                $table->string('icon')->nullable();
                $table->unsignedBigInteger('parent_id')->nullable();
                $table->integer('sort')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── System Configs ──
        if (!Schema::hasTable('system_configs')) {
            Schema::create('system_configs', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('type')->default('string');
                $table->string('group_name')->default('general');
                $table->timestamps();
            });
        }

        // ── Notifications ──
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('type')->default('system');
                $table->string('title');
                $table->text('message')->nullable();
                $table->string('link')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamp('created_at')->nullable();
            });
        }

        // ── Flash Sales ──
        if (!Schema::hasTable('flash_sales')) {
            Schema::create('flash_sales', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->timestamp('start_date')->nullable();
                $table->timestamp('end_date')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Flash Sale Items ──
        if (!Schema::hasTable('flash_sale_items')) {
            Schema::create('flash_sale_items', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('flash_sale_id');
                $table->unsignedBigInteger('product_id');
                $table->decimal('original_price', 12, 2);
                $table->decimal('sale_price', 12, 2);
                $table->integer('stock_limit')->default(0);
                $table->integer('sold_count')->default(0);
                $table->timestamp('created_at')->nullable();

                $table->foreign('flash_sale_id')->references('id')->on('flash_sales')->cascadeOnDelete();
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // ── Webhooks ──
        if (!Schema::hasTable('webhooks')) {
            Schema::create('webhooks', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('url');
                $table->string('event');
                $table->boolean('is_active')->default(true);
                $table->string('secret')->nullable();
                $table->timestamps();
            });
        }

        // ── API Keys ──
        if (!Schema::hasTable('api_keys')) {
            Schema::create('api_keys', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('key')->unique();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Custom Fields ──
        if (!Schema::hasTable('custom_fields')) {
            Schema::create('custom_fields', function (Blueprint $table) {
                $table->id();
                $table->string('entity_type');
                $table->string('name');
                $table->string('label');
                $table->string('type')->default('text');
                $table->boolean('is_required')->default(false);
                $table->json('options')->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }

        // ── Activity Logs ──
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action');
                $table->string('entity_type')->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->json('data')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        // ── Promotions ──
        if (!Schema::hasTable('promotions')) {
            Schema::create('promotions', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('product_id');
                $table->decimal('price_promotion', 12, 2);
                $table->timestamp('date_start')->nullable();
                $table->timestamp('date_end')->nullable();
                $table->timestamps();

                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // ── Languages ──
        if (!Schema::hasTable('languages')) {
            Schema::create('languages', function (Blueprint $table) {
                $table->id();
                $table->string('code', 10)->unique();
                $table->string('name');
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Language Translations ──
        if (!Schema::hasTable('language_translations')) {
            Schema::create('language_translations', function (Blueprint $table) {
                $table->id();
                $table->string('language_code', 10);
                $table->string('key');
                $table->text('value')->nullable();
                $table->string('group_name')->default('general');
                $table->timestamps();

                $table->unique(['language_code', 'key']);
            });
        }

        // ── Roles ──
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('display_name')->nullable();
                $table->json('permissions')->nullable();
                $table->timestamps();
            });
        }

        // ── Auto Reply Templates ──
        if (!Schema::hasTable('auto_reply_templates')) {
            Schema::create('auto_reply_templates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('trigger_keyword')->nullable();
                $table->text('reply_message');
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Shops ──
        if (!Schema::hasTable('shops')) {
            Schema::create('shops', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('slug')->unique();
                $table->text('description')->nullable();
                $table->string('logo')->nullable();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Auth Access Tokens ──
        if (!Schema::hasTable('auth_access_tokens')) {
            Schema::create('auth_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tokenable_id');
                $table->string('type')->default('auth_token');
                $table->string('name')->nullable();
                $table->string('hash', 64);
                $table->json('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'flash_sale_items', 'flash_sales', 'promotions', 'order_details', 'orders',
            'product_variants', 'leads', 'activity_logs', 'notifications',
            'auto_reply_templates', 'language_translations', 'languages', 'roles',
            'webhooks', 'api_keys', 'custom_fields', 'nav_links', 'system_configs',
            'coupons', 'shops', 'shop_customers', 'customers', 'cms_pages', 'banners',
            'products', 'product_brands', 'product_categories', 'users',
        ];
        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }
    }
};
