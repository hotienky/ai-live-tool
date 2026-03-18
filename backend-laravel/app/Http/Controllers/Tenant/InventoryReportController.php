<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntry;
use App\Models\Product;
use App\Models\StockReceipt;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryReportController extends Controller
{
    use ApiResponse;

    /**
     * Inventory Stock Report — current status of all products
     */
    public function stockReport(Request $request)
    {
        $query = Product::where('is_active', true)->orderBy('name');

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        if ($category = $request->input('category_id')) {
            $query->where('category_id', $category);
        }

        if ($request->input('low_stock')) {
            $query->whereColumn('stock', '<=', DB::raw('COALESCE(min_stock, 5)'));
        }

        $products = $query->get()->map(function ($p) {
            $stockValue = ($p->cost_price ?? 0) * $p->stock;
            $sellValue = $p->price * $p->stock;
            return [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'category_id' => $p->category_id,
                'stock' => $p->stock,
                'min_stock' => $p->min_stock ?? 5,
                'cost_price' => $p->cost_price ?? 0,
                'price' => $p->price,
                'stock_value' => round($stockValue, 2),
                'sell_value' => round($sellValue, 2),
                'is_low' => $p->stock <= ($p->min_stock ?? 5),
                'is_out' => $p->stock <= 0,
            ];
        });

        $summary = [
            'total_products' => $products->count(),
            'total_stock' => $products->sum('stock'),
            'total_stock_value' => round($products->sum('stock_value'), 2),
            'total_sell_value' => round($products->sum('sell_value'), 2),
            'low_stock_count' => $products->where('is_low', true)->count(),
            'out_of_stock' => $products->where('is_out', true)->count(),
        ];

        return $this->successResponse([
            'products' => $products->values(),
            'summary' => $summary,
        ]);
    }

    /**
     * Xuất Nhập Tồn Report — stock movement for a period
     * Beginning stock + Imports - Exports = Ending stock
     */
    public function movementReport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());

        // Get all confirmed stock receipts in period
        $receipts = StockReceipt::where('status', 'confirmed')
            ->whereNotNull('confirmed_at')
            ->whereBetween('confirmed_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
            ->get();

        // Build per-product movement
        $movements = [];

        foreach ($receipts as $receipt) {
            $items = $receipt->items;
            if (!is_array($items)) continue;

            foreach ($items as $item) {
                $pid = $item['product_id'] ?? null;
                if (!$pid) continue;

                if (!isset($movements[$pid])) {
                    $movements[$pid] = [
                        'product_id' => $pid,
                        'product_name' => $item['product_name'] ?? '',
                        'sku' => $item['sku'] ?? '',
                        'import_qty' => 0,
                        'import_value' => 0,
                        'export_qty' => 0,
                        'export_value' => 0,
                    ];
                }

                $qty = $item['qty'] ?? 0;
                $value = $qty * ($item['unit_price'] ?? 0);

                if (in_array($receipt->type, ['import', 'return'])) {
                    $movements[$pid]['import_qty'] += $qty;
                    $movements[$pid]['import_value'] += $value;
                } else {
                    $movements[$pid]['export_qty'] += $qty;
                    $movements[$pid]['export_value'] += $value;
                }
            }
        }

        // Get current stock and calculate beginning stock
        $productIds = array_keys($movements);
        $products = Product::whereIn('id', $productIds)->get()->keyBy('id');

        $report = [];
        foreach ($movements as $pid => $mov) {
            $product = $products[$pid] ?? null;
            $currentStock = $product ? $product->stock : 0;
            // Beginning = Current - imports + exports (reverse the movements)
            $beginStock = $currentStock - $mov['import_qty'] + $mov['export_qty'];

            $report[] = array_merge($mov, [
                'begin_stock' => max(0, $beginStock),
                'end_stock' => $currentStock,
                'cost_price' => $product ? ($product->cost_price ?? 0) : 0,
            ]);
        }

        // Sort by product name
        usort($report, fn($a, $b) => strcmp($a['product_name'], $b['product_name']));

        $summary = [
            'period' => ['from' => $from, 'to' => $to],
            'total_import_qty' => array_sum(array_column($report, 'import_qty')),
            'total_import_value' => round(array_sum(array_column($report, 'import_value')), 2),
            'total_export_qty' => array_sum(array_column($report, 'export_qty')),
            'total_export_value' => round(array_sum(array_column($report, 'export_value')), 2),
            'products_moved' => count($report),
        ];

        return $this->successResponse([
            'items' => $report,
            'summary' => $summary,
        ]);
    }

    /**
     * COGS Report — cost of goods sold breakdown
     */
    public function cogsReport(Request $request)
    {
        $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
        $to = $request->input('to', Carbon::now()->toDateString());

        // COGS entries from accounting
        $cogsEntries = AccountingEntry::where('category', 'cogs')
            ->whereBetween('entry_date', [$from, $to])
            ->orderByDesc('entry_date')
            ->get();

        $totalCogs = $cogsEntries->sum('amount');

        // Revenue in same period
        $revenue = AccountingEntry::where('type', 'revenue')
            ->whereBetween('entry_date', [$from, $to])
            ->sum('amount');

        // Gross profit
        $grossProfit = $revenue - $totalCogs;
        $grossMargin = $revenue > 0 ? round(($grossProfit / $revenue) * 100, 1) : 0;

        return $this->successResponse([
            'entries' => $cogsEntries,
            'summary' => [
                'period' => ['from' => $from, 'to' => $to],
                'total_cogs' => round($totalCogs, 2),
                'total_revenue' => round($revenue, 2),
                'gross_profit' => round($grossProfit, 2),
                'gross_margin' => $grossMargin,
            ],
        ]);
    }

    /**
     * Low stock alerts
     */
    public function lowStockAlerts()
    {
        $products = Product::where('is_active', true)
            ->whereColumn('stock', '<=', DB::raw('COALESCE(min_stock, 5)'))
            ->orderBy('stock')
            ->get(['id', 'name', 'sku', 'stock', 'min_stock', 'price', 'cost_price']);

        return $this->successResponse([
            'alerts' => $products->map(fn($p) => [
                'id' => $p->id,
                'name' => $p->name,
                'sku' => $p->sku,
                'stock' => $p->stock,
                'min_stock' => $p->min_stock ?? 5,
                'is_out' => $p->stock <= 0,
            ]),
            'total' => $products->count(),
            'out_of_stock' => $products->where('stock', '<=', 0)->count(),
        ]);
    }

    /**
     * Export CSV — stock report or movement report
     */
    public function exportCsv(Request $request)
    {
        $type = $request->input('type', 'stock');

        if ($type === 'movement') {
            $from = $request->input('from', Carbon::now()->startOfMonth()->toDateString());
            $to = $request->input('to', Carbon::now()->toDateString());

            $receipts = StockReceipt::where('status', 'confirmed')
                ->whereNotNull('confirmed_at')
                ->whereBetween('confirmed_at', [$from . ' 00:00:00', $to . ' 23:59:59'])
                ->get();

            $movements = [];
            foreach ($receipts as $receipt) {
                $items = $receipt->items;
                if (!is_array($items)) continue;
                foreach ($items as $item) {
                    $pid = $item['product_id'] ?? null;
                    if (!$pid) continue;
                    if (!isset($movements[$pid])) {
                        $movements[$pid] = ['name' => $item['product_name'] ?? '', 'sku' => $item['sku'] ?? '', 'import' => 0, 'import_val' => 0, 'export' => 0, 'export_val' => 0];
                    }
                    $qty = $item['qty'] ?? 0;
                    $val = $qty * ($item['unit_price'] ?? 0);
                    if (in_array($receipt->type, ['import', 'return'])) {
                        $movements[$pid]['import'] += $qty;
                        $movements[$pid]['import_val'] += $val;
                    } else {
                        $movements[$pid]['export'] += $qty;
                        $movements[$pid]['export_val'] += $val;
                    }
                }
            }

            $csv = "Sản phẩm,SKU,Nhập (SL),Giá trị nhập,Xuất (SL),Giá trị xuất\n";
            foreach ($movements as $m) {
                $csv .= "\"{$m['name']}\",\"{$m['sku']}\",{$m['import']}," . round($m['import_val']) . ",{$m['export']}," . round($m['export_val']) . "\n";
            }

            return response($csv, 200, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => "attachment; filename=xuat-nhap-ton_{$from}_{$to}.csv",
            ]);
        }

        // Default: stock report
        $products = Product::where('is_active', true)->orderBy('name')->get();
        $csv = "Sản phẩm,SKU,Tồn kho,Tối thiểu,Giá vốn,Giá bán,Giá trị kho,Trạng thái\n";
        foreach ($products as $p) {
            $val = round(($p->cost_price ?? 0) * $p->stock);
            $status = $p->stock <= 0 ? 'Hết hàng' : ($p->stock <= ($p->min_stock ?? 5) ? 'Sắp hết' : 'OK');
            $csv .= "\"{$p->name}\",\"{$p->sku}\",{$p->stock},{$p->min_stock}," . round($p->cost_price ?? 0) . ",{$p->price},{$val},{$status}\n";
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename=ton-kho_' . now()->format('Y-m-d') . '.csv',
        ]);
    }
}
