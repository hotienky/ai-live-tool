<?php
namespace App\Repositories\Shop;
use App\Models\Shop;
use App\Repositories\BaseEloquentRepository;

class ShopRepository extends BaseEloquentRepository implements ShopRepositoryInterface
{
    public function __construct(Shop $model) { parent::__construct($model); }

    public function findOrCreate(string $platform, string $shopId, array $data)
    {
        $shop = $this->model->where('platform', $platform)->where('shop_id', $shopId)->first();
        if (!$shop) {
            $data['platform'] = $platform;
            $data['shop_id'] = $shopId;
            $data['created_at'] = now();
            $data['updated_at'] = now();
            $shop = $this->model->create($data);
        }
        return $shop;
    }
}
