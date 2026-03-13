<?php
namespace App\Repositories\Role;
use App\Repositories\BaseRepoInterface;
interface RoleRepositoryInterface extends BaseRepoInterface
{
    public function findWithPermissions(int $id);
    public function getAllPermissions();
    public function syncPermissions(int $roleId, array $permissionIds): void;
    public function deleteWithRelations(int $roleId): void;
    public function assignRoleToUser(int $userId, int $roleId): void;
    public function getUsers();
}
