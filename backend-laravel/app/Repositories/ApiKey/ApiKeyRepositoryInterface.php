<?php
namespace App\Repositories\ApiKey;

use App\Repositories\BaseRepoInterface;

interface ApiKeyRepositoryInterface extends BaseRepoInterface
{
    public function createWithKey(array $data);
}
