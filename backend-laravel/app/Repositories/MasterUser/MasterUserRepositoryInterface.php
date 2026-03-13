<?php
namespace App\Repositories\MasterUser;

use App\Repositories\BaseRepoInterface;

interface MasterUserRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
    public function createAccessToken(int $userId): string;
    public function revokeAccessToken(string $token): bool;
}
