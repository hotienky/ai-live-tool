<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('master')->table('domains', function (Blueprint $table) {
            if (!Schema::connection('master')->hasColumn('domains', 'type')) {
                $table->string('type', 20)->default('storefront')->after('tenant_id'); // 'storefront' or 'cms'
            }
            if (!Schema::connection('master')->hasColumn('domains', 'is_primary')) {
                $table->boolean('is_primary')->default(false)->after('type');
            }
            if (!Schema::connection('master')->hasColumn('domains', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('is_primary');
            }
        });
    }

    public function down(): void
    {
        Schema::connection('master')->table('domains', function (Blueprint $table) {
            $table->dropColumn(['type', 'is_primary', 'verified_at']);
        });
    }
};
