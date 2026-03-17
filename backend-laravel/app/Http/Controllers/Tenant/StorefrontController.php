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
use App\Traits\ApiResponse;
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
    ) {}

    public function products(Request $request)
    {
        $perPage = min((int) $request->input('per_page', 20), 100);
        $paginated = $this->productRepo->getProducts($perPage);
        return $this->successResponse([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
            ],
        ]);
    }

    public function productDetail($identifier)
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
        return $this->successResponse($product);
    }

    public function relatedProducts($slug)
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
            return $this->successResponse($related);
        } catch (\Exception $e) {
            return $this->successResponse([]);
        }
    }

    public function categories() { return $this->successResponse($this->categoryRepo->getCategories()); }
    public function brands() { return $this->successResponse($this->brandRepo->all()); }
    public function banners() { return $this->successResponse($this->bannerRepo->manyBy('status', 1)); }
    public function pages() { return $this->successResponse($this->cmsPageRepo->all()); }
    public function flashSales() { return $this->successResponse($this->flashSaleRepo->getActive()); }

    public function pageDetail($slug)
    {
        $page = $this->cmsPageRepo->findBy('alias', $slug);
        return $page ? $this->successResponse($page) : $this->notFoundResponse('Page not found');
    }

    public function resolveUrl(Request $request)
    {
        $path = ltrim($request->input('path'), '/');
        if (empty($path)) return $this->notFoundResponse('Path is required');

        $page = $this->cmsPageRepo->findBy('alias', $path);
        if ($page) return $this->successResponse(['type' => 'page', 'data' => $page]);

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
            return $this->successResponse(['type' => 'product', 'data' => $product]);
        }

        $category = $this->categoryRepo->findBy('slug', $path);
        if ($category) return $this->successResponse(['type' => 'category', 'data' => $category]);

        return $this->notFoundResponse('Route not found');
    }

    public function storeInfo()
    {
        $configs = $this->configRepo->getByGroup('store');
        $info = [];
        foreach ($configs as $c) { $info[$c->key] = $c->value; }
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

    public function featuredProducts()
    {
        return $this->successResponse(
            $this->productRepo->query()->where('is_featured', true)->where('is_active', true)->limit(12)->get()
        );
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
}
