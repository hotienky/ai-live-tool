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
    public static function applyTemplate(string $tenantId, string $templateId): array
    {
        $templates = collect(self::listTemplates())->keyBy('id');
        $template = $templates->get($templateId);

        if (!$template) {
            return ['success' => false, 'message' => "Template '{$templateId}' không tồn tại."];
        }

        $tenant = Tenant::findOrFail($tenantId);

        // 1. Install Required Modules (in master DB)
        if (!empty($template['modules'])) {
            // Usually modules are managed in master
            config(['database.default' => 'master']);
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
            if (!empty($template['default_pages']) && \Schema::hasTable('cms_pages')) {
                foreach ($template['default_pages'] as $page) {
                    DB::table('cms_pages')->updateOrInsert(
                        ['slug' => $page['slug']],
                        [
                            'title' => $page['title'],
                            'content' => "<p>Nội dung trang {$page['title']}</p>",
                            'is_published' => true,
                            'template' => $page['template'] ?? 'default',
                            'author_id' => 1,
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

            // 5. Update Tenant Settings (Mark as Onboarded + Store Site Data)
            // Note: tenant->settings is stored on 'tenants' table which is in master. 
            // We should do this outside of tenant context. We will return the updated settings array string and run it outside.
        });

        // 6. Update Tenant settings on Master
        $settings = $tenant->settings ?? [];
        $settings['onboarded'] = true;
        $settings['site_template'] = $templateId;
        
        $tenant->settings = $settings;
        $tenant->save();

        return ['success' => true, 'message' => "Đã khởi tạo website với mẫu '{$template['name']}' thành công."];
    }
}
