<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $order;
    public array $items;
    public ?array $bankInfo;

    public function __construct(array $order, array $items, ?array $bankInfo = null)
    {
        $this->order = $order;
        $this->items = $items;
        $this->bankInfo = $bankInfo;
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Xác nhận đơn hàng #' . $this->order['id'],
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
        $order = $this->order;
        $items = $this->items;
        $total = number_format($order['total_amount'] ?? 0, 0, ',', '.');

        $itemsHtml = '';
        foreach ($items as $item) {
            $price = number_format($item['price'] ?? 0, 0, ',', '.');
            $qty = $item['qty'] ?? 1;
            $subtotal = number_format(($item['price'] ?? 0) * $qty, 0, ',', '.');
            $itemsHtml .= <<<HTML
            <tr>
                <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px">{$item['name']}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:center">{$qty}</td>
                <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right">{$price}đ</td>
                <td style="padding:10px 12px;border-bottom:1px solid #eee;font-size:14px;text-align:right;font-weight:600">{$subtotal}đ</td>
            </tr>
            HTML;
        }

        $paymentLabel = ($order['payment_method'] ?? '') === 'bank' ? 'Chuyển khoản ngân hàng' : 'Thanh toán khi nhận hàng (COD)';

        $bankSection = '';
        if ($this->bankInfo) {
            $b = $this->bankInfo;
            $bankSection = <<<HTML
            <div style="margin-top:24px;padding:20px;background:#f0f4ff;border-radius:12px;border:1px solid #c7d2fe">
                <h3 style="margin:0 0 12px;font-size:16px;color:#4338ca">💳 Thông tin chuyển khoản</h3>
                <table style="width:100%;font-size:14px">
                    <tr><td style="padding:4px 0;color:#666;width:140px">Ngân hàng:</td><td style="font-weight:600">{$b['bank_name']}</td></tr>
                    <tr><td style="padding:4px 0;color:#666">Chủ tài khoản:</td><td style="font-weight:600">{$b['account_name']}</td></tr>
                    <tr><td style="padding:4px 0;color:#666">Số tài khoản:</td><td style="font-weight:600;color:#4338ca">{$b['account_number']}</td></tr>
                    <tr><td style="padding:4px 0;color:#666">Số tiền:</td><td style="font-weight:700;color:#dc2626">{$total}đ</td></tr>
                    <tr><td style="padding:4px 0;color:#666">Nội dung CK:</td><td style="font-weight:600">{$b['note']}</td></tr>
                </table>
            </div>
            HTML;
        }

        $date = date('d/m/Y H:i', strtotime($order['created_at'] ?? 'now'));

        return <<<HTML
        <!DOCTYPE html>
        <html>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f5">
            <div style="max-width:600px;margin:0 auto;background:#fff">
                <!-- Header -->
                <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:32px;text-align:center">
                    <h1 style="margin:0;color:#fff;font-size:24px">✅ Đặt hàng thành công!</h1>
                    <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Cảm ơn bạn đã mua hàng</p>
                </div>

                <div style="padding:28px">
                    <!-- Order Info -->
                    <div style="display:flex;justify-content:space-between;margin-bottom:24px">
                        <div>
                            <p style="margin:0;font-size:13px;color:#888">Mã đơn hàng</p>
                            <p style="margin:4px 0 0;font-size:20px;font-weight:800;color:#7c3aed">#{$order['id']}</p>
                        </div>
                        <div style="text-align:right">
                            <p style="margin:0;font-size:13px;color:#888">Ngày đặt</p>
                            <p style="margin:4px 0 0;font-size:14px;font-weight:600">{$date}</p>
                        </div>
                    </div>

                    <!-- Customer Info -->
                    <div style="padding:16px;background:#fafafa;border-radius:10px;margin-bottom:24px;font-size:14px">
                        <p style="margin:0"><strong>👤 {$order['customer_name']}</strong></p>
                        <p style="margin:4px 0 0;color:#666">📞 {$order['customer_phone']}</p>
                        <p style="margin:4px 0 0;color:#666">📍 {$order['customer_address']}</p>
                        <p style="margin:8px 0 0;color:#666">💳 {$paymentLabel}</p>
                    </div>

                    <!-- Items -->
                    <h3 style="margin:0 0 12px;font-size:16px">📦 Chi tiết đơn hàng</h3>
                    <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
                        <thead>
                            <tr style="background:#f8f8f8">
                                <th style="padding:10px 12px;text-align:left;font-size:13px;color:#666;font-weight:600">Sản phẩm</th>
                                <th style="padding:10px 12px;text-align:center;font-size:13px;color:#666;font-weight:600">SL</th>
                                <th style="padding:10px 12px;text-align:right;font-size:13px;color:#666;font-weight:600">Đơn giá</th>
                                <th style="padding:10px 12px;text-align:right;font-size:13px;color:#666;font-weight:600">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>{$itemsHtml}</tbody>
                    </table>

                    <!-- Totals Breakdown -->
                    <div style="text-align:right;padding:16px;background:#fafafa;border-radius:10px">
                        {$this->buildTotalsHtml()}
                    </div>

                    {$bankSection}

                    <!-- Footer Note -->
                    <p style="margin:24px 0 0;font-size:13px;color:#888;text-align:center;line-height:1.6">
                        Nếu bạn có câu hỏi, vui lòng liên hệ với chúng tôi.<br>
                        Cảm ơn bạn đã tin tưởng và mua hàng!
                    </p>
                </div>
            </div>
        </body>
        </html>
        HTML;
    }

    private function buildTotalsHtml(): string
    {
        $order = $this->order;
        $html = '';

        // Subtotal
        $subtotal = $order['subtotal'] ?? null;
        if ($subtotal) {
            $html .= '<div style="margin-bottom:6px"><span style="font-size:14px;color:#666">Tạm tính: </span><span style="font-size:14px;font-weight:600">' . number_format($subtotal, 0, ',', '.') . 'đ</span></div>';
        }

        // Discount
        $discount = $order['discount_amount'] ?? 0;
        if ($discount > 0) {
            $html .= '<div style="margin-bottom:6px"><span style="font-size:14px;color:#666">Giảm giá: </span><span style="font-size:14px;font-weight:600;color:#16a34a">-' . number_format($discount, 0, ',', '.') . 'đ</span></div>';
        }

        // Shipping
        $shipping = $order['shipping_fee'] ?? 0;
        if ($shipping > 0) {
            $html .= '<div style="margin-bottom:6px"><span style="font-size:14px;color:#666">Phí giao hàng: </span><span style="font-size:14px;font-weight:600">' . number_format($shipping, 0, ',', '.') . 'đ</span></div>';
        }

        // Tax
        $tax = $order['tax_amount'] ?? 0;
        if ($tax > 0) {
            $taxLabel = 'Thuế';
            $taxDetails = $order['tax_details'] ?? [];
            if (is_string($taxDetails)) {
                $taxDetails = json_decode($taxDetails, true) ?: [];
            }
            if (!empty($taxDetails)) {
                $names = array_column($taxDetails, 'name');
                $taxLabel .= ' (' . implode(', ', $names) . ')';
            }
            $html .= '<div style="margin-bottom:6px"><span style="font-size:14px;color:#666">' . $taxLabel . ': </span><span style="font-size:14px;font-weight:600;color:#7c3aed">' . number_format($tax, 0, ',', '.') . 'đ</span></div>';
        }

        // Grand total
        $total = number_format($order['total_amount'] ?? 0, 0, ',', '.');
        $html .= '<div style="margin-top:8px;padding-top:10px;border-top:1px solid #e5e7eb"><span style="font-size:14px;color:#666">Tổng thanh toán: </span><span style="font-size:22px;font-weight:800;color:#7c3aed">' . $total . 'đ</span></div>';

        return $html;
    }
}
