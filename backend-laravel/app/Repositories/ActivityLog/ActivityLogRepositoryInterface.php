<?php
namespace App\Repositories\ActivityLog;

use App\Repositories\BaseRepoInterface;

interface ActivityLogRepositoryInterface extends BaseRepoInterface
{
    public function getRecent(int $limit = 50, ?string $action = null, int $page = 1);
    public function getStats(): array;
}
