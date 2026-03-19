<?php
namespace App\Actions\Category;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string',
                'slug' => 'nullable|string',
                'description' => 'nullable|string',
                'image_url' => 'nullable|string',
                'parent_id' => 'nullable|integer',
                'sort_order' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
            ]);
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
            $category = $this->repo->store($data);
            $this->logActivity('category.created', 'category', $category->id, ['name' => $data['name']]);

            if ($request->has('translations')) {
                $this->syncTranslations('categories', $category->id, $request->input('translations'));
            }

            return $this->successResponse($category, 'Category created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
