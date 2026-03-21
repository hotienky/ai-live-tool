<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/search?q=keyword&type=post&per_page=20
     * Full-text search across content.
     */
    public function search(Request $request)
    {
        $query = $request->input('q', '');
        if (strlen($query) < 2) {
            return $this->errorResponse('Search query must be at least 2 characters.', 422);
        }

        $search = Content::query()
            ->published()
            ->where(function ($q) use ($query) {
                $q->where('title', 'LIKE', "%{$query}%")
                  ->orWhere('body', 'LIKE', "%{$query}%")
                  ->orWhere('excerpt', 'LIKE', "%{$query}%")
                  ->orWhere('slug', 'LIKE', "%{$query}%");
            });

        // Filter by type: ?type=post
        if ($type = $request->input('type')) {
            $search->where('type', $type);
        }

        // Sorting: relevance via title match first
        $search->orderByRaw("CASE WHEN title LIKE ? THEN 0 ELSE 1 END", ["%{$query}%"])
            ->orderBy('published_at', 'desc');

        $perPage = min((int) $request->input('per_page', 20), 50);
        $result = $search->paginate($perPage);

        // Format results with highlights
        $items = $result->through(function ($item) use ($query) {
            return [
                'id' => $item->id,
                'type' => $item->type,
                'title' => $item->title,
                'slug' => $item->slug,
                'excerpt' => $this->highlight($item->excerpt ?? '', $query),
                'featured_image' => $item->featured_image ?? null,
                'status' => $item->status,
                'published_at' => $item->published_at,
            ];
        });

        return response()->json([
            'data' => $items->items(),
            'meta' => [
                'query' => $query,
                'total' => $result->total(),
                'current_page' => $result->currentPage(),
                'per_page' => $result->perPage(),
                'last_page' => $result->lastPage(),
            ],
            'links' => [
                'next' => $result->nextPageUrl(),
                'prev' => $result->previousPageUrl(),
            ],
        ]);
    }

    private function highlight(string $text, string $query): string
    {
        if (empty($query) || empty($text)) return $text;
        // Return first 200 chars with matching context
        $pos = mb_stripos($text, $query);
        if ($pos === false) return mb_substr($text, 0, 200);
        $start = max(0, $pos - 50);
        return ($start > 0 ? '...' : '') . mb_substr($text, $start, 200) . '...';
    }
}
