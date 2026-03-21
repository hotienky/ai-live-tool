<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    use ApiResponse;

    /**
     * List comments (admin — all statuses)
     */
    public function index(Request $request)
    {
        $query = Comment::with(['content:id,title,type', 'replies'])
            ->topLevel()
            ->orderBy('created_at', 'desc');

        // Filter by status
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Filter by content
        if ($contentId = $request->input('content_id')) {
            $query->where('content_id', $contentId);
        }

        // Search
        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('body', 'ilike', "%{$search}%")
                  ->orWhere('author_name', 'ilike', "%{$search}%");
            });
        }

        return $this->successResponse(
            $query->paginate($request->input('per_page', 20))
        );
    }

    /**
     * Approve a comment
     */
    public function approve($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->update(['status' => 'approved']);
        return $this->successResponse($comment, 'Đã duyệt bình luận');
    }

    /**
     * Mark as spam
     */
    public function spam($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->update(['status' => 'spam']);
        return $this->successResponse($comment, 'Đã đánh dấu spam');
    }

    /**
     * Delete comment
     */
    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->delete();
        return $this->successResponse(null, 'Đã xoá bình luận');
    }

    /**
     * Public: submit a comment (storefront)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'content_id' => 'required|integer|exists:contents,id',
            'author_name' => 'required|string|max:100',
            'author_email' => 'nullable|email|max:255',
            'body' => 'required|string|max:2000',
            'parent_id' => 'nullable|integer|exists:comments,id',
        ]);

        $validated['status'] = 'pending'; // always pending for moderation

        $comment = Comment::create($validated);

        return $this->successResponse($comment, 'Bình luận đã được gửi, chờ duyệt', 201);
    }

    /**
     * Public: list approved comments for a content item (storefront)
     */
    public function forContent($contentId)
    {
        $comments = Comment::where('content_id', $contentId)
            ->approved()
            ->topLevel()
            ->with('replies')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->successResponse($comments);
    }
}
