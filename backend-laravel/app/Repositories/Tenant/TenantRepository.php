<?php
namespace App\Repositories\Tenant;

use App\Models\Tenant;
use App\Repositories\BaseEloquentRepository;

class TenantRepository extends BaseEloquentRepository implements TenantRepositoryInterface
{
    public function __construct(Tenant $model)
    {
        parent::__construct($model);
    }

    public function suspend(int $id)
    {
        $this->update(['status' => 'suspended', 'updated_at' => now()], $id);
        return $this->findOne($id);
    }

    public function activate(int $id)
    {
        $this->update(['status' => 'active', 'updated_at' => now()], $id);
        return $this->findOne($id);
    }
}
