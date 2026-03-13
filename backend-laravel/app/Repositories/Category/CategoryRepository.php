<?php
namespace App\Repositories\Category;

use App\Models\ProductCategory;
use App\Repositories\BaseEloquentRepository;

class CategoryRepository extends BaseEloquentRepository implements CategoryRepositoryInterface
{
    public function __construct(ProductCategory $model) { parent::__construct($model); }

    public function getCategories()
    {
        return $this->model->orderBy('sort_order')->get();
    }
}
