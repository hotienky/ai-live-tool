<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class NewOrderAdminMail extends BaseAdminMail
{
    public function __construct(public readonly object $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "🛒 Đơn hàng mới #{$this->order->order_number} — " . number_format($this->order->total_amount) . 'đ',
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->buildHtml());
    }

    private function buildHtml(): string
    {
        $o          = $this->order;
        $total      = number_format($o->total_amount);
        $orderUrl   = config('app.url') . "/admin/orders/{$o->id}";
        $date       = date('d/m/Y H:i', strtotime($o->created_at ?? 'now'));
        $payMethod  = match ($o->payment_method ?? 'cod') {
            'bank'    => '🏦 Chuyển khoản',
            'momo'    => '💜 MoMo',
            'zalopay' => '💙 ZaloPay',
            default   => '💵 COD',
        };

        $statusBadge = $this->badge('Chờ xác nhận', '#f59e0b');

        $body = <<<HTML
        <p style="margin:0 0 20px;font-size:15px;color:#334155">
          Bạn vừa nhận được một đơn hàng mới. Vui lòng xác nhận sớm để đảm bảo trải nghiệm khách hàng tốt nhất.
        </p>

        <!-- Order summary card -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:20px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
            <div>
              <span style="font-size:13px;color:#64748b">Mã đơn hàng</span><br>
              <span style="font-size:20px;font-weight:800;color:#6366f1">#{$o->order_number}</span>
            </div>
            <div style="text-align:right">
              {$statusBadge}
            </div>
          </div>
          <table style="width:100%;border-collapse:collapse">
            {$this->row('Khách hàng', htmlspecialchars($o->customer_name))}
            {$this->row('Điện thoại', htmlspecialchars($o->customer_phone ?? ''))}
            {$this->row('Địa chỉ', htmlspecialchars($o->customer_address ?? ''), 'color:#334155;font-weight:400')}
            {$this->row('Thanh toán', $payMethod)}
            {$this->row('Thời gian', $date)}
          </table>
        </div>

        <!-- Total -->
        <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:10px;padding:20px;text-align:center;margin-bottom:20px">
          <p style="margin:0;color:rgba(255,255,255,0.8);font-size:13px">Tổng giá trị đơn hàng</p>
          <p style="margin:6px 0 0;font-size:32px;font-weight:800;color:#fff">{$total}đ</p>
        </div>

        {$this->btn($orderUrl, '👉 Xem và xác nhận đơn hàng')}
        HTML;

        return $this->wrapHtml(
            '#6366f1,#8b5cf6',
            '🛒',
            'Đơn hàng mới!',
            "Đơn #{$o->order_number} — {$o->customer_name}",
            $body,
        );
    }
}
