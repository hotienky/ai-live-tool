<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Product\ProductRepositoryInterface;
use App\Repositories\Category\CategoryRepositoryInterface;
use App\Repositories\Brand\BrandRepositoryInterface;
use App\Repositories\Banner\BannerRepositoryInterface;
use App\Repositories\CmsPage\CmsPageRepositoryInterface;
use App\Repositories\Language\LanguageRepositoryInterface;
use App\Repositories\FlashSale\FlashSaleRepositoryInterface;
use App\Repositories\Order\OrderRepositoryInterface;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use App\Repositories\Coupon\CouponRepositoryInterface;
use App\Actions\Storefront\CheckoutAction;
use App\Actions\Storefront\OrderDetailAction;
use App\Actions\Storefront\ShipmentTrackingAction;
use App\Actions\Storefront\ProductReviewsAction;
use App\Actions\Storefront\CreateReviewAction;
use App\Repositories\NavLink\NavLinkRepositoryInterface;
use App\Traits\ApiResponse;
use App\Models\ContentTranslation;
use App\Models\TenantModuleSubscription;
use Illuminate\Http\Request;

class StorefrontController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ProductRepositoryInterface $productRepo,
        private CategoryRepositoryInterface $categoryRepo,
        private BrandRepositoryInterface $brandRepo,
        private BannerRepositoryInterface $bannerRepo,
        private CmsPageRepositoryInterface $cmsPageRepo,
        private LanguageRepositoryInterface $langRepo,
        private FlashSaleRepositoryInterface $flashSaleRepo,
        private OrderRepositoryInterface $orderRepo,
        private SystemConfigRepositoryInterface $configRepo,
        private CouponRepositoryInterface $couponRepo,
        private NavLinkRepositoryInterface $navLinkRepo,
    ) {}

    public function products(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = $this->productRepo->getProducts($perPage);
        $items = collect($paginated->items())->map(fn($p) => $p->toArray())->all();

        // Merge translations if locale requested
        $locale = $this->getLocale($request);
        if ($locale) {
            $items = ContentTranslation::mergeIntoItems($items, 'products', $locale, ['name', 'description', 'meta_title', 'meta_description']);
        }

        return $this->successResponse([
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function productDetail(Request $request, $identifier)
    {
        $product = $this->productRepo->findBySlugOrId($identifier);
        if (!$product) return $this->notFoundResponse('Product not found');

        $dbVariants = $this->orderRepo->getVariants($product->id);
        $jsonVariants = is_array($product->variants) ? $product->variants : [];

        if ($dbVariants->count() > 0 && !empty($jsonVariants)) {
            $jsonMap = collect($jsonVariants)->keyBy(fn($v) => ($v['sku'] ?? '') ?: ($v['name'] ?? ''));
            $dbVariants = $dbVariants->map(function ($v) use ($jsonMap) {
                $key = $v->sku ?: $v->name;
                $json = $jsonMap->get($key);
                if ($json && isset($json['promotion_price'])) {
                    $v->promotion_price = $json['promotion_price'];
                }
                return $v;
            });
        }

        $product->variants_list = $dbVariants->count() > 0 ? $dbVariants : collect($jsonVariants);

        // Merge translations for product detail
        $locale = $this->getLocale($request);
        if ($locale) {
            $product = ContentTranslation::mergeIntoSingleItem($product, 'products', $locale, ['name', 'description', 'meta_title', 'meta_description']);
        }

        return $this->successResponse($product);
    }

    public function relatedProducts(Request $request, $slug)
    {
        $product = $this->productRepo->findBySlugOrId($slug);
        if (!$product) return $this->notFoundResponse('Product not found');

        try {
            $related = $this->productRepo->query()
                ->where('is_active', true)
                ->where('id', '!=', $product->id)
                ->when($product->category_id, fn($q) => $q->where('category_id', $product->category_id))
                ->limit(6)
                ->get();

            $locale = $this->getLocale($request);
            if ($locale) {
                $arr = collect($related)->map(fn($p) => $p->toArray())->all();
                $arr = ContentTranslation::mergeIntoItems($arr, 'products', $locale, ['name', 'description']);
                return $this->successResponse($arr);
            }
            return $this->successResponse($related);
        } catch (\Exception $e) {
            return $this->successResponse([]);
        }
    }

    public function categories(Request $request)
    {
        $items = $this->categoryRepo->getCategories();
        $locale = $this->getLocale($request);
        if ($locale) {
            $arr = collect($items)->map(fn($c) => is_array($c) ? $c : $c->toArray())->all();
            $arr = ContentTranslation::mergeIntoItems($arr, 'categories', $locale, ['name', 'description', 'meta_title', 'meta_description']);
            return $this->successResponse($arr);
        }
        return $this->successResponse($items);
    }
    public function brands(Request $request)
    {
        $items = $this->brandRepo->all();
        $locale = $this->getLocale($request);
        if ($locale) {
            $arr = collect($items)->map(fn($b) => is_array($b) ? $b : $b->toArray())->all();
            $arr = ContentTranslation::mergeIntoItems($arr, 'brands', $locale, ['name', 'description', 'meta_title', 'meta_description']);
            return $this->successResponse($arr);
        }
        return $this->successResponse($items);
    }

    public function banners(Request $request)
    {
        $items = $this->bannerRepo->manyBy('status', 1);
        $locale = $this->getLocale($request);
        if ($locale) {
            $arr = collect($items)->map(fn($b) => is_array($b) ? $b : $b->toArray())->all();
            $arr = ContentTranslation::mergeIntoItems($arr, 'banners', $locale, ['title', 'description']);
            return $this->successResponse($arr);
        }
        return $this->successResponse($items);
    }

    public function pages(Request $request)
    {
        $items = $this->cmsPageRepo->all();
        $locale = $this->getLocale($request);
        if ($locale) {
            $arr = collect($items)->map(fn($p) => is_array($p) ? $p : $p->toArray())->all();
            $arr = ContentTranslation::mergeIntoItems($arr, 'cms_pages', $locale, ['title', 'content', 'meta_title', 'meta_description']);
            return $this->successResponse($arr);
        }
        return $this->successResponse($items);
    }
    public function flashSales(Request $request) {
        $items = collect($this->flashSaleRepo->getActive())->map(fn($item) => is_array($item) ? $item : $item->toArray())->all();
        $locale = $this->getLocale($request);
        if ($locale) {
            $items = ContentTranslation::mergeIntoItems($items, 'flash_sales', $locale, ['name']);
        }
        return $this->successResponse($items);
    }

    /**
     * Mega endpoint: returns all site configuration in one request.
     * Used by Headless frontends to bootstrap in a single API call.
     */
    public function siteConfig(Request $request)
    {
        $locale = $this->getLocale($request);

        // Store info
        $storeConfigs = $this->configRepo->getByGroup('store');
        $storeInfo = [];
        foreach ($storeConfigs as $c) { $storeInfo[$c->key] = $c->value; }

        if ($locale) {
            $trans = ContentTranslation::getGrouped('configs', 'store');
            if (isset($trans[$locale])) {
                $storeInfo = array_merge($storeInfo, $trans[$locale]);
            }
        }

        // Theme
        $themeConfigs = $this->configRepo->getByGroup('theme');
        $theme = [];
        foreach ($themeConfigs as $c) { $theme[$c->key] = $c->value; }

        // Layout
        $layoutConfigs = $this->configRepo->getByGroup('storefront_layout');
        $layoutMap = [];
        foreach ($layoutConfigs as $c) { $layoutMap[$c->key] = $c->value; }

        if ($locale) {
            $transLayout = ContentTranslation::getGrouped('configs', 'storefront_layout');
            if (isset($transLayout[$locale])) {
                $layoutMap = array_merge($layoutMap, $transLayout[$locale]);
            }
        }

        // Nav links (nested)
        $navLinks = $this->navLinkRepo->all();
        $mappedLinks = $navLinks->map(fn($link) => [
            'id' => $link->id,
            'name' => $link->title ?? '',
            'url' => $link->url ?? '#',
            'group' => $link->group ?? 'menu',
            'type' => $link->type ?? 'single',
            'sort' => $link->sort_order ?? 0,
            'parent_id' => $link->parent_id,
            'target' => $link->target ?? '_self',
            'icon' => $link->icon ?? '',
            'is_active' => $link->is_active ?? true,
        ])->all();

        // Merge translations for navLinks if needed
        if ($locale) {
            $mappedLinks = ContentTranslation::mergeIntoItems($mappedLinks, 'nav_links', $locale, ['title']);
        }

        $mappedCollection = collect($mappedLinks);
        $parentLinks = $mappedCollection->whereNull('parent_id')->values();
        $nestedLinks = $parentLinks->map(function ($p) use ($mappedCollection) {
            $p['children'] = $mappedCollection->where('parent_id', $p['id'])->values()->all();
            return $p;
        });

        // Categories (flat)
        $categories = $this->categoryRepo->getCategories();

        // Merge translations for categories if needed
        if ($locale) {
            $catArr = collect($categories)->map(fn($c) => is_array($c) ? $c : $c->toArray())->all();
            $categories = ContentTranslation::mergeIntoItems($catArr, 'categories', $locale, ['name', 'description', 'meta_title', 'meta_description']);
        }

        // Default layout values
        $defaultSections = [
            ['type' => 'banner', 'enabled' => true, 'order' => 0],
            ['type' => 'categories', 'enabled' => true, 'order' => 1],
            ['type' => 'flash_sale', 'enabled' => true, 'order' => 2],
            ['type' => 'featured_products', 'enabled' => true, 'order' => 3],
            ['type' => 'new_arrivals', 'enabled' => true, 'order' => 4],
            ['type' => 'cms_pages', 'enabled' => true, 'order' => 5],
        ];
        $defaultHeaderConfig = ['logoPosition' => 'left', 'maxNavLinks' => 5, 'showSearch' => true, 'sticky' => true, 'showThemeToggle' => true];
        $defaultFooterConfig = [
            'columns' => [
                ['title' => 'Về chúng tôi', 'type' => 'links', 'links' => []],
                ['title' => 'Hỗ trợ', 'type' => 'links', 'links' => []],
                ['title' => 'Liên hệ', 'type' => 'contact', 'items' => []],
            ],
            'social' => [], 'paymentMethods' => ['cod', 'bank'],
            'badges' => [], 'legalText' => '', 'copyrightText' => '', 'bgColor' => '',
        ];

        // Languages (only if languages module is installed)
        $languages = [];
        if ($this->isLanguagesModuleActive()) {
            $languages = $this->langRepo->query()->where('is_active', true)->get()->toArray();
        }

        return $this->successResponse([
            'store' => $storeInfo,
            'theme' => $theme,
            'layout' => [
                'sections' => json_decode($layoutMap['layout_sections'] ?? 'null') ?: $defaultSections,
                'pages' => json_decode($layoutMap['layout_pages'] ?? 'null', true) ?: ['cart' => true, 'account' => true, 'auth' => true, 'order_tracking' => true, 'products' => true],
                'pageConfigs' => json_decode($layoutMap['layout_page_configs'] ?? 'null', true) ?: [],
                'template' => $layoutMap['layout_template'] ?? 'full_store',
                'customCss' => $layoutMap['layout_custom_css'] ?? '',
                'headerConfig' => json_decode($layoutMap['layout_header_config'] ?? 'null', true) ?: $defaultHeaderConfig,
                'footerConfig' => json_decode($layoutMap['layout_footer_config'] ?? 'null', true) ?: $defaultFooterConfig,
            ],
            'navLinks' => $nestedLinks->values(),
            'categories' => $categories,
            'languages' => $languages,
        ]);
    }

    /**
     * Full-text search across products.
     */
    public function searchProducts(Request $request)
    {
        $q = trim($request->input('q', ''));
        if (strlen($q) < 2) return $this->successResponse(['data' => [], 'meta' => ['total' => 0]]);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = $this->productRepo->query()
            ->where('is_active', true)
            ->where(function ($query) use ($q) {
                $query->where('name', 'like', "%{$q}%")
                      ->orWhere('description', 'like', "%{$q}%")
                      ->orWhere('sku', 'like', "%{$q}%")
                      ->orWhere('keywords', 'like', "%{$q}%");
            })
            ->paginate($perPage);

        $items = collect($paginated->items())->map(fn($p) => $p->toArray())->all();

        // Merge translations if locale requested
        $locale = $this->getLocale($request);
        if ($locale) {
            $items = ContentTranslation::mergeIntoItems($items, 'products', $locale, ['name', 'description', 'meta_title', 'meta_description']);
        }

        return $this->successResponse([
            'data' => $items,
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function pageDetail(Request $request, $slug)
    {
        $page = $this->cmsPageRepo->findBy('alias', $slug);
        if (!$page) return $this->notFoundResponse('Page not found');

        $locale = $this->getLocale($request);
        if ($locale) {
            $page = ContentTranslation::mergeIntoSingleItem($page, 'cms_pages', $locale, ['title', 'content', 'meta_title', 'meta_description']);
        }
        return $this->successResponse($page);
    }

    public function resolveUrl(Request $request)
    {
        $path = ltrim($request->input('path'), '/');
        if (empty($path)) return $this->notFoundResponse('Path is required');
        $locale = $this->getLocale($request);

        $page = $this->cmsPageRepo->findBy('alias', $path);
        if ($page) {
            if ($locale) $page = ContentTranslation::mergeIntoSingleItem($page, 'cms_pages', $locale, ['title', 'content', 'meta_title', 'meta_description']);
            return $this->successResponse(['type' => 'page', 'data' => $page]);
        }

        $product = $this->productRepo->findBySlugOrId($path);
        if ($product) {
            $dbVariants = $this->orderRepo->getVariants($product->id);
            $jsonVariants = is_array($product->variants) ? $product->variants : [];
            if ($dbVariants->count() > 0 && !empty($jsonVariants)) {
                $jsonMap = collect($jsonVariants)->keyBy(fn($v) => ($v['sku'] ?? '') ?: ($v['name'] ?? ''));
                $dbVariants = $dbVariants->map(function ($v) use ($jsonMap) {
                    $key = $v->sku ?: $v->name;
                    $json = $jsonMap->get($key);
                    if ($json && isset($json['promotion_price'])) $v->promotion_price = $json['promotion_price'];
                    return $v;
                });
            }
            $product->variants_list = $dbVariants->count() > 0 ? $dbVariants : collect($jsonVariants);
            if ($locale) $product = ContentTranslation::mergeIntoSingleItem($product, 'products', $locale, ['name', 'description', 'meta_title', 'meta_description']);
            return $this->successResponse(['type' => 'product', 'data' => $product]);
        }

        $category = $this->categoryRepo->findBy('slug', $path);
        if ($category) {
            if ($locale) $category = ContentTranslation::mergeIntoSingleItem($category, 'categories', $locale, ['name', 'description', 'meta_title', 'meta_description']);
            return $this->successResponse(['type' => 'category', 'data' => $category]);
        }

        return $this->notFoundResponse('Route not found');
    }

    public function storeInfo(Request $request)
    {
        $configs = $this->configRepo->getByGroup('store');
        $info = [];
        foreach ($configs as $c) { $info[$c->key] = $c->value; }

        $locale = $this->getLocale($request);
        if ($locale) {
            $trans = ContentTranslation::getGrouped('configs', 'store');
            if (isset($trans[$locale])) {
                $info = array_merge($info, $trans[$locale]);
            }
        }
        return $this->successResponse($info);
    }

    public function languages()
    {
        return $this->successResponse($this->langRepo->query()->where('is_active', true)->get());
    }

    public function translations($langCode)
    {
        $lang = $this->langRepo->findBy('code', $langCode);
        if (!$lang) return $this->notFoundResponse('Language not found');
        return $this->successResponse($this->langRepo->getTranslations($lang->id));
    }

    public function featuredProducts(Request $request)
    {
        $items = $this->productRepo->query()->where('is_featured', true)->where('is_active', true)->limit(12)->get();
        $locale = $this->getLocale($request);
        if ($locale) {
            $arr = collect($items)->map(fn($p) => $p->toArray())->all();
            $arr = ContentTranslation::mergeIntoItems($arr, 'products', $locale, ['name', 'description', 'meta_title', 'meta_description']);
            return $this->successResponse($arr);
        }
        return $this->successResponse($items);
    }

    public function theme()
    {
        $configs = $this->configRepo->getByGroup('theme');
        $theme = [];
        foreach ($configs as $c) { $theme[$c->key] = $c->value; }
        return $this->successResponse($theme);
    }

    public function storefrontLayout()
    {
        $configs = $this->configRepo->getByGroup('storefront_layout');
        $map = [];
        foreach ($configs as $c) { $map[$c->key] = $c->value; }

        $defaultSections = [
            ['type' => 'banner', 'enabled' => true, 'order' => 0],
            ['type' => 'categories', 'enabled' => true, 'order' => 1],
            ['type' => 'flash_sale', 'enabled' => true, 'order' => 2],
            ['type' => 'featured_products', 'enabled' => true, 'order' => 3],
            ['type' => 'new_arrivals', 'enabled' => true, 'order' => 4],
            ['type' => 'cms_pages', 'enabled' => true, 'order' => 5],
        ];
        $defaultPages = ['cart' => true, 'account' => true, 'auth' => true, 'order_tracking' => true, 'products' => true];
        $defaultPageConfigs = [
            'products' => ['sidebarPosition' => 'left', 'gridColumns' => 4, 'itemsPerPage' => 12, 'showFilters' => ['category' => true, 'brand' => true, 'price' => true]],
            'productDetail' => ['galleryStyle' => 'thumbnails', 'layoutRatio' => '50-50', 'showBreadcrumb' => true, 'showRelatedProducts' => true, 'relatedCount' => 6, 'showReviews' => true],
            'checkout' => ['showCoupon' => true, 'showNotes' => true, 'showSteps' => true, 'layout' => 'two-column'],
            'auth' => ['allowRegister' => true, 'allowForgotPassword' => true, 'showSocialLogin' => false, 'cardMaxWidth' => 440],
            'account' => ['showOrders' => true, 'showAddresses' => true, 'showPasswordChange' => true, 'sidebarPosition' => 'left'],
        ];
        $defaultHeaderConfig = ['logoPosition' => 'left', 'maxNavLinks' => 5, 'showSearch' => true, 'sticky' => true, 'showThemeToggle' => true];
        $defaultFooterConfig = [
            'columns' => [
                ['title' => 'Về chúng tôi', 'type' => 'links', 'links' => []],
                ['title' => 'Hỗ trợ', 'type' => 'links', 'links' => []],
                ['title' => 'Liên hệ', 'type' => 'contact', 'items' => []],
            ],
            'social' => [], 'paymentMethods' => ['cod', 'bank'],
            'badges' => [], 'legalText' => '', 'copyrightText' => '', 'bgColor' => '',
        ];

        return $this->successResponse([
            'sections' => json_decode($map['layout_sections'] ?? 'null') ?: $defaultSections,
            'pages' => json_decode($map['layout_pages'] ?? 'null') ?: $defaultPages,
            'template' => $map['layout_template'] ?? 'full_store',
            'customCss' => $map['layout_custom_css'] ?? '',
            'pageConfigs' => json_decode($map['layout_page_configs'] ?? 'null', true) ?: $defaultPageConfigs,
            'headerConfig' => json_decode($map['layout_header_config'] ?? 'null', true) ?: $defaultHeaderConfig,
            'footerConfig' => json_decode($map['layout_footer_config'] ?? 'null', true) ?: $defaultFooterConfig,
        ]);
    }

    public function paymentMethods()
    {
        $configs = $this->configRepo->getByGroup('payment');
        $map = [];
        foreach ($configs as $c) { $map[$c->key] = $c->value; }

        $methods = [];
        if (filter_var($map['payment_cod_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $methods[] = ['code' => 'cod', 'name' => $map['payment_cod_name'] ?? 'COD', 'description' => $map['payment_cod_description'] ?? ''];
        }
        if (filter_var($map['payment_bank_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $methods[] = [
                'code' => 'bank', 'name' => $map['payment_bank_name'] ?? 'Bank Transfer', 'description' => $map['payment_bank_description'] ?? '',
                'bank_info' => ['account_name' => $map['payment_bank_account_name'] ?? '', 'account_number' => $map['payment_bank_account_number'] ?? '', 'bank_name' => $map['payment_bank_name_display'] ?? '', 'branch' => $map['payment_bank_branch'] ?? '', 'note_template' => $map['payment_bank_note_template'] ?? ''],
            ];
        }
        return $this->successResponse($methods);
    }

    // ── Delegated to Actions ──
    public function checkout(Request $request, CheckoutAction $action) { return $action($request); }
    public function orderDetail($id, OrderDetailAction $action) { return $action($id); }
    public function shipmentTracking(Request $request, $orderId, ShipmentTrackingAction $action) { return $action($request, $orderId); }
    public function productReviews($productId, ProductReviewsAction $action) { return $action($productId); }
    public function createReview(Request $request, $productId, CreateReviewAction $action) { return $action($request, $productId); }

    public function storefrontOrders(Request $request)
    {
        $customer = $request->attributes->get('shop_customer');
        if (!$customer) return $this->errorResponse('Authentication required', 401);

        $orders = $this->orderRepo->query()
            ->where(function ($q) use ($customer) {
                $q->where('customer_email', $customer->email);
                if ($customer->phone) $q->orWhere('customer_phone', $customer->phone);
            })
            ->orderByDesc('created_at')->limit(50)->get();

        $orders->each(fn($order) => $order->details = $this->orderRepo->getDetails($order->id));
        return $this->successResponse($orders);
    }

    public function cancelOrder(Request $request, $id)
    {
        $customer = $request->attributes->get('shop_customer');
        if (!$customer) return $this->errorResponse('Authentication required', 401);

        $order = $this->orderRepo->find($id);
        if (!$order) return $this->notFoundResponse('Order not found');

        // Verify ownership
        $isOwner = ($order->customer_email === $customer->email) ||
                   ($customer->phone && $order->customer_phone === $customer->phone);
        if (!$isOwner) return $this->errorResponse('Unauthorized', 403);

        // Only allow cancelling pending orders
        if ($order->status !== 'pending') {
            return $this->errorResponse('Chỉ có thể hủy đơn hàng đang chờ xác nhận', 422);
        }

        $order->status = 'cancelled';
        $order->save();

        return $this->successResponse(['message' => 'Đã hủy đơn hàng thành công']);
    }

    public function validateCoupon(Request $request)
    {
        $code = strtoupper(trim($request->input('code', '')));
        $orderTotal = floatval($request->input('order_total', 0));

        if (!$code) return $this->successResponse(['valid' => false, 'message' => 'Vui lòng nhập mã giảm giá']);

        $result = $this->couponRepo->validateCoupon($code, $orderTotal);
        if (!$result['valid']) {
            $messages = ['Coupon not found' => 'Mã giảm giá không tồn tại', 'Coupon has expired' => 'Mã giảm giá đã hết hạn', 'Order total does not meet minimum requirement' => 'Đơn hàng chưa đạt giá trị tối thiểu'];
            return $this->successResponse(['valid' => false, 'message' => $messages[$result['message']] ?? $result['message']]);
        }

        $coupon = $result['coupon'];
        return $this->successResponse(['valid' => true, 'discount' => round($result['discount'], 0), 'coupon' => ['code' => $coupon->code, 'type' => $coupon->type, 'value' => $coupon->value]]);
    }

    // Helper: Check if languages module is installed
    private function isLanguagesModuleActive(): bool
    {
        try {
            $tenantId = app('tenant_id') ?? null;
            $query = TenantModuleSubscription::where('module_id', 'languages')
                ->where('is_active', true);
            if ($tenantId) {
                $query->where('tenant_id', $tenantId);
            }
            return $query->exists();
        } catch (\Exception) {
            return false;
        }
    }

    /**
     * Extract locale from Accept-Language header.
     * Returns null if no translation needed (default language or module inactive).
     */
    private function getLocale(Request $request): ?string
    {
        $locale = $request->header('Accept-Language');
        if (!$locale || !$this->isLanguagesModuleActive()) {
            return null;
        }
        // Don't translate if requesting the default language
        try {
            $defaultLang = $this->langRepo->query()->where('is_default', true)->first();
            if ($defaultLang && $locale === $defaultLang->code) {
                return null;
            }
        } catch (\Exception) {}
        return $locale;
    }
}
