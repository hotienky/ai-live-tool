<?php
namespace App\Repositories\Promotion;
use App\Models\Promotion;
use App\Repositories\BaseEloquentRepository;

class PromotionRepository extends BaseEloquentRepository implements PromotionRepositoryInterface
{
    public function __construct(Promotion $model) { parent::__construct($model); }
}
