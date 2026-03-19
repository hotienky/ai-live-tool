<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

try {
    // connect to tenant directly
    $db = \DB::connection('pgsql');
    config(['database.connections.pgsql.database' => 'tenant_fashionvn']);
    \DB::purge('pgsql');

    $rows = \DB::connection('pgsql')->table('content_translations')->get();
    echo "Found " . count($rows) . " rows in content_translations.\n";
    foreach ($rows as $row) {
        echo json_encode($row) . "\n";
    }
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
