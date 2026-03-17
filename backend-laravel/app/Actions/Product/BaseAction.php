<?php
namespace App\Actions\Product;

use App\Repositories\Product\ProductRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;

class BaseAction
{
    use ApiResponse, LogsActivity;

    protected ProductRepositoryInterface $productRepository;

    public function __construct(ProductRepositoryInterface $productRepository)
    {
        $this->productRepository = $productRepository;
    }
}
