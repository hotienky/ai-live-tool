<?php
namespace App\Actions\Storefront;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreateReviewAction extends BaseAction
{
    public function __invoke(Request $request, int $productId)
    {
        $customer = $request->attributes->get('shop_customer');
        if (!$customer) {
            return $this->errorResponse('Authentication required', 401);
        }

        try {
            $data = $request->validate([
                'rating' => 'required|integer|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            $existing = DB::table('product_reviews')
                ->where('product_id', $productId)
                ->where('customer_id', $customer->id)
                ->first();

            if ($existing) {
                DB::table('product_reviews')
                    ->where('id', $existing->id)
                    ->update([
                        'rating' => $data['rating'],
                        'comment' => $data['comment'] ?? null,
                        'updated_at' => now(),
                    ]);
                $review = DB::table('product_reviews')->where('id', $existing->id)->first();
            } else {
                $id = DB::table('product_reviews')->insertGetId([
                    'product_id' => $productId,
                    'customer_id' => $customer->id,
                    'customer_name' => trim(($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')) ?: 'Khách hàng',
                    'rating' => $data['rating'],
                    'comment' => $data['comment'] ?? null,
                    'is_approved' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $review = DB::table('product_reviews')->where('id', $id)->first();
            }

            return $this->successResponse($review, 'Review submitted successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        }
    }
}
