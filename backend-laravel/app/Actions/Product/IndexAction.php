<?php
namespace App\Actions\Product;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        try {
            $products = $this->productRepository->getProducts();
            // Append category/brand names and variants for each product
            foreach ($products as $p) {
                $cat = $p->category()->first();
                $brand = $p->brand()->first();
                $p->category = $cat?->name ?? $p->getAttribute('category') ?? '';
                $p->brand = $brand?->name ?? $p->getAttribute('brand') ?? '';
                // Merge variant data: prefer JSON variants column, fallback to product_variants table
                if (empty($p->variants) || (is_array($p->variants) && count($p->variants) === 0)) {
                    $dbVars = $p->productVariants()->get();
                    if ($dbVars->count() > 0) {
                        $p->variants = $dbVars->toArray();
                    }
                }
            }
            return $this->successResponse($products, 'Products retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

