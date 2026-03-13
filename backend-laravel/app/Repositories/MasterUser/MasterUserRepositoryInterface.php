<?php
namespace App\Repositories\MasterUser;

use App\Repositories\BaseRepoInterface;

interface MasterUserRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
}
