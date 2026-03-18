<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntry;
use App\Services\AccountingService;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use Illuminate\Http\Request;

class AccountingController extends Controller
{
    use ApiResponse, LogsActivity;

    public function __construct(
        private AccountingService $accountingService,
        private SystemConfigRepositoryInterface $configRepo,
    ) {}

    /**
     * Financial summary (cards: revenue, expenses, profit, tax)
     */
    public function summary(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');
        return $this->successResponse($this->accountingService->getSummary($from, $to));
    }

    /**
     * Monthly breakdown for charts
     */
    public function monthly(Request $request)
    {
        $year = $request->input('year', date('Y'));
        return $this->successResponse($this->accountingService->getMonthlyBreakdown((int) $year));
    }

    /**
     * Tax report by month
     */
    public function taxReport(Request $request)
    {
        $year = $request->input('year', date('Y'));
        return $this->successResponse($this->accountingService->getTaxReport((int) $year));
    }

    /**
     * List accounting entries
     */
    public function index(Request $request)
    {
        $query = AccountingEntry::query()->orderByDesc('entry_date')->orderByDesc('id');

        if ($type = $request->input('type')) $query->where('type', $type);
        if ($cat = $request->input('category')) $query->where('category', $cat);
        if ($from = $request->input('from')) $query->where('entry_date', '>=', $from);
        if ($to = $request->input('to')) $query->where('entry_date', '<=', $to);

        $perPage = min($request->input('per_page', 20), 100);
        $paginated = $query->paginate($perPage);

        return $this->successResponse([
            'items' => $paginated->items(),
            'pagination' => [
                'total' => $paginated->total(),
                'per_page' => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Create a manual accounting entry
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:revenue,expense,adjustment',
            'category' => 'required|string|max:100',
            'amount' => 'required|numeric',
            'tax_amount' => 'nullable|numeric',
            'description' => 'nullable|string',
            'entry_date' => 'required|date',
        ]);

        $data['created_by'] = $request->user()?->id;
        $entry = AccountingEntry::create($data);
        $this->logActivity('accounting.created', 'accounting_entry', $entry->id);
        return $this->successResponse($entry, 'Đã tạo bút toán', 201);
    }

    /**
     * Update an accounting entry
     */
    public function update(Request $request, $id)
    {
        $entry = AccountingEntry::findOrFail($id);
        $data = $request->validate([
            'type' => 'sometimes|in:revenue,expense,adjustment',
            'category' => 'sometimes|string|max:100',
            'amount' => 'sometimes|numeric',
            'tax_amount' => 'nullable|numeric',
            'description' => 'nullable|string',
            'entry_date' => 'sometimes|date',
        ]);

        $entry->update($data);
        $this->logActivity('accounting.updated', 'accounting_entry', $id);
        return $this->successResponse($entry, 'Đã cập nhật');
    }

    /**
     * Delete an accounting entry
     */
    public function destroy($id)
    {
        AccountingEntry::findOrFail($id)->delete();
        $this->logActivity('accounting.deleted', 'accounting_entry', $id);
        return $this->successResponse(null, 'Đã xoá');
    }

    /**
     * Export accounting entries as CSV
     */
    public function exportEntries(Request $request)
    {
        $query = AccountingEntry::query()->orderByDesc('entry_date');
        if ($type = $request->input('type')) $query->where('type', $type);
        if ($from = $request->input('from')) $query->where('entry_date', '>=', $from);
        if ($to = $request->input('to')) $query->where('entry_date', '<=', $to);

        $entries = $query->get();
        $csv = "\xEF\xBB\xBF"; // UTF-8 BOM for Excel
        $csv .= "Ngày,Loại,Danh mục,Mô tả,Số tiền,Thuế,Tham chiếu\n";

        foreach ($entries as $e) {
            $csv .= implode(',', [
                $e->entry_date->format('d/m/Y'),
                $e->type,
                '"' . str_replace('"', '""', $e->category) . '"',
                '"' . str_replace('"', '""', $e->description ?? '') . '"',
                $e->amount,
                $e->tax_amount,
                $e->reference_type ? "{$e->reference_type}#{$e->reference_id}" : '',
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="accounting_entries_' . date('Y-m-d') . '.csv"');
    }

    /**
     * Export tax report as CSV
     */
    public function exportTaxReport(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $report = $this->accountingService->getTaxReport((int) $year);

        $csv = "\xEF\xBB\xBF"; // UTF-8 BOM
        $csv .= "Tháng,Doanh thu,Thuế thu,Thuế hoàn,Thuế phải nộp,Đơn hàng,Hoàn trả\n";

        foreach ($report as $r) {
            $csv .= implode(',', [
                "Tháng {$r['month']}",
                $r['total_sales'],
                $r['tax_collected'],
                $r['tax_refunded'],
                $r['tax_payable'],
                $r['order_count'],
                $r['refund_count'],
            ]) . "\n";
        }

        return response($csv)
            ->header('Content-Type', 'text/csv; charset=UTF-8')
            ->header('Content-Disposition', 'attachment; filename="tax_report_' . $year . '.csv"');
    }

    /* ─── Accounting Config ─── */

    private static array $DEFAULTS = [
        'auto_email' => 'true',
        'invoice_prefix' => 'INV',
        'payment_terms' => '0',       // 0 = no due date, 7/14/30 days
        'tax_label' => 'VAT',
        'footer_text' => 'Cảm ơn quý khách!',
        'custom_categories' => '[]',  // JSON array of {key, label}
        'seller_name' => '',
        'seller_phone' => '',
        'seller_email' => '',
        'seller_address' => '',
        'seller_tax_id' => '',
    ];

    public function getConfig()
    {
        $configs = $this->configRepo->getByGroup('accounting');
        $result = self::$DEFAULTS;
        foreach ($configs as $c) {
            if (array_key_exists($c->key, $result)) {
                $result[$c->key] = $c->value;
            }
        }
        return $this->successResponse($result);
    }

    public function updateConfig(Request $request)
    {
        $data = $request->validate([
            'auto_email' => 'sometimes|string|in:true,false',
            'invoice_prefix' => 'sometimes|string|max:20',
            'payment_terms' => 'sometimes|string|in:0,7,14,30',
            'tax_label' => 'sometimes|string|max:50',
            'footer_text' => 'sometimes|string|max:500',
            'custom_categories' => 'sometimes|string',
            'seller_name' => 'sometimes|string|max:255',
            'seller_phone' => 'sometimes|string|max:30',
            'seller_email' => 'sometimes|nullable|string|max:255',
            'seller_address' => 'sometimes|string|max:500',
            'seller_tax_id' => 'sometimes|string|max:50',
        ]);

        $items = [];
        foreach ($data as $key => $value) {
            $items[] = ['key' => $key, 'value' => $value];
        }
        $this->configRepo->updateGroup('accounting', $items);

        $this->logActivity('accounting_config.updated', 'accounting_config', null);
        return $this->successResponse(null, 'Đã cập nhật cấu hình kế toán');
    }
}
