<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cms_pages', function (Blueprint $table) {
            // is_system: trang hệ thống (home, about, contact) — không thể xóa qua UI
            $table->boolean('is_system')->default(false)->after('is_dynamic');
        });
    }

    public function down(): void
    {
        Schema::table('cms_pages', function (Blueprint $table) {
            $table->dropColumn('is_system');
        });
    }
};
