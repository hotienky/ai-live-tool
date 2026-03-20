<?php

namespace App\Console\Commands;

use App\Events\Product\StockLow;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Chạy mỗi 15 phút — quét sản phẩm có tồn kho dưới ngưỡng.
 * Ngưỡng lấy từ system_configs: notification.low_stock_threshold
 */
class CheckLowStockCommand extends Command
{
    protected $signature   = 'notifications:check-low-stock';
    protected $description = 'Kiểm tra sản phẩm tồn kho thấp và gửi thông báo';

    public function handle(): int
    {
        try {
            $threshold = (int) (DB::table('system_configs')
                ->where('key', 'notification.low_stock_threshold')
                ->value('value') ?? 5);

            $products = DB::table('products')
                ->where('is_active', true)
                ->where('stock', '<=', $threshold)
                ->select('id', 'name', 'sku', 'price', 'stock')
                ->get();

            if ($products->isEmpty()) {
                $this->info('Không có sản phẩm nào cần cảnh báo tồn kho.');
                return self::SUCCESS;
            }

            $fired = 0;
            foreach ($products as $product) {
                $outOfStock = $product->stock <= 0;
                event(new StockLow($product, $product->stock, $threshold, $outOfStock));
                $fired++;
                $this->line("  → [{$product->name}] stock={$product->stock}" . ($outOfStock ? ' (HẾT HÀNG)' : ''));
            }

            $this->info("Đã gửi {$fired} cảnh báo tồn kho.");
            return self::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Lỗi check-low-stock: ' . $e->getMessage());
            return self::FAILURE;
        }
    }
}
