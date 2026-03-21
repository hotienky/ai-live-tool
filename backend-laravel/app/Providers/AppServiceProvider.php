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
    }
}
