<?php

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Models\AccountingEntry;
use App\Services\AccountingService;
use App\Traits\ApiResponse;
use App\Traits\LogsActivity;
use App\Repositories\SystemConfig\SystemConfigRepositoryInterface;
use Illuminate\Http\Request;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Carbon\Carbon;

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
     * Profit & Loss report
     */
    public function profitLoss(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');
        return $this->successResponse($this->accountingService->getProfitLossReport($from, $to));
    }

    /**
     * Balance Sheet
     */
    public function balanceSheet(Request $request)
    {
        $asOf = $request->input('as_of');
        return $this->successResponse($this->accountingService->getBalanceSheet($asOf));
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

    /* ═══════════════════════════════════════════
     *  EXPORT: CSV (legacy) + Excel (new)
     * ═══════════════════════════════════════════ */

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
                Carbon::parse($e->entry_date)->format('d/m/Y'),
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

    /**
     * Export entries as Excel (.xlsx)
     */
    public function exportEntriesExcel(Request $request)
    {
        $query = AccountingEntry::query()->orderByDesc('entry_date');
        if ($type = $request->input('type')) $query->where('type', $type);
        if ($from = $request->input('from')) $query->where('entry_date', '>=', $from);
        if ($to = $request->input('to')) $query->where('entry_date', '<=', $to);
        $entries = $query->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Sổ thu chi');

        // Header
        $headers = ['Ngày', 'Loại', 'Danh mục', 'Mô tả', 'Số tiền', 'Thuế', 'Tham chiếu'];
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}1", $h);
        }
        $this->styleHeaderRow($sheet, 'A1:G1');

        // Data
        $row = 2;
        $typeLabels = ['revenue' => 'Thu', 'expense' => 'Chi', 'adjustment' => 'Điều chỉnh'];
        foreach ($entries as $e) {
            $sheet->setCellValue("A{$row}", Carbon::parse($e->entry_date)->format('d/m/Y'));
            $sheet->setCellValue("B{$row}", $typeLabels[$e->type] ?? $e->type);
            $sheet->setCellValue("C{$row}", $e->category);
            $sheet->setCellValue("D{$row}", $e->description);
            $sheet->setCellValue("E{$row}", $e->amount);
            $sheet->setCellValue("F{$row}", $e->tax_amount);
            $sheet->setCellValue("G{$row}", $e->reference_type ? "{$e->reference_type}#{$e->reference_id}" : '');
            $row++;
        }

        // Format number columns
        $sheet->getStyle("E2:F{$row}")->getNumberFormat()->setFormatCode('#,##0');

        // Auto width
        foreach (range('A', 'G') as $col) $sheet->getColumnDimension($col)->setAutoSize(true);

        return $this->downloadExcel($spreadsheet, 'so_thu_chi_' . date('Y-m-d'));
    }

    /**
     * Export tax report as Excel (.xlsx)
     */
    public function exportTaxReportExcel(Request $request)
    {
        $year = $request->input('year', date('Y'));
        $report = $this->accountingService->getTaxReport((int) $year);

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle("Báo cáo thuế {$year}");

        $headers = ['Tháng', 'Doanh thu', 'Thuế thu', 'Thuế hoàn', 'Thuế phải nộp', 'Đơn hàng', 'Hoàn trả'];
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet->setCellValue("{$col}1", $h);
        }
        $this->styleHeaderRow($sheet, 'A1:G1');

        $row = 2;
        foreach ($report as $r) {
            $sheet->setCellValue("A{$row}", "Tháng {$r['month']}");
            $sheet->setCellValue("B{$row}", $r['total_sales']);
            $sheet->setCellValue("C{$row}", $r['tax_collected']);
            $sheet->setCellValue("D{$row}", $r['tax_refunded']);
            $sheet->setCellValue("E{$row}", $r['tax_payable']);
            $sheet->setCellValue("F{$row}", $r['order_count']);
            $sheet->setCellValue("G{$row}", $r['refund_count']);
            $row++;
        }

        // Totals row
        $sheet->setCellValue("A{$row}", 'TỔNG');
        for ($c = 1; $c <= 6; $c++) {
            $col = chr(65 + $c);
            $sheet->setCellValue("{$col}{$row}", "=SUM({$col}2:{$col}" . ($row - 1) . ")");
        }
        $sheet->getStyle("A{$row}:G{$row}")->getFont()->setBold(true);
        $sheet->getStyle("B2:E{$row}")->getNumberFormat()->setFormatCode('#,##0');

        foreach (range('A', 'G') as $col) $sheet->getColumnDimension($col)->setAutoSize(true);

        return $this->downloadExcel($spreadsheet, "bao_cao_thue_{$year}");
    }

    /**
     * Export combined accounting report (Summary + Entries + Tax) as Excel
     */
    public function exportCombinedExcel(Request $request)
    {
        $from = $request->input('from');
        $to = $request->input('to');
        $year = $request->input('year', date('Y'));

        $spreadsheet = new Spreadsheet();

        // Sheet 1: Summary
        $sheet1 = $spreadsheet->getActiveSheet();
        $sheet1->setTitle('Tổng quan');
        $summary = $this->accountingService->getSummary($from, $to);
        $summaryData = [
            ['Báo cáo tổng hợp kế toán'],
            ['Kỳ:', ($from ?? 'Đầu kỳ') . ' → ' . ($to ?? 'Hiện tại')],
            [],
            ['Chỉ tiêu', 'Số tiền (VNĐ)'],
            ['Doanh thu', $summary['revenue']],
            ['Chi phí', $summary['expenses']],
            ['Điều chỉnh', $summary['adjustments']],
            ['Lợi nhuận', $summary['profit']],
            [],
            ['Thuế thu', $summary['tax_collected']],
            ['Thuế hoàn', $summary['tax_refunded']],
            ['Thuế phải nộp', $summary['tax_payable']],
        ];
        foreach ($summaryData as $i => $row) {
            foreach ($row as $j => $val) {
                $col = chr(65 + $j);
                $sheet1->setCellValue("{$col}" . ($i + 1), $val);
            }
        }
        $sheet1->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $this->styleHeaderRow($sheet1, 'A4:B4');
        $sheet1->getStyle('B5:B12')->getNumberFormat()->setFormatCode('#,##0');
        $sheet1->getColumnDimension('A')->setWidth(20);
        $sheet1->getColumnDimension('B')->setWidth(20);

        // Sheet 2: Entries
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Sổ thu chi');
        $query = AccountingEntry::query()->orderByDesc('entry_date');
        if ($from) $query->where('entry_date', '>=', $from);
        if ($to) $query->where('entry_date', '<=', $to);
        $entries = $query->get();

        $headers = ['Ngày', 'Loại', 'Danh mục', 'Mô tả', 'Số tiền', 'Thuế', 'Tham chiếu'];
        foreach ($headers as $i => $h) {
            $col = chr(65 + $i);
            $sheet2->setCellValue("{$col}1", $h);
        }
        $this->styleHeaderRow($sheet2, 'A1:G1');
        $typeLabels = ['revenue' => 'Thu', 'expense' => 'Chi', 'adjustment' => 'Điều chỉnh'];
        $row = 2;
        foreach ($entries as $e) {
            $sheet2->setCellValue("A{$row}", Carbon::parse($e->entry_date)->format('d/m/Y'));
            $sheet2->setCellValue("B{$row}", $typeLabels[$e->type] ?? $e->type);
            $sheet2->setCellValue("C{$row}", $e->category);
            $sheet2->setCellValue("D{$row}", $e->description);
            $sheet2->setCellValue("E{$row}", $e->amount);
            $sheet2->setCellValue("F{$row}", $e->tax_amount);
            $sheet2->setCellValue("G{$row}", $e->reference_type ? "{$e->reference_type}#{$e->reference_id}" : '');
            $row++;
        }
        $sheet2->getStyle("E2:F{$row}")->getNumberFormat()->setFormatCode('#,##0');
        foreach (range('A', 'G') as $col) $sheet2->getColumnDimension($col)->setAutoSize(true);

        // Sheet 3: Tax Report
        $sheet3 = $spreadsheet->createSheet();
        $sheet3->setTitle("Thuế {$year}");
        $taxReport = $this->accountingService->getTaxReport((int) $year);
        $taxHeaders = ['Tháng', 'Doanh thu', 'Thuế thu', 'Thuế hoàn', 'Thuế phải nộp', 'Đơn hàng', 'Hoàn trả'];
        foreach ($taxHeaders as $i => $h) {
            $col = chr(65 + $i);
            $sheet3->setCellValue("{$col}1", $h);
        }
        $this->styleHeaderRow($sheet3, 'A1:G1');
        $row = 2;
        foreach ($taxReport as $r) {
            $sheet3->setCellValue("A{$row}", "Tháng {$r['month']}");
            $sheet3->setCellValue("B{$row}", $r['total_sales']);
            $sheet3->setCellValue("C{$row}", $r['tax_collected']);
            $sheet3->setCellValue("D{$row}", $r['tax_refunded']);
            $sheet3->setCellValue("E{$row}", $r['tax_payable']);
            $sheet3->setCellValue("F{$row}", $r['order_count']);
            $sheet3->setCellValue("G{$row}", $r['refund_count']);
            $row++;
        }
        $sheet3->getStyle("B2:E{$row}")->getNumberFormat()->setFormatCode('#,##0');
        foreach (range('A', 'G') as $col) $sheet3->getColumnDimension($col)->setAutoSize(true);

        // Sheet 4: P&L
        $sheet4 = $spreadsheet->createSheet();
        $sheet4->setTitle('Lãi lỗ');
        $pnl = $this->accountingService->getProfitLossReport($from, $to);
        $pnlData = [
            ['BÁO CÁO LÃI LỖ'],
            ['Kỳ:', ($from ?? 'Đầu kỳ') . ' → ' . ($to ?? 'Hiện tại')],
            [],
            ['DOANH THU', '', $pnl['revenue']['total']],
        ];
        foreach ($pnl['revenue']['by_category'] as $cat) {
            $pnlData[] = ['', $cat['category'], $cat['amount']];
        }
        $pnlData[] = [];
        $pnlData[] = ['CHI PHÍ', '', $pnl['expenses']['total']];
        foreach ($pnl['expenses']['by_category'] as $cat) {
            $pnlData[] = ['', $cat['category'], $cat['amount']];
        }
        $pnlData[] = [];
        $pnlData[] = ['ĐIỀU CHỈNH', '', $pnl['adjustments']];
        $pnlData[] = ['THUẾ PHẢI NỘP', '', $pnl['tax_payable']];
        $pnlData[] = [];
        $pnlData[] = ['LỢI NHUẬN GỘP', '', $pnl['gross_profit']];
        $pnlData[] = ['LỢI NHUẬN RÒNG', '', $pnl['net_profit']];
        $pnlData[] = ['BIÊN LỢI NHUẬN', '', $pnl['margin'] . '%'];
        foreach ($pnlData as $i => $row) {
            foreach ($row as $j => $val) {
                $col = chr(65 + $j);
                $sheet4->setCellValue("{$col}" . ($i + 1), $val);
            }
        }
        $sheet4->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet4->getColumnDimension('A')->setWidth(22);
        $sheet4->getColumnDimension('B')->setWidth(20);
        $sheet4->getColumnDimension('C')->setWidth(18);

        $spreadsheet->setActiveSheetIndex(0);

        return $this->downloadExcel($spreadsheet, 'bao_cao_tong_hop_' . date('Y-m-d'));
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

    /* ─── Helpers ─── */

    private function styleHeaderRow($sheet, string $range): void
    {
        $sheet->getStyle($range)->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '1F2937']],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER, 'vertical' => Alignment::VERTICAL_CENTER],
            'borders' => ['allBorders' => ['borderStyle' => Border::BORDER_THIN, 'color' => ['rgb' => '374151']]],
        ]);
    }

    private function downloadExcel(Spreadsheet $spreadsheet, string $filename)
    {
        $temp = tempnam(sys_get_temp_dir(), 'xlsx');
        $writer = new Xlsx($spreadsheet);
        $writer->save($temp);
        $content = file_get_contents($temp);
        unlink($temp);

        return response($content)
            ->header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            ->header('Content-Disposition', "attachment; filename=\"{$filename}.xlsx\"")
            ->header('Cache-Control', 'max-age=0');
    }
}
