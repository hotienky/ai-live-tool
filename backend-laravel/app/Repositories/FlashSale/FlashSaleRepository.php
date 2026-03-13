<?php
namespace App\Repositories\FlashSale;

use App\Models\FlashSale;
use App\Repositories\BaseEloquentRepository;

class FlashSaleRepository extends BaseEloquentRepository implements FlashSaleRepositoryInterface
{
    public function __construct(FlashSale $model)
    {
        parent::__construct($model);
    }

    public function getActive()
    {
        return $this->model->where('is_active', true)
            ->where('end_date', '>=', now())
            ->get();
    }
}
