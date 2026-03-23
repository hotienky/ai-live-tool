<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// Seed trang hệ thống (home, about, contact).
// Chạy trên cả tenant mới lẫn tenant đã tồn tại.
// Dùng insertOrIgnore để không ghi đè nếu đã tồn tại theo alias.

return new class extends Migration
{
    private array $systemPages = [
        [
            'title'       => 'Trang chủ',
            'alias'       => 'home',
            'content'     => null,
            'is_dynamic'  => true,
            'is_system'   => true,
            'status'      => true,
            'layout_data' => '{"version":"1.0","blocks":[]}',
            'sort'        => 0,
        ],
        [
            'title'       => 'Giới thiệu',
            'alias'       => 'about',
            'content'     => '',
            'is_dynamic'  => false,
            'is_system'   => true,
            'status'      => true,
            'layout_data' => null,
            'sort'        => 1,
        ],
        [
            'title'       => 'Liên hệ',
            'alias'       => 'contact',
            'content'     => '',
            'is_dynamic'  => false,
            'is_system'   => true,
            'status'      => true,
            'layout_data' => null,
            'sort'        => 2,
        ],
    ];

    public function up(): void
    {
        $now = now();
        foreach ($this->systemPages as $page) {
            // Chỉ chèn nếu alias chưa tồn tại
            $exists = DB::table('cms_pages')->where('alias', $page['alias'])->exists();
            if (!$exists) {
                DB::table('cms_pages')->insert(array_merge($page, [
                    'created_at' => $now,
                    'updated_at' => $now,
                ]));
            } else {
                // Nếu đã tồn tại, đánh dấu is_system = true để khoá xoá
                DB::table('cms_pages')
                    ->where('alias', $page['alias'])
                    ->update(['is_system' => true, 'updated_at' => $now]);
            }
        }
    }

    public function down(): void
    {
        DB::table('cms_pages')
            ->whereIn('alias', array_column($this->systemPages, 'alias'))
            ->where('is_system', true)
            ->delete();
    }
};
