<?php
namespace App\Repositories\Product;

use App\Repositories\BaseRepoInterface;

interface ProductRepositoryInterface extends BaseRepoInterface
{
    public function getProducts();
    public function findBySku(string $sku);
    public function findBySlugOrId($identifier);
    public function adjustStock(int $id, int $quantity, ?int $userId = null, ?string $reason = null);
}
