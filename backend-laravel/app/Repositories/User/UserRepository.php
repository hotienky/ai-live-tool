<?php
namespace App\Repositories\User;
use App\Models\User;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;
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
}
