<?php
namespace App\Repositories\NavLink;
use App\Repositories\BaseRepoInterface;
interface NavLinkRepositoryInterface extends BaseRepoInterface
{
    public function reorder(array $items);
}
