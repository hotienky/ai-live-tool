<?php
namespace App\Repositories\Brand;
use App\Models\ProductBrand;
use App\Repositories\BaseEloquentRepository;

class BrandRepository extends BaseEloquentRepository implements BrandRepositoryInterface
{
    public function __construct(ProductBrand $model) { parent::__construct($model); }
}
