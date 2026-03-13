<?php
namespace App\Repositories\Shop;
use App\Repositories\BaseRepoInterface;
interface ShopRepositoryInterface extends BaseRepoInterface
{
    public function findOrCreate(string $platform, string $shopId, array $data);
}
