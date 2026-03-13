<?php
namespace App\Repositories\User;
use App\Repositories\BaseRepoInterface;
interface UserRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
}
