<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Repair missing module migrations for all tenants.
 * 
 * This seeder is SAFE to run repeatedly — Laravel's migrator auto-skips 
 * already-executed migrations. Use this when:
 * - A module migration was added AFTER some tenants already installed the module
 * - Module install didn't complete migrations properly
 * 
 * Usage: php artisan db:seed --class=RepairModuleMigrationsSeeder --force
 */
class RepairModuleMigrationsSeeder extends Seeder
{
    public function run(): void
    {
        $tenants = Tenant::all();
        $this->command->info("🔧 Repairing module migrations for {$tenants->count()} tenants...");

        foreach ($tenants as $tenant) {
            $this->repairTenant($tenant);
        }

        $this->command->info('✅ Done!');
    }

    protected function repairTenant($tenant): void
    {
        $this->command->info("\n── Tenant: {$tenant->name} ({$tenant->slug}) ──");

        // Get installed module IDs directly from master DB (bypass Cache facade)
        $master = DB::connection(config('tenancy.database.central_connection', 'master'));
        $installedModules = $master->table('tenant_module_subscriptions')
            ->where('tenant_id', $tenant->id)
            ->where('is_active', true)
            ->pluck('module_id')
            ->toArray();

        if (empty($installedModules)) {
            $this->command->warn("  No modules installed, skipping.");
            return;
        }

        $this->command->info("  Installed modules: " . implode(', ', $installedModules));

        // Switch to tenant DB context
        try {
            $tenant->run(function () use ($installedModules, $tenant) {
                foreach ($installedModules as $moduleId) {
                    $migrationDir = "database/migrations/modules/{$moduleId}";
                    $fullPath = database_path("migrations/modules/{$moduleId}");

                    if (!is_dir($fullPath)) {
                        continue; // No migrations for this module
                    }

                    $files = glob($fullPath . '/*.php');
                    if (empty($files)) {
                        continue;
                    }

                    $this->command->info("  📦 Running migrations for: {$moduleId} (" . count($files) . " files)");

                    try {
                        Artisan::call('migrate', [
                            '--path' => $migrationDir,
                            '--database' => 'tenant',
                            '--realpath' => false,
                            '--force' => true,
                        ]);
                        $output = trim(Artisan::output());
                        if ($output) {
                            foreach (explode("\n", $output) as $line) {
                                $this->command->line("    {$line}");
                            }
                        }
                    } catch (\Exception $e) {
                        $this->command->error("    ❌ Failed: {$e->getMessage()}");
                        Log::error("[RepairMigrations] {$tenant->slug}/{$moduleId}: {$e->getMessage()}");
                    }
                }
            });
        } catch (\Stancl\Tenancy\Exceptions\TenantDatabaseDoesNotExistException $e) {
            $this->command->warn("  ⚠  Database does not exist, skipping. Create it first.");
        } catch (\Exception $e) {
            $this->command->error("  ❌ Cannot connect: " . class_basename($e) . ': ' . $e->getMessage());
        }
    }
}
