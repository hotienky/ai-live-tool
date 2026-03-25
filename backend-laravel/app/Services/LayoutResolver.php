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
 * Hỗ trợ hai dạng layout:
 *   1. Node có data.endpoint  → fetch theo endpoint đó
 *   2. Node có type trong sectionDataMap → auto-inject dữ liệu theo type
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
     * Tuân thủ P4 – Plugin-based architecture.
     */
    public static function registerSectionResolver(string $sectionType, callable $resolver): void
    {
        self::$pluginResolvers[$sectionType] = $resolver;
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
                // Inject vào params (cho Shopify-style sections) và props (cho block-builder)
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

        // Đệ quy blocks (new builder format: { version, blocks: [...] })
        if (!empty($node['blocks']) && is_array($node['blocks'])) {
            $node['blocks'] = array_map(
                fn($block) => $this->resolveNode($block, $locale),
                $node['blocks']
            );
        }

        return $node;
    }

    /**
     * Auto-resolve data theo section/block type.
     * Plugin có thể mở rộng qua registerSectionResolver().
     */
    private function resolveByType(string $type, array $node, ?string $locale): mixed
    {
        // Kiểm tra plugin-registered resolvers trước (P4 – plugin logic)
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

        // Core section types
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
     * Core section type → data resolver mapping.
     * Chỉ chứa core types; business-specific types đăng ký qua registerSectionResolver().
     */
    private function getCoreTypeMap(): array
    {
        $params = fn(array $node) => array_merge(
            $node['params'] ?? [],
            $node['settings'] ?? []  // block-builder format dùng settings
        );

        return [
            // ── Banner ──
            'banner' => function (array $node, ?string $locale) {
                $repo = app(\App\Repositories\Banner\BannerRepositoryInterface::class);
                return collect($repo->manyBy('status', true))
                    ->map(fn($b) => is_array($b) ? $b : $b->toArray())
                    ->values()
                    ->all();
            },

            // ── E-Commerce ──
            'featured_products' => $this->makeProductResolver(),
            'featured-products' => $this->makeProductResolver(),
            'product-listing' => $this->makeProductResolver(),

            'new_arrivals' => $this->makeNewArrivalsResolver(),

            'categories' => function (array $node, ?string $locale) {
                $repo = app(\App\Repositories\Category\CategoryRepositoryInterface::class);
                return collect($repo->getCategories())
                    ->map(fn($c) => is_array($c) ? $c : $c->toArray())
                    ->values()
                    ->all();
            },

            'product-categories' => function (array $node, ?string $locale) {
                $repo = app(\App\Repositories\Category\CategoryRepositoryInterface::class);
                return collect($repo->getCategories())
                    ->map(fn($c) => is_array($c) ? $c : $c->toArray())
                    ->values()
                    ->all();
            },

            'flash_sale' => function (array $node, ?string $locale) {
                $repo = app(\App\Repositories\FlashSale\FlashSaleRepositoryInterface::class);
                return collect($repo->getActive())
                    ->map(fn($f) => is_array($f) ? $f : $f->toArray())
                    ->values()
                    ->all();
            },

            // ── CMS Pages ──
            'cms_pages' => function (array $node, ?string $locale) {
                $repo = app(\App\Repositories\CmsPage\CmsPageRepositoryInterface::class);
                return collect($repo->all())
                    ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                    ->values()
                    ->all();
            },

            // ── Blog ──
            'blog_posts' => $this->makeBlogResolver(),
            'blog-collection' => $this->makeBlogResolver(),
            'latest-posts' => $this->makeBlogResolver(),
        ];
    }

    /**
     * Tạo product resolver dùng lại cho nhiều section types.
     */
    private function makeProductResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? $p['count'] ?? 12);
            $repo = app(\App\Repositories\Product\ProductRepositoryInterface::class);
            return collect($repo->getProducts($limit)->items())
                ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                ->all();
        };
    }

    /**
     * Tạo new arrivals resolver.
     */
    private function makeNewArrivalsResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? $p['count'] ?? 8);
            $repo = app(\App\Repositories\Product\ProductRepositoryInterface::class);
            return collect($repo->getProducts($limit)->items())
                ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                ->all();
        };
    }

    /**
     * Tạo blog resolver dùng lại cho nhiều section types.
     */
    private function makeBlogResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? $p['count'] ?? 6);
            try {
                // Blog posts qua direct data map (tránh HTTP overhead)
                return $this->fetchData('api/storefront/blog/posts', ['limit' => $limit], $locale);
            } catch (\Exception $e) {
                return [];
            }
        };
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

        $response = Http::timeout(5)->get($url, $query);
        if ($response->successful()) {
            $body = $response->json();
            return $body['data'] ?? $body;
        }

        return [];
    }

    /**
     * Direct DB calls (tránh HTTP round-trip cho các endpoint thông dụng).
     */
    private function getDirectDataMap(): array
    {
        return [
            'api/storefront/banners' => function ($params, $locale) {
                $repo = app(\App\Repositories\Banner\BannerRepositoryInterface::class);
                return collect($repo->manyBy('status', true))
                    ->map(fn($b) => is_array($b) ? $b : $b->toArray())
                    ->values()
                    ->all();
            },
            'api/storefront/products' => function ($params, $locale) {
                $repo = app(\App\Repositories\Product\ProductRepositoryInterface::class);
                $perPage = $params['limit'] ?? 12;
                return collect($repo->getProducts($perPage)->items())
                    ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                    ->all();
            },
            'api/storefront/blog/posts' => function ($params, $locale) {
                // Graceful: blog module có thể chưa được cài
                try {
                    $limit = $params['limit'] ?? 6;
                    return \App\Models\Content::where('type', 'post')
                        ->where('status', 'published')
                        ->orderByDesc('published_at')
                        ->limit($limit)
                        ->get()
                        ->map(fn($p) => $p->toArray())
                        ->all();
                } catch (\Exception $e) {
                    return [];
                }
            },
        ];
    }
}
