<?php
namespace App\Repositories\Banner;
use App\Models\Banner;
use App\Repositories\BaseEloquentRepository;

class BannerRepository extends BaseEloquentRepository implements BannerRepositoryInterface
{
    public function __construct(Banner $model) { parent::__construct($model); }
}
