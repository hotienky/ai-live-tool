<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Add installed_version column to tenant_module_subscriptions table.
 * Tracks which version of a module is installed per tenant.
 */
return new class extends Migration
{
    public function up(): void
    {
        $connection = config('tenancy.database.central_connection', 'master');
        $schema = Schema::connection($connection);

        if (!$schema->hasColumn('tenant_module_subscriptions', 'installed_version')) {
            $schema->table('tenant_module_subscriptions', function (Blueprint $table) {
                $table->string('installed_version', 20)->nullable()->after('installed_by');
            });
        }
    }

    public function down(): void
    {
        $connection = config('tenancy.database.central_connection', 'master');

        Schema::connection($connection)->table('tenant_module_subscriptions', function (Blueprint $table) {
            $table->dropColumn('installed_version');
        });
    }
};
