<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Cache;

// Mock cache to bypass Stancl error
app()->instance('cache', new class {
    public function store() {
        return new class {
            public function get() { return null; }
            public function put() {}
            public function forget() {}
        };
    }
});

$ids = ['blog', 'shop', 'event', 'service', 'bds', 'restaurant', 'spa'];

foreach($ids as $id) {
    echo "Processing $id...\n";
    $t = App\Models\Tenant::find($id);
    if ($t) { $t->delete(); }
    $t = App\Models\Tenant::create(['id' => $id, 'slug' => $id, 'name' => ucfirst($id), 'db_name' => "tenant_$id"]);
    $t->domains()->create(['domain' => "$id.localhost"]);
    $t->domains()->create(['domain' => "$id.cms.localhost"]);
}
echo "Done.\n";
