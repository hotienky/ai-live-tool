<?php
namespace App\Repositories\Cart;

use App\Models\CartItem;
use App\Repositories\BaseEloquentRepository;

class CartRepository extends BaseEloquentRepository implements CartRepositoryInterface
{
    public function __construct(CartItem $model)
    {
        parent::__construct($model);
    }

    public function getByUserId(int $userId)
    {
        return $this->model->where('user_id', $userId)->get();
    }

    public function addItem(int $userId, array $data)
    {
        $data['user_id'] = $userId;
        $data['created_at'] = now();
        return $this->store($data);
    }

    public function updateItem(int $userId, int $productId, array $data)
    {
        $this->model->where('user_id', $userId)
            ->where('product_id', $productId)
            ->update($data);

        return $this->model->where('user_id', $userId)
            ->where('product_id', $productId)
            ->first();
    }

    public function removeItem(int $userId, int $productId)
    {
        return $this->model->where('user_id', $userId)
            ->where('product_id', $productId)
            ->delete();
    }
}
