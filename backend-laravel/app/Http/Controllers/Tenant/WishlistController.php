<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Middleware\ShopCustomerAuth;
use App\Models\Product;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/storefront/wishlist
     * Returns the logged-in customer's wishlist items with product details.
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

        $products = Product::whereIn('id', $productIds)
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
     * Add a product to wishlist.
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
     * Remove a product from wishlist.
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
     * Clear all wishlist items for the customer.
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
