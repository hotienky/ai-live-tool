<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('layout_global_blocks', function (Blueprint $table) {
            $table->jsonb('translations')->nullable()->after('block_json');
        });

        Schema::table('navigation_menus', function (Blueprint $table) {
            $table->jsonb('translations')->nullable()->after('tree_json');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('layout_global_blocks', function (Blueprint $table) {
            $table->dropColumn('translations');
        });

        Schema::table('navigation_menus', function (Blueprint $table) {
            $table->dropColumn('translations');
        });
    }
};
