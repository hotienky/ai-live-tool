<?php
namespace App\Actions\Product;

class DestroyAction extends BaseAction
{
    public function __invoke($id)
    {
        try {
            $product = $this->productRepository->find($id);
            if (!$product) {
                return $this->notFoundResponse('Product not found');
            }

            $this->productRepository->delete($id);
            return $this->successResponse(null, 'Product deleted successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}
