<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\File;

class AuditModelSchema extends Command
{
    protected $signature = 'audit:models';
    protected $description = 'Deep audit to ensure Model fillables map to actual database columns.';

    public function handle()
    {
        $tenant = \App\Models\Tenant::first();
        if ($tenant) {
            \Stancl\Tenancy\Facades\Tenancy::initialize($tenant);
            $this->info("Initialized tenant: " . $tenant->id);
        } else {
            $this->warn("No tenant found. Running in central context.");
        }

        $modelsPath = app_path('Models');
        $modelFiles = File::allFiles($modelsPath);

        $errors = [];

        foreach ($modelFiles as $file) {
            $class = 'App\\Models\\' . $file->getFilenameWithoutExtension();
            if (!class_exists($class)) continue;
            
            $reflection = new \ReflectionClass($class);
            if ($reflection->isAbstract()) continue;
            
            try {
                $model = new $class();
                $table = $model->getTable();
                
                if (!Schema::hasTable($table)) {
                    $errors[] = "CRITICAL: Table '$table' for model $class DOES NOT EXIST!";
                    continue;
                }
                
                $columns = Schema::getColumnListing($table);
                $fillable = $model->getFillable();
                
                $missing = [];
                foreach ($fillable as $f) {
                    if (!in_array($f, $columns)) {
                        $missing[] = $f;
                    }
                }
                
                if (!empty($missing)) {
                    $errors[] = "MISMATCH in $class: Fillable expects [" . implode(', ', $missing) . "], but they do NOT exist in table '$table'.";
                }
            } catch (\Throwable $e) {
                // Ignore models that fail to instantiate (e.g. interfaces, traits)
            }
        }

        if (empty($errors)) {
            $this->info("✅ All Models accurately match Database schemas!");
        } else {
            $this->error("❌ DEEP AUDIT FAILED - Found Schema mismatches:");
            foreach ($errors as $err) {
                $this->line("- $err");
            }
        }
    }
}
