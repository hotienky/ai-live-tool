<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $query = Review::query()->orderBy('created_at', 'desc');

        if ($request->has('approved')) {
            $query->where('is_approved', $request->boolean('approved'));
        }
        if ($request->has('rating')) {
            $query->where('rating', $request->rating);
        }

        $reviews = $query->paginate(20);

        return response()->json([
            'type' => 'success',
            'data' => $reviews,
        ]);
    }

    public function update(Request $request, $id)
    {
        $review = Review::findOrFail($id);
        $review->update($request->only(['is_approved', 'is_featured', 'content']));

        return response()->json([
            'type' => 'success',
            'data' => $review->fresh(),
        ]);
    }

    public function approve($id)
    {
        $review = Review::findOrFail($id);
        $review->update(['is_approved' => !$review->is_approved]);

        return response()->json([
            'type' => 'success',
            'data' => $review->fresh(),
            'message' => $review->is_approved ? 'Đã duyệt' : 'Đã ẩn',
        ]);
    }

    public function destroy($id)
    {
        Review::findOrFail($id)->delete();

        return response()->json([
            'type' => 'success',
            'message' => 'Đã xóa đánh giá',
        ]);
    }

    public function stats()
    {
        return response()->json([
            'type' => 'success',
            'data' => [
                'total' => Review::count(),
                'pending' => Review::where('is_approved', false)->count(),
                'approved' => Review::where('is_approved', true)->count(),
                'avg_rating' => round(Review::avg('rating') ?? 0, 1),
            ],
        ]);
    }

    // Public: submit a review (storefront)
    public function store(Request $request)
    {
        $request->validate([
            'reviewable_type' => 'required|string|in:product,page',
            'reviewable_id' => 'required|integer',
            'author_name' => 'required|string|max:100',
            'rating' => 'required|integer|min:1|max:5',
        ]);

        $review = Review::create([
            'reviewable_type' => $request->reviewable_type,
            'reviewable_id' => $request->reviewable_id,
            'author_name' => $request->author_name,
            'author_email' => $request->author_email,
            'rating' => $request->rating,
            'content' => $request->content,
            'is_approved' => false, // needs moderation
        ]);

        return response()->json([
            'type' => 'success',
            'message' => 'Cảm ơn đánh giá của bạn! Đánh giá sẽ hiển thị sau khi được duyệt.',
        ]);
    }
}
