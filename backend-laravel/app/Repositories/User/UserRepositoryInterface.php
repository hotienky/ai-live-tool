<?php
namespace App\Repositories\User;
use App\Repositories\BaseRepoInterface;
use Illuminate\Support\Collection;

interface UserRepositoryInterface extends BaseRepoInterface
{
    public function findByEmail(string $email);
    public function createAccessToken(int $userId): string;
    public function revokeAccessToken(string $tokenHash): bool;

    // Staff user management
    public function listWithRoles(): Collection;
    public function findWithRole(int $id);
    public function storeStaff(array $data): object;
    public function syncRole(int $userId, ?int $roleId): void;
    public function toggleActive(int $id): bool;
}
