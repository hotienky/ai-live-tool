<?php

namespace App\Transformers;

abstract class BaseTransformer
{
    /**
     * Transform a single item.
     */
    abstract public function transform($item): array;

    /**
     * Transform a collection of items.
     */
    public function transformCollection($items): array
    {
        if (is_array($items) || $items instanceof \Illuminate\Support\Collection) {
            return collect($items)->map(function ($item) {
                return $this->transform($item);
            })->toArray();
        }

        return [];
    }
}
