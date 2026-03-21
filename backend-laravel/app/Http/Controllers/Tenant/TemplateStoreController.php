<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TemplateReview;
use App\Services\TemplateStoreService;
use Illuminate\Http\Request;

class TemplateStoreController extends Controller
{
    /**
     * GET /template-store — Browse templates.
     */
    public function index(Request $request)
    {
        $templates = TemplateStoreService::list($request->only([
            'industry', 'category', 'price', 'featured', 'search', 'sort', 'dir', 'per_page',
        ]));

        return response()->json([
            'data' => $templates->items(),
            'meta' => [
                'current_page' => $templates->currentPage(),
                'per_page' => $templates->perPage(),
                'total' => $templates->total(),
                'last_page' => $templates->lastPage(),
            ],
        ]);
    }

    /**
     * GET /template-store/{id} — Template detail.
     */
    public function show(string $id)
    {
        $template = TemplateStoreService::detail($id);
        if (!$template) {
            return response()->json(['message' => 'Template not found.'], 404);
        }

        return response()->json(['data' => $template]);
    }

    /**
     * POST /template-store/{id}/install — Install template.
     */
    public function install(Request $request, string $id)
    {
        $tenantId = $request->header('X-Tenant-Id', tenant('id') ?? 'default');

        try {
            $result = TemplateStoreService::install($tenantId, $id);
            return response()->json($result);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Template not found.'], 404);
        } catch (\Throwable $e) {
            return response()->json(['message' => 'Install failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * POST /template-store/{id}/review — Submit review.
     */
    public function review(Request $request, string $id)
    {
        $validated = $request->validate([
            'rating' => 'required|numeric|min:1|max:5',
            'review_text' => 'nullable|string|max:1000',
        ]);

        $template = \App\Models\Template::where('template_id', $id)->firstOrFail();
        $tenantId = $request->header('X-Tenant-Id', tenant('id') ?? 'default');

        $review = TemplateReview::updateOrCreate(
            ['template_id' => $template->id, 'tenant_id' => $tenantId],
            $validated
        );

        // Update template average rating
        $avgRating = TemplateReview::where('template_id', $template->id)->avg('rating');
        $template->update(['rating' => round($avgRating, 1)]);

        return response()->json(['data' => $review]);
    }
}
