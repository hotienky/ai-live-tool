<?php
namespace App\Actions\Role;

use App\Repositories\Role\RoleRepositoryInterface;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;

abstract class BaseAction
{
    use ApiResponse, LogsActivity;

    public function __construct(protected RoleRepositoryInterface $repo) {}
}
