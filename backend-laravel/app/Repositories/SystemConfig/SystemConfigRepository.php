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
            $group = $item['group_name'] ?? $item['group'] ?? 'general';
            DB::table('system_configs')->updateOrInsert(
                // Match on COMPOSITE unique key (key + group_name)
                ['key' => $item['key'], 'group_name' => $group],
                ['value' => $item['value'], 'type' => $item['type'] ?? 'string', 'updated_at' => now()]
            );
        }
    }

    public function updateGroup(string $group, array $items): void
    {
        foreach ($items as $item) {
            DB::table('system_configs')->updateOrInsert(
                // Match on COMPOSITE unique key (key + group_name)
                ['key' => $item['key'], 'group_name' => $group],
                ['value' => $item['value'], 'type' => $item['type'] ?? 'string', 'updated_at' => now()]
            );
        }
    }
}
