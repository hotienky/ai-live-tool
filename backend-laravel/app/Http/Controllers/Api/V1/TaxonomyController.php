<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ContentTaxonomy;
use App\Services\ContentTypeRegistry;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class TaxonomyController extends Controller
{
    use ApiResponse;

    public function __construct(private ContentTypeRegistry $registry) {}

    /**
     * GET /api/v1/taxonomies/{type}
     * List all taxonomy terms for a content type (categories, tags, etc.)
     */
    public function index(Request $request, string $type)
    {
        if (!$this->registry->exists($type)) {
            return $this->notFoundResponse("Content type '{$type}' not found.");
        }

        $config = $this->registry->get($type);
        $taxonomyNames = array_keys($config['taxonomies'] ?? []);

        // Optional taxonomy filter: ?taxonomy=category
        $taxonomyFilter = $request->input('taxonomy');

        $query = ContentTaxonomy::query()
            ->join('contents', 'content_taxonomies.content_id', '=', 'contents.id')
            ->where('contents.type', $type);

        if ($taxonomyFilter && in_array($taxonomyFilter, $taxonomyNames)) {
            $query->where('content_taxonomies.taxonomy', $taxonomyFilter);
        }

        $terms = $query
            ->select('content_taxonomies.taxonomy', 'content_taxonomies.term')
            ->selectRaw('COUNT(*) as count')
            ->groupBy('content_taxonomies.taxonomy', 'content_taxonomies.term')
            ->orderBy('content_taxonomies.taxonomy')
            ->orderByDesc('count')
            ->get()
            ->groupBy('taxonomy')
            ->map(fn ($items) => $items->map(fn ($item) => [
                'term' => $item->term,
                'count' => $item->count,
            ])->values());

        return response()->json([
            'data' => $terms,
            'meta' => [
                'content_type' => $type,
                'available_taxonomies' => $taxonomyNames,
            ],
        ]);
    }
}
