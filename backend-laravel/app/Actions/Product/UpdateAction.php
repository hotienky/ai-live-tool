<?php
namespace App\Actions\Product;

use Illuminate\Http\Request;
use Illuminate\Support\Str;
use App\Models\ProductCategory;
use App\Models\ProductBrand;

class UpdateAction extends BaseAction
{
    public function __invoke(Request $request, $id)
    {
        try {
            $product = $this->productRepository->find($id);
            if (!$product) {
                return $this->notFoundResponse('Product not found');
            }

            $data = $request->all();

            // SKU uniqueness check (exclude current)
            if (isset($data['sku'])) {
                $existing = $this->productRepository->findBySku($data['sku']);
                if ($existing && $existing->id != $id) {
                    return $this->errorResponse('SKU đã tồn tại ở sản phẩm khác');
                }
            }

            // Map category name → category_id
            if (isset($data['category']) && !isset($data['category_id'])) {
                $cat = ProductCategory::where('name', $data['category'])->first();
                $data['category_id'] = $cat?->id;
            }

            // Map brand name → brand_id
            if (isset($data['brand']) && !isset($data['brand_id'])) {
                $brand = ProductBrand::where('name', $data['brand'])->first();
                $data['brand_id'] = $brand?->id;
            }

            // Auto-generate slug if name changed
            if (isset($data['name']) && $data['name'] !== $product->name) {
                $data['slug'] = Str::slug($data['name']);
            }

            // Strip non-DB fields
            unset($data['category'], $data['brand'], $data['image'], $data['status']);

            $this->productRepository->update($data, $id);
            $product = $this->productRepository->find($id);
            $this->logActivity('product.updated', 'product', $id, ['name' => $product->name ?? null]);

            return $this->successResponse($product, 'Product updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

