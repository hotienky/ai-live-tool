<?php
namespace App\Repositories\CustomField;

use App\Repositories\BaseRepoInterface;

interface CustomFieldRepositoryInterface extends BaseRepoInterface
{
    public function getAllSorted();
    public function getValues(string $entityType, int $entityId);
    public function upsertValues(string $entityType, int $entityId, array $values);
}
