<?php
namespace App\Actions\Product;

use App\Repositories\Product\ProductRepositoryInterface;
use App\Traits\ApiResponse;

class BaseAction
{
    use ApiResponse;

    protected ProductRepositoryInterface $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }
}
