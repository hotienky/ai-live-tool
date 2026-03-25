<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class RunAllVerticalSeeders extends Seeder
{
    public function run()
    {
        $seeders = [
            'tenant_service' => TenantServiceSeeder::class,
            'tenant_spa' => TenantSpaSeeder::class,
            'tenant_bds' => TenantBdsSeeder::class,
            'tenant_event' => TenantEventSeeder::class,
        ];

        foreach ($seeders as $db => $seederClass) {
            try {
                Config::set('database.connections.pgsql.database', $db);
                DB::purge('pgsql');
                $this->call($seederClass);
                echo "✅ Completed {$db}\n";
            } catch (\Exception $e) {
                echo "❌ Failed {$db}: " . $e->getMessage() . "\n";
            }
        }

        // Fix nav links for all tenants
        $this->call(FixNavLinksSeeder::class);
        echo "✅ All vertical seeders completed!\n";
    }
}
