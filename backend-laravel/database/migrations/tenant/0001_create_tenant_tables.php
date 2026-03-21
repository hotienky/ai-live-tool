<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Core tenant tables — Only essential system tables.
 * Module-specific tables (products, orders, etc.) are created
 * when the corresponding plugin/module is installed.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── Users (tenant admin/staff) ──
        if (!Schema::hasTable('users')) {
            Schema::create('users', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->unique();
                $table->timestamp('email_verified_at')->nullable();
                $table->string('password');
                $table->string('role')->default('admin');
                $table->boolean('is_active')->default(true);
                $table->timestamp('last_login_at')->nullable();
                $table->rememberToken();
                $table->timestamps();
            });
        }

        // ── Auth Access Tokens ──
        if (!Schema::hasTable('auth_access_tokens')) {
            Schema::create('auth_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tokenable_id');
                $table->string('type')->default('auth_token');
                $table->string('name')->nullable();
                $table->string('hash', 64);
                $table->json('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->timestamps();
            });
        }

        // ── Roles ──
        if (!Schema::hasTable('roles')) {
            Schema::create('roles', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->string('display_name')->nullable();
                $table->json('permissions')->nullable();
                $table->timestamps();
            });
        }

        // ── System Configs ──
        if (!Schema::hasTable('system_configs')) {
            Schema::create('system_configs', function (Blueprint $table) {
                $table->id();
                $table->string('key')->unique();
                $table->text('value')->nullable();
                $table->string('type')->default('string');
                $table->string('group_name')->default('general');
                $table->timestamps();
            });
        }

        // ── Nav Links ──
        if (!Schema::hasTable('nav_links')) {
            Schema::create('nav_links', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('url');
                $table->string('icon')->nullable();
                $table->unsignedBigInteger('parent_id')->nullable();
                $table->integer('sort')->default(0);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Languages ──
        if (!Schema::hasTable('languages')) {
            Schema::create('languages', function (Blueprint $table) {
                $table->id();
                $table->string('code', 10)->unique();
                $table->string('name');
                $table->boolean('is_default')->default(false);
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Language Translations ──
        if (!Schema::hasTable('language_translations')) {
            Schema::create('language_translations', function (Blueprint $table) {
                $table->id();
                $table->string('language_code', 10);
                $table->string('key');
                $table->text('value')->nullable();
                $table->string('group_name')->default('general');
                $table->timestamps();

                $table->unique(['language_code', 'key']);
            });
        }

        // ── CMS Pages ──
        if (!Schema::hasTable('cms_pages')) {
            Schema::create('cms_pages', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->string('alias')->unique();
                $table->string('image')->nullable();
                $table->longText('content')->nullable();
                $table->integer('sort')->default(0);
                $table->boolean('status')->default(true);
                $table->string('meta_title')->nullable();
                $table->text('meta_description')->nullable();
                $table->timestamps();
            });
        }

        // ── Banners ──
        if (!Schema::hasTable('banners')) {
            Schema::create('banners', function (Blueprint $table) {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->string('image')->nullable();
                $table->string('url')->nullable();
                $table->string('type')->default('main');
                $table->integer('sort')->default(0);
                $table->boolean('status')->default(true);
                $table->timestamps();
            });
        }

        // ── Notifications ──
        if (!Schema::hasTable('notifications')) {
            Schema::create('notifications', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('type')->default('system');
                $table->string('title');
                $table->text('message')->nullable();
                $table->string('link')->nullable();
                $table->boolean('is_read')->default(false);
                $table->timestamp('created_at')->nullable();
            });
        }

        // ── Activity Logs ──
        if (!Schema::hasTable('activity_logs')) {
            Schema::create('activity_logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('action');
                $table->string('entity_type')->nullable();
                $table->unsignedBigInteger('entity_id')->nullable();
                $table->json('data')->nullable();
                $table->timestamp('created_at')->nullable();
            });
        }

        // ── Webhooks ──
        if (!Schema::hasTable('webhooks')) {
            Schema::create('webhooks', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('url');
                $table->string('event');
                $table->boolean('is_active')->default(true);
                $table->string('secret')->nullable();
                $table->timestamps();
            });
        }

        // ── API Keys ──
        if (!Schema::hasTable('api_keys')) {
            Schema::create('api_keys', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('key')->unique();
                $table->boolean('is_active')->default(true);
                $table->timestamps();
            });
        }

        // ── Custom Fields ──
        if (!Schema::hasTable('custom_fields')) {
            Schema::create('custom_fields', function (Blueprint $table) {
                $table->id();
                $table->string('entity_type');
                $table->string('name');
                $table->string('label');
                $table->string('type')->default('text');
                $table->boolean('is_required')->default(false);
                $table->json('options')->nullable();
                $table->integer('sort_order')->default(0);
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        $tables = [
            'activity_logs', 'notifications', 'language_translations', 'languages',
            'roles', 'webhooks', 'api_keys', 'custom_fields', 'nav_links',
            'system_configs', 'cms_pages', 'banners', 'auth_access_tokens', 'users',
        ];
        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }
    }
};
