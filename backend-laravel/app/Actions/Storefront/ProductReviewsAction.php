<?php
namespace App\Actions\Storefront;

use Illuminate\Support\Facades\DB;

class ProductReviewsAction extends BaseAction
{
    public function __invoke(int $productId)
    {
        $reviews = DB::table('product_reviews')
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
}
