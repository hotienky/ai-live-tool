<?php
namespace App\Actions\User;

use Illuminate\Http\Request;

class DestroyAction extends BaseAction
{
    public function __invoke(Request $request, int $id)
    {
        $authUser = $request->attributes->get('auth_user');
        if ($authUser && $authUser->id == $id) {
            return $this->errorResponse('Không thể xóa tài khoản đang đăng nhập', 403);
        }

        $this->logActivity('user.deleted', 'user', $id);
        $this->repo->syncRole($id, null); // Remove role pivot
        $this->repo->delete($id);

        return $this->successResponse(null, 'Đã xóa người dùng');
    }
}
