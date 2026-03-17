<?php
namespace App\Repositories\FlashSale;

use App\Models\FlashSale;
use App\Repositories\BaseEloquentRepository;

class FlashSaleRepository extends BaseEloquentRepository implements FlashSaleRepositoryInterface
{
    public function __construct(FlashSale $model)
    {
        parent::__construct($model);
    }

    /**
     * Get active flash sales that are currently running,
     * eager-loading their items + the linked product details.
     */
    public function getActive()
    {
        return $this->model
            ->where('is_active', true)
            ->where('end_date', '>=', now())
            ->with(['items.product'])   // eager-load items and each item's product
            ->orderByDesc('start_date')
            ->get()
            ->map(function ($sale) {
                // Reshape items into the shape the frontend expects
                $sale->items = $sale->items->filter(fn ($item) => $item->product)
                    ->map(fn ($item) => [
                        'id'          => $item->id,
                        'product_id'  => $item->product_id,
                        'name'        => $item->product->name,
                        'image'       => $item->product->image_url,
                        'slug'        => $item->product->slug,
                        'price'       => (float) $item->original_price,   // frontend reads item.price
                        'sale_price'  => (float) $item->sale_price,
                        'stock_limit' => $item->stock_limit,
                        'sold_count'  => $item->sold_count,
                    ])->values();
                return $sale;
            });
    }
}
