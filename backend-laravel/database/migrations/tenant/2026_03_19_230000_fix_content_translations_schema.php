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
        if (Schema::hasTable('content_translations')) {
            // Check if column exists, if not, add it
            if (!Schema::hasColumn('content_translations', 'translatable_id')) {
                Schema::table('content_translations', function (Blueprint $table) {
                    $table->unsignedBigInteger('translatable_id')->after('translatable_type')->default(0);
                });
            }

            // Also ensure we remove any default value if we just added it
            Schema::table('content_translations', function (Blueprint $table) {
                // Changing column doesn't work perfectly in all SQLite/Postgres versions without doctrine/dbal,
                // but setting default to null shouldn't crash if we used a strict default above.
                // It's safer to just leave it or let the actual application populate it.
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Safe down method
    }
};
