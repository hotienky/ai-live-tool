<?php
namespace App\Repositories\Role;
use App\Models\Role;
use App\Repositories\BaseEloquentRepository;

class RoleRepository extends BaseEloquentRepository implements RoleRepositoryInterface
{
    public function __construct(Role $model) { parent::__construct($model); }
}
