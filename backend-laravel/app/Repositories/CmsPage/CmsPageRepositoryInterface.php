<?php
namespace App\Repositories\CmsPage;
use App\Repositories\BaseRepoInterface;

interface CmsPageRepositoryInterface extends BaseRepoInterface
{
    public function findByAlias(string $alias): ?object;
    public function getSystemPages(): \Illuminate\Support\Collection;
}
