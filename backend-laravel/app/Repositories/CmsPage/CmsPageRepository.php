<?php
namespace App\Repositories\CmsPage;
use App\Models\CmsPage;
use App\Repositories\BaseEloquentRepository;

class CmsPageRepository extends BaseEloquentRepository implements CmsPageRepositoryInterface
{
    public function __construct(CmsPage $model) { parent::__construct($model); }

    public function findByAlias(string $alias): ?object
    {
        return CmsPage::where('alias', $alias)->first();
    }

    public function getSystemPages(): \Illuminate\Support\Collection
    {
        return CmsPage::where('is_system', true)->orderBy('sort')->get();
    }
}
