<?php

namespace App\Services;

/**
 * ContentTypeRegistry — WordPress-like Custom Post Types
 *
 * Plugins register content types once in a service provider:
 *   ContentTypeRegistry::register('post', [ ... ]);
 *
 * The generic ContentController handles CRUD for all registered types.
 */
class ContentTypeRegistry
{
    protected static array $types = [];

    /**
     * Register a new content type
     *
     * @param string $type  Unique type key (e.g. 'post', 'course', 'listing')
     * @param array  $config  Configuration array
     */
    public static function register(string $type, array $config): void
    {
        static::$types[$type] = array_merge([
            'name' => $type,
            'label' => ucfirst($type),
            'label_plural' => ucfirst($type) . 's',
            'icon' => 'FileText',
            'supports' => ['title', 'body', 'excerpt', 'featured_image', 'slug'],
            'taxonomies' => [],           // e.g. ['category', 'tag']
            'has_revisions' => true,
            'has_comments' => false,
            'meta_fields' => [],          // custom fields stored in meta JSONB
            'module_id' => null,          // optional — links to a module
        ], $config);
    }

    /**
     * Get a registered content type config
     */
    public static function get(string $type): ?array
    {
        return static::$types[$type] ?? null;
    }

    /**
     * Get all registered content types
     */
    public static function all(): array
    {
        return static::$types;
    }

    /**
     * Check if a content type is registered
     */
    public static function exists(string $type): bool
    {
        return isset(static::$types[$type]);
    }

    /**
     * Auto-generate validation rules from type config
     */
    public static function getValidationRules(string $type): array
    {
        $config = static::get($type);
        if (!$config) return [];

        $rules = [];

        // Title is always required
        if (in_array('title', $config['supports'])) {
            $rules['title'] = 'required|string|max:255';
        }

        // Slug is optional (auto-generated if missing)
        if (in_array('slug', $config['supports'])) {
            $rules['slug'] = 'nullable|string|max:255';
        }

        // Body
        if (in_array('body', $config['supports'])) {
            $rules['body'] = 'nullable|string';
        }

        // Excerpt
        if (in_array('excerpt', $config['supports'])) {
            $rules['excerpt'] = 'nullable|string|max:500';
        }

        // Meta fields
        foreach ($config['meta_fields'] as $field) {
            $validation = $field['validation'] ?? 'nullable|string';
            if ($field['required'] ?? false) {
                $validation = 'required|' . ltrim($validation, 'nullable|');
            }
            $rules["meta.{$field['key']}"] = $validation;
        }

        return $rules;
    }

    /**
     * Get supported taxonomies for a content type
     */
    public static function getTaxonomies(string $type): array
    {
        $config = static::get($type);
        return $config['taxonomies'] ?? [];
    }
}
