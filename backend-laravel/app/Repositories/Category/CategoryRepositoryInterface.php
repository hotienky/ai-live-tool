<?php
namespace App\Repositories\Category;
use App\Repositories\BaseRepoInterface;

interface CategoryRepositoryInterface extends BaseRepoInterface
{
    public function getCategories();
}
