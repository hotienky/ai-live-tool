<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * P4 – Plugin-based architecture:
 * Each module registers its own section data resolvers.
 * This class is called during tenancy boot to register resolvers
 * for modules that are installed on the current tenant.
 *
 * Usage: PluginResolverRegistrar::boot() — called from TenancyServiceProvider
 *        after tenancy is initialized and modules are known.
 */
class PluginResolverRegistrar
{
    /**
     * Register all section resolvers for installed modules.
     * Called once per request after tenancy initialization.
     */
    public static function boot(): void
    {
        $moduleResolvers = self::getModuleResolverMap();

        foreach ($moduleResolvers as $moduleId => $resolvers) {
            $tenantId = tenant('id') ?? '';
            if (!ModuleRegistry::isInstalled($tenantId, $moduleId)) {
                continue;
            }

            foreach ($resolvers as $sectionType => $resolver) {
                LayoutResolver::registerSectionResolver($sectionType, $resolver);
            }
        }
    }

    /**
     * Module → section type → resolver mapping.
     * Each module defines which section types it provides data for.
     */
    private static function getModuleResolverMap(): array
    {
        return [
            // ── E-Commerce Module ──
            'ecom' => [
                'featured_products' => self::makeProductResolver(),
                'featured-products' => self::makeProductResolver(),
                'product-listing'   => self::makeProductResolver(),
                'new_arrivals'      => self::makeNewArrivalsResolver(),
                'categories'        => self::makeCategoriesResolver(),
                'product-categories' => self::makeCategoriesResolver(),
                'flash_sale'        => self::makeFlashSaleResolver(),
            ],

            // ── Blog Module ──
            'blog' => [
                'blog_posts'      => self::makeBlogResolver(),
                'blog-collection' => self::makeBlogResolver(),
                'latest-posts'    => self::makeBlogResolver(),
            ],

            // ── Events Module ──
            'events' => [
                'event_list'      => self::makeEventResolver(),
                'upcoming_events' => self::makeEventResolver(),
            ],

            // ── Restaurant Module ──
            'restaurant' => [
                'menu_list'       => self::makeMenuResolver(),
                'restaurant_info' => self::makeRestaurantInfoResolver(),
            ],

            // ── Booking Module ──
            'booking' => [
                'booking_form'    => self::makeBookingResolver(),
                'service_list'    => self::makeServiceResolver(),
            ],

            // ── Real Estate Module ──
            'realestate' => [
                'property_list'   => self::makePropertyResolver(),
                'featured_listings' => self::makePropertyResolver(),
            ],
        ];
    }

    // ══════════════════════════════════════════
    // E-Commerce Resolvers
    // ══════════════════════════════════════════

    private static function makeProductResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? $p['count'] ?? 12);
            try {
                $repo = app(\App\Repositories\Product\ProductRepositoryInterface::class);
                return collect($repo->getProducts($limit)->items())
                    ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                    ->all();
            } catch (\Exception $e) {
                Log::debug("[PluginResolver:ecom] Product resolve failed: {$e->getMessage()}");
                return [];
            }
        };
    }

    private static function makeNewArrivalsResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? $p['count'] ?? 8);
            try {
                $repo = app(\App\Repositories\Product\ProductRepositoryInterface::class);
                return collect($repo->getProducts($limit)->items())
                    ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }

    private static function makeCategoriesResolver(): callable
    {
        return function (array $node, ?string $locale) {
            try {
                $repo = app(\App\Repositories\Category\CategoryRepositoryInterface::class);
                return collect($repo->getCategories())
                    ->map(fn($c) => is_array($c) ? $c : $c->toArray())
                    ->values()
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }

    private static function makeFlashSaleResolver(): callable
    {
        return function (array $node, ?string $locale) {
            try {
                $repo = app(\App\Repositories\FlashSale\FlashSaleRepositoryInterface::class);
                return collect($repo->getActive())
                    ->map(fn($f) => is_array($f) ? $f : $f->toArray())
                    ->values()
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }

    // ══════════════════════════════════════════
    // Blog Resolvers
    // ══════════════════════════════════════════

    private static function makeBlogResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? $p['count'] ?? 6);
            try {
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
        };
    }

    // ══════════════════════════════════════════
    // Events Resolvers
    // ══════════════════════════════════════════

    private static function makeEventResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? 6);
            try {
                return \App\Models\Content::where('type', 'event')
                    ->where('status', 'published')
                    ->orderByDesc('created_at')
                    ->limit($limit)
                    ->get()
                    ->map(fn($e) => $e->toArray())
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }

    // ══════════════════════════════════════════
    // Restaurant Resolvers
    // ══════════════════════════════════════════

    private static function makeMenuResolver(): callable
    {
        return function (array $node, ?string $locale) {
            try {
                return DB::table('restaurant_menu_items')
                    ->where('is_available', true)
                    ->orderBy('sort_order')
                    ->limit(20)
                    ->get()
                    ->map(fn($item) => (array) $item)
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }

    private static function makeRestaurantInfoResolver(): callable
    {
        return function (array $node, ?string $locale) {
            try {
                return DB::table('restaurant_settings')->first();
            } catch (\Exception $e) {
                return null;
            }
        };
    }

    // ══════════════════════════════════════════
    // Booking Resolvers
    // ══════════════════════════════════════════

    private static function makeBookingResolver(): callable
    {
        return function (array $node, ?string $locale) {
            return []; // Booking form data is handled client-side
        };
    }

    private static function makeServiceResolver(): callable
    {
        return function (array $node, ?string $locale) {
            try {
                return DB::table('booking_services')
                    ->where('is_active', true)
                    ->orderBy('sort_order')
                    ->limit(20)
                    ->get()
                    ->map(fn($s) => (array) $s)
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }

    // ══════════════════════════════════════════
    // Real Estate Resolvers
    // ══════════════════════════════════════════

    private static function makePropertyResolver(): callable
    {
        return function (array $node, ?string $locale) {
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            $limit = (int) ($p['limit'] ?? 6);
            try {
                return \App\Models\Content::where('type', 'listing')
                    ->where('status', 'published')
                    ->orderByDesc('created_at')
                    ->limit($limit)
                    ->get()
                    ->map(fn($l) => $l->toArray())
                    ->all();
            } catch (\Exception $e) {
                return [];
            }
        };
    }
}
