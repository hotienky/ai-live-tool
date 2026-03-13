<?php
namespace App\Repositories\MasterUser;

use App\Models\MasterUser;
use App\Repositories\BaseEloquentRepository;

class MasterUserRepository extends BaseEloquentRepository implements MasterUserRepositoryInterface
{
    public function __construct(MasterUser $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email)
    {
        return $this->model->where('email', $email)->first();
    }
}
