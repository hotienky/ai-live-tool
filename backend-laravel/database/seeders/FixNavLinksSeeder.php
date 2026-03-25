<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class FixNavLinksSeeder extends Seeder
{
    public function run()
    {
        $dbs = [
            'tenant_shop', 'tenant_blog', 'tenant_bds', 
            'tenant_event', 'tenant_service', 'tenant_spa', 'tenant_restaurant'
        ];
        
        foreach ($dbs as $dbName) {
            try {
                Config::set('database.connections.pgsql.database', $dbName);
                DB::purge('pgsql');
                $db = DB::connection('pgsql');

                if (!$db->getSchemaBuilder()->hasTable('nav_links')) {
                    continue;
                }

                // Update all /page/xyz to /xyz
                $updated = 0;
                $links = $db->table('nav_links')->where('url', 'like', '/page/%')->get();
                foreach($links as $link) {
                    $newUrl = str_replace('/page/', '/', $link->url);
                    $db->table('nav_links')->where('id', $link->id)->update(['url' => $newUrl]);
                    $updated++;
                }
                
                // Add a dummy 'contact' page for /contact to resolve successfully if missing
                if (!$db->table('cms_pages')->where('alias', 'contact')->exists()) {
                    $isPgsql = $db->getDriverName() === 'pgsql';
                    $true = $isPgsql ? DB::raw('true') : true;

                    $db->table('cms_pages')->insert([
                        'title' => 'Liên hệ',
                        'alias' => 'contact',
                        'content' => '<div style="max-width: 600px; margin: 40px auto; padding: 40px; background: var(--sf-bg-surface); border-radius: 16px; border: 1px solid var(--sf-border); text-align: center;">
                            <h2>Liên Hệ Với Chúng Tôi</h2>
                            <p style="margin-top: 16px; color: var(--sf-text-secondary); font-size: 16px;">Hotline: 1900 1234<br>Email: contact@example.com<br>Địa chỉ: TP. Hồ Chí Minh, Việt Nam</p>
                        </div>',
                        'status' => $true,
                        'sort' => 99,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                echo "✅ Fixed $updated nav links and ensured contact page in $dbName\n";
            } catch (\Exception $e) {
                echo "❌ Skipped $dbName: " . $e->getMessage() . "\n";
            }
        }
    }
}
