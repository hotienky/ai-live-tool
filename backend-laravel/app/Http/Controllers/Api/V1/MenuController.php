<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MenuController extends Controller
{
    use ApiResponse;

    /**
     * GET /api/v1/menus/{location}
     * Returns navigation menu tree for a given location.
     */
    public function show(Request $request, string $location)
    {
        $links = DB::table('nav_links')
            ->where('location', $location)
            ->orderBy('sort_order')
            ->get();

        if ($links->isEmpty()) {
            return $this->notFoundResponse("Menu '{$location}' not found.");
        }

        // Build tree structure
        $tree = $this->buildTree($links);

        return response()->json([
            'data' => [
                'location' => $location,
                'items' => $tree,
            ],
        ]);
    }

    /**
     * GET /api/v1/menus
     * List all available menu locations.
     */
    public function index(Request $request)
    {
        $locations = DB::table('nav_links')
            ->select('location')
            ->distinct()
            ->pluck('location');

        return response()->json([
            'data' => $locations,
        ]);
    }

    private function buildTree($items, $parentId = null): array
    {
        $tree = [];
        foreach ($items as $item) {
            if (($item->parent_id ?? null) == $parentId) {
                $node = [
                    'id' => $item->id,
                    'label' => $item->label ?? $item->title ?? '',
                    'url' => $item->url ?? '',
                    'target' => $item->target ?? '_self',
                    'icon' => $item->icon ?? null,
                    'children' => $this->buildTree($items, $item->id),
                ];
                $tree[] = $node;
            }
        }
        return $tree;
    }
}
