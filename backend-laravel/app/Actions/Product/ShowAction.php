<?php
namespace App\Actions\Product;

class ShowAction extends BaseAction
{
    public function __invoke($id)
    {
        try {
            $product = $this->productRepository->find($id);
            if (!$product) {
                return $this->notFoundResponse('Product not found');
            }

            // Load relationships
            $product->load(['category', 'brand', 'productVariants']);
            $product->category_name = $product->category?->name;
            $product->brand_name = $product->brand?->name;

            return $this->successResponse($product);
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
