<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$tenant = \App\Models\Tenant::first();
if (!$tenant) { die("No tenants found.\n"); }
\Stancl\Tenancy\Facades\Tenancy::initialize($tenant);

use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\File;

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
        $errors[] = "EXCEPTION parsing $class: " . $e->getMessage();
    }
}

if (empty($errors)) {
    echo "✅ All Models accurately match Database schemas!\n";
} else {
    echo "❌ DEEP AUDIT FAILED - Found Schema mismatches:\n";
    foreach ($errors as $err) {
        echo "- $err\n";
    }
}
