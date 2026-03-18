<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Hóa đơn {{ $invoice->invoice_number }}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 12px; color: #1f2937;
            padding: 32px;
        }
        .invoice-header {
            display: flex; justify-content: space-between; align-items: flex-start;
            border-bottom: 2px solid #111827; padding-bottom: 20px; margin-bottom: 24px;
        }
        .invoice-header h1 { font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
        .invoice-number { font-size: 14px; color: #6b7280; margin-top: 4px; }
        .invoice-meta { text-align: right; }
        .invoice-meta div { margin-bottom: 4px; font-size: 12px; }
        .invoice-meta .label { color: #6b7280; }

        .parties { display: flex; justify-content: space-between; margin-bottom: 28px; gap: 40px; }
        .party { flex: 1; }
        .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 8px; font-weight: 700; }
        .party p { font-size: 13px; margin-bottom: 3px; }
        .party p strong { font-weight: 700; }

        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        thead tr { background: #111827; color: #fff; }
        th { padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
        th.right { text-align: right; }
        td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; font-size: 12px; }
        td.right { text-align: right; }
        tbody tr:nth-child(even) { background: #f9fafb; }

        .totals { margin-left: auto; width: 300px; }
        .totals-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
        .totals-row.grand { font-size: 16px; font-weight: 900; border-top: 2px solid #111827; padding-top: 12px; margin-top: 8px; }
        .totals-row .label { color: #6b7280; }
        .totals-row .discount { color: #16a34a; }
        .totals-row .tax { color: #7c3aed; }

        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
        .notes { margin-top: 24px; padding: 14px; background: #f3f4f6; border-radius: 6px; font-size: 12px; }
        .notes strong { display: block; margin-bottom: 4px; }
        .status { display: inline-block; padding: 4px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; }
        .status-issued { background: #dbeafe; color: #2563eb; }
        .status-paid { background: #dcfce7; color: #16a34a; }
        .status-cancelled { background: #fee2e2; color: #dc2626; }
        .status-draft { background: #f3f4f6; color: #6b7280; }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div>
            <h1>HÓA ĐƠN</h1>
            <div class="invoice-number">#{{ $invoice->invoice_number }}</div>
        </div>
        <div class="invoice-meta">
            <div><span class="label">Ngày xuất:</span> {{ $invoice->issued_at ? $invoice->issued_at->format('d/m/Y') : now()->format('d/m/Y') }}</div>
            @if($invoice->due_date)
            <div><span class="label">Hạn TT:</span> {{ $invoice->due_date->format('d/m/Y') }}</div>
            @endif
            <div>
                <span class="status status-{{ $invoice->status }}">
                    {{ ['draft' => 'Nháp', 'issued' => 'Đã xuất', 'paid' => 'Đã TT', 'cancelled' => 'Huỷ'][$invoice->status] ?? $invoice->status }}
                </span>
            </div>
        </div>
    </div>

    <div class="parties">
        <div class="party">
            <h3>Khách hàng</h3>
            <p><strong>{{ $invoice->customer_name }}</strong></p>
            @if($invoice->customer_phone)<p>SĐT: {{ $invoice->customer_phone }}</p>@endif
            @if($invoice->customer_email)<p>Email: {{ $invoice->customer_email }}</p>@endif
            @if($invoice->customer_address)<p>{{ $invoice->customer_address }}</p>@endif
        </div>
        @if(isset($storeInfo))
        <div class="party" style="text-align: right;">
            <h3>Người bán</h3>
            <p><strong>{{ $storeInfo['name'] ?? '' }}</strong></p>
            @if(isset($storeInfo['phone']))<p>SĐT: {{ $storeInfo['phone'] }}</p>@endif
            @if(isset($storeInfo['email']))<p>{{ $storeInfo['email'] }}</p>@endif
            @if(isset($storeInfo['address']))<p>{{ $storeInfo['address'] }}</p>@endif
        </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Sản phẩm</th>
                <th class="right">Đơn giá</th>
                <th class="right">SL</th>
                <th class="right">Thành tiền</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $i => $item)
            <tr>
                <td>{{ $i + 1 }}</td>
                <td>{{ $item['name'] ?? '—' }}</td>
                <td class="right">{{ number_format($item['price'] ?? 0, 0, ',', '.') }}đ</td>
                <td class="right">{{ $item['qty'] ?? 1 }}</td>
                <td class="right">{{ number_format(($item['price'] ?? 0) * ($item['qty'] ?? 1), 0, ',', '.') }}đ</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <div class="totals-row">
            <span class="label">Tạm tính:</span>
            <span>{{ number_format($invoice->subtotal, 0, ',', '.') }}đ</span>
        </div>
        @if($invoice->discount_amount > 0)
        <div class="totals-row">
            <span class="label">Giảm giá:</span>
            <span class="discount">-{{ number_format($invoice->discount_amount, 0, ',', '.') }}đ</span>
        </div>
        @endif
        @if($invoice->shipping_fee > 0)
        <div class="totals-row">
            <span class="label">Phí giao hàng:</span>
            <span>{{ number_format($invoice->shipping_fee, 0, ',', '.') }}đ</span>
        </div>
        @endif
        @if($invoice->tax_amount > 0)
        <div class="totals-row">
            <span class="label">Thuế{{ $invoice->tax_details ? ' (' . implode(', ', array_column($invoice->tax_details, 'name')) . ')' : '' }}:</span>
            <span class="tax">{{ number_format($invoice->tax_amount, 0, ',', '.') }}đ</span>
        </div>
        @endif
        <div class="totals-row grand">
            <span>TỔNG CỘNG:</span>
            <span>{{ number_format($invoice->total_amount, 0, ',', '.') }}đ</span>
        </div>
    </div>

    @if($invoice->notes)
    <div class="notes">
        <strong>Ghi chú:</strong>
        {{ $invoice->notes }}
    </div>
    @endif

    <div class="footer">
        Cảm ơn quý khách! · Xuất lúc {{ now()->format('d/m/Y H:i') }}
    </div>
</body>
</html>
