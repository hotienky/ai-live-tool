<?php

namespace App\Http\Controllers\Master;
use App\Http\Controllers\Controller;

use App\Repositories\MasterUser\MasterUserRepositoryInterface;
use App\Traits\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class MasterAuthController extends Controller
{
    use ApiResponse;

    public function __construct(private MasterUserRepositoryInterface $repo) {}

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = $this->repo->findByEmail($data['email']);

        if (!$user) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        // Handle both bcrypt (Laravel) and scrypt (AdonisJS legacy) password hashes
        $passwordValid = false;
        try {
            $passwordValid = Hash::check($data['password'], $user->password);
        } catch (\RuntimeException $e) {
            $passwordValid = password_verify($data['password'], $user->password);
        }

        if (!$passwordValid) {
            return $this->errorResponse('Invalid credentials', 401);
        }

        // Auto-rehash to bcrypt for future logins
        if (!str_starts_with($user->password, '$2y$') && !str_starts_with($user->password, '$2b$')) {
            $this->repo->update(['password' => Hash::make($data['password']), 'updated_at' => now()], $user->id);
        }

        $token = $this->repo->createAccessToken($user->id);

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'name' => $user->name,
                'role' => $user->role,
            ],
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return $this->successResponse($request->attributes->get('masterUser'));
    }

    public function logout()
    {
        return $this->successResponse(null, 'Logged out successfully');
    }
}
