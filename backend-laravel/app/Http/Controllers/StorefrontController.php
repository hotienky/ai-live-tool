<?php

namespace App\Http\Controllers;

use App\Repositories\Product\ProductRepositoryInterface;
use App\Repositories\Category\CategoryRepositoryInterface;
use App\Repositories\Brand\BrandRepositoryInterface;
use App\Repositories\Banner\BannerRepositoryInterface;
use App\Repositories\CmsPage\CmsPageRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StorefrontController extends Controller
{
    use ApiResponse;

    public function __construct(
        private ProductRepositoryInterface $productRepo,
        private CategoryRepositoryInterface $categoryRepo,
        private BrandRepositoryInterface $brandRepo,
        private BannerRepositoryInterface $bannerRepo,
        private CmsPageRepositoryInterface $cmsPageRepo,
    ) {}

    public function products(Request $request)
    {
        return $this->successResponse($this->productRepo->getProducts());
    }

    public function productDetail($identifier)
    {
        $product = $this->productRepo->findBySlugOrId($identifier);
        if (!$product) return $this->notFoundResponse('Product not found');

        $variants = DB::table('product_variants')->where('product_id', $product->id)->get();
        $product->variants_list = $variants;
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
            $this->bannerRepo->manyBy('is_active', true)
        );
    }

    public function pages()
    {
        return $this->successResponse($this->cmsPageRepo->all());
    }

    public function pageDetail($slug)
    {
        $page = DB::table('cms_pages')->where('slug', $slug)->first();
        return $page ? $this->successResponse($page) : $this->notFoundResponse('Page not found');
    }

    public function storeInfo()
    {
        $configs = DB::table('system_configs')->where('group', 'store')->get();
        $info = [];
        foreach ($configs as $c) { $info[$c->key] = $c->value; }
        return $this->successResponse($info);
    }

    public function languages()
    {
        return $this->successResponse(DB::table('languages')->where('is_active', true)->get());
    }

    public function translations($langCode)
    {
        $lang = DB::table('languages')->where('code', $langCode)->first();
        if (!$lang) return $this->notFoundResponse('Language not found');
        $translations = DB::table('language_translations')->where('language_id', $lang->id)->get();
        $result = [];
        foreach ($translations as $t) { $result[$t->key] = $t->value; }
        return $this->successResponse($result);
    }

    public function featuredProducts()
    {
        return $this->successResponse(
            DB::table('products')->where('is_featured', true)->where('is_active', true)->limit(12)->get()
        );
    }

    public function theme()
    {
        $configs = DB::table('system_configs')->where('group', 'theme')->get();
        $theme = [];
        foreach ($configs as $c) { $theme[$c->key] = $c->value; }
        return $this->successResponse($theme);
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

            $totalAmount = collect($data['items'])->reduce(
                fn($sum, $i) => $sum + (floatval($i['price'] ?? 0) * intval($i['qty'] ?? 1)), 0
            );

            $orderId = DB::table('orders')->insertGetId([
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'],
                'customer_address' => $data['customer_address'],
                'payment_method' => $data['payment_method'] ?? 'cod',
                'notes' => $data['notes'] ?? null,
                'items' => json_encode($data['items']),
                'total_amount' => $totalAmount,
                'status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            foreach ($data['items'] as $item) {
                DB::table('order_details')->insert([
                    'order_id' => $orderId,
                    'product_id' => $item['product_id'] ?? null,
                    'product_name' => $item['name'] ?? '',
                    'sku' => $item['sku'] ?? '',
                    'price' => $item['price'] ?? 0,
                    'quantity' => $item['qty'] ?? 1,
                    'total' => (floatval($item['price'] ?? 0) * intval($item['qty'] ?? 1)),
                ]);
            }

            return $this->successResponse(
                DB::table('orders')->where('id', $orderId)->first(),
                'Order created successfully', 201
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
