<?php
namespace App\Actions\Product;

use Illuminate\Http\Request;

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

            $this->productRepository->update($data, $id);
            $product = $this->productRepository->find($id);

            return $this->successResponse($product, 'Product updated successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
