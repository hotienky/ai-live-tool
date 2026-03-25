<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class ContentTranslation extends Model
{
    protected $fillable = [
        'translatable_type',
        'translatable_id',
        'locale',
        'field',
        'value',
    ];

    /**
     * Get all translations for a specific entity, grouped by locale.
     */
    public static function getGrouped(string $type, int|string $id): array|object
    {
        if (!is_numeric($id)) {
            return new \stdClass();
        }

        $rows = self::where('translatable_type', $type)
            ->where('translatable_id', $id)
            ->get();

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->locale][$row->field] = $row->value;
        }

        // Return object so JSON encodes as {} not [] when empty
        return empty($grouped) ? new \stdClass() : $grouped;
    }

    /**
     * Upsert translations for an entity.
     * $translations = [ 'en' => ['name' => 'T-shirt', 'description' => 'A nice shirt'], 'ja' => [...] ]
     */
    public static function upsertGrouped(string $type, int|string $id, array $translations): void
    {
        foreach ($translations as $locale => $fields) {
            foreach ($fields as $field => $value) {
                self::updateOrCreate(
                    [
                        'translatable_type' => $type,
                        'translatable_id' => $id,
                        'locale' => $locale,
                        'field' => $field,
                    ],
                    ['value' => $value]
                );
            }
        }
    }

    /**
     * Merge translations into an array of items for a specific locale.
     * Used by API responses to overlay translated fields.
     */
    public static function mergeIntoItems(array $items, string $type, ?string $locale, array $fields = ['name', 'description'], string $fallbackLocale = 'vi'): array
    {
        if (empty($items) || empty($locale)) return $items;

        try {
            $ids = array_column($items, 'id');
            $rows = self::where('translatable_type', $type)
                ->whereIn('translatable_id', $ids)
                ->whereIn('locale', array_unique([$locale, $fallbackLocale]))
                ->whereIn('field', $fields)
                ->get();

            $map = [];
            foreach ($rows as $row) {
                $map[$row->translatable_id][$row->locale][$row->field] = $row->value;
            }

            foreach ($items as &$item) {
                $id = is_array($item) ? ($item['id'] ?? null) : ($item->id ?? null);
                if (!$id) continue;
                foreach ($fields as $field) {
                    $val = $map[$id][$locale][$field]
                        ?? $map[$id][$fallbackLocale][$field]
                        ?? null;
                    if ($val !== null) {
                        is_array($item) ? ($item[$field] = $val) : ($item->$field = $val);
                    }
                }
            }
        } catch (\Exception $e) {
            // Table may not exist yet — return original items without crash
            Log::info('ContentTranslation::mergeIntoItems skipped: ' . $e->getMessage());
        }

        return $items;
    }

    /**
     * Merge translations into a single item (model or array) for a specific locale.
     * Used for product detail, page detail, etc.
     */
    public static function mergeIntoSingleItem($item, string $type, ?string $locale, array $fields = ['name', 'description'], string $fallbackLocale = 'vi')
    {
        if (empty($item) || empty($locale)) return $item;

        try {
            $id = is_array($item) ? ($item['id'] ?? null) : ($item->id ?? null);
            if (!$id) return $item;

            $rows = self::where('translatable_type', $type)
                ->where('translatable_id', $id)
                ->whereIn('locale', array_unique([$locale, $fallbackLocale]))
                ->whereIn('field', $fields)
                ->get();

            $map = [];
            foreach ($rows as $row) {
                $map[$row->locale][$row->field] = $row->value;
            }

            foreach ($fields as $field) {
                $val = $map[$locale][$field]
                    ?? $map[$fallbackLocale][$field]
                    ?? null;
                if ($val !== null) {
                    if (is_array($item)) {
                        $item[$field] = $val;
                    } else {
                        $item->{$field} = $val;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::info('ContentTranslation::mergeIntoSingleItem skipped: ' . $e->getMessage());
        }

        return $item;
    }
}
