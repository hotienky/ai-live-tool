<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fix system_configs table:
 * 1. Replace UNIQUE(key) → UNIQUE(key, group_name)
 *    Two groups can legitimately share a key name (e.g. 'mode' in 'theme' and 'cache').
 *
 * 2. Add INDEX(group_name) for faster getByGroup() WHERE queries.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('system_configs')) {
            return;
        }

        Schema::table('system_configs', function (Blueprint $table) {
            // Drop the old single-column unique constraint on 'key'
            // (ignore if it doesn't exist — may already be removed)
            try {
                $table->dropUnique(['key']);
            } catch (\Throwable $e) { /* already removed or named differently */ }

            // Add composite unique: (key, group_name)
            try {
                $table->unique(['key', 'group_name'], 'sc_key_group_unique');
            } catch (\Throwable $e) { /* already exists */ }

            // Add index on group_name for fast WHERE group_name = ? queries
            try {
                $table->index('group_name', 'sc_group_name_idx');
            } catch (\Throwable $e) { /* already exists */ }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('system_configs')) {
            return;
        }

        Schema::table('system_configs', function (Blueprint $table) {
            try { $table->dropUnique('sc_key_group_unique'); } catch (\Throwable $e) {}
            try { $table->dropIndex('sc_group_name_idx'); } catch (\Throwable $e) {}
            try { $table->unique('key'); } catch (\Throwable $e) {}
        });
    }
};
