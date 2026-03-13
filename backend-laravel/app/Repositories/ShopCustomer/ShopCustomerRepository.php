<?php
namespace App\Repositories\ShopCustomer;
use App\Models\ShopCustomer;
use App\Repositories\BaseEloquentRepository;

class ShopCustomerRepository extends BaseEloquentRepository implements ShopCustomerRepositoryInterface
{
    public function __construct(ShopCustomer $model) { parent::__construct($model); }
}
