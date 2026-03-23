<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\ForumCategory;
use App\Models\ForumPost;
use App\Models\ForumThread;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ForumController extends Controller
{
    use ApiResponse;

    // ── Stats ──

    public function stats()
    {
        return $this->successResponse([
            'totalCategories' => ForumCategory::count(),
            'totalThreads'    => ForumThread::count(),
            'totalPosts'      => ForumPost::count(),
            'totalMembers'    => ForumThread::whereNotNull('author_id')->distinct('author_id')->count('author_id'),
        ]);
    }

    // ── Categories ──

    public function categories()
    {
        $items = ForumCategory::withCount('threads')
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->successResponse($items);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'integer',
            'is_active'   => 'boolean',
        ]);

        return $this->successResponse(ForumCategory::create($data), 'Đã tạo chuyên mục', 201);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = ForumCategory::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'sort_order'  => 'integer',
            'is_active'   => 'boolean',
        ]);

        $category->update($data);

        return $this->successResponse($category, 'Đã cập nhật chuyên mục');
    }

    public function destroyCategory($id)
    {
        ForumCategory::findOrFail($id)->delete();

        return $this->successResponse(null, 'Đã xoá chuyên mục');
    }

    // ── Threads ──

    public function threads(Request $request)
    {
        $query = ForumThread::with('category:id,name');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }

        $items = $query->orderByDesc('is_pinned')
            ->orderByDesc('created_at')
            ->paginate($request->input('per_page', 20));

        return $this->successResponse($items);
    }

    public function updateThread(Request $request, $id)
    {
        $thread = ForumThread::findOrFail($id);
        $data = $request->validate([
            'status'    => 'sometimes|in:open,closed,locked',
            'is_pinned' => 'sometimes|boolean',
            'title'     => 'sometimes|string|max:255',
        ]);

        $thread->update($data);

        return $this->successResponse($thread, 'Đã cập nhật chủ đề');
    }

    public function destroyThread($id)
    {
        ForumThread::findOrFail($id)->delete();

        return $this->successResponse(null, 'Đã xoá chủ đề');
    }
}
