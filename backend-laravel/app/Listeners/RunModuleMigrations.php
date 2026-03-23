<?php

namespace App\Listeners;

use App\Events\ModuleInstalled;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

/**
 * When a module is installed, automatically run its database migrations.
 * Migrations must be in: database/migrations/modules/{module-id}/
 */
class RunModuleMigrations
{
    public function handle(ModuleInstalled $event): void
    {
        $moduleId = $event->moduleId;
        $migrationPath = database_path("migrations/modules/{$moduleId}");

        if (!File::isDirectory($migrationPath)) {
            return; // No module-specific migrations
        }

        try {
            Artisan::call('migrate', [
                '--path' => "database/migrations/modules/{$moduleId}",
                '--force' => true,
            ]);

            Log::info("Auto-migrated module [{$moduleId}] for tenant [{$event->tenantId}]", [
                'output' => Artisan::output(),
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to auto-migrate module [{$moduleId}]: {$e->getMessage()}");
        }
    }
}
