<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;

class MigrateModulesCommand extends Command
{
    protected $signature = 'modules:migrate
                            {--module= : Migrate a specific module only (e.g. booking, membership)}
                            {--tenant= : Run for a specific tenant slug only}
                            {--force : Force the migration to run}';

    protected $description = 'Run module migrations for all (or specified) tenants';

    public function handle(): int
    {
        $modulesBase = database_path('migrations/modules');
        $onlyModule  = $this->option('module');
        $onlyTenant  = $this->option('tenant');
        $force       = $this->option('force');

        // Collect module directories to migrate
        $modules = collect(glob("{$modulesBase}/*/", GLOB_ONLYDIR))
            ->map(fn($path) => basename($path))
            ->when($onlyModule, fn($c) => $c->filter(fn($m) => $m === $onlyModule))
            ->values();

        if ($modules->isEmpty()) {
            $this->error("No module migration directory found" . ($onlyModule ? " for '{$onlyModule}'" : '') . '.');
            return self::FAILURE;
        }

        // Collect tenants
        $query = Tenant::query();
        if ($onlyTenant) {
            $query->where('slug', $onlyTenant);
        }
        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->error("No tenants found" . ($onlyTenant ? " with slug '{$onlyTenant}'" : '') . '.');
            return self::FAILURE;
        }

        $this->info("Migrating " . $modules->count() . " module(s) for " . $tenants->count() . " tenant(s)...");

        foreach ($tenants as $tenant) {
            $this->line("\n<fg=cyan>Tenant: {$tenant->id} (slug: {$tenant->slug})</>");

            tenancy()->initialize($tenant);

            foreach ($modules as $module) {
                $path = "database/migrations/modules/{$module}";
                $args = [
                    '--path'     => $path,
                    '--database' => 'tenant',
                    '--realpath' => false,
                ];
                if ($force) {
                    $args['--force'] = true;
                }

                Artisan::call('migrate', $args);
                $output = trim(Artisan::output());

                if (str_contains($output, 'Nothing to migrate')) {
                    $this->line("  <fg=gray>[{$module}]</> Nothing to migrate.");
                } else {
                    $this->line("  <fg=green>[{$module}]</> {$output}");
                }
            }

            tenancy()->end();
        }

        $this->newLine();
        $this->info('Done.');

        return self::SUCCESS;
    }
}
