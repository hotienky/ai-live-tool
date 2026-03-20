<?php
namespace App\Repositories\Product;

use App\Models\Product;
use App\Repositories\BaseEloquentRepository;
use App\Pipelines\ProductFilterPipeline;
use Illuminate\Support\Facades\DB;

class ProductRepository extends BaseEloquentRepository implements ProductRepositoryInterface
{
    public function __construct(Product $model)
    {
        parent::__construct($model);
    }

    public function getProducts($perPage = null)
    {
        $query = $this->model->query();
        $query = ProductFilterPipeline::run($query, request()->all());
        $query->orderByDesc('created_at')->orderByDesc('id');
        if ($perPage) {
            return $query->paginate($perPage);
        }
        return $query->get();
    }

    public function findBySku(string $sku)
    {
        return $this->model->where('sku', $sku)->first();
    }

    public function findBySlugOrId($identifier)
    {
        if (is_numeric($identifier)) {
            return $this->model->find($identifier);
        }
        return $this->model->where('sku', $identifier)->orWhere('slug', $identifier)->first();
    }

    public function adjustStock(int $id, int $quantity, ?int $userId = null, ?string $reason = null)
    {
        $product = $this->findOrFail($id);
        $stockBefore = $product->stock ?? 0;
        $stockAfter = $stockBefore + $quantity;

        $this->update(['stock' => $stockAfter], $id);

        DB::table('stock_histories')->insert([
            'product_id' => $id,
            'action' => $quantity > 0 ? 'add' : 'subtract',
            'quantity_change' => $quantity,
            'stock_before' => $stockBefore,
            'stock_after' => $stockAfter,
            'reason' => $reason,
            'created_at' => now(),
        ]);

        return $stockAfter;
    }
}
