<?php
namespace App\Actions\Brand;

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
                'is_active' => 'nullable|boolean',
            ]);
            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
            $brand = $this->repo->store($data);
            return $this->successResponse($brand, 'Brand created', 201);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
