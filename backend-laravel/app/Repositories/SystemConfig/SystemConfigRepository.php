<?php
namespace App\Repositories\SystemConfig;

use Illuminate\Support\Facades\DB;

class SystemConfigRepository implements SystemConfigRepositoryInterface
{
    public function getAll(?string $group = null)
    {
        $query = DB::table('system_configs');
        if ($group) $query->where('group_name', $group);
        return $query->get();
    }

    public function getByGroup(string $group)
    {
        return DB::table('system_configs')->where('group_name', $group)->get();
    }

    public function upsertItems(array $items): void
    {
        foreach ($items as $item) {
            DB::table('system_configs')->updateOrInsert(
                ['key' => $item['key'], 'group_name' => $item['group'] ?? 'general'],
                ['value' => $item['value'], 'updated_at' => now()]
            );
        }
    }

    public function updateGroup(string $group, array $items): void
    {
        foreach ($items as $item) {
            DB::table('system_configs')->updateOrInsert(
                ['key' => $item['key'], 'group_name' => $group],
                ['value' => $item['value'], 'updated_at' => now()]
            );
        }
    }
}
