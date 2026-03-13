<?php
namespace App\Repositories\MasterUser;

use App\Models\MasterUser;
use App\Repositories\BaseEloquentRepository;
use Illuminate\Support\Facades\DB;

class MasterUserRepository extends BaseEloquentRepository implements MasterUserRepositoryInterface
{
    public function __construct(MasterUser $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email)
    {
        return $this->model->where('email', $email)->first();
    }

    public function createAccessToken(int $userId): string
    {
        $token = bin2hex(random_bytes(32));
        DB::connection('master')->table('master_access_tokens')->insert([
            'user_id' => $userId,
            'token' => $token,
            'created_at' => now(),
            'expires_at' => now()->addDays(30),
        ]);
        return $token;
    }

    public function revokeAccessToken(string $token): bool
    {
        return DB::connection('master')->table('master_access_tokens')
            ->where('token', $token)->delete() > 0;
    }
}
