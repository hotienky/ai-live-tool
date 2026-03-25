<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * P1 – Multi-tenant isolation:
 * Mọi bảng PHẢI có tenant_id. Mọi query PHẢI filter theo tenant_id.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('layout_pages', 'tenant_id')) {
            Schema::table('layout_pages', function (Blueprint $t) {
                $t->string('tenant_id', 100)->nullable()->after('id')->index();
            });
        }

        if (!Schema::hasColumn('layout_page_versions', 'tenant_id')) {
            Schema::table('layout_page_versions', function (Blueprint $t) {
                $t->string('tenant_id', 100)->nullable()->after('id')->index();
            });
        }

        // Back-fill: set tenant_id from current tenant context
        $tenantId = tenant('id') ?? null;
        if ($tenantId) {
            \DB::table('layout_pages')->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
            \DB::table('layout_page_versions')->whereNull('tenant_id')->update(['tenant_id' => $tenantId]);
        }
    }

    public function down(): void
    {
        Schema::table('layout_pages', fn(Blueprint $t) => $t->dropColumn('tenant_id'));
        Schema::table('layout_page_versions', fn(Blueprint $t) => $t->dropColumn('tenant_id'));
    }
};
