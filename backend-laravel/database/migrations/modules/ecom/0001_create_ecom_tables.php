<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * E-commerce module tables: products, orders, coupons, flash sales, etc.
 * Runs when the ecom module is installed for a tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
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

        // ── Shop Customers (Auth/Login for storefront) ──
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
                $table->string('type')->default('percent');
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

        // ── Wishlists ──
        if (!Schema::hasTable('wishlists')) {
            Schema::create('wishlists', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('shop_customer_id');
                $table->unsignedBigInteger('product_id');
                $table->timestamps();
                $table->unique(['shop_customer_id', 'product_id']);
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'wishlists', 'flash_sale_items', 'flash_sales', 'promotions',
            'order_details', 'orders', 'coupons', 'product_variants',
            'products', 'product_brands', 'product_categories',
            'shop_customers', 'shops',
        ];
        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }
    }
};
