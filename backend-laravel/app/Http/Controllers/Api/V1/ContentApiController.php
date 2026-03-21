<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Models\ContentTaxonomy;
use App\Services\ContentTypeRegistry;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;

class ContentApiController extends Controller
{
    use ApiResponse;

    public function __construct(private ContentTypeRegistry $registry) {}

    /**
     * GET /api/v1/content/{type}
     * Paginated list with filtering, field selection, sorting, includes.
     */
    public function index(Request $request, string $type)
    {
        if (!$this->registry->exists($type)) {
            return $this->notFoundResponse("Content type '{$type}' not found.");
        }

        $query = Content::ofType($type);

        // Default: only published for public API
        $apiKey = $request->get('_api_key');
        if (!$apiKey || $apiKey->type === 'public') {
            $query->published();
        }

        // Filtering: ?filter[status]=published&filter[category]=tech
        if ($filters = $request->input('filter', [])) {
            foreach ($filters as $field => $value) {
                if ($field === 'status') {
                    $query->where('status', $value);
                } elseif ($field === 'author_id') {
                    $query->where('author_id', $value);
                } elseif (in_array($field, ['category', 'tag'])) {
                    // Filter by taxonomy
                    $query->whereHas('taxonomies', fn ($q) => $q->where('taxonomy', $field)->where('term', $value));
                } else {
                    // Filter by meta field
                    $query->where("meta->{$field}", $value);
                }
            }
        }

        // Sorting: ?sort=-published_at (prefix - for desc)
        $sort = $request->input('sort', '-published_at');
        $sortDir = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $sortField = ltrim($sort, '-');
        if (in_array($sortField, ['title', 'slug', 'status', 'published_at', 'created_at', 'updated_at'])) {
            $query->orderBy($sortField, $sortDir);
        }

        // Include relations: ?include=author,categories,tags
        $includes = $request->input('include', '');
        $eagerLoads = [];
        foreach (explode(',', $includes) as $inc) {
            $inc = trim($inc);
            if ($inc === 'author') $eagerLoads[] = 'author:id,name,email';
            if ($inc === 'categories' || $inc === 'tags' || $inc === 'taxonomies') $eagerLoads[] = 'taxonomies';
            if ($inc === 'revisions') $eagerLoads[] = 'revisions';
        }
        if (!empty($eagerLoads)) $query->with($eagerLoads);

        $perPage = min((int) $request->input('per_page', 20), 100);
        $result = $query->paginate($perPage);

        // Field selection: ?fields=title,slug,excerpt,featured_image
        $fields = $request->input('fields');
        $data = $result->through(function ($item) use ($fields) {
            return $this->formatItem($item, $fields);
        });

        return response()->json([
            'data' => $data->items(),
            'meta' => [
                'current_page' => $result->currentPage(),
                'per_page' => $result->perPage(),
                'total' => $result->total(),
                'last_page' => $result->lastPage(),
            ],
            'links' => [
                'next' => $result->nextPageUrl(),
                'prev' => $result->previousPageUrl(),
            ],
        ]);
    }

    /**
     * GET /api/v1/content/{type}/{slug}
     * Single item by slug.
     */
    public function show(Request $request, string $type, string $slug)
    {
        if (!$this->registry->exists($type)) {
            return $this->notFoundResponse("Content type '{$type}' not found.");
        }

        $query = Content::ofType($type)->where('slug', $slug);

        $apiKey = $request->get('_api_key');
        if (!$apiKey || $apiKey->type === 'public') {
            $query->published();
        }

        // Include relations
        $includes = $request->input('include', '');
        $eagerLoads = [];
        foreach (explode(',', $includes) as $inc) {
            $inc = trim($inc);
            if ($inc === 'author') $eagerLoads[] = 'author:id,name,email';
            if (in_array($inc, ['categories', 'tags', 'taxonomies'])) $eagerLoads[] = 'taxonomies';
            if ($inc === 'revisions') $eagerLoads[] = 'revisions';
        }
        if (!empty($eagerLoads)) $query->with($eagerLoads);

        $item = $query->first();
        if (!$item) {
            return $this->notFoundResponse("Content not found.");
        }

        $fields = $request->input('fields');
        return response()->json(['data' => $this->formatItem($item, $fields)]);
    }

