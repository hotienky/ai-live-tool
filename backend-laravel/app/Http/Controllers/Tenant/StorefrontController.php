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

        // Merge promotion_price from JSON variants into DB variants (by matching sku or name)
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

        // If no DB variants, use JSON variants directly (they include promotion_price)
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

    public function categories()
    {
        return $this->successResponse($this->categoryRepo->getCategories());
    }

    public function brands()
    {
        return $this->successResponse($this->brandRepo->all());
    }

    public function banners()
    {
        return $this->successResponse(
            $this->bannerRepo->manyBy('status', 1)
        );
    }

    public function pages()
    {
        return $this->successResponse($this->cmsPageRepo->all());
    }

    public function pageDetail($slug)
    {
        $page = $this->cmsPageRepo->findBy('alias', $slug);
        return $page ? $this->successResponse($page) : $this->notFoundResponse('Page not found');
    }

    public function resolveUrl(Request $request)
    {
        $path = ltrim($request->input('path'), '/');
        if (empty($path)) return $this->notFoundResponse('Path is required');

        // 1. Check CMS Page
        $page = $this->cmsPageRepo->findBy('alias', $path);
        if ($page) {
            return $this->successResponse(['type' => 'page', 'data' => $page]);
        }

        // 2. Check Product
        $product = $this->productRepo->findBySlugOrId($path);
        if ($product) {
            // Need the full product detail data, so reuse productDetail logic
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
            
            return $this->successResponse(['type' => 'product', 'data' => $product]);
        }

        // 3. Check Category
        $category = $this->categoryRepo->findBy('slug', $path);
        if ($category) {
            return $this->successResponse(['type' => 'category', 'data' => $category]);
        }

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
        return $this->successResponse(
            $this->langRepo->query()->where('is_active', true)->get()
        );
    }

    public function translations($langCode)
    {
        $lang = $this->langRepo->findBy('code', $langCode);
        if (!$lang) return $this->notFoundResponse('Language not found');
        $translations = $this->langRepo->getTranslations($lang->id);
        return $this->successResponse($translations);
    }

    public function featuredProducts()
    {
        return $this->successResponse(
            $this->productRepo->query()
                ->where('is_featured', true)
                ->where('is_active', true)
                ->limit(12)
                ->get()
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

        // Default layout when nothing is configured
        $defaultSections = [
            ['type' => 'banner', 'enabled' => true, 'order' => 0],
            ['type' => 'categories', 'enabled' => true, 'order' => 1],
            ['type' => 'flash_sale', 'enabled' => true, 'order' => 2],
            ['type' => 'featured_products', 'enabled' => true, 'order' => 3],
            ['type' => 'new_arrivals', 'enabled' => true, 'order' => 4],
            ['type' => 'cms_pages', 'enabled' => true, 'order' => 5],
        ];
        $defaultPages = [
            'cart' => true,
            'account' => true,
            'auth' => true,
            'order_tracking' => true,
            'products' => true,
        ];

        $defaultPageConfigs = [
            'products' => [
                'sidebarPosition' => 'left',
                'gridColumns' => 4,
                'itemsPerPage' => 12,
                'showFilters' => ['category' => true, 'brand' => true, 'price' => true],
            ],
            'productDetail' => [
                'galleryStyle' => 'thumbnails',
                'layoutRatio' => '50-50',
                'showBreadcrumb' => true,
                'showRelatedProducts' => true,
                'relatedCount' => 6,
                'showReviews' => true,
            ],
        ];

        $defaultHeaderConfig = [
            'logoPosition' => 'left',
            'maxNavLinks' => 5,
            'showSearch' => true,
            'sticky' => true,
            'showThemeToggle' => true,
        ];

        $defaultFooterConfig = [
            'columns' => 3,
            'showContact' => true,
            'showLinks' => true,
            'showPaymentIcons' => false,
            'copyrightText' => '',
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
            $methods[] = [
                'code' => 'cod',
                'name' => $map['payment_cod_name'] ?? 'COD',
                'description' => $map['payment_cod_description'] ?? '',
            ];
        }
        if (filter_var($map['payment_bank_enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            $methods[] = [
                'code' => 'bank',
                'name' => $map['payment_bank_name'] ?? 'Bank Transfer',
                'description' => $map['payment_bank_description'] ?? '',
                'bank_info' => [
                    'account_name' => $map['payment_bank_account_name'] ?? '',
                    'account_number' => $map['payment_bank_account_number'] ?? '',
                    'bank_name' => $map['payment_bank_name_display'] ?? '',
                    'branch' => $map['payment_bank_branch'] ?? '',
                    'note_template' => $map['payment_bank_note_template'] ?? '',
                ],
            ];
        }
        return $this->successResponse($methods);
    }

    public function checkout(Request $request)
    {
        try {
            $data = $request->validate([
                'customer_name' => 'required|string',
                'customer_phone' => 'required|string',
                'customer_address' => 'required|string',
                'customer_email' => 'nullable|email',
                'payment_method' => 'nullable|string',
                'notes' => 'nullable|string',
                'items' => 'required|array',
                // Shipping fields
                'shipping_provider' => 'nullable|string',
                'shipping_service' => 'nullable|string',
                'shipping_fee' => 'nullable|numeric',
                'to_province_id' => 'nullable|integer',
                'to_district_id' => 'nullable|integer',
                'to_ward_code' => 'nullable|string',
            ]);

            $paymentMethod = $data['payment_method'] ?? 'cod';
            $subtotal = collect($data['items'])->reduce(
                fn($sum, $i) => $sum + (floatval($i['price'] ?? 0) * intval($i['qty'] ?? 1)), 0
            );

            // Coupon/Voucher processing
            $couponCode = $request->input('coupon_code');
            $discountAmount = 0;
            if ($couponCode) {
                $couponResult = $this->couponRepo->validateCoupon($couponCode, $subtotal);
                if ($couponResult['valid']) {
                    $discountAmount = min($couponResult['discount'], $subtotal);
                    // Increment used_count
                    $coupon = $couponResult['coupon'];
                    $coupon->increment('used_count');
                }
                // Silently ignore invalid coupon at checkout (already validated on frontend)
            }

            $shippingFee = floatval($data['shipping_fee'] ?? 0);
            $totalAmount = $subtotal - $discountAmount + $shippingFee;

            $order = $this->orderRepo->store([
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_address' => $data['customer_address'],
                'customer_email' => $data['customer_email'] ?? null,
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentMethod === 'bank' ? 'unpaid' : 'pending',
                'notes' => $data['notes'] ?? null,
                'items' => json_encode($data['items']),
                'total_amount' => $totalAmount,
                'discount_amount' => $discountAmount,
                'shipping_fee' => $shippingFee,
                'coupon_code' => $discountAmount > 0 ? $couponCode : null,
                'shipping_provider' => $data['shipping_provider'] ?? null,
                'shipping_service' => $data['shipping_service'] ?? null,
                'to_province_id' => $data['to_province_id'] ?? null,
                'to_district_id' => $data['to_district_id'] ?? null,
                'to_ward_code' => $data['to_ward_code'] ?? null,
                'status' => 'pending',
            ]);

            $this->orderRepo->createOrderDetails($order->id, $data['items']);

            // Build response with bank info if bank transfer
            $response = $order->toArray();
            $bankInfo = null;
            if ($paymentMethod === 'bank') {
                $configs = $this->configRepo->getByGroup('payment');
                $map = [];
                foreach ($configs as $c) { $map[$c->key] = $c->value; }
                $bankInfo = [
                    'account_name' => $map['payment_bank_account_name'] ?? '',
                    'account_number' => $map['payment_bank_account_number'] ?? '',
                    'bank_name' => $map['payment_bank_name_display'] ?? '',
                    'bank_bin' => $map['payment_bank_bin'] ?? '',
                    'branch' => $map['payment_bank_branch'] ?? '',
                    'note' => str_replace('{order_id}', $order->id, $map['payment_bank_note_template'] ?? ''),
                ];
                $response['bank_info'] = $bankInfo;
            }

            // Send order confirmation email
            $email = $data['customer_email'] ?? null;
            if ($email) {
                try {
                    \Illuminate\Support\Facades\Mail::to($email)->send(
                        new \App\Mail\OrderConfirmationMail($response, $data['items'], $bankInfo)
                    );
                } catch (\Exception $mailErr) {
                    \Illuminate\Support\Facades\Log::warning('Order email failed: ' . $mailErr->getMessage());
                }
            }

            return $this->successResponse($response, 'Order created successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function orderDetail($id)
    {
        $order = $this->orderRepo->find($id);
        if (!$order) return $this->notFoundResponse('Order not found');

        $response = $order->toArray();
        $response['details'] = $this->orderRepo->getDetails($id);

        if ($order->payment_method === 'bank') {
            $configs = $this->configRepo->getByGroup('payment');
            $map = [];
            foreach ($configs as $c) { $map[$c->key] = $c->value; }
            $response['bank_info'] = [
                'account_name' => $map['payment_bank_account_name'] ?? '',
                'account_number' => $map['payment_bank_account_number'] ?? '',
                'bank_name' => $map['payment_bank_name_display'] ?? '',
                'bank_bin' => $map['payment_bank_bin'] ?? '',
                'branch' => $map['payment_bank_branch'] ?? '',
                'note' => str_replace('{order_id}', $order->id, $map['payment_bank_note_template'] ?? ''),
            ];
        }

        return $this->successResponse($response);
    }

    public function flashSales()
    {
        return $this->successResponse($this->flashSaleRepo->getActive());
    }

    public function shipmentTracking(Request $request, $orderId)
    {
        $phone = $request->query('phone');
        if (!$phone) {
            return $this->errorResponse('Phone number is required', 400);
        }

        $order = $this->orderRepo->find($orderId);
        if (!$order || $order->customer_phone !== $phone) {
            return $this->notFoundResponse('Order not found');
        }

        $shipment = \Illuminate\Support\Facades\DB::table('shipments')
            ->where('order_id', $orderId)->first();

        if (!$shipment) {
            return $this->successResponse([
                'order_id' => $orderId,
                'status' => 'pending',
                'message' => 'Đơn hàng chưa được giao cho đơn vị vận chuyển',
                'shipment' => null,
                'history' => [],
            ]);
        }

        $history = \Illuminate\Support\Facades\DB::table('shipment_history')
            ->where('shipment_id', $shipment->id)
            ->orderByDesc('created_at')
            ->get();

        return $this->successResponse([
            'order_id' => $orderId,
            'status' => $shipment->status,
            'carrier' => $shipment->carrier,
            'tracking_code' => $shipment->tracking_code,
            'carrier_order_code' => $shipment->carrier_order_code,
            'receiver_name' => $shipment->receiver_name,
            'receiver_phone' => $shipment->receiver_phone,
            'receiver_address' => $shipment->receiver_address,
            'shipping_fee' => $shipment->shipping_fee,
            'delivered_at' => $shipment->delivered_at,
            'shipment' => $shipment,
            'history' => $history,
        ]);
    }

    public function storefrontOrders(Request $request)
    {
        $customer = $request->attributes->get('shop_customer');
        if (!$customer) {
            return $this->errorResponse('Authentication required', 401);
        }

        $orders = $this->orderRepo->query()
            ->where(function ($q) use ($customer) {
                $q->where('customer_email', $customer->email);
                if ($customer->phone) {
                    $q->orWhere('customer_phone', $customer->phone);
                }
            })
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        // Attach details for each order
        $orders->each(function ($order) {
            $order->details = $this->orderRepo->getDetails($order->id);
        });

        return $this->successResponse($orders);
    }

    public function productReviews($productId)
    {
        $reviews = \Illuminate\Support\Facades\DB::table('product_reviews')
            ->where('product_id', $productId)
            ->where('is_approved', true)
            ->orderByDesc('created_at')
            ->get();

        $avg = $reviews->avg('rating') ?? 0;
        $count = $reviews->count();

        return $this->successResponse([
            'reviews' => $reviews,
            'average_rating' => round($avg, 1),
            'total_reviews' => $count,
            'rating_distribution' => [
                5 => $reviews->where('rating', 5)->count(),
                4 => $reviews->where('rating', 4)->count(),
                3 => $reviews->where('rating', 3)->count(),
                2 => $reviews->where('rating', 2)->count(),
                1 => $reviews->where('rating', 1)->count(),
            ],
        ]);
    }

    public function createReview(Request $request, $productId)
    {
        // Requires authentication via ShopCustomerAuth middleware
        $customer = $request->attributes->get('shop_customer');
        if (!$customer) {
            return $this->errorResponse('Authentication required', 401);
        }

        try {
            $data = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            // Check if customer already reviewed this product
            $existing = \Illuminate\Support\Facades\DB::table('product_reviews')
                ->where('product_id', $productId)
                ->where('customer_id', $customer->id)
                ->first();

            if ($existing) {
                // Update existing review
                \Illuminate\Support\Facades\DB::table('product_reviews')
                    ->where('id', $existing->id)
                    ->update([
                        'rating' => $data['rating'],
                        'comment' => $data['comment'] ?? null,
                        'updated_at' => now(),
                    ]);
                $review = \Illuminate\Support\Facades\DB::table('product_reviews')
                    ->where('id', $existing->id)->first();
            } else {
                $id = \Illuminate\Support\Facades\DB::table('product_reviews')->insertGetId([
                    'product_id' => $productId,
                    'customer_id' => $customer->id,
                    'customer_name' => trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')) ?: __('messages.default_customer_name', [], 'Khách hàng'),
                    'rating' => $data['rating'],
                    'comment' => $data['comment'] ?? null,
                    'is_approved' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $review = \Illuminate\Support\Facades\DB::table('product_reviews')
                    ->where('id', $id)->first();
            }

            return $this->successResponse($review, 'Review submitted successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        }
    }

    public function validateCoupon(Request $request)
    {
        $code = strtoupper(trim($request->input('code', '')));
        $orderTotal = floatval($request->input('order_total', 0));

        if (!$code) {
            return $this->successResponse(['valid' => false, 'message' => 'Vui lòng nhập mã giảm giá']);
        }

        $result = $this->couponRepo->validateCoupon($code, $orderTotal);

        if (!$result['valid']) {
            $messages = [
                'Coupon not found' => 'Mã giảm giá không tồn tại',
                'Coupon has expired' => 'Mã giảm giá đã hết hạn',
                'Order total does not meet minimum requirement' => 'Đơn hàng chưa đạt giá trị tối thiểu',
            ];
            return $this->successResponse([
                'valid' => false,
                'message' => $messages[$result['message']] ?? $result['message'],
            ]);
        }

        $coupon = $result['coupon'];
        return $this->successResponse([
            'valid' => true,
            'discount' => round($result['discount'], 0),
            'coupon' => [
                'code' => $coupon->code,
                'type' => $coupon->type,
                'value' => $coupon->value,
            ],
        ]);
    }
}
