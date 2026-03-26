<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tenant;

class CreateEcommerceTenantSeeder extends Seeder
{
    public function run()
    {
        $id = 'longchauphar';
        
        $tenant = Tenant::where('slug', $id)->first();
        if ($tenant) {
            $this->command->info("Tenant {$id} already exists in DB. Exiting...");
            return;
        }

        $this->command->info("Creating Tenant {$id}...");
        
        // Fix for CLI CachedTenantResolver bug: Forcefully bind Cache Factory 
        app()->instance(\Illuminate\Contracts\Cache\Factory::class, app('cache'));

        try {
            $tenant = Tenant::create([
                'id' => $id,
                'slug' => $id,
                'db_name' => 'tenant_' . $id,
                'name' => 'Long Châu Pharma',
                'default_language' => 'vi',
                'storage_driver' => 'local',
                'modules' => ['ecom', 'cms', 'banners', 'languages', 'marketing', 'warehouse', 'shipping', 'tax', 'accounting']
            ]);
        } catch (\Throwable $e) {
            $tenant = Tenant::find($id);
        }

        $tenant->domains()->createMany([
            ['domain' => 'ecommerce.localhost', 'type' => 'storefront'],
            ['domain' => 'cms.localhost', 'type' => 'cms']
        ]);

        $this->command->info("Tenant created successfully. Tenancy DB mapped.");
    }
}
