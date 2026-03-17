<?php
namespace App\Actions\User;

class ShowAction extends BaseAction
{
    public function __invoke(int $id)
    {
        $user = $this->repo->findWithRole($id);
        if (!$user) return $this->notFoundResponse('Người dùng không tồn tại');
        return $this->successResponse($user);
    }
}
