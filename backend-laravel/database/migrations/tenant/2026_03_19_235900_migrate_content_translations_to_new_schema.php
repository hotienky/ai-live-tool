<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Fix content_translations table when it was created with old schema:
     *   Old: table_name, row_id, field_name, language_id
     *   New: translatable_type, translatable_id, locale, field
     *
     * If the table already has the new schema, does nothing.
     */
    public function up(): void
    {
        if (!Schema::hasTable('content_translations')) {
            return;
        }

        $hasNew = Schema::hasColumn('content_translations', 'translatable_type');
        if ($hasNew) {
            return; // Already migrated
        }

        // --- Add new columns ---
        DB::statement('ALTER TABLE content_translations ADD COLUMN IF NOT EXISTS translatable_type VARCHAR(50)');
        DB::statement('ALTER TABLE content_translations ADD COLUMN IF NOT EXISTS locale VARCHAR(10)');
        DB::statement('ALTER TABLE content_translations ADD COLUMN IF NOT EXISTS field VARCHAR(100)');

        // --- Populate from old columns ---
        DB::statement("UPDATE content_translations SET translatable_type = table_name WHERE translatable_type IS NULL");
        DB::statement("UPDATE content_translations SET field = field_name WHERE field IS NULL");

        // locale: try to resolve from languages table, fallback to 'vi'
        try {
            DB::statement("UPDATE content_translations ct SET locale = (SELECT code FROM languages l WHERE l.id = ct.language_id LIMIT 1) WHERE ct.locale IS NULL");
        } catch (\Throwable $e) {
            // languages table may not exist
        }
        DB::statement("UPDATE content_translations SET locale = 'vi' WHERE locale IS NULL");
        DB::statement("UPDATE content_translations SET translatable_type = '' WHERE translatable_type IS NULL");
        DB::statement("UPDATE content_translations SET field = '' WHERE field IS NULL");

        // --- Add NOT NULL constraints to new columns ---
        DB::statement('ALTER TABLE content_translations ALTER COLUMN translatable_type SET NOT NULL');
        DB::statement('ALTER TABLE content_translations ALTER COLUMN locale SET NOT NULL');
        DB::statement('ALTER TABLE content_translations ALTER COLUMN field SET NOT NULL');

        // --- Make old columns nullable (no longer actively written to) ---
        $driver = DB::connection()->getDriverName();
        if ($driver === 'pgsql') {
            try { DB::statement('ALTER TABLE content_translations ALTER COLUMN table_name DROP NOT NULL'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE content_translations ALTER COLUMN field_name DROP NOT NULL'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE content_translations ALTER COLUMN row_id DROP NOT NULL'); } catch (\Throwable $e) {}
            try { DB::statement('ALTER TABLE content_translations ALTER COLUMN language_id DROP NOT NULL'); } catch (\Throwable $e) {}

            // Drop old unique constraint
            try {
                $constraints = DB::select("
                    SELECT constraint_name FROM information_schema.table_constraints
                    WHERE table_name = 'content_translations' AND constraint_type = 'UNIQUE'
                    AND constraint_name LIKE '%table_name%'
                ");
                foreach ($constraints as $c) {
                    DB::statement("ALTER TABLE content_translations DROP CONSTRAINT IF EXISTS \"{$c->constraint_name}\"");
                }
            } catch (\Throwable $e) {}
        }

        // --- Add new unique index ---
        try {
            DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS content_trans_unique ON content_translations (translatable_type, translatable_id, locale, field)');
        } catch (\Throwable $e) {
            // Index may already exist
        }
    }

    public function down(): void
    {
        // Not safely reversible
    }
};
