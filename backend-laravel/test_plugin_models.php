<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

\Stancl\Tenancy\Facades\Tenancy::initialize('tenant');

$models = [
    \App\Models\BookingService::class,
    \App\Models\Event::class,
    \App\Models\RestaurantTable::class,
    \App\Models\SalonService::class,
    \App\Models\LmsCourse::class,
    \App\Models\ForumBoard::class,
    \App\Models\JobboardJob::class,
    \App\Models\RealestateProperty::class,
    \App\Models\LuckyWheel::class,
    \App\Models\MembershipTier::class,
];

foreach ($models as $model) {
    try {
        if (!class_exists($model)) {
            echo "SKIPPED: Model $model does not exist\n";
            continue;
        }
        $count = $model::count();
        echo "OK: $model (Count: $count)\n";
    } catch (\Exception $e) {
        $err = $e->getMessage();
        echo "ERROR: $model - " . (strlen($err) > 100 ? substr($err, 0, 100) . '...' : $err) . "\n";
    }
}
