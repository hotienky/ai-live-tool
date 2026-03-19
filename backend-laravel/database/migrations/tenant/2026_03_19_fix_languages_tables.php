<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * Fix languages-related tables for multi-language module.
 * - Add missing 'sort' column to 'languages' table
 * - Add 'language_id' column to 'language_translations' (was using 'language_code' only)
 * - Create 'content_translations' table if not exists (for product/category/CMS translations)
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Add missing 'sort' column to languages table
        if (Schema::hasTable('languages') && !Schema::hasColumn('languages', 'sort')) {
            Schema::table('languages', function (Blueprint $table) {
                $table->integer('sort')->default(0)->after('is_active');
            });
        }

        // 2. Fix language_translations: add language_id if missing
        if (Schema::hasTable('language_translations') && !Schema::hasColumn('language_translations', 'language_id')) {
            Schema::table('language_translations', function (Blueprint $table) {
                $table->unsignedBigInteger('language_id')->nullable()->after('id');
                $table->index('language_id');
            });

            // Backfill language_id from language_code
            $languages = DB::table('languages')->get();
            foreach ($languages as $lang) {
                DB::table('language_translations')
                    ->where('language_code', $lang->code)
                    ->update(['language_id' => $lang->id]);
            }
        }

        // 3. Create content_translations table if not exists
        if (!Schema::hasTable('content_translations')) {
            Schema::create('content_translations', function (Blueprint $table) {
                $table->id();
                $table->string('translatable_type', 50); // 'products', 'categories', 'cms_pages'
                $table->unsignedBigInteger('translatable_id');
                $table->string('locale', 10); // 'en', 'ja', 'ko'
                $table->string('field', 100); // 'name', 'description', 'content'
                $table->text('value')->nullable();
                $table->timestamps();

                $table->unique(
                    ['translatable_type', 'translatable_id', 'locale', 'field'],
                    'content_trans_unique'
                );
                $table->index(['translatable_type', 'translatable_id', 'locale'], 'content_trans_lookup');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('languages') && Schema::hasColumn('languages', 'sort')) {
            Schema::table('languages', function (Blueprint $table) {
                $table->dropColumn('sort');
            });
        }

        if (Schema::hasTable('language_translations') && Schema::hasColumn('language_translations', 'language_id')) {
            Schema::table('language_translations', function (Blueprint $table) {
                $table->dropIndex(['language_id']);
                $table->dropColumn('language_id');
            });
        }

        Schema::dropIfExists('content_translations');
    }
};
