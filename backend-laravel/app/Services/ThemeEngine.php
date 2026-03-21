<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

/**
 * ThemeEngine — manages storefront themes.
 *
 * Each theme lives in /themes/{id}/ with a theme.json manifest.
 * Tenants can select, preview, and switch themes.
 */
class ThemeEngine
{
    /**
     * Base path for built-in themes.
     */
    private static function basePath(): string
    {
        return base_path('themes');
    }

    /**
     * List all available themes.
     */
    public static function listThemes(): array
    {
        $dir = self::basePath();
        if (!File::isDirectory($dir)) return [];

        $themes = [];
        foreach (File::directories($dir) as $themeDir) {
            $manifest = $themeDir . '/theme.json';
            if (File::exists($manifest)) {
                $data = json_decode(File::get($manifest), true);
                if ($data) {
                    $data['_path'] = $themeDir;
                    $data['preview'] = $data['preview'] ?? null;
                    $themes[] = $data;
                }
            }
        }

        return $themes;
    }

    /**
     * Get a single theme by ID.
     */
    public static function getTheme(string $themeId): ?array
    {
        $manifest = self::basePath() . '/' . $themeId . '/theme.json';
        if (!File::exists($manifest)) return null;

        $data = json_decode(File::get($manifest), true);
        if (!$data) return null;

        $data['_path'] = self::basePath() . '/' . $themeId;
        return $data;
    }

    /**
     * Set the active theme for a tenant.
     */
    public static function setTenantTheme(string $tenantId, string $themeId): bool
    {
        $theme = self::getTheme($themeId);
        if (!$theme) return false;

        // Store in system_configs table
        \DB::table('system_configs')->updateOrInsert(
            ['key' => 'theme.active_theme'],
            ['value' => $themeId, 'group' => 'theme', 'updated_at' => now()]
        );

        // Apply theme colors as CSS variable overrides
        if (!empty($theme['colors'])) {
            foreach ($theme['colors'] as $key => $value) {
                \DB::table('system_configs')->updateOrInsert(
                    ['key' => "theme.color_{$key}"],
                    ['value' => $value, 'group' => 'theme', 'updated_at' => now()]
                );
            }
        }

        // Apply fonts
        if (!empty($theme['fonts'])) {
            foreach ($theme['fonts'] as $key => $value) {
                \DB::table('system_configs')->updateOrInsert(
                    ['key' => "theme.font_{$key}"],
                    ['value' => $value, 'group' => 'theme', 'updated_at' => now()]
                );
            }
        }

        return true;
    }

    /**
     * Get the active theme ID for a tenant.
     */
    public static function getTenantTheme(): string
    {
        $config = \DB::table('system_configs')
            ->where('key', 'theme.active_theme')
            ->value('value');

        return $config ?: 'starter';
    }

    /**
     * Get the full theme config for a tenant (active theme + overrides).
     */
    public static function getTenantThemeConfig(): array
    {
        $themeId = self::getTenantTheme();
        $theme = self::getTheme($themeId) ?? self::getTheme('starter') ?? [];

        // Load tenant color overrides
        $overrides = \DB::table('system_configs')
            ->where('group', 'theme')
            ->pluck('value', 'key')
            ->toArray();

        return [
            'theme' => $theme,
            'overrides' => $overrides,
        ];
    }

    /**
     * Get the default sections for a theme (used when applying theme).
     */
    public static function getThemeSections(string $themeId): array
    {
        $theme = self::getTheme($themeId);
        return $theme['sections'] ?? [];
    }
}
