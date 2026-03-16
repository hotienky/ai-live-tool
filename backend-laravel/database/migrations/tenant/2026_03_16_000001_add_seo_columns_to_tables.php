<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Products
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'meta_title')) {
                    $table->string('meta_title', 255)->nullable();
                }
                if (!Schema::hasColumn('products', 'meta_description')) {
                    $table->text('meta_description')->nullable();
                }
                if (!Schema::hasColumn('products', 'meta_keywords')) {
                    $table->string('meta_keywords', 500)->nullable();
                }
            });
        }

        // Product Categories
        if (Schema::hasTable('product_categories')) {
            Schema::table('product_categories', function (Blueprint $table) {
                if (!Schema::hasColumn('product_categories', 'meta_description')) {
                    $table->text('meta_description')->nullable();
                }
            });
        }

        // Product Brands
        if (Schema::hasTable('product_brands')) {
            Schema::table('product_brands', function (Blueprint $table) {
                if (!Schema::hasColumn('product_brands', 'meta_description')) {
                    $table->text('meta_description')->nullable();
                }
            });
        }

        // CMS Pages
        if (Schema::hasTable('cms_pages')) {
            Schema::table('cms_pages', function (Blueprint $table) {
                if (!Schema::hasColumn('cms_pages', 'meta_description')) {
                    $table->text('meta_description')->nullable();
                }
                if (!Schema::hasColumn('cms_pages', 'meta_keywords')) {
                    $table->string('meta_keywords', 500)->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn(['meta_title', 'meta_description', 'meta_keywords']);
            });
        }
        if (Schema::hasTable('product_categories')) {
            Schema::table('product_categories', function (Blueprint $table) {
                $table->dropColumn(['meta_description']);
            });
        }
        if (Schema::hasTable('product_brands')) {
            Schema::table('product_brands', function (Blueprint $table) {
                $table->dropColumn(['meta_description']);
            });
        }
        if (Schema::hasTable('cms_pages')) {
            Schema::table('cms_pages', function (Blueprint $table) {
                $table->dropColumn(['meta_description', 'meta_keywords']);
            });
        }
    }
};
