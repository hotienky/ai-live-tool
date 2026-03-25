<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * P5 – Data Layer (BFF):
 * Component KHÔNG fetch API. Laravel PHẢI resolve data trước, inject vào props.
 *
 * Flow: Layout JSON → resolveNode() → inject props.resolvedData → Frontend render
 *
 * CORE ONLY — This class contains only:
 *   1. The resolve engine (recursive node resolution)
 *   2. Core section types (banner, cms_pages, grid, spacer, etc.)
 *   3. Plugin extension API (registerSectionResolver)
 *
 * Plugin-specific resolvers (ecom, blog, events, etc.) are registered
 * via PluginResolverRegistrar — see P4 (Plugin-based architecture).
 */
class LayoutResolver
{
    private string $baseUrl;

    /** Registry cho phép plugin đăng ký data resolver theo section type */
    private static array $pluginResolvers = [];

    public function __construct()
    {
        $this->baseUrl = rtrim(config('app.url'), '/');
    }

    /**
     * Cho phép plugin/module đăng ký resolver theo section type.
     * P4 – Plugin-based architecture.
     */
    public static function registerSectionResolver(string $sectionType, callable $resolver): void
    {
        self::$pluginResolvers[$sectionType] = $resolver;
    }

    /**
     * Get list of all registered resolver types (for debugging/verification).
     */
    public static function getRegisteredResolvers(): array
    {
        return array_keys(self::$pluginResolvers);
    }

    /**
     * Clear all plugin resolvers (useful for testing).
     */
    public static function clearResolvers(): void
    {
        self::$pluginResolvers = [];
    }

    /**
     * Resolve toàn bộ danh sách nodes.
     */
    public function resolve(array $nodes, ?string $locale = null): array
    {
        return array_map(fn($node) => $this->resolveNode($node, $locale), $nodes);
    }

    /**
     * Resolve một node: inject resolvedData, sau đó xử lý children đệ quy.
     */
    private function resolveNode(array $node, ?string $locale = null): array
    {
        // Nguồn 1: node có data.endpoint tường minh
        if (!empty($node['data']['endpoint'])) {
            try {
                $node['props'] ??= [];
                $node['props']['resolvedData'] = $this->fetchData(
                    $node['data']['endpoint'],
                    $node['data']['params'] ?? [],
                    $locale
                );
            } catch (\Exception $e) {
                Log::warning("LayoutResolver: endpoint resolve failed [{$node['data']['endpoint']}]", [
                    'error' => $e->getMessage(),
                ]);
                $node['props']['resolvedData'] = [];
            }

        // Nguồn 2: auto-resolve theo section/block type
        } elseif (!empty($node['type'])) {
            $resolved = $this->resolveByType($node['type'], $node, $locale);
            if ($resolved !== null) {
                $node['params'] ??= [];
                $node['params']['resolvedData'] = $resolved;
                $node['props'] ??= [];
                $node['props']['resolvedData'] = $resolved;
            }
        }

        // Đệ quy children
        if (!empty($node['children'])) {
            $node['children'] = array_map(
                fn($child) => $this->resolveNode($child, $locale),
                $node['children']
            );
        }

        // Đệ quy blocks (new builder format)
        if (!empty($node['blocks']) && is_array($node['blocks'])) {
            $node['blocks'] = array_map(
                fn($block) => $this->resolveNode($block, $locale),
                $node['blocks']
            );
        }

        return $node;
    }

    /**
     * Resolve data theo section/block type.
     * 1. Check plugin-registered resolvers first (P4)
     * 2. Fallback to core types
     */
    private function resolveByType(string $type, array $node, ?string $locale): mixed
    {
        // Plugin-registered resolvers (P4 – plugin logic first)
        if (isset(self::$pluginResolvers[$type])) {
            try {
                return (self::$pluginResolvers[$type])($node, $locale);
            } catch (\Exception $e) {
                Log::warning("LayoutResolver: plugin resolver failed for type [{$type}]", [
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        }

        // Core section types only
        $map = $this->getCoreTypeMap();
        if (isset($map[$type])) {
            try {
                return ($map[$type])($node, $locale);
            } catch (\Exception $e) {
                Log::warning("LayoutResolver: core type resolve failed [{$type}]", [
                    'error' => $e->getMessage(),
                ]);
                return null;
            }
        }

        return null;
    }

    /**
     * CORE section types ONLY.
     * P4: NO plugin/business-specific types here.
     * Plugin types are registered via PluginResolverRegistrar.
     */
    private function getCoreTypeMap(): array
    {
        return [
            // ── Banner (core feature — every tenant has banners) ──
            'banner' => function (array $node, ?string $locale) {
                try {
                    $repo = app(\App\Repositories\Banner\BannerRepositoryInterface::class);
                    return collect($repo->manyBy('status', true))
                        ->map(fn($b) => is_array($b) ? $b : $b->toArray())
                        ->values()
                        ->all();
                } catch (\Exception $e) {
                    return [];
                }
            },

            // ── CMS Pages (core) ──
            'cms_pages' => function (array $node, ?string $locale) {
                try {
                    $repo = app(\App\Repositories\CmsPage\CmsPageRepositoryInterface::class);
                    return collect($repo->all())
                        ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                        ->values()
                        ->all();
                } catch (\Exception $e) {
                    return [];
                }
            },
        ];
    }

    /**
     * Fetch data từ endpoint. Ưu tiên direct DB call, fallback HTTP.
     */
    private function fetchData(string $endpoint, array $params = [], ?string $locale = null): mixed
    {
        $directMap = $this->getDirectDataMap();
        $cleanEndpoint = ltrim($endpoint, '/');

        if (isset($directMap[$cleanEndpoint])) {
            return call_user_func($directMap[$cleanEndpoint], $params, $locale);
        }

        // Fallback: internal HTTP call
        $url = $this->baseUrl . '/' . $cleanEndpoint;
        $query = $params;
        if ($locale) {
            $query['lang'] = $locale;
        }

        try {
            $response = Http::timeout(5)->get($url, $query);
            if ($response->successful()) {
                $body = $response->json();
                return $body['data'] ?? $body;
            }
        } catch (\Exception $e) {
            Log::warning("LayoutResolver: HTTP fetch failed [{$cleanEndpoint}]", [
                'error' => $e->getMessage(),
            ]);
        }

        return [];
    }

    /**
     * Direct DB calls for common endpoints (avoids HTTP round-trip).
     * Only core endpoints here — plugin endpoints use the resolver system.
     */
    private function getDirectDataMap(): array
    {
        return [
            'api/storefront/banners' => function ($params, $locale) {
                try {
                    $repo = app(\App\Repositories\Banner\BannerRepositoryInterface::class);
                    return collect($repo->manyBy('status', true))
                        ->map(fn($b) => is_array($b) ? $b : $b->toArray())
                        ->values()
                        ->all();
                } catch (\Exception $e) {
                    return [];
                }
            },
        ];
    }
}
