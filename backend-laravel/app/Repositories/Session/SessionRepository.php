<?php
namespace App\Repositories\Session;
use App\Models\Session;
use App\Repositories\BaseEloquentRepository;

class SessionRepository extends BaseEloquentRepository implements SessionRepositoryInterface
{
    public function __construct(Session $model) { parent::__construct($model); }
}