    /**
     * POST /api/v1/content/{type}
     * Create new content (requires secret key).
     */
    public function store(Request $request, string $type)
    {
        if (!$this->registry->exists($type)) {
            return $this->notFoundResponse("Content type '{$type}' not found.");
        }

        $config = $this->registry->get($type);
        $rules = $this->registry->getValidationRules($type);
        $validated = $request->validate($rules);
        $validated['type'] = $type;

        if (empty($validated['slug']) && !empty($validated['title'])) {
            $validated['slug'] = \Illuminate\Support\Str::slug($validated['title']);
        }

        $content = Content::create($validated);

        // Handle taxonomies
        if ($taxonomies = $request->input('taxonomies')) {
            foreach ($taxonomies as $taxonomy => $terms) {
                foreach ((array) $terms as $term) {
                    ContentTaxonomy::create([
                        'content_id' => $content->id,
                        'taxonomy' => $taxonomy,
                        'term' => $term,
                    ]);
                }
            }
        }

        // Fire webhook event
        $this->fireWebhook('content.created', $content);

        return response()->json([
            'data' => $this->formatItem($content->fresh(['taxonomies'])),
        ], 201);
    }

    /**
     * PUT /api/v1/content/{type}/{id}
     */
    public function update(Request $request, string $type, $id)
    {
        if (!$this->registry->exists($type)) {
            return $this->notFoundResponse("Content type '{$type}' not found.");
        }

        $content = Content::ofType($type)->find($id);
        if (!$content) {
            return $this->notFoundResponse("Content not found.");
        }

        $rules = $this->registry->getValidationRules($type);
        // Make all rules optional for updates
        foreach ($rules as $key => $rule) {
            if (is_string($rule)) {
                $rules[$key] = str_replace('required', 'sometimes', $rule);
            }
        }
        $validated = $request->validate($rules);
        $content->update($validated);

        // Update taxonomies if provided
        if ($request->has('taxonomies')) {
            $content->taxonomies()->delete();
            foreach ($request->input('taxonomies') as $taxonomy => $terms) {
                foreach ((array) $terms as $term) {
                    ContentTaxonomy::create([
                        'content_id' => $content->id,
                        'taxonomy' => $taxonomy,
                        'term' => $term,
                    ]);
                }
            }
        }

        $this->fireWebhook('content.updated', $content);

        return response()->json([
            'data' => $this->formatItem($content->fresh(['taxonomies'])),
        ]);
    }

    /**
     * DELETE /api/v1/content/{type}/{id}
     */
    public function destroy(Request $request, string $type, $id)
    {
        if (!$this->registry->exists($type)) {
            return $this->notFoundResponse("Content type '{$type}' not found.");
        }

        $content = Content::ofType($type)->find($id);
        if (!$content) {
            return $this->notFoundResponse("Content not found.");
        }

        $this->fireWebhook('content.deleted', $content);
        $content->taxonomies()->delete();
        $content->delete();

        return response()->json(['data' => null, 'message' => 'Deleted.']);
    }

    /**
     * Format content item, optionally selecting specific fields.
     */
    private function formatItem(Content $item, ?string $fields = null): array
    {
        $data = $item->toArray();

        if ($fields) {
            $allowed = array_map('trim', explode(',', $fields));
            $allowed[] = 'id'; // Always include id
            $filtered = [];
            foreach ($allowed as $f) {
                if (array_key_exists($f, $data)) {
                    $filtered[$f] = $data[$f];
                }
            }
            return $filtered;
        }

        return $data;
    }

    /**
     * Fire webhook for content events.
     */
    private function fireWebhook(string $event, Content $content): void
    {
        try {
            app(\App\Services\WebhookDeliveryService::class)->dispatch($event, [
                'type' => $content->type,
                'id' => $content->id,
                'slug' => $content->slug,
                'title' => $content->title,
                'status' => $content->status,
            ]);
        } catch (\Throwable $e) {
            // Webhook errors shouldn't break API responses
            \Log::warning('Webhook dispatch failed: ' . $e->getMessage());
        }
    }
}
