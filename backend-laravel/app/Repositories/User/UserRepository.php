<?php
namespace App\Repositories\User;
use App\Models\User;
use App\Repositories\BaseEloquentRepository;

class UserRepository extends BaseEloquentRepository implements UserRepositoryInterface
{
    public function __construct(User $model) { parent::__construct($model); }

    public function findByEmail(string $email)
    {
        return $this->model->where('email', $email)->first();
    }
}
