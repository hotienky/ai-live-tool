<?php
namespace App\Repositories\SystemConfig;

interface SystemConfigRepositoryInterface
{
    public function getAll(?string $group = null);
    public function getByGroup(string $group);
    public function upsertItems(array $items): void;
    public function updateGroup(string $group, array $items): void;
}
