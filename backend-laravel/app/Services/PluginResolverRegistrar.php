<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * P4 – Plugin-based architecture:
 * Each module registers its own section data resolvers AND content types.
 * This class is called during tenancy boot to register resolvers/types
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
        $tenantId = tenant('id') ?? '';
        $moduleResolvers = self::getModuleResolverMap();

        foreach ($moduleResolvers as $moduleId => $resolvers) {
            if (!ModuleRegistry::isInstalled($tenantId, $moduleId)) {
                continue;
            }

            foreach ($resolvers as $sectionType => $resolver) {
                LayoutResolver::registerSectionResolver($sectionType, $resolver);
            }
        }

        // P4: Register content types for installed modules
        self::bootContentTypes($tenantId);
    }

    /**
     * Register plugin-specific content types.
     * Only registers types for modules installed on this tenant.
     */
    private static function bootContentTypes(string $tenantId): void
    {
        $moduleContentTypes = self::getModuleContentTypes();

        foreach ($moduleContentTypes as $moduleId => $types) {
            if (!ModuleRegistry::isInstalled($tenantId, $moduleId)) {
                continue;
            }

            foreach ($types as $typeKey => $config) {
                ContentTypeRegistry::register($typeKey, $config);
            }
        }

        // P4.2: Register Tenant-specific Content Types from DB
        try {
            $tenantTypes = \App\Models\TenantContentType::all();
            foreach ($tenantTypes as $type) {
                ContentTypeRegistry::register($type->type_key, [
                    'label' => $type->name,
                    'label_plural' => $type->name,
                    'icon' => $type->icon ?? 'FileText',
                    'supports' => $type->supports ?? [],
                    'has_revisions' => $type->has_revisions,
                    'has_comments' => $type->has_comments,
                    'meta_fields' => $type->meta_fields ?? [],
                ]);
            }
        } catch (\Exception $e) {
            // In case table does not exist or db not migrated yet
            \Illuminate\Support\Facades\Log::warning("Could not load TenantContentTypes: " . $e->getMessage());
        }
    }

    /**
     * Module → content type definitions.
     * P4: Each module defines its own content types.
     */
    private static function getModuleContentTypes(): array
    {
        return [
            'blog' => [
                'post' => [
                    'label' => 'Bài viết',
                    'label_plural' => 'Blog',
                    'icon' => 'PenSquare',
                    'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
                    'taxonomies' => ['category', 'tag'],
                    'has_revisions' => true,
                    'has_comments' => true,
                    'module_id' => 'blog',
                    'meta_fields' => [
                        ['key' => 'seo_title', 'type' => 'text', 'label' => 'SEO Title', 'validation' => 'string|max:255'],
                        ['key' => 'seo_description', 'type' => 'textarea', 'label' => 'Meta Description', 'validation' => 'string|max:500'],
                        ['key' => 'reading_time', 'type' => 'number', 'label' => 'Thời gian đọc (phút)'],
                        ['key' => 'is_featured', 'type' => 'checkbox', 'label' => 'Bài viết nổi bật'],
                    ],
                ],
            ],

            'events' => [
                'event' => [
                    'label' => 'Sự kiện',
                    'label_plural' => 'Sự kiện',
                    'icon' => 'CalendarDays',
                    'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
                    'taxonomies' => ['event_category'],
                    'has_revisions' => false,
                    'has_comments' => false,
                    'module_id' => 'events',
                    'meta_fields' => [
                        ['key' => 'location', 'type' => 'text', 'label' => 'Địa điểm', 'validation' => 'string|max:500'],
                        ['key' => 'start_date', 'type' => 'datetime', 'label' => 'Ngày bắt đầu', 'required' => true, 'validation' => 'date'],
                        ['key' => 'end_date', 'type' => 'datetime', 'label' => 'Ngày kết thúc', 'validation' => 'date'],
                        ['key' => 'ticket_price', 'type' => 'number', 'label' => 'Giá vé', 'validation' => 'numeric|min:0'],
                        ['key' => 'capacity', 'type' => 'number', 'label' => 'Sức chứa', 'validation' => 'integer|min:0'],
                        ['key' => 'organizer', 'type' => 'text', 'label' => 'Đơn vị tổ chức', 'validation' => 'string|max:255'],
                        ['key' => 'registration_url', 'type' => 'text', 'label' => 'Link đăng ký', 'validation' => 'string|max:500'],
                    ],
                ],
            ],

            'forum' => [
                'topic' => [
                    'label' => 'Chủ đề',
                    'label_plural' => 'Diễn đàn',
                    'icon' => 'MessageSquare',
                    'supports' => ['title', 'body', 'slug'],
                    'taxonomies' => ['forum_category'],
                    'has_revisions' => false,
                    'has_comments' => true,
                    'module_id' => 'forum',
                    'meta_fields' => [
                        ['key' => 'is_pinned', 'type' => 'checkbox', 'label' => 'Ghim'],
                        ['key' => 'is_locked', 'type' => 'checkbox', 'label' => 'Khoá'],
                        ['key' => 'view_count', 'type' => 'number', 'label' => 'Lượt xem'],
                        ['key' => 'reply_count', 'type' => 'number', 'label' => 'Trả lời'],
                    ],
                ],
            ],

            'jobboard' => [
                'job' => [
                    'label' => 'Tin tuyển dụng',
                    'label_plural' => 'Tuyển dụng',
                    'icon' => 'Briefcase',
                    'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
                    'taxonomies' => ['job_category', 'job_type'],
                    'has_revisions' => false,
                    'has_comments' => false,
                    'module_id' => 'jobboard',
                    'meta_fields' => [
                        ['key' => 'company', 'type' => 'text', 'label' => 'Công ty', 'required' => true, 'validation' => 'string|max:255'],
                        ['key' => 'location', 'type' => 'text', 'label' => 'Địa điểm', 'validation' => 'string|max:500'],
                        ['key' => 'salary_range', 'type' => 'text', 'label' => 'Mức lương', 'validation' => 'string|max:255'],
                        ['key' => 'deadline', 'type' => 'date', 'label' => 'Hạn nộp', 'validation' => 'date'],
                        ['key' => 'experience_level', 'type' => 'select', 'label' => 'Kinh nghiệm', 'validation' => 'string|max:100'],
                        ['key' => 'apply_url', 'type' => 'text', 'label' => 'Link ứng tuyển', 'validation' => 'string|max:500'],
                    ],
                ],
            ],

            'realestate' => [
                'listing' => [
                    'label' => 'Tin đăng',
                    'label_plural' => 'Bất động sản',
                    'icon' => 'Building2',
                    'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
                    'taxonomies' => ['property_type', 'listing_type'],
                    'has_revisions' => false,
                    'has_comments' => false,
                    'module_id' => 'realestate',
                    'meta_fields' => [
                        ['key' => 'price', 'type' => 'number', 'label' => 'Giá', 'required' => true, 'validation' => 'numeric|min:0'],
                        ['key' => 'area_sqm', 'type' => 'number', 'label' => 'Diện tích (m²)', 'validation' => 'numeric|min:0'],
                        ['key' => 'bedrooms', 'type' => 'number', 'label' => 'Phòng ngủ', 'validation' => 'integer|min:0'],
                        ['key' => 'bathrooms', 'type' => 'number', 'label' => 'Phòng tắm', 'validation' => 'integer|min:0'],
                        ['key' => 'address', 'type' => 'text', 'label' => 'Địa chỉ', 'required' => true, 'validation' => 'string|max:500'],
                        ['key' => 'lat', 'type' => 'number', 'label' => 'Vĩ độ', 'validation' => 'numeric'],
                        ['key' => 'lng', 'type' => 'number', 'label' => 'Kinh độ', 'validation' => 'numeric'],
                        ['key' => 'agent_name', 'type' => 'text', 'label' => 'Môi giới', 'validation' => 'string|max:255'],
                        ['key' => 'agent_phone', 'type' => 'text', 'label' => 'SĐT Môi giới', 'validation' => 'string|max:20'],
                    ],
                ],
            ],
        ];
    }

    /**
     * Module → section type → resolver mapping.
     * Each module defines which section types it provides data for.
     */
    private static function getModuleResolverMap(): array
    {
        return [
            // ── E-Commerce Module ──
            // Canonical types use underscore. Hyphen aliases are normalized
            // by LayoutResolver before reaching here.
            'ecom' => [
                'featured_products'  => self::makeProductResolver(),
                'product_listing'    => self::makeProductResolver(),
                'new_arrivals'       => self::makeNewArrivalsResolver(),
                'categories'         => self::makeCategoriesResolver(),
                'product_categories' => self::makeCategoriesResolver(),
                'flash_sale'         => self::makeFlashSaleResolver(),
            ],

            // ── Blog Module ──
            'blog' => [
                'blog_posts'      => self::makeBlogResolver(),
                'blog_collection' => self::makeBlogResolver(),
                'latest_posts'    => self::makeBlogResolver(),
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
                $query = \App\Models\Product::query()->where('is_active', true);

                if (!empty($p['filterCategory'])) {
                    $query->where('category_id', $p['filterCategory']);
                }

                if (!empty($p['sortOrder'])) {
                    switch ($p['sortOrder']) {
                        case 'bestselling':
                            // Fallback to random if no sales count column
                            $query->inRandomOrder();
                            break;
                        case 'price_asc':
                            $query->orderBy('price', 'asc');
                            break;
                        case 'price_desc':
                            $query->orderBy('price', 'desc');
                            break;
                        case 'newest':
                        default:
                            $query->orderByDesc('created_at')->orderByDesc('id');
                            break;
                    }
                } else {
                    $query->orderByDesc('created_at')->orderByDesc('id');
                }

                return collect($query->limit($limit)->get())
                    ->map(fn($p) => is_array($p) ? $p : $p->toArray())
                    ->all();
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::debug("[PluginResolver:ecom] Product resolve failed: {$e->getMessage()}");
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
            $p = array_merge($node['params'] ?? [], $node['settings'] ?? []);
            try {
                $query = \App\Models\ProductCategory::query();
                if (!empty($p['selectedCategoryIds']) && is_array($p['selectedCategoryIds'])) {
                    $query->whereIn('id', $p['selectedCategoryIds']);
                }
                return collect($query->get())
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
                    ->map(fn($p) => is_array($p) ? $p : (is_object($p) && method_exists($p, 'toArray') ? $p->toArray() : (array)$p))
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
