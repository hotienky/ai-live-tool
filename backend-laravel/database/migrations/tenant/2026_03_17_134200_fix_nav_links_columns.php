<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('nav_links', function (Blueprint $table) {
            // Rename 'sort' to 'sort_order' for consistency with code
            if (Schema::hasColumn('nav_links', 'sort') && !Schema::hasColumn('nav_links', 'sort_order')) {
                $table->renameColumn('sort', 'sort_order');
            }
        });

        Schema::table('nav_links', function (Blueprint $table) {
            // Add parent_id if missing (some DBs have collection_id instead)
            if (!Schema::hasColumn('nav_links', 'parent_id')) {
                $table->unsignedBigInteger('parent_id')->nullable()->after('icon');
            }

            // Add group column (menu, footer, etc.)
            if (!Schema::hasColumn('nav_links', 'group')) {
                $table->string('group')->default('menu')->after('url');
            }

            // Add type column (single, collection)
            if (!Schema::hasColumn('nav_links', 'type')) {
                $table->string('type')->default('single')->after('group');
            }

            // Add target column (_self, _blank)
            if (!Schema::hasColumn('nav_links', 'target')) {
                $table->string('target')->default('_self')->after('icon');
            }

            // Add sort_order if doesn't exist (and sort wasn't renamed)
            if (!Schema::hasColumn('nav_links', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('target');
            }
        });

        // Migrate data from collection_id to parent_id if collection_id exists
        if (Schema::hasColumn('nav_links', 'collection_id')) {
            \Illuminate\Support\Facades\DB::table('nav_links')
                ->whereNotNull('collection_id')
                ->update(['parent_id' => \Illuminate\Support\Facades\DB::raw('"collection_id"')]);
        }
    }

    public function down(): void
    {
        Schema::table('nav_links', function (Blueprint $table) {
            $table->dropColumn(['group', 'type', 'target']);
            if (Schema::hasColumn('nav_links', 'sort_order') && !Schema::hasColumn('nav_links', 'sort')) {
                $table->renameColumn('sort_order', 'sort');
            }
        });
    }
};
