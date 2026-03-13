<?php
namespace App\Actions\Product;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StoreAction extends BaseAction
{
    public function __invoke(Request $request)
    {
        try {
            $data = $request->validate([
                'name' => 'required|string',
                'sku' => 'required|string',
                'price' => 'nullable',
                'cost_price' => 'nullable',
                'stock' => 'nullable|integer',
                'image_url' => 'nullable|string',
                'images' => 'nullable',
                'description' => 'nullable|string',
                'category_id' => 'nullable|integer',
                'brand_id' => 'nullable|integer',
                'is_active' => 'nullable|boolean',
                'is_featured' => 'nullable|boolean',
                'slug' => 'nullable|string',
                'weight' => 'nullable',
                'unit' => 'nullable|string',
                'barcode' => 'nullable|string',
                'keywords' => 'nullable',
                'variants' => 'nullable',
            ]);

            // SKU uniqueness check
            $existing = $this->productRepository->findBySku($data['sku']);
            if ($existing) {
                return $this->errorResponse('SKU đã tồn tại, vui lòng chọn SKU khác');
            }

            $data['slug'] = $data['slug'] ?? Str::slug($data['name']);
            $data['price'] = $data['price'] ?? 0;
            $data['stock'] = $data['stock'] ?? 0;
            $data['is_active'] = $data['is_active'] ?? true;
            $data['is_featured'] = $data['is_featured'] ?? false;

            $product = $this->productRepository->store($data);

            return $this->successResponse($product, 'Product created successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->validationErrorResponse($e->errors());
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
