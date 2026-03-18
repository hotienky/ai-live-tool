<?php

namespace App\Mail;

use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceMail extends Mailable
{
    use Queueable, SerializesModels;

    public Invoice $invoice;
    public string $footerText = 'Cảm ơn quý khách!';

    public function __construct(Invoice $invoice)
    {
        $this->invoice = $invoice;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Hoá đơn ' . $this->invoice->invoice_number,
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: $this->buildHtml(),
        );
    }

    private function buildHtml(): string
    {
        $inv = $this->invoice;
        $items = is_array($inv->items) ? $inv->items : [];

        $itemsHtml = '';
        foreach ($items as $i => $item) {
            $price = number_format($item['price'] ?? 0, 0, ',', '.');
            $qty = $item['qty'] ?? 1;
            $subtotal = number_format(($item['price'] ?? 0) * $qty, 0, ',', '.');
            $itemsHtml .= "<tr>
                <td style=\"padding:8px 12px;border-bottom:1px solid #eee;font-size:13px\">" . ($i + 1) . "</td>
                <td style=\"padding:8px 12px;border-bottom:1px solid #eee;font-size:13px\">{$item['name']}</td>
                <td style=\"padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:center\">{$qty}</td>
                <td style=\"padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right\">{$price}đ</td>
                <td style=\"padding:8px 12px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:600\">{$subtotal}đ</td>
            </tr>";
        }

        $totalsHtml = '';
        if ($inv->subtotal > 0) {
            $totalsHtml .= '<div style="margin-bottom:4px"><span style="color:#666">Tạm tính:</span> <span style="font-weight:600">' . number_format((float) $inv->subtotal, 0, ',', '.') . 'đ</span></div>';
        }
        if ($inv->discount_amount > 0) {
            $totalsHtml .= '<div style="margin-bottom:4px"><span style="color:#666">Giảm giá:</span> <span style="font-weight:600;color:#16a34a">-' . number_format((float) $inv->discount_amount, 0, ',', '.') . 'đ</span></div>';
        }
        if ($inv->shipping_fee > 0) {
            $totalsHtml .= '<div style="margin-bottom:4px"><span style="color:#666">Phí VC:</span> <span style="font-weight:600">' . number_format((float) $inv->shipping_fee, 0, ',', '.') . 'đ</span></div>';
        }
        if ($inv->tax_amount > 0) {
            $taxLabel = 'Thuế';
            if (!empty($inv->tax_details)) {
                $names = array_column($inv->tax_details, 'name');
                $taxLabel .= ' (' . implode(', ', $names) . ')';
            }
            $totalsHtml .= '<div style="margin-bottom:4px"><span style="color:#666">' . $taxLabel . ':</span> <span style="font-weight:600;color:#7c3aed">' . number_format((float) $inv->tax_amount, 0, ',', '.') . 'đ</span></div>';
        }
        $total = number_format((float) $inv->total_amount, 0, ',', '.');
        $totalsHtml .= '<div style="margin-top:8px;padding-top:8px;border-top:2px solid #111"><span style="font-weight:700">TỔNG CỘNG:</span> <span style="font-size:20px;font-weight:800;color:#7c3aed">' . $total . 'đ</span></div>';

        $issuedDate = $inv->issued_at ? $inv->issued_at->format('d/m/Y') : date('d/m/Y');

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
            <div style="max-width:600px;margin:0 auto;background:#fff">
                <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:28px;text-align:center">
                    <h1 style="margin:0;color:#fff;font-size:22px">📄 HÓA ĐƠN</h1>
                    <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px">{$inv->invoice_number}</p>
                </div>

                <div style="padding:24px">
                    <div style="margin-bottom:20px;font-size:14px">
                        <p style="margin:0"><strong>Khách hàng:</strong> {$inv->customer_name}</p>
                        <p style="margin:4px 0 0;color:#666">SĐT: {$inv->customer_phone}</p>
                        <p style="margin:4px 0 0;color:#666">Ngày xuất: {$issuedDate}</p>
                    </div>

                    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                        <thead>
                            <tr style="background:#f8f8f8">
                                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666">#</th>
                                <th style="padding:8px 12px;text-align:left;font-size:12px;color:#666">Sản phẩm</th>
                                <th style="padding:8px 12px;text-align:center;font-size:12px;color:#666">SL</th>
                                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666">Đơn giá</th>
                                <th style="padding:8px 12px;text-align:right;font-size:12px;color:#666">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>{$itemsHtml}</tbody>
                    </table>

                    <div style="text-align:right;padding:16px;background:#fafafa;border-radius:10px;font-size:14px">
                        {$totalsHtml}
                    </div>

                    <p style="margin:20px 0 0;font-size:12px;color:#999;text-align:center">
                        Đây là hoá đơn điện tử. {$this->footerText}
                    </p>
                </div>
            </div>
        </body>
        </html>
        HTML;
    }
}
