<?php

namespace App\Transformers;

class ProductTransformer extends BaseTransformer
{
    public function transform($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->name,
            'sku' => $item->sku,
            'slug' => $item->slug,
            'price' => (float) $item->price,
            'cost_price' => $item->cost_price ? (float) $item->cost_price : null,
            'promotion_price' => $item->promotion_price ? (float) $item->promotion_price : null,
            'promotion_start' => $item->promotion_start,
            'promotion_end' => $item->promotion_end,
            'image_url' => $item->image_url,
            'images' => $item->images,
            'description' => $item->description,
            'keywords' => $item->keywords,
            'category' => $item->category,
            'category_id' => $item->category_id,
            'brand_id' => $item->brand_id,
            'stock' => (int) ($item->stock ?? 0),
            'low_stock_threshold' => (int) ($item->low_stock_threshold ?? 5),
            'unit' => $item->unit,
            'barcode' => $item->barcode,
            'weight' => $item->weight,
            'variants' => $item->variants,
            'is_active' => (bool) $item->is_active,
            'is_featured' => (bool) $item->is_featured,
            'created_at' => $item->created_at,
            'updated_at' => $item->updated_at,
        ];
    }
}
