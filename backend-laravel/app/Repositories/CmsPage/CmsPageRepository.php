<?php
namespace App\Repositories\CmsPage;
use App\Models\CmsPage;
use App\Repositories\BaseEloquentRepository;

class CmsPageRepository extends BaseEloquentRepository implements CmsPageRepositoryInterface
{
    public function __construct(CmsPage $model) { parent::__construct($model); }
}
