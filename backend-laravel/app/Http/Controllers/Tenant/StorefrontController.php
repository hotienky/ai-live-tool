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
    ) {}

    public function products(Request $request)
    {
        return $this->successResponse($this->productRepo->getProducts());
    }

    public function productDetail($identifier)
    {
        $product = $this->productRepo->findBySlugOrId($identifier);
        if (!$product) return $this->notFoundResponse('Product not found');

        $product->variants_list = $this->orderRepo->getVariants($product->id);
        return $this->successResponse($product);
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

    public function paymentMethods()
    {
        $configs = $this->configRepo->getByGroup('payment');
        $map = [];
        foreach ($configs as $c) { $map[$c->key] = $c->value; }

        $methods = [];
        if (($map['payment_cod_enabled'] ?? '') === 'true') {
            $methods[] = [
                'code' => 'cod',
                'name' => $map['payment_cod_name'] ?? 'COD',
                'description' => $map['payment_cod_description'] ?? '',
            ];
        }
        if (($map['payment_bank_enabled'] ?? '') === 'true') {
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
                'payment_method' => 'nullable|string',
                'notes' => 'nullable|string',
                'items' => 'required|array',
            ]);

            $paymentMethod = $data['payment_method'] ?? 'cod';
            $totalAmount = collect($data['items'])->reduce(
                fn($sum, $i) => $sum + (floatval($i['price'] ?? 0) * intval($i['qty'] ?? 1)), 0
            );

            $order = $this->orderRepo->store([
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_address' => $data['customer_address'],
                'payment_method' => $paymentMethod,
                'payment_status' => $paymentMethod === 'bank' ? 'unpaid' : 'pending',
                'notes' => $data['notes'] ?? null,
                'items' => json_encode($data['items']),
                'total_amount' => $totalAmount,
                'status' => 'pending',
            ]);

            $this->orderRepo->createOrderDetails($order->id, $data['items']);

            // Build response with bank info if bank transfer
            $response = $order->toArray();
            if ($paymentMethod === 'bank') {
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

    public function storefrontOrders()
    {
        return $this->successResponse(
            $this->orderRepo->query()->orderByDesc('created_at')->limit(50)->get()
        );
    }
}
