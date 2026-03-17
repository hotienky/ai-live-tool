<?php
namespace App\Repositories\MasterRole;

use App\Models\MasterRole;
use App\Repositories\BaseEloquentRepository;

class MasterRoleRepository extends BaseEloquentRepository implements MasterRoleRepositoryInterface
{
    public function __construct(MasterRole $model)
    {
        parent::__construct($model);
    }
}
