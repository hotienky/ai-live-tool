<?php
namespace App\Repositories\Tenant;

use App\Repositories\BaseRepoInterface;

interface TenantRepositoryInterface extends BaseRepoInterface
{
    public function suspend(int $id);
    public function activate(int $id);
}
