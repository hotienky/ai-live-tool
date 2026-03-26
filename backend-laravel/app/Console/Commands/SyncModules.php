<?php

namespace App\Console\Commands;

use App\Models\Module;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

/**
 * Sync module.json files → modules table.
 * 
 * module.json is the SINGLE SOURCE OF TRUTH for module metadata.
 * This command reads all module.json files from app/Modules/ and
 * upserts them into the master modules table.
 * 
 * Usage:
 *   php artisan modules:sync          # Sync all modules
 *   php artisan modules:sync --fresh  # Delete DB records not in filesystem
 */
class SyncModules extends Command
{
    protected $signature = 'modules:sync {--fresh : Remove DB modules not found in filesystem}';
    protected $description = 'Sync module.json files to modules database table';

    public function handle(): int
    {
        $modulesDir = app_path('Modules');

        if (!is_dir($modulesDir)) {
            $this->error("Modules directory not found: {$modulesDir}");
            return 1;
        }

        $synced = [];
        $dirs = File::directories($modulesDir);

        foreach ($dirs as $dir) {
            $jsonPath = $dir . '/module.json';
            if (!file_exists($jsonPath)) {
                $this->warn("Skipping " . basename($dir) . " — no module.json");
                continue;
            }

            $json = json_decode(file_get_contents($jsonPath), true);
            if (!$json || empty($json['id'])) {
                $this->warn("Skipping " . basename($dir) . " — invalid module.json");
                continue;
            }

            $data = [
                'module_id'   => $json['id'],
                'name'        => $json['name'] ?? $json['id'],
                'description' => $json['description'] ?? '',
                'icon'        => $json['icon'] ?? 'Package',
                'category'    => $json['category'] ?? 'other',
                'version'     => $json['version'] ?? '1.0.0',
                'requires'    => $json['requires'] ?? [],
                'sidebar'     => $json['sidebar'] ?? null,
                'config'      => array_filter([
                    'controllers' => $json['controllers'] ?? null,
                    'services'    => $json['services'] ?? null,
                    'models'      => $json['models'] ?? null,
                    'routes_file' => $json['routes_file'] ?? null,
                    'permissions' => $json['permissions'] ?? null,
                ]),
            ];

            Module::updateOrCreate(
                ['module_id' => $data['module_id']],
                $data,
            );

            $synced[] = $data['module_id'];
            $this->info("✓ {$data['module_id']} — {$data['name']}");
        }

        // Remove orphaned DB records
        if ($this->option('fresh') && !empty($synced)) {
            $deleted = Module::whereNotIn('module_id', $synced)->delete();
            if ($deleted > 0) {
                $this->warn("Removed {$deleted} orphaned module(s) from DB");
            }
        }

        $this->newLine();
        $this->info("Synced " . count($synced) . " module(s) from module.json files.");
        return 0;
    }
}
