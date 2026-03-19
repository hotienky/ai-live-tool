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
    public static function getGrouped(string $type, int|string $id): array
    {
        $rows = self::where('translatable_type', $type)
            ->where('translatable_id', $id)
            ->get();

        $grouped = [];
        foreach ($rows as $row) {
            $grouped[$row->locale][$row->field] = $row->value;
        }

        return $grouped;
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
    public static function mergeIntoItems(array $items, string $type, string $locale, array $fields = ['name', 'description']): array
    {
        if (empty($items) || empty($locale)) return $items;

        try {
            $ids = array_column($items, 'id');
            $translations = self::where('translatable_type', $type)
                ->whereIn('translatable_id', $ids)
                ->where('locale', $locale)
                ->whereIn('field', $fields)
                ->get()
                ->groupBy('translatable_id');

            foreach ($items as &$item) {
                $itemTrans = $translations->get($item['id'], collect());
                foreach ($itemTrans as $t) {
                    if (!empty($t->value)) {
                        $item[$t->field] = $t->value;
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
    public static function mergeIntoSingleItem($item, string $type, string $locale, array $fields = ['name', 'description'])
    {
        if (empty($item) || empty($locale)) return $item;

        try {
            $id = is_array($item) ? ($item['id'] ?? null) : ($item->id ?? null);
            if (!$id) return $item;

            $translations = self::where('translatable_type', $type)
                ->where('translatable_id', $id)
                ->where('locale', $locale)
                ->whereIn('field', $fields)
                ->pluck('value', 'field');

            foreach ($translations as $field => $value) {
                if (!empty($value)) {
                    if (is_array($item)) {
                        $item[$field] = $value;
                    } else {
                        $item->{$field} = $value;
                    }
                }
            }
        } catch (\Exception $e) {
            Log::info('ContentTranslation::mergeIntoSingleItem skipped: ' . $e->getMessage());
        }

        return $item;
    }
}
