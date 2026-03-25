<?php

namespace App\Providers;

use App\Services\ContentTypeRegistry;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

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
        // ── Fix PostgreSQL boolean with pgbouncer (emulated prepares) ──
        // Must be in boot() so it overrides default Laravel DatabaseServiceProvider binding.
        // PDO emulated prepares (required for pgbouncer) converts PHP booleans to 1/0
        // which PostgreSQL strict typing rejects. Our custom connection converts them to 'true'/'false'.
        \Illuminate\Database\Connection::resolverFor('pgsql', function ($connection, $database, $prefix, $config) {
            return new \App\Database\PostgresConnection($connection, $database, $prefix, $config);
        });
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

        // Note: Plugin content types (post, event, topic, job, listing) are now
        // registered per-tenant in PluginResolverRegistrar::bootContentTypes()
        // to comply with P4 plugin architecture.
    }
}
