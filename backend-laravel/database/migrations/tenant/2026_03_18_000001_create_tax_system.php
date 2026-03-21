<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Tax Rates table (core — always create)
        if (!Schema::hasTable('tax_rates')) {
            Schema::create('tax_rates', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('code')->unique();
                $table->decimal('rate', 8, 4);
                $table->enum('type', ['percentage', 'fixed'])->default('percentage');
                $table->enum('scope', ['global', 'category', 'product', 'region'])->default('global');
                $table->json('applies_to')->nullable();
                $table->boolean('is_compound')->default(false);
                $table->integer('priority')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // 2. Add tax columns to orders (only if ecom module installed)
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'subtotal')) {
                    $table->decimal('subtotal', 15, 2)->default(0);
                }
                if (!Schema::hasColumn('orders', 'tax_amount')) {
                    $table->decimal('tax_amount', 15, 2)->default(0);
                }
                if (!Schema::hasColumn('orders', 'tax_details')) {
                    $table->json('tax_details')->nullable();
                }
            });
        }

        // 3. Add tax_class to products (only if ecom module installed)
        if (Schema::hasTable('products')) {
            if (!Schema::hasColumn('products', 'tax_class')) {
                Schema::table('products', function (Blueprint $table) {
                    $table->string('tax_class', 50)->default('default');
                });
            }
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('tax_rates');

        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $cols = ['subtotal', 'tax_amount', 'tax_details'];
                foreach ($cols as $c) {
                    if (Schema::hasColumn('orders', $c)) $table->dropColumn($c);
                }
            });
        }

        if (Schema::hasTable('products')) {
            if (Schema::hasColumn('products', 'tax_class')) {
                Schema::table('products', function (Blueprint $table) {
                    $table->dropColumn('tax_class');
                });
            }
        }
    }
};
