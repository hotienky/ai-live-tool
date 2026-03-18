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

        // Use raw SQL with IF EXISTS — PostgreSQL aborts entire
        // transaction on constraint errors even inside try/catch
        $conn = Schema::getConnection();

        // Drop old unique on 'key' (try both possible names)
        $conn->statement("ALTER TABLE system_configs DROP CONSTRAINT IF EXISTS system_configs_key_unique");
        $conn->statement("ALTER TABLE system_configs DROP CONSTRAINT IF EXISTS system_configs_key_idx");

        // Add composite unique: (key, group_name)
        $conn->statement("CREATE UNIQUE INDEX IF NOT EXISTS sc_key_group_unique ON system_configs (key, group_name)");

        // Add index on group_name
        $conn->statement("CREATE INDEX IF NOT EXISTS sc_group_name_idx ON system_configs (group_name)");
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
