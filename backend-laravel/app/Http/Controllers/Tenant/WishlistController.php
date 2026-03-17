<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Repositories\Product\ProductRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    use ApiResponse;

    public function __construct(private ProductRepositoryInterface $productRepo) {}

    /**
     * GET /api/storefront/wishlist
     */
    public function index(Request $request)
    {
        $customerId = $request->attributes->get('customer_id');
        if (!$customerId) {
            return $this->errorResponse('Unauthorized', 401);
        }

        $productIds = DB::table('wishlists')
            ->where('customer_id', $customerId)
            ->orderByDesc('id')
            ->pluck('product_id');

        $products = $this->productRepo->query()
            ->whereIn('id', $productIds)
            ->get()
            ->map(fn($p) => [
                'id'              => $p->id,
                'name'            => $p->name,
                'slug'            => $p->slug,
                'price'           => (float) $p->price,
                'promotion_price' => $p->promotion_price ? (float) $p->promotion_price : null,
                'image'           => $p->image_url ?? $p->image ?? null,
                'category'        => $p->category ?? null,
                'stock'           => $p->stock ?? 0,
            ]);

        return $this->successResponse($products, 'Wishlist retrieved');
    }

    /**
     * POST /api/storefront/wishlist/{productId}
     */
    public function add(Request $request, int $productId)
    {
        $customerId = $request->attributes->get('customer_id');
        if (!$customerId) {
            return $this->errorResponse('Unauthorized', 401);
        }

        DB::table('wishlists')->updateOrInsert(
            ['customer_id' => $customerId, 'product_id' => $productId],
            ['created_at' => now(), 'updated_at' => now()]
        );

        return $this->successResponse(null, 'Added to wishlist');
    }

    /**
     * DELETE /api/storefront/wishlist/{productId}
     */
    public function remove(Request $request, int $productId)
    {
        $customerId = $request->attributes->get('customer_id');
        if (!$customerId) {
            return $this->errorResponse('Unauthorized', 401);
        }

        DB::table('wishlists')
            ->where('customer_id', $customerId)
            ->where('product_id', $productId)
            ->delete();

        return $this->successResponse(null, 'Removed from wishlist');
    }

    /**
     * DELETE /api/storefront/wishlist
     */
    public function clear(Request $request)
    {
        $customerId = $request->attributes->get('customer_id');
        if (!$customerId) {
            return $this->errorResponse('Unauthorized', 401);
        }

        DB::table('wishlists')->where('customer_id', $customerId)->delete();

        return $this->successResponse(null, 'Wishlist cleared');
    }
}
