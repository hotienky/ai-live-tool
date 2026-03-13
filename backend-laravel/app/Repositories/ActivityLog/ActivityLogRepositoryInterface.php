<?php
namespace App\Repositories\ActivityLog;

use App\Repositories\BaseRepoInterface;

interface ActivityLogRepositoryInterface extends BaseRepoInterface
{
    public function getRecent(int $limit = 100);
    public function getStats(): array;
}
