<?php

namespace App\Services;

use App\Models\Template;
use App\Models\TemplateInstall;
use Illuminate\Pagination\LengthAwarePaginator;

class TemplateStoreService
{
    /**
     * Browse templates with filters.
     */
    public static function list(array $filters = []): LengthAwarePaginator
    {
        $query = Template::active();

        if ($filters['industry'] ?? null) {
            $query->byIndustry($filters['industry']);
        }

        if ($filters['category'] ?? null) {
            $query->where('category', $filters['category']);
        }

        if (($filters['price'] ?? null) === 'free') {
            $query->free();
        } elseif (($filters['price'] ?? null) === 'paid') {
            $query->where('price', '>', 0);
        }

        if ($filters['featured'] ?? false) {
            $query->featured();
        }

        if ($filters['search'] ?? null) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sort = $filters['sort'] ?? 'install_count';
        $dir = $filters['dir'] ?? 'desc';
        if (in_array($sort, ['install_count', 'rating', 'price', 'created_at', 'name'])) {
            $query->orderBy($sort, $dir);
        }

        return $query->paginate($filters['per_page'] ?? 12);
    }

    /**
     * Install a template for a tenant.
     */
    public static function install(string $tenantId, string $templateId): array
    {
        $template = Template::where('template_id', $templateId)->active()->firstOrFail();

        // 1. Apply theme config (colors, fonts)
        if ($template->theme_config) {
            ThemeEngine::setTenantTheme($tenantId, 'starter');

            $colors = $template->theme_config['colors'] ?? [];
            foreach ($colors as $key => $value) {
                \DB::table('system_configs')->updateOrInsert(
                    ['key' => "theme.color_{$key}"],
                    ['value' => $value, 'group' => 'theme', 'updated_at' => now()]
                );
            }

            $fonts = $template->theme_config['fonts'] ?? [];
            foreach ($fonts as $key => $value) {
                \DB::table('system_configs')->updateOrInsert(
                    ['key' => "theme.font_{$key}"],
                    ['value' => $value, 'group' => 'theme', 'updated_at' => now()]
                );
            }
        }

        // 2. Track install
        $template->increment('install_count');
        TemplateInstall::create([
            'template_id' => $template->id,
            'tenant_id' => $tenantId,
            'installed_at' => now(),
        ]);

        return [
            'success' => true,
            'message' => "Đã cài đặt template: {$template->name}",
            'template' => $template,
        ];
    }

    /**
     * Get template details with reviews.
     */
    public static function detail(string $templateId): ?Template
    {
        return Template::where('template_id', $templateId)
            ->active()
            ->withCount('reviews')
            ->withAvg('reviews', 'rating')
            ->first();
    }
}
