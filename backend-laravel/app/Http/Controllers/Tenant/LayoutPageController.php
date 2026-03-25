<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LayoutPage;
use App\Services\LayoutResolver;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * P1 – tenant_id đã được guard qua LayoutPage Global Scope.
 * P6 – Cache contract: key format = tenant:{tenant_id}:page:{slug}
 * P10 – Versioning: publish → tạo version, rollback → restore version.
 */
class LayoutPageController extends Controller
{
    public function __construct(private LayoutResolver $layoutResolver) {}

    /* ── List all pages ── */
    public function index(): JsonResponse
    {
        $pages = LayoutPage::orderBy('slug')->get()->map(fn($p) => [
            'id'             => $p->id,
            'slug'           => $p->slug,
            'title'          => $p->title,
            'status'         => $p->status,
            'version'        => $p->version,
            'is_system'      => $p->is_system,
            'sections_count' => is_array($p->layout_json) ? count($p->layout_json) : 0,
            'updated_at'     => $p->updated_at?->toISOString(),
        ]);

        return response()->json(['type' => 'success', 'data' => $pages]);
    }

    /* ── Get single page with full layout (admin editor) ── */
    public function show(int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        return response()->json(['type' => 'success', 'data' => $page]);
    }

    /**
     * Get page by slug for storefront consumption.
     * P5 – BFF: resolve data cho mọi section trước khi trả về.
     * P6 – Cache contract: tenant:{tenant_id}:page:{slug}.
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $tenantId = tenant('id') ?? 'default';
        $cacheKey = "tenant:{$tenantId}:page:{$slug}";

        $data = Cache::remember($cacheKey, 300, function () use ($slug) {
            $page = LayoutPage::bySlug($slug)->published()->first();
            if (!$page) {
                return null;
            }

            $pageArr = $page->toArray();

            // BFF: resolve data cho sections trong layout_json
            if (!empty($pageArr['layout_json'])) {
                $layoutJson = is_array($pageArr['layout_json'])
                    ? $pageArr['layout_json']
                    : json_decode($pageArr['layout_json'], true) ?? [];

                $pageArr['layout_json'] = $this->layoutResolver->resolve($layoutJson);
            }

            return $pageArr;
        });

        if (!$data) {
            return response()->json(['type' => 'error', 'message' => 'Page not found'], 404);
        }

        return response()->json(['type' => 'success', 'data' => $data]);
    }

    /* ── Create page ── */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug'        => 'required|string|max:100|unique:layout_pages,slug',
            'title'       => 'nullable|string|max:255',
            'layout_json' => 'required|array',
            'status'      => 'nullable|string|in:draft,published',
            'is_system'   => 'nullable|boolean',
            'meta'        => 'nullable|array',
        ]);

        $page = LayoutPage::create($data);

        $this->clearLayoutCache($page->slug);

        return response()->json(['type' => 'success', 'data' => $page], 201);
    }

    /* ── Update layout (save draft or direct update) ── */
    public function update(Request $request, int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);

        $data = $request->validate([
            'title'       => 'nullable|string|max:255',
            'layout_json' => 'nullable|array',
            'status'      => 'nullable|string|in:draft,published',
            'meta'        => 'nullable|array',
        ]);

        $page->update($data);

        $this->clearLayoutCache($page->slug);

        return response()->json(['type' => 'success', 'data' => $page]);
    }

    /* ── Save as draft ── */
    public function saveDraft(Request $request, int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        $layoutJson = $request->validate(['layout_json' => 'required|array'])['layout_json'];

        $page->saveDraft($layoutJson);

        return response()->json(['type' => 'success', 'message' => 'Saved as draft', 'data' => $page]);
    }

    /**
     * Publish – tạo version snapshot.
     * P10 – Versioning: mỗi lần publish → tạo version.
     */
    public function publish(Request $request, int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);

        // published_by dùng authenticated user, không nhận từ request (bảo mật)
        $publishedBy = auth()->user()?->name ?? auth()->user()?->email ?? 'admin';
        $note = $request->input('note', null);

        if ($request->has('layout_json')) {
            $page->update(['layout_json' => $request->input('layout_json')]);
        }

        $page->publish($publishedBy, $note);

        // Cache contract: clear cache khi publish
        $this->clearLayoutCache($page->slug);

        return response()->json([
            'type'    => 'success',
            'message' => "Published v{$page->version}",
            'data'    => $page,
        ]);
    }

    /**
     * Rollback – restore về một version cũ.
     * P10 – Versioning: cho phép rollback.
     */
    public function rollback(int $id, int $version): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        $page->rollback($version);

        $this->clearLayoutCache($page->slug);

        return response()->json([
            'type'    => 'success',
            'message' => "Rolled back to v{$version}",
            'data'    => $page,
        ]);
    }

    /* ── List versions ── */
    public function versions(int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        $versions = $page->versions()->get()->map(fn($v) => [
            'id'             => $v->id,
            'version'        => $v->version,
            'published_by'   => $v->published_by,
            'note'           => $v->note,
            'sections_count' => is_array($v->layout_json) ? count($v->layout_json) : 0,
            'created_at'     => $v->created_at?->toISOString(),
        ]);

        return response()->json(['type' => 'success', 'data' => $versions]);
    }

    /* ── Delete page ── */
    public function destroy(int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        if ($page->is_system) {
            return response()->json(['type' => 'error', 'message' => 'Cannot delete system page'], 403);
        }

        $slug = $page->slug;
        $page->delete();

        $this->clearLayoutCache($slug);

        return response()->json(['type' => 'success', 'message' => 'Deleted']);
    }

    /**
     * P6 – Cache contract: clear theo đúng format tenant:{tenant_id}:page:{slug}.
     * Gọi khi publish, update, delete, rollback.
     */
    private function clearLayoutCache(string $slug): void
    {
        $tenantId = tenant('id') ?? 'default';

        // Cache key cho storefront (slug-based)
        Cache::forget("tenant:{$tenantId}:page:{$slug}");

        // Clear siteConfig cache (homepage dùng layout_pages)
        StorefrontController::clearSiteConfigCache($tenantId);
    }
}
