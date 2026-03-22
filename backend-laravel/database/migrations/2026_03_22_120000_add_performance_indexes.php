<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance indexes for storefront queries.
 * These indexes optimize the most common read patterns:
 * - Product listing (sort by created_at, filter by category, search by name)
 * - Order listing (sort by created_at, filter by status, lookup by customer)
 */
return new class extends Migration
{
    public function up(): void
    {
        // Products table indexes
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                // Listing: sorted by newest first (default storefront sort)
                if (!$this->hasIndex('products', 'idx_products_created_at')) {
                    $table->index('created_at', 'idx_products_created_at');
                }
                // Filter by category
                if (Schema::hasColumn('products', 'category_id') && !$this->hasIndex('products', 'idx_products_category_id')) {
                    $table->index('category_id', 'idx_products_category_id');
                }
                // Filter by status (active/hidden)
                if (Schema::hasColumn('products', 'status') && !$this->hasIndex('products', 'idx_products_status')) {
                    $table->index('status', 'idx_products_status');
                }
                // Slug lookups (product detail page)
                if (Schema::hasColumn('products', 'slug') && !$this->hasIndex('products', 'idx_products_slug')) {
                    $table->unique('slug', 'idx_products_slug');
                }
                // Composite: active products sorted by newest
                if (Schema::hasColumn('products', 'status') && !$this->hasIndex('products', 'idx_products_status_created')) {
                    $table->index(['status', 'created_at'], 'idx_products_status_created');
                }
            });
        }

        // Orders table indexes
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!$this->hasIndex('orders', 'idx_orders_created_at')) {
                    $table->index('created_at', 'idx_orders_created_at');
                }
                if (Schema::hasColumn('orders', 'status') && !$this->hasIndex('orders', 'idx_orders_status')) {
                    $table->index('status', 'idx_orders_status');
                }
                if (Schema::hasColumn('orders', 'customer_id') && !$this->hasIndex('orders', 'idx_orders_customer_id')) {
                    $table->index('customer_id', 'idx_orders_customer_id');
                }
                // Order number lookups
                if (Schema::hasColumn('orders', 'order_number') && !$this->hasIndex('orders', 'idx_orders_order_number')) {
                    $table->unique('order_number', 'idx_orders_order_number');
                }
            });
        }

        // System configs — group lookups (used by site-config)
        if (Schema::hasTable('system_configs')) {
            Schema::table('system_configs', function (Blueprint $table) {
                if (Schema::hasColumn('system_configs', 'group') && !$this->hasIndex('system_configs', 'idx_sysconfigs_group')) {
                    $table->index('group', 'idx_sysconfigs_group');
                }
            });
        }
    }

    public function down(): void
    {
        $indexes = [
            'products' => ['idx_products_created_at', 'idx_products_category_id', 'idx_products_status', 'idx_products_slug', 'idx_products_status_created'],
            'orders' => ['idx_orders_created_at', 'idx_orders_status', 'idx_orders_customer_id', 'idx_orders_order_number'],
            'system_configs' => ['idx_sysconfigs_group'],
        ];

        foreach ($indexes as $table => $idxList) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $table) use ($idxList) {
                    foreach ($idxList as $idx) {
                        if ($this->hasIndex($table->getTable(), $idx)) {
                            $table->dropIndex($idx);
                        }
                    }
                });
            }
        }
    }

    private function hasIndex(string $table, string $indexName): bool
    {
        try {
            $indexes = Schema::getIndexes($table);
            foreach ($indexes as $index) {
                if ($index['name'] === $indexName) return true;
            }
        } catch (\Exception $e) {
            // Fallback for older Laravel versions
            return false;
        }
        return false;
    }
};
