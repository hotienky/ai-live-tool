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
                            'status' => DB::raw('true'),
                            'created_at' => now(),
                            'updated_at' => now()
                        ]
                    );
                }
            }

            // 4. Create proper Home LayoutPage if missing
            if (Schema::hasTable('layout_pages')) {
                // Determine layout payload from template, use empty if blank
                $sections = $template['layout_sections'] ?? [];
                
                $headerConfig = [
                    'layout' => 'standard', 'sticky' => true, 'bgColor' => '#ffffff', 'textColor' => '#333333', 'showTopBar' => true,
                    'topBarBg' => '#f1f5f9', 'topBarText' => '#64748b', 'contactPhone' => '1900 1234', 'promoText' => 'Freeship cho đơn từ 300k'
                ];
                if (!empty($template['header_config'])) {
                    $headerConfig = array_merge($headerConfig, $template['header_config']);
                }

                $footerConfig = [
                    'layout' => 'standard', 'bgColor' => '#ffffff', 'textColor' => '#475569', 'copyrightText' => '© 2026 Bản quyền thuộc về MebiSoft.',
                    'columns' => [
                        ['title' => 'Về chúng tôi', 'links' => [['label' => 'Giới thiệu', 'url' => '/about'], ['label' => 'Liên hệ', 'url' => '/contact']]],
                        ['title' => 'Hỗ trợ khách hàng', 'links' => [['label' => 'Câu hỏi thường gặp', 'url' => '/faq'], ['label' => 'Chính sách bảo hành', 'url' => '/warranty']]]
                    ]
                ];
                if (!empty($template['footer_config'])) {
                    $footerConfig = array_merge($footerConfig, $template['footer_config']);
                }

                // Construct standard meta
                $meta = [
                    'pages' => ['cart' => true, 'account' => true, 'auth' => true, 'order_tracking' => true, 'products' => true],
                    'template' => 'full_store',
                    'customCss' => '',
                    'headerConfig' => $headerConfig,
                    'footerConfig' => $footerConfig
                ];

                $home = DB::table('layout_pages')->where('slug', 'home')->first();
                if ($home) {
                    DB::table('layout_pages')->where('slug', 'home')->update([
                        'layout_json' => json_encode($sections),
                        'meta' => json_encode($meta),
                        'status' => 'published',
                        'version' => $home->version + 1,
                        'updated_at' => now(),
                        'published_at' => now()
                    ]);
                } else {
                    DB::table('layout_pages')->insert([
                        'slug' => 'home',
                        'title' => 'Trang Chủ',
                        'layout_json' => json_encode($sections),
                        'meta' => json_encode($meta),
                        'status' => 'published',
                        'is_system' => true,
                        'is_dynamic' => false,
                        'version' => 1,
                        'created_at' => now(),
                        'updated_at' => now(),
                        'published_at' => now()
                    ]);
                }
            }

            // 4.5 Insert Nav Links
            if (!empty($template['nav_links']) && Schema::hasTable('nav_links')) {
                DB::table('nav_links')->where('group', 'menu')->delete();
                foreach ($template['nav_links'] as $idx => $link) {
                    DB::table('nav_links')->insert([
                        'title' => $link['title'],
                        'url' => $link['url'] ?? '#',
                        'group' => $link['group'] ?? 'menu',
                        'type' => $link['type'] ?? 'single',
                        'sort_order' => $link['sort_order'] ?? $idx,
                        'is_active' => true,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 5. Apply Site Info
            if (!empty($siteInfo)) {
                if (!empty($siteInfo['name'])) {
                    DB::table('system_configs')->updateOrInsert(
                        ['key' => 'shop_name'],
                        ['group_name' => 'store', 'type' => 'string', 'value' => $siteInfo['name'], 'updated_at' => now(), 'created_at' => now()]
                    );
                }
                if (!empty($siteInfo['description'])) {
                    DB::table('system_configs')->updateOrInsert(
                        ['key' => 'description'],
                        ['group_name' => 'store', 'type' => 'string', 'value' => $siteInfo['description'], 'updated_at' => now(), 'created_at' => now()]
                    );
                }
                if (!empty($siteInfo['language'])) {
                    DB::table('system_configs')->updateOrInsert(
                        ['key' => 'default_language'],
                        ['group_name' => 'system', 'type' => 'string', 'value' => $siteInfo['language'], 'updated_at' => now(), 'created_at' => now()]
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
