<?php

namespace App\Providers;

use App\Services\ContentTypeRegistry;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // ── Register core content types ──
        ContentTypeRegistry::register('page', [
            'label' => 'Trang',
            'label_plural' => 'Trang CMS',
            'icon' => 'FileText',
            'supports' => ['title', 'body', 'slug', 'featured_image'],
            'taxonomies' => [],
            'has_revisions' => true,
            'meta_fields' => [
                ['key' => 'seo_title', 'type' => 'text', 'label' => 'SEO Title', 'validation' => 'string|max:255'],
                ['key' => 'seo_description', 'type' => 'textarea', 'label' => 'SEO Description', 'validation' => 'string|max:500'],
            ],
        ]);

        ContentTypeRegistry::register('post', [
            'label' => 'Bài viết',
            'label_plural' => 'Blog',
            'icon' => 'PenSquare',
            'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
            'taxonomies' => ['category', 'tag'],
            'has_revisions' => true,
            'has_comments' => true,
            'module_id' => 'blog',
            'meta_fields' => [
                ['key' => 'seo_title', 'type' => 'text', 'label' => 'SEO Title', 'validation' => 'string|max:255'],
                ['key' => 'seo_description', 'type' => 'textarea', 'label' => 'Meta Description', 'validation' => 'string|max:500'],
                ['key' => 'reading_time', 'type' => 'number', 'label' => 'Thời gian đọc (phút)'],
                ['key' => 'is_featured', 'type' => 'checkbox', 'label' => 'Bài viết nổi bật'],
            ],
        ]);

        // ── Plugin content types ──

        ContentTypeRegistry::register('event', [
            'label' => 'Sự kiện',
            'label_plural' => 'Sự kiện',
            'icon' => 'CalendarDays',
            'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
            'taxonomies' => ['event_category'],
            'has_revisions' => false,
            'has_comments' => false,
            'module_id' => 'events',
            'meta_fields' => [
                ['key' => 'location', 'type' => 'text', 'label' => 'Địa điểm', 'validation' => 'string|max:500'],
                ['key' => 'start_date', 'type' => 'datetime', 'label' => 'Ngày bắt đầu', 'required' => true, 'validation' => 'date'],
                ['key' => 'end_date', 'type' => 'datetime', 'label' => 'Ngày kết thúc', 'validation' => 'date'],
                ['key' => 'ticket_price', 'type' => 'number', 'label' => 'Giá vé', 'validation' => 'numeric|min:0'],
                ['key' => 'capacity', 'type' => 'number', 'label' => 'Sức chứa', 'validation' => 'integer|min:0'],
                ['key' => 'organizer', 'type' => 'text', 'label' => 'Đơn vị tổ chức', 'validation' => 'string|max:255'],
                ['key' => 'registration_url', 'type' => 'text', 'label' => 'Link đăng ký', 'validation' => 'string|max:500'],
            ],
        ]);

        ContentTypeRegistry::register('topic', [
            'label' => 'Chủ đề',
            'label_plural' => 'Diễn đàn',
            'icon' => 'MessageSquare',
            'supports' => ['title', 'body', 'slug'],
            'taxonomies' => ['forum_category'],
            'has_revisions' => false,
            'has_comments' => true,
            'module_id' => 'forum',
            'meta_fields' => [
                ['key' => 'is_pinned', 'type' => 'checkbox', 'label' => 'Ghim'],
                ['key' => 'is_locked', 'type' => 'checkbox', 'label' => 'Khoá'],
                ['key' => 'view_count', 'type' => 'number', 'label' => 'Lượt xem'],
                ['key' => 'reply_count', 'type' => 'number', 'label' => 'Trả lời'],
            ],
        ]);

        ContentTypeRegistry::register('job', [
            'label' => 'Tin tuyển dụng',
            'label_plural' => 'Tuyển dụng',
            'icon' => 'Briefcase',
            'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
            'taxonomies' => ['job_category', 'job_type'],
            'has_revisions' => false,
            'has_comments' => false,
            'module_id' => 'jobboard',
            'meta_fields' => [
                ['key' => 'company', 'type' => 'text', 'label' => 'Công ty', 'required' => true, 'validation' => 'string|max:255'],
                ['key' => 'location', 'type' => 'text', 'label' => 'Địa điểm', 'validation' => 'string|max:500'],
                ['key' => 'salary_range', 'type' => 'text', 'label' => 'Mức lương', 'validation' => 'string|max:255'],
                ['key' => 'deadline', 'type' => 'date', 'label' => 'Hạn nộp', 'validation' => 'date'],
                ['key' => 'experience_level', 'type' => 'select', 'label' => 'Kinh nghiệm', 'validation' => 'string|max:100'],
                ['key' => 'apply_url', 'type' => 'text', 'label' => 'Link ứng tuyển', 'validation' => 'string|max:500'],
            ],
        ]);

        ContentTypeRegistry::register('listing', [
            'label' => 'Tin đăng',
            'label_plural' => 'Bất động sản',
            'icon' => 'Building2',
            'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
            'taxonomies' => ['property_type', 'listing_type'],
            'has_revisions' => false,
            'has_comments' => false,
            'module_id' => 'realestate',
            'meta_fields' => [
                ['key' => 'price', 'type' => 'number', 'label' => 'Giá', 'required' => true, 'validation' => 'numeric|min:0'],
                ['key' => 'area_sqm', 'type' => 'number', 'label' => 'Diện tích (m²)', 'validation' => 'numeric|min:0'],
                ['key' => 'bedrooms', 'type' => 'number', 'label' => 'Phòng ngủ', 'validation' => 'integer|min:0'],
                ['key' => 'bathrooms', 'type' => 'number', 'label' => 'Phòng tắm', 'validation' => 'integer|min:0'],
                ['key' => 'address', 'type' => 'text', 'label' => 'Địa chỉ', 'required' => true, 'validation' => 'string|max:500'],
                ['key' => 'lat', 'type' => 'number', 'label' => 'Vĩ độ', 'validation' => 'numeric'],
                ['key' => 'lng', 'type' => 'number', 'label' => 'Kinh độ', 'validation' => 'numeric'],
                ['key' => 'agent_name', 'type' => 'text', 'label' => 'Môi giới', 'validation' => 'string|max:255'],
                ['key' => 'agent_phone', 'type' => 'text', 'label' => 'SĐT Môi giới', 'validation' => 'string|max:20'],
            ],
        ]);
    }
}
