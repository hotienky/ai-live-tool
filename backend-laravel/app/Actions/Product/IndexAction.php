<?php
namespace App\Actions\Product;

class IndexAction extends BaseAction
{
    public function __invoke()
    {
        try {
            $perPage = min((int) request()->input('limit', 15), 100);
            $paginated = $this->productRepository->getProducts($perPage);

            // Append category/brand names and variants for each product
            foreach ($paginated as $p) {
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

            return $this->successResponse([
                'data' => $paginated->items(),
                'meta' => [
                    'current_page' => $paginated->currentPage(),
                    'last_page' => $paginated->lastPage(),
                    'per_page' => $paginated->perPage(),
                    'total' => $paginated->total(),
                ],
            ], 'Products retrieved successfully');
        } catch (\Exception $e) {
            return $this->errorResponse($e->getMessage());
        }
    }
}

