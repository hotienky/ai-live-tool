<?php
namespace App\Repositories\Cart;

use App\Repositories\BaseRepoInterface;

interface CartRepositoryInterface extends BaseRepoInterface
{
    public function getByUserId(int $userId);
    public function addItem(int $userId, array $data);
    public function updateItem(int $userId, int $productId, array $data);
    public function removeItem(int $userId, int $productId);
}
