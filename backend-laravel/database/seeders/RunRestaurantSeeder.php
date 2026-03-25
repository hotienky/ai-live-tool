<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class RunRestaurantSeeder extends Seeder
{
    public function run()
    {
        Config::set('database.connections.pgsql.database', 'tenant_restaurant');
        DB::purge('pgsql');
        $this->call(TenantRestaurantSeeder::class);
        $this->call(FixNavLinksSeeder::class);
        echo "Successfully seeded tenant_restaurant and fixed nav links!\n";
    }
}
