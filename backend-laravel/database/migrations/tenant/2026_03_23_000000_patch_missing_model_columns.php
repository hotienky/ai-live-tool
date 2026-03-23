<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // BANNERS
        if (Schema::hasTable('banners')) {
            Schema::table('banners', function (Blueprint $table) {
                if (!Schema::hasColumn('banners', 'link')) $table->string('link')->nullable();
                if (!Schema::hasColumn('banners', 'sort_order')) $table->integer('sort_order')->default(0);
                if (!Schema::hasColumn('banners', 'is_active')) $table->boolean('is_active')->default(true);
                if (!Schema::hasColumn('banners', 'position')) $table->string('position')->nullable();
                if (!Schema::hasColumn('banners', 'start_date')) $table->datetime('start_date')->nullable();
                if (!Schema::hasColumn('banners', 'end_date')) $table->datetime('end_date')->nullable();
            });
        }

        // CMS_PAGES
        if (Schema::hasTable('cms_pages')) {
            Schema::table('cms_pages', function (Blueprint $table) {
                if (!Schema::hasColumn('cms_pages', 'published_at')) $table->datetime('published_at')->nullable();
                if (!Schema::hasColumn('cms_pages', 'created_by')) $table->unsignedBigInteger('created_by')->nullable();
                if (!Schema::hasColumn('cms_pages', 'updated_by')) $table->unsignedBigInteger('updated_by')->nullable();
                if (!Schema::hasColumn('cms_pages', 'meta_keywords')) $table->text('meta_keywords')->nullable();
            });
        }

        // CUSTOMERS
        if (Schema::hasTable('customers')) {
            Schema::table('customers', function (Blueprint $table) {
                if (!Schema::hasColumn('customers', 'name')) $table->string('name')->nullable();
                if (!Schema::hasColumn('customers', 'note')) $table->text('note')->nullable();
                if (!Schema::hasColumn('customers', 'source')) $table->string('source')->nullable();
                if (!Schema::hasColumn('customers', 'status')) $table->string('status')->nullable();
                if (!Schema::hasColumn('customers', 'tags')) $table->jsonb('tags')->nullable();
            });
        }

        // LEADS
        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table) {
                if (!Schema::hasColumn('leads', 'name')) $table->string('name')->nullable();
                if (!Schema::hasColumn('leads', 'email')) $table->string('email')->nullable();
                if (!Schema::hasColumn('leads', 'phone')) $table->string('phone')->nullable();
                if (!Schema::hasColumn('leads', 'message')) $table->text('message')->nullable();
                if (!Schema::hasColumn('leads', 'source')) $table->string('source')->nullable();
                if (!Schema::hasColumn('leads', 'assigned_to')) $table->unsignedBigInteger('assigned_to')->nullable();
                if (!Schema::hasColumn('leads', 'note')) $table->text('note')->nullable();
            });
        }

        // ORDERS
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'note')) $table->text('note')->nullable();
            });
        }

        // PRODUCTS
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'content')) $table->longText('content')->nullable();
                if (!Schema::hasColumn('products', 'sort_order')) $table->integer('sort_order')->default(0);
                if (!Schema::hasColumn('products', 'meta_keywords')) $table->text('meta_keywords')->nullable();
            });
        }

        // PROMOTIONS
        if (Schema::hasTable('promotions')) {
            Schema::table('promotions', function (Blueprint $table) {
                if (!Schema::hasColumn('promotions', 'name')) $table->string('name')->nullable();
                if (!Schema::hasColumn('promotions', 'code')) $table->string('code')->nullable();
                if (!Schema::hasColumn('promotions', 'type')) $table->string('type')->nullable();
                if (!Schema::hasColumn('promotions', 'value')) $table->decimal('value', 12, 2)->nullable();
                if (!Schema::hasColumn('promotions', 'min_order_amount')) $table->decimal('min_order_amount', 12, 2)->nullable();
                if (!Schema::hasColumn('promotions', 'max_discount')) $table->decimal('max_discount', 12, 2)->nullable();
                if (!Schema::hasColumn('promotions', 'usage_limit')) $table->integer('usage_limit')->nullable();
                if (!Schema::hasColumn('promotions', 'used_count')) $table->integer('used_count')->default(0);
                if (!Schema::hasColumn('promotions', 'start_date')) $table->datetime('start_date')->nullable();
                if (!Schema::hasColumn('promotions', 'end_date')) $table->datetime('end_date')->nullable();
                if (!Schema::hasColumn('promotions', 'is_active')) $table->boolean('is_active')->default(true);
                if (!Schema::hasColumn('promotions', 'description')) $table->text('description')->nullable();
            });
        }
        
        // SHOPS
        if (Schema::hasTable('shops')) {
            Schema::table('shops', function (Blueprint $table) {
                if (!Schema::hasColumn('shops', 'domain')) $table->string('domain')->nullable();
                if (!Schema::hasColumn('shops', 'email')) $table->string('email')->nullable();
                if (!Schema::hasColumn('shops', 'phone')) $table->string('phone')->nullable();
                if (!Schema::hasColumn('shops', 'address')) $table->text('address')->nullable();
                if (!Schema::hasColumn('shops', 'settings')) $table->jsonb('settings')->nullable();
                if (!Schema::hasColumn('shops', 'user_id')) $table->unsignedBigInteger('user_id')->nullable();
            });
        }

        // SHOP_CUSTOMERS (this might be a pivot table)
        if (Schema::hasTable('shop_customers')) {
            Schema::table('shop_customers', function (Blueprint $table) {
                if (!Schema::hasColumn('shop_customers', 'shop_id')) $table->unsignedBigInteger('shop_id')->nullable();
            });
        }
    }

    public function down(): void
    {
        // Safe to ignore down because adding columns doesn't hurt.
    }
};
