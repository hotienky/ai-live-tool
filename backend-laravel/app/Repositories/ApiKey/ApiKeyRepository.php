<?php
namespace App\Repositories\ApiKey;

use App\Models\ApiKey;
use App\Repositories\BaseEloquentRepository;

class ApiKeyRepository extends BaseEloquentRepository implements ApiKeyRepositoryInterface
{
    public function __construct(ApiKey $model)
    {
        parent::__construct($model);
    }

    public function createWithKey(array $data)
    {
        $data['key'] = bin2hex(random_bytes(16));
        return $this->store($data);
    }
}
