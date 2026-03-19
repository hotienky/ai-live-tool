<?php

namespace App\Http\Controllers\Tenant;
use App\Http\Controllers\Controller;

use App\Repositories\Product\ProductRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\HasContentTranslations;
use Illuminate\Http\Request;

class PromotionsController extends Controller
{
    use ApiResponse, HasContentTranslations;

    public function __construct(
        private ProductRepositoryInterface $productRepo
    ) {}

    public function index()
    {
        // Return products that have a promotion_price set
        $products = $this->productRepo->query()
            ->whereNotNull('promotion_price')
            ->where('promotion_price', '>', 0)
            ->orderByDesc('updated_at')
            ->get();

        $promotions = $products->map(function ($p) {
            return [
                'id' => $p->id,
                'productId' => $p->id,
                'product' => $p,
                'pricePromotion' => $p->promotion_price,
                'dateStart' => $p->promotion_start,
                'dateEnd' => $p->promotion_end,
            ];
        });

        return $this->successResponse($promotions);
    }

    public function store(Request $request)
    {
        try {
            $productId = $request->input('productId') ?: $request->input('product_id');
            $pricePromotion = $request->input('pricePromotion') ?: $request->input('price_promotion', 0);
            $dateStart = $request->input('dateStart') ?: $request->input('date_start');
            $dateEnd = $request->input('dateEnd') ?: $request->input('date_end');

            if (!$productId) return $this->errorResponse('Chưa chọn sản phẩm');

            $product = $this->productRepo->find($productId);
            if (!$product) return $this->notFoundResponse('Sản phẩm không tồn tại');

            // Update product promotion fields directly
            $this->productRepo->update([
                'promotion_price' => $pricePromotion ?: null,
                'promotion_start' => $dateStart ?: null,
                'promotion_end' => $dateEnd ?: null,
            ], $productId);

            if ($request->has('translations')) {
                $this->syncTranslations('promotions', $productId, $request->input('translations'));
            }

            return $this->successResponse(null, 'Đã lưu khuyến mãi', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pricePromotion = $request->input('pricePromotion') ?: $request->input('price_promotion', 0);
            $dateStart = $request->input('dateStart') ?: $request->input('date_start');
            $dateEnd = $request->input('dateEnd') ?: $request->input('date_end');

            $this->productRepo->update([
                'promotion_price' => $pricePromotion ?: null,
                'promotion_start' => $dateStart ?: null,
                'promotion_end' => $dateEnd ?: null,
            ], $id);

            if ($request->has('translations')) {
                $this->syncTranslations('promotions', $id, $request->input('translations'));
            }

            return $this->successResponse(null, 'Đã cập nhật khuyến mãi');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            // Clear promotion fields on the product
            $this->productRepo->update([
                'promotion_price' => null,
                'promotion_start' => null,
                'promotion_end' => null,
            ], $id);

            return $this->successResponse(null, 'Đã xóa khuyến mãi');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}


