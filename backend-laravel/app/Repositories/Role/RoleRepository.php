<?php
namespace App\Repositories\Role;
use App\Models\Role;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;

class RoleRepository extends BaseEloquentRepository implements RoleRepositoryInterface
{
    public function __construct(Role $model) { parent::__construct($model); }

    public function findWithPermissions(int $id)
    {
        $role = $this->find($id);
        if (!$role) return null;

        // Preserve the roles.permissions JSON column (e.g. ["*"])
        $role->raw_permissions = $role->permissions;

        // Load related permission objects from pivot
        $permList = DB::table('role_permissions')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->where('role_permissions.role_id', $id)
            ->select('permissions.*')
            ->get();

        $role->permission_list = $permList;
        $role->permission_names = $permList->pluck('name')->toArray();

        return $role;
    }

    public function getAllPermissions()
    {
        return DB::table('permissions')->get();
    }

    public function syncPermissions(int $roleId, array $permissionIds): void
    {
        DB::table('role_permissions')->where('role_id', $roleId)->delete();
        foreach ($permissionIds as $pid) {
            DB::table('role_permissions')->insert(['role_id' => $roleId, 'permission_id' => $pid]);
        }
    }

    public function deleteWithRelations(int $roleId): void
    {
        DB::table('role_permissions')->where('role_id', $roleId)->delete();
        DB::table('user_roles')->where('role_id', $roleId)->delete();
        $this->delete($roleId);
    }

    public function assignRoleToUser(int $userId, int $roleId): void
    {
        DB::table('user_roles')->updateOrInsert(
            ['user_id' => $userId],
            ['role_id' => $roleId]
        );
    }

    public function getUsers()
    {
        return DB::table('users')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->select('users.id', 'users.full_name', 'users.email', 'users.is_active', 'roles.id as role_id', 'roles.name as role_name')
            ->get();
    }
}
