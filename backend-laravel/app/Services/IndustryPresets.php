<?php

namespace App\Services;

/**
 * IndustryPresets — Shopify-style industry → module mapping.
 *
 * When a tenant selects their industry (during onboarding or later),
 * this service determines which modules should be auto-installed.
 * This replaces the need for users to manually find and install modules.
 *
 * Pattern: Like Shopify asking "What do you sell?" during setup.
 */
class IndustryPresets
{
    /**
     * Industry → default module IDs.
     * 'cms' is always included as the base (like WordPress core).
     */
    public const PRESETS = [
        'ecommerce' => [
            'label'       => 'Bán hàng Online',
            'icon'        => 'ShoppingCart',
            'description' => 'Website bán hàng hoàn chỉnh với sản phẩm, đơn hàng, thanh toán',
            'modules'     => ['ecom', 'cms', 'marketing', 'shipping', 'warehouse', 'tax', 'accounting'],
        ],
        'livestream' => [
            'label'       => 'Livestream bán hàng',
            'icon'        => 'MonitorPlay',
            'description' => 'Bán hàng qua livestream từ TikTok, Facebook, YouTube',
            'modules'     => ['ecom', 'cms', 'livestream', 'marketing', 'shipping', 'warehouse', 'tax', 'accounting'],
        ],
        'blog' => [
            'label'       => 'Blog / Tin tức',
            'icon'        => 'PenSquare',
            'description' => 'Website blog, tin tức, tạp chí trực tuyến',
            'modules'     => ['cms', 'blog'],
        ],
        'restaurant' => [
            'label'       => 'Nhà hàng / Cafe',
            'icon'        => 'UtensilsCrossed',
            'description' => 'Website nhà hàng với menu, đặt bàn, đặt hàng online',
            'modules'     => ['ecom', 'cms'],
        ],
        'education' => [
            'label'       => 'Khóa học Online',
            'icon'        => 'GraduationCap',
            'description' => 'Nền tảng học trực tuyến với khóa học, bài giảng, chứng chỉ',
            'modules'     => ['cms', 'lms'],
        ],
        'salon' => [
            'label'       => 'Salon / Spa',
            'icon'        => 'Scissors',
            'description' => 'Website salon với dịch vụ, đặt lịch, quản lý khách hàng',
            'modules'     => ['cms', 'crm'],
        ],
        'realestate' => [
            'label'       => 'Bất động sản',
            'icon'        => 'Building2',
            'description' => 'Website bất động sản với tin đăng, tìm kiếm, bản đồ',
            'modules'     => ['cms', 'crm'],
        ],
        'portfolio' => [
            'label'       => 'Portfolio / Landing Page',
            'icon'        => 'Palette',
            'description' => 'Trang giới thiệu cá nhân, doanh nghiệp, hoặc sự kiện',
            'modules'     => ['cms'],
        ],
        'custom' => [
            'label'       => 'Tùy chỉnh',
            'icon'        => 'LayoutGrid',
            'description' => 'Bắt đầu với trang trống, tự thêm tính năng theo nhu cầu',
            'modules'     => ['cms'],
        ],
    ];

    /**
     * Get all available presets (for onboarding UI).
     */
    public static function all(): array
    {
        return collect(self::PRESETS)->map(fn($preset, $key) => [
            'id'          => $key,
            'label'       => $preset['label'],
            'icon'        => $preset['icon'],
            'description' => $preset['description'],
            'modules'     => $preset['modules'],
        ])->values()->toArray();
    }

    /**
     * Get module IDs for a specific industry.
     */
    public static function modulesFor(string $industry): array
    {
        return self::PRESETS[$industry]['modules'] ?? self::PRESETS['custom']['modules'];
    }

    /**
     * Install all modules for an industry preset.
     * Uses ModuleRegistry::install() for each module to trigger migrations + events.
     */
    public static function applyPreset(string $tenantId, string $industry, ?int $userId = null): array
    {
        $modules = self::modulesFor($industry);
        $installed = [];
        $errors = [];

        foreach ($modules as $moduleId) {
            // Skip if already installed
            if (ModuleRegistry::isInstalled($tenantId, $moduleId)) {
                $installed[] = $moduleId;
                continue;
            }

            $result = ModuleRegistry::install($tenantId, $moduleId, $userId);
            if ($result['success']) {
                $installed[] = $moduleId;
            } else {
                $errors[] = "{$moduleId}: {$result['message']}";
            }
        }

        return [
            'success'   => empty($errors),
            'installed' => $installed,
            'errors'    => $errors,
            'industry'  => $industry,
            'message'   => empty($errors)
                ? 'Đã cài đặt ' . count($installed) . ' tính năng cho lĩnh vực "' . (self::PRESETS[$industry]['label'] ?? $industry) . '"'
                : 'Cài đặt hoàn tất với ' . count($errors) . ' lỗi',
        ];
    }
}
