<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;

class SeedSites extends Command
{
    protected $signature = 'seed:sites';
    protected $description = 'Seed the 7 required industry websites';

    public function handle()
    {
        $tenant_ids = ['blog', 'shop', 'event', 'service', 'bds', 'restaurant', 'spa'];
        
        foreach($tenant_ids as $id) {
            $this->info("Checking tenant: $id");
            $tenant = Tenant::find($id);
            if ($tenant) {
                $tenant->domains()->delete();
                $tenant->delete();
                $this->info("Deleted old tenant $id");
            }
        }

        foreach($tenant_ids as $id) {
            $this->info("Creating tenant: $id");
            try {
                $t = Tenant::create([
                    'id' => $id, 
                    'slug' => $id, 
                    'name' => ucfirst($id),
                    'db_name' => "tenant_{$id}"
                ]);
                $t->domains()->create(['domain' => $id . '.localhost']);
                $t->domains()->create(['domain' => $id . '.cms.localhost']);
                $this->info("Created $id successfully.");
            } catch (\Exception $e) {
                $this->error("Error on $id: " . $e->getMessage());
            }
        }
        $this->info('Done!');
    }
}
