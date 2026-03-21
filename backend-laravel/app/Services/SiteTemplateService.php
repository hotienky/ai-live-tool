<?php

namespace App\Services;

use App\Models\Tenant;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class SiteTemplateService
{
    /**
     * Get list of all available site templates from JSON files
     */
    public static function listTemplates(): array
    {
        $path = database_path('seeders/templates');
        if (!File::exists($path)) {
            return [];
        }

        $files = File::files($path);
        $templates = [];

        foreach ($files as $file) {
            if ($file->getExtension() === 'json') {
                $content = json_decode(File::get($file->getPathname()), true);
                if ($content) {
                    $templates[] = $content;
                }
            }
        }

        return $templates;
    }

    /**
     * Apply a specific template configuration to a tenant
     */
    public static function applyTemplate(string $tenantId, string $templateId, array $siteInfo = []): array
    {
        $templates = collect(self::listTemplates())->keyBy('id');
        $template = $templates->get($templateId);

        if (!$template) {
            return ['success' => false, 'message' => "Template '{$templateId}' không tồn tại."];
        }

        $tenant = Tenant::findOrFail($tenantId);

        // 1. Install Required Modules (in master DB)
        if (!empty($template['modules'])) {
            // Modules are managed in master via ModuleRegistry
            foreach ($template['modules'] as $moduleId) {
                // Ensure the module exists first
                $moduleExists = DB::connection('master')->table('modules')->where('module_id', $moduleId)->exists();
                if ($moduleExists) {
                    ModuleRegistry::install($tenantId, $moduleId);
                } else {
                    Log::warning("[SiteTemplate] Module {$moduleId} not found for template {$templateId}");
                }
            }
        }

        // Run the rest within the Tenant's Database Context
        $tenant->run(function () use ($template, $tenant, $tenantId) {
            // 2. Set Theme
            if (!empty($template['theme'])) {
                ThemeEngine::setTenantTheme($tenantId, $template['theme']);
            }

            // 3. Create Default Pages
            if (!empty($template['default_pages']) && Schema::hasTable('cms_pages')) {
                foreach ($template['default_pages'] as $page) {
                    DB::table('cms_pages')->updateOrInsert(
                        ['alias' => $page['slug']],
                        [
                            'title' => $page['title'],
                            'content' => "<p>Nội dung trang {$page['title']}</p>",
                            'status' => true,
                            'created_at' => now(),
                            'updated_at' => now()
                        ]
                    );
                }
            }

            // 4. Set Custom Storefront Layout Sections
            if (!empty($template['layout_sections'])) {
                $layoutData = json_encode($template['layout_sections']);
                DB::table('system_configs')->updateOrInsert(
                    ['key' => 'storefront.layout.home'],
                    [
                        'group' => 'storefront',
                        'value' => $layoutData,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]
                );
            }

            // 5. Apply Site Info
            if (!empty($siteInfo)) {
                if (!empty($siteInfo['name'])) {
                    DB::table('system_configs')->updateOrInsert(
                        ['key' => 'shop_name'],
                        ['group' => 'store', 'value' => $siteInfo['name'], 'updated_at' => now(), 'created_at' => now()]
                    );
                }
                if (!empty($siteInfo['description'])) {
                    DB::table('system_configs')->updateOrInsert(
                        ['key' => 'description'],
                        ['group' => 'store', 'value' => $siteInfo['description'], 'updated_at' => now(), 'created_at' => now()]
                    );
                }
                if (!empty($siteInfo['language'])) {
                    DB::table('system_configs')->updateOrInsert(
                        ['key' => 'default_language'],
                        ['group' => 'system', 'value' => $siteInfo['language'], 'updated_at' => now(), 'created_at' => now()]
                    );
                }
            }
        });

        // 6. Update Tenant settings on Master
        // Note: Tenant model casts settings to array, but handle edge cases
        $settings = $tenant->settings;
        if (!is_array($settings)) {
            $settings = is_string($settings) ? (json_decode($settings, true) ?: []) : [];
        }
        $settings['onboarded'] = true;
        $settings['site_template'] = $templateId;
        
        $tenant->settings = $settings;
        $tenant->save();

        // Clear tenant status cache so frontend immediately sees onboarded=true
        \Illuminate\Support\Facades\Cache::forget("tenant_status:{$tenant->slug}");

        return ['success' => true, 'message' => "Đã khởi tạo website với mẫu '{$template['name']}' thành công."];
    }
}
