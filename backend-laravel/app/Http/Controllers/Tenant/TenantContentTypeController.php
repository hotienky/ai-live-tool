<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\TenantContentType;
use App\Services\ContentTypeRegistry;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TenantContentTypeController extends Controller
{
    use ApiResponse;

    public function index()
    {
        try {
            $types = TenantContentType::all();
            return $this->successResponse($types);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function store(Request $request)
    {
        try {
            $data = $request->validate([
                'type_key' => [
                    'required',
                    'string',
                    'max:50',
                    'regex:/^[a-z0-9_]+$/',
                    // Must be unique per tenant
                    Rule::unique('tenant_content_types')->where(function ($query) {
                        return $query->where('tenant_id', tenant('id'));
                    }),
                ],
                'name' => 'required|string|max:255',
                'singular_name' => 'required|string|max:255',
                'icon' => 'nullable|string',
                'supports' => 'nullable|array',
                'meta_fields' => 'nullable|array',
                'has_revisions' => 'boolean',
                'has_comments' => 'boolean',
            ]);

            // Default 'supports' array if not provided
            if (empty($data['supports'])) {
                $data['supports'] = ['title', 'body', 'slug', 'featured_image'];
            }

            $type = TenantContentType::create($data);

            // Dynamically register so it's available immediately for this request
            ContentTypeRegistry::register($type->type_key, [
                'label' => $type->name,
                'label_plural' => $type->name,
                'icon' => $type->icon ?? 'FileText',
                'supports' => $type->supports,
                'has_revisions' => $type->has_revisions,
                'has_comments' => $type->has_comments,
                'meta_fields' => $type->meta_fields ?? [],
            ]);

            return $this->successResponse($type, 'Content Type created', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse($e->getMessage(), 422);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function show($id)
    {
        try {
            $type = TenantContentType::find($id);
            if (!$type) return $this->notFoundResponse('Content Type not found');
            return $this->successResponse($type);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $type = TenantContentType::find($id);
            if (!$type) return $this->notFoundResponse('Content Type not found');

            $data = $request->validate([
                'name' => 'required|string|max:255',
                'singular_name' => 'required|string|max:255',
                'icon' => 'nullable|string',
                'supports' => 'nullable|array',
                'meta_fields' => 'nullable|array',
                'has_revisions' => 'boolean',
                'has_comments' => 'boolean',
            ]);

            $type->update($data);

            return $this->successResponse($type, 'Content Type updated');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }

    public function destroy($id)
    {
        try {
            $type = TenantContentType::find($id);
            if (!$type) return $this->notFoundResponse('Content Type not found');
            
            // Prevent deletion if content exists? Optional, but good practice.
            $count = \App\Models\Content::where('type', $type->type_key)->count();
            if ($count > 0) {
                return $this->errorResponse("Cannot delete because there are $count items of this type.", 400);
            }

            $type->delete();
            return $this->successResponse(null, 'Content Type deleted');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
