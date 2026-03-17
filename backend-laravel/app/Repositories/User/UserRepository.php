<?php
namespace App\Repositories\User;
use App\Models\User;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserRepository extends BaseEloquentRepository implements UserRepositoryInterface
{
    public function __construct(User $model) { parent::__construct($model); }

    public function findByEmail(string $email)
    {
        return $this->model->where('email', $email)->first();
    }

    public function createAccessToken(int $userId): string
    {
        $token = Str::random(64);
        DB::table('auth_access_tokens')->insert([
            'tokenable_id' => $userId,
            'type' => 'auth_token',
            'name' => 'API Token',
            'hash' => hash('sha256', $token),
            'created_at' => now(),
            'updated_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);
        return $token;
    }

    public function revokeAccessToken(string $tokenHash): bool
    {
        return DB::table('auth_access_tokens')->where('hash', $tokenHash)->delete() > 0;
    }

    // ── Staff User Management ──

    public function listWithRoles(): Collection
    {
        return DB::table('users')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->select(
                'users.id', 'users.name', 'users.email',
                'users.is_active', 'users.created_at',
                'users.role_id',
                'roles.name as role_name',
                'roles.display_name as role_display_name'
            )
            ->orderByDesc('users.created_at')
            ->get();
    }

    public function findWithRole(int $id)
    {
        return DB::table('users')
            ->leftJoin('roles', 'roles.id', '=', 'users.role_id')
            ->where('users.id', $id)
            ->select('users.*', 'roles.name as role_name', 'roles.display_name as role_display_name')
            ->first();
    }

    public function storeStaff(array $data): object
    {
        $userId = DB::table('users')->insertGetId([
            'name'       => $data['name'],
            'email'      => $data['email'],
            'password'   => Hash::make($data['password']),
            'role_id'    => $data['role_id'] ?? null,
            'is_active'  => $data['is_active'] ?? true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        if (!empty($data['role_id'])) {
            $this->syncRole($userId, $data['role_id']);
        }

        return $this->findWithRole($userId);
    }

    public function syncRole(int $userId, ?int $roleId): void
    {
        if ($roleId) {
            DB::table('user_roles')->updateOrInsert(
                ['user_id' => $userId],
                ['role_id' => $roleId]
            );
        } else {
            DB::table('user_roles')->where('user_id', $userId)->delete();
        }
    }

    public function toggleActive(int $id): bool
    {
        $user = DB::table('users')->where('id', $id)->first();
        if (!$user) return false;

        $newStatus = !$user->is_active;
        DB::table('users')->where('id', $id)->update([
            'is_active'  => $newStatus,
            'updated_at' => now(),
        ]);
        return $newStatus;
    }
}
