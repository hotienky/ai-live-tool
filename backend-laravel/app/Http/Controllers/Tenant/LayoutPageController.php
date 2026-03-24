<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\LayoutPage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class LayoutPageController extends Controller
{
    /* ── List all pages ── */
    public function index(): JsonResponse
    {
        $pages = LayoutPage::orderBy('slug')->get()->map(fn($p) => [
            'id' => $p->id,
            'slug' => $p->slug,
            'title' => $p->title,
            'status' => $p->status,
            'version' => $p->version,
            'is_system' => $p->is_system,
            'sections_count' => is_array($p->layout_json) ? count($p->layout_json) : 0,
            'updated_at' => $p->updated_at?->toISOString(),
        ]);

        return response()->json(['type' => 'success', 'data' => $pages]);
    }

    /* ── Get single page with full layout ── */
    public function show(int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        return response()->json(['type' => 'success', 'data' => $page]);
    }

    /* ── Get page by slug (for storefront) ── */
    public function showBySlug(string $slug): JsonResponse
    {
        $page = LayoutPage::bySlug($slug)->published()->first();
        if (!$page) {
            return response()->json(['type' => 'error', 'message' => 'Page not found'], 404);
        }
        return response()->json(['type' => 'success', 'data' => $page]);
    }

    /* ── Create page ── */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug' => 'required|string|max:100|unique:layout_pages,slug',
            'title' => 'nullable|string|max:255',
            'layout_json' => 'required|array',
            'status' => 'nullable|string|in:draft,published',
            'is_system' => 'nullable|boolean',
            'meta' => 'nullable|array',
        ]);

        $page = LayoutPage::create($data);

        $this->clearLayoutCache();

        return response()->json(['type' => 'success', 'data' => $page], 201);
    }

    /* ── Update layout (save draft or direct update) ── */
    public function update(Request $request, int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);

        $data = $request->validate([
            'title' => 'nullable|string|max:255',
            'layout_json' => 'nullable|array',
            'status' => 'nullable|string|in:draft,published',
            'meta' => 'nullable|array',
        ]);

        $page->update($data);

        $this->clearLayoutCache();

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

    /* ── Publish (creates version snapshot) ── */
    public function publish(Request $request, int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        $note = $request->input('note', null);
        $publishedBy = $request->input('published_by', 'admin');

        // If new layout provided, update first
        if ($request->has('layout_json')) {
            $page->update(['layout_json' => $request->input('layout_json')]);
        }

        $page->publish($publishedBy, $note);

        $this->clearLayoutCache();

        return response()->json([
            'type' => 'success',
            'message' => "Published v{$page->version}",
            'data' => $page,
        ]);
    }

    /* ── Rollback to a version ── */
    public function rollback(Request $request, int $id, int $version): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        $page->rollback($version);

        $this->clearLayoutCache();

        return response()->json([
            'type' => 'success',
            'message' => "Rolled back to v{$version}",
            'data' => $page,
        ]);
    }

    /* ── List versions ── */
    public function versions(int $id): JsonResponse
    {
        $page = LayoutPage::findOrFail($id);
        $versions = $page->versions()->get()->map(fn($v) => [
            'id' => $v->id,
            'version' => $v->version,
            'published_by' => $v->published_by,
            'note' => $v->note,
            'sections_count' => is_array($v->layout_json) ? count($v->layout_json) : 0,
            'created_at' => $v->created_at?->toISOString(),
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
        $page->delete();

        $this->clearLayoutCache();

        return response()->json(['type' => 'success', 'message' => 'Deleted']);
    }

    /* ── Clear layout cache ── */
    private function clearLayoutCache(): void
    {
        StorefrontController::clearSiteConfigCache();
    }
}
