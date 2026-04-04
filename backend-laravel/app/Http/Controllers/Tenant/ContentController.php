<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Services\ContentTypeRegistry;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ContentController extends Controller
{
    use ApiResponse, LogsActivity;

    /**
     * List all registered content types
     */
    public function types()
    {
        return $this->successResponse(ContentTypeRegistry::all());
    }

    /**
     * List content items for a given type
     */
    public function index(Request $request, string $type)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $query = Content::ofType($type)->with('taxonomies');

        // Status filter
        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        // Search
        if ($search = $request->input('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }

        // Taxonomy filter
        if ($taxonomy = $request->input('taxonomy')) {
            $term = $request->input('term');
            if ($term) {
                $query->whereHas('taxonomies', function ($q) use ($taxonomy, $term) {
                    $q->where('taxonomy', $taxonomy)->where('term', $term);
                });
            }
        }

        // Sort
        $sort = $request->input('sort', 'created_at');
        $order = $request->input('order', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'title', 'published_at', 'status'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $perPage = min($request->input('per_page', 20), 100);
        return $this->successResponse($query->paginate($perPage));
    }

    /**
     * Storefront API: List published content items for a given type
     */
    public function indexStorefront(Request $request, string $type)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $query = Content::ofType($type)->where('status', 'published')->with('taxonomies');

        // Search
        if ($search = $request->input('search')) {
            $query->where('title', 'ilike', "%{$search}%");
        }

        // Sort
        $sort = $request->input('sort', 'published_at');
        $order = $request->input('order', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'title', 'published_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $order === 'asc' ? 'asc' : 'desc');
        } else {
            $query->orderBy('published_at', 'desc');
        }

        $perPage = min($request->input('per_page', 20), 100);
        return $this->successResponse($query->paginate($perPage));
    }

    /**
     * Create a new content item
     */
    public function store(Request $request, string $type)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $config = ContentTypeRegistry::get($type);
        $rules = ContentTypeRegistry::getValidationRules($type);
        $rules['status'] = 'nullable|string|in:draft,published,archived';
        $rules['published_at'] = 'nullable|date';
        $rules['featured_image'] = 'nullable|string';
        $rules['taxonomies'] = 'nullable|array';

        $validated = $request->validate($rules);

        // Auto-generate slug
        $slug = $validated['slug'] ?? Str::slug($validated['title']);
        $slug = $this->ensureUniqueSlug($type, $slug);

        $content = Content::create([
            'type' => $type,
            'slug' => $slug,
            'title' => $validated['title'],
            'body' => $validated['body'] ?? null,
            'excerpt' => $validated['excerpt'] ?? null,
            'featured_image' => $validated['featured_image'] ?? null,
            'status' => $validated['status'] ?? 'draft',
            'author_id' => $request->user()?->id,
            'meta' => $validated['meta'] ?? null,
            'published_at' => $validated['published_at'] ?? null,
        ]);

        // Sync taxonomies
        if (!empty($validated['taxonomies'])) {
            foreach ($validated['taxonomies'] as $taxonomy => $terms) {
                if (is_array($terms)) {
                    $content->syncTaxonomy($taxonomy, $terms);
                }
            }
        }

        // Create initial revision
        if ($config['has_revisions'] ?? true) {
            $content->createRevision($request->user()?->id);
        }

        $this->logActivity("content.{$type}.created", 'content', $content->id, [
            'title' => $content->title,
        ]);

        return $this->successResponse(
            $content->load('taxonomies'),
            "Đã tạo {$config['label']}",
            201
        );
    }

    /**
     * Show a single content item
     */
    public function show(string $type, $id)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $content = Content::ofType($type)->with(['taxonomies', 'revisions'])->find($id);
        if (!$content) {
            return $this->notFoundResponse("{$type} not found");
        }

        return $this->successResponse($content);
    }

    /**
     * Storefront API: Show a single published content item
     */
    public function showStorefront(string $type, $id)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        // Use either ID or Slug
        $content = Content::ofType($type)
            ->where('status', 'published')
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                  ->orWhere('slug', $id);
            })
            ->with(['taxonomies']) // No revisions needed for storefront
            ->first();

        if (!$content) {
            return $this->notFoundResponse("{$type} not found or not published");
        }

        return $this->successResponse($content);
    }

    /**
     * Update a content item
     */
    public function update(Request $request, string $type, $id)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $content = Content::ofType($type)->find($id);
        if (!$content) {
            return $this->notFoundResponse("{$type} not found");
        }

        $config = ContentTypeRegistry::get($type);
        $rules = ContentTypeRegistry::getValidationRules($type);
        // Make title optional on update
        if (isset($rules['title'])) {
            $rules['title'] = 'sometimes|string|max:255';
        }
        $rules['status'] = 'nullable|string|in:draft,published,archived';
        $rules['published_at'] = 'nullable|date';
        $rules['featured_image'] = 'nullable|string';
        $rules['taxonomies'] = 'nullable|array';

        $validated = $request->validate($rules);

        // Create revision BEFORE updating (snapshot of old state)
        if ($config['has_revisions'] ?? true) {
            $content->createRevision($request->user()?->id);
        }

        // Update slug if title changed
        if (isset($validated['slug'])) {
            $validated['slug'] = $this->ensureUniqueSlug($type, $validated['slug'], $content->id);
        }

        $content->update(array_filter([
            'slug' => $validated['slug'] ?? null,
            'title' => $validated['title'] ?? null,
            'body' => $validated['body'] ?? null,
            'excerpt' => $validated['excerpt'] ?? null,
            'featured_image' => $validated['featured_image'] ?? null,
            'status' => $validated['status'] ?? null,
            'meta' => $validated['meta'] ?? null,
            'published_at' => $validated['published_at'] ?? null,
        ], fn ($v) => $v !== null));

        // Sync taxonomies
        if (isset($validated['taxonomies'])) {
            foreach ($validated['taxonomies'] as $taxonomy => $terms) {
                if (is_array($terms)) {
                    $content->syncTaxonomy($taxonomy, $terms);
                }
            }
        }

        $this->logActivity("content.{$type}.updated", 'content', $content->id, [
            'title' => $content->title,
        ]);

        return $this->successResponse(
            $content->fresh(['taxonomies']),
            "Đã cập nhật {$config['label']}"
        );
    }

    /**
     * Soft-delete a content item
     */
    public function destroy(string $type, $id)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $content = Content::ofType($type)->find($id);
        if (!$content) {
            return $this->notFoundResponse("{$type} not found");
        }

        $config = ContentTypeRegistry::get($type);
        $title = $content->title;
        $content->delete();

        $this->logActivity("content.{$type}.deleted", 'content', $id, [
            'title' => $title,
        ]);

        return $this->successResponse(null, "Đã xoá {$config['label']}");
    }

    /**
     * Stats for a given content type (used by module dashboards)
     */
    public function stats(string $type)
    {
        if (!ContentTypeRegistry::exists($type)) {
            return response()->json(['error' => "Unknown content type: {$type}"], 404);
        }

        $total    = Content::ofType($type)->count();
        $byStatus = Content::ofType($type)
            ->selectRaw('status, count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status');

        $published = $byStatus['published'] ?? 0;
        $draft     = $byStatus['draft']     ?? 0;

        return $this->successResponse(compact('total', 'published', 'draft', 'byStatus'));
    }

    /**
     * Ensure slug is unique for a given content type
     */
    protected function ensureUniqueSlug(string $type, string $slug, ?int $excludeId = null): string
    {
        $original = $slug;
        $counter = 1;

        while (true) {
            $query = Content::ofType($type)->where('slug', $slug);
            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }
            if (!$query->exists()) break;
            $slug = "{$original}-{$counter}";
            $counter++;
        }

        return $slug;
    }
}
