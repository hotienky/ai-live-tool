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
        Schema::table('layout_pages', function (Blueprint $table) {
            $table->boolean('is_dynamic')->default(false)->after('is_system');
            $table->timestamp('published_at')->nullable()->after('updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('layout_pages', function (Blueprint $table) {
            $table->dropColumn(['is_dynamic', 'published_at']);
        });
    }
};
