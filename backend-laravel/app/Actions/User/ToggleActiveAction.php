<?php
namespace App\Actions\User;

class ToggleActiveAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $user = $this->repo->findWithRole($id);
        if (!$user) return $this->notFoundResponse('Người dùng không tồn tại');

        $newStatus = $this->repo->toggleActive($id);

        return $this->successResponse(['is_active' => $newStatus], 'Đã cập nhật trạng thái');
    }
}
