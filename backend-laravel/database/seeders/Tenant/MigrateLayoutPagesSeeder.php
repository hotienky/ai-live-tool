<?php

namespace Database\Seeders\Tenant;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\LayoutPage;

class MigrateLayoutPagesSeeder extends Seeder
{
    public function run(): void
    {
        // Get layout from system_configs
        $layoutConfigs = DB::table('system_configs')
            ->where('group_name', 'storefront_layout')
            ->get()
            ->keyBy('key');

        $layoutSectionsJson = $layoutConfigs->get('layout_sections')?->value;
        $themeConfigJson    = DB::table('system_configs')->where('group_name', 'theme')->get()->pluck('value', 'key')->toJson();

        if (empty($layoutSectionsJson) || $layoutSectionsJson === 'null') {
            // Default sections if none found
            $sections = [
                ['type' => 'banner', 'enabled' => true, 'order' => 0],
                ['type' => 'categories', 'enabled' => true, 'order' => 1],
                ['type' => 'flash_sale', 'enabled' => true, 'order' => 2],
                ['type' => 'featured_products', 'enabled' => true, 'order' => 3],
                ['type' => 'new_arrivals', 'enabled' => true, 'order' => 4],
                ['type' => 'cms_pages', 'enabled' => true, 'order' => 5],
            ];
        } else {
            $sections = json_decode($layoutSectionsJson, true);
        }

        // Create or update the 'home' page
        $page = LayoutPage::updateOrCreate(
            ['slug' => 'home'],
            [
                'title' => 'Trang chủ',
                'layout_json' => $sections,
                'status' => 'published',
                'is_system' => true,
                'meta' => [
                    'theme' => json_decode($themeConfigJson, true) ?? [],
                ]
            ]
        );

        // Create initial version snapshot
        if ($page->versions()->count() === 0) {
            $page->versions()->create([
                'layout_json' => $sections,
                'version' => $page->version ?? 1,
                'published_by' => 'system_migration',
                'note' => 'Initial migration from system_configs',
            ]);
        }

        $this->command->info('Migrated layout_pages for current tenant.');
    }
}
