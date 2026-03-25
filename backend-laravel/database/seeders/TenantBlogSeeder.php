<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;

class TenantBlogSeeder extends Seeder
{
    public function run(): void
    {
        $tenantDb = env('TENANT_DB', 'tenant_blog');
        Config::set('database.connections.pgsql.database', $tenantDb);
        DB::purge('pgsql');
        DB::reconnect('pgsql');

        $db = DB::connection('pgsql');
        $isPgsql = $db->getDriverName() === 'pgsql';
        $true = $isPgsql ? DB::raw('true') : true;

        echo "🗑️  Clearing old blog data...\n";
        $db->table('content_taxonomies')->delete();
        $db->table('contents')->delete();
        $db->table('nav_links')->delete();
        $db->table('cms_pages')->delete();

        // 1. Author
        $authorId = $db->table('users')->first()->id ?? null;

        // 2. Blog Posts (Contents)
        $posts = [
            [
                'type' => 'post',
                'slug' => 'xu-huong-cong-nghe-ai-nam-2026',
                'title' => 'Xu hướng Công nghệ AI định hình năm 2026',
                'excerpt' => 'Khám phá những xu hướng Trí tuệ nhân tạo (AI) sẽ thống trị và thay đổi cách chúng ta làm việc trong tương lai gần.',
                'body' => '<p>Công nghệ AI đang phát triển với tốc độ chóng mặt. Trong bài viết này, chúng ta sẽ tìm hiểu về các xu hướng cốt lõi như AI tạo sinh (Generative AI), tự động hóa thông minh và tích hợp AI vào đời sống hàng ngày.</p><p>...</p>',
                'featured_image' => 'https://placehold.co/800x400/3b82f6/ffffff?text=AI+Trends',
                'status' => 'published',
                'author_id' => $authorId,
                'published_at' => now()->subDays(2),
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'type' => 'post',
                'slug' => 'ky-nang-lap-trinh-can-thiet',
                'title' => 'Top 5 Kỹ năng Lập trình cần thiết cho Developer',
                'excerpt' => 'Để tồn tại và phát triển trong ngành IT, lập trình viên cần trang bị những kỹ năng gì ngoài việc viết code?',
                'body' => '<p>Ngôn ngữ lập trình là chưa đủ. Các kỹ năng như giao tiếp, hiểu biết về UI/UX, và tư duy giải quyết vấn đề đóng vai trò quan trọng không kém.</p>',
                'featured_image' => 'https://placehold.co/800x400/10b981/ffffff?text=Coding+Skills',
                'status' => 'published',
                'author_id' => $authorId,
                'published_at' => now()->subDays(5),
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'type' => 'post',
                'slug' => 'review-laptop-macbook-pro-m4',
                'title' => 'Đánh giá chi tiết MacBook Pro M4 mới nhất',
                'excerpt' => 'Liệu chip M4 có mang lại sự đột phá về hiệu năng như Apple đã quảng cáo?',
                'body' => '<p>Chúng tôi đã trải nghiệm MacBook Pro M4 trong 2 tuần và đây là những đánh giá trung thực nhất về hiệu năng, thời lượng pin và màn hình.</p>',
                'featured_image' => 'https://placehold.co/800x400/6366f1/ffffff?text=MacBook+M4',
                'status' => 'published',
                'author_id' => $authorId,
                'published_at' => now()->subDays(10),
                'created_at' => now(), 'updated_at' => now(),
            ],
        ];

        foreach ($posts as $post) {
            $postId = $db->table('contents')->insertGetId($post);
            
            // Add category (taxonomy)
            $db->table('content_taxonomies')->insert([
                ['content_id' => $postId, 'taxonomy' => 'category', 'term' => 'Công nghệ', 'created_at' => now(), 'updated_at' => now()],
                ['content_id' => $postId, 'taxonomy' => 'tag', 'term' => 'news', 'created_at' => now(), 'updated_at' => now()],
            ]);
        }
        echo "✅ Seeded Blog Posts\n";

        // 3. CMS Pages
        $db->table('cms_pages')->insert([
            [
                'title' => 'Giới thiệu tác giả',
                'alias' => 'gioi-thieu',
                'content' => '<h2>Về chúng tôi</h2><p>TechBlog Việt Nam là trang web cung cấp thông tin công nghệ mới nhất...</p>',
                'status' => $true, 'sort' => 1,
                'created_at' => now(), 'updated_at' => now(),
            ],
            [
                'title' => 'Liên hệ',
                'alias' => 'lien-he',
                'content' => '<h2>Liên hệ với TechBlog</h2><p>Email: contact@blog.com</p>',
                'status' => $true, 'sort' => 2,
                'created_at' => now(), 'updated_at' => now(),
            ]
        ]);
        echo "✅ Seeded CMS Pages\n";

        // 4. Nav Links
        $db->table('nav_links')->insert([
            ['title' => 'Trang chủ', 'url' => '/', 'icon' => 'Home', 'sort_order' => 1, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Công nghệ', 'url' => '/category/cong-nghe', 'icon' => 'Cpu', 'sort_order' => 2, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Giới thiệu', 'url' => '/page/gioi-thieu', 'icon' => 'Info', 'sort_order' => 3, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
            ['title' => 'Liên hệ', 'url' => '/page/lien-he', 'icon' => 'Mail', 'sort_order' => 4, 'is_active' => $true, 'created_at' => now(), 'updated_at' => now()],
        ]);
        echo "✅ Seeded Nav Links\n";
    }
}
