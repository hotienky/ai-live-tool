<?php
namespace App\Actions\Product;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        try {
            $products = $this->productRepository->getProducts();
            return $this->successResponse($products, 'Products retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
