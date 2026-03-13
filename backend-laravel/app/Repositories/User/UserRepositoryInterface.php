<?php
namespace App\Repositories\User;
use App\Repositories\BaseRepoInterface;
interface UserRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
    public function createAccessToken(int $userId): string;
    public function revokeAccessToken(string $tokenHash): bool;
}
