<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class PlanExpiringMail extends BaseAdminMail
{
    public function __construct(
        public readonly string  $tenantName,
        public readonly int     $daysLeft,
        public readonly ?string $expiresAt,
    ) {}

    public function envelope(): Envelope
    {
        $urgency = match(true) {
            $this->daysLeft <= 1 => '🚨 Khẩn cấp',
            $this->daysLeft <= 3 => '⚠️ Gấp',
            default              => '📅 Nhắc nhở',
        };

        return new Envelope(
            subject: "{$urgency}: Gói dịch vụ hết hạn sau {$this->daysLeft} ngày — {$this->tenantName}",
        );
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->buildHtml());
    }

    private function buildHtml(): string
    {
        $renewUrl = config('app.url') . '/subscription/renew';

        [$accentColor, $alertBg, $alertBorder, $alertText, $icon] = match(true) {
            $this->daysLeft <= 1 => ['#ef4444,#dc2626', '#fef2f2', '#fecaca', '#dc2626', '🚨'],
            $this->daysLeft <= 3 => ['#f97316,#ea580c', '#fff7ed', '#fed7aa', '#c2410c', '⚠️'],
            default              => ['#6366f1,#8b5cf6', '#eff6ff', '#bfdbfe', '#1d4ed8', '📅'],
        };

        $daysText = $this->daysLeft === 1 ? 'còn 1 ngày' : "còn {$this->daysLeft} ngày";
        $expiresText = $this->expiresAt
            ? date('d/m/Y', strtotime($this->expiresAt))
            : 'Sắp tới';

        $urgencyNote = match(true) {
            $this->daysLeft <= 1 => 'Gói dịch vụ của bạn sẽ hết hạn trong vòng <strong>24 giờ tới</strong>. Sau khi hết hạn, một số tính năng sẽ bị giới hạn.',
            $this->daysLeft <= 3 => 'Gói dịch vụ của bạn sắp hết hạn. Hãy gia hạn ngay để tránh gián đoạn hoạt động kinh doanh.',
            default              => 'Đây là thông báo nhắc nhở. Bạn còn thời gian gia hạn, nhưng hãy chuẩn bị sớm để không bị gián đoạn.',
        };

        $body = <<<HTML
        <p style="margin:0 0 20px;font-size:15px;color:#334155">{$urgencyNote}</p>

        <!-- Countdown box -->
        <div style="background:{$alertBg};border:1px solid {$alertBorder};border-radius:12px;padding:24px;margin-bottom:20px;text-align:center">
          <p style="margin:0;font-size:13px;color:{$alertText}">Thời gian còn lại</p>
          <p style="margin:8px 0;font-size:48px;font-weight:900;color:{$alertText}">{$this->daysLeft}</p>
          <p style="margin:0;font-size:16px;font-weight:600;color:{$alertText}">ngày</p>
        </div>

        <!-- Details -->
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:20px">
          <table style="width:100%;border-collapse:collapse">
            {$this->row('Tên shop', htmlspecialchars($this->tenantName))}
            {$this->row('Ngày hết hạn', $expiresText)}
            {$this->row('Trạng thái', $this->badge($daysText, $alertText))}
          </table>
        </div>

        <!-- Benefits reminder -->
        <div style="margin-bottom:20px">
          <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#334155">Gia hạn để tiếp tục sử dụng:</p>
          <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#64748b;line-height:2">
            <li>✅ Quản lý sản phẩm & đơn hàng không giới hạn</li>
            <li>✅ Storefront & tên miền tùy chỉnh</li>
            <li>✅ Báo cáo & phân tích doanh thu</li>
            <li>✅ Hỗ trợ kỹ thuật ưu tiên</li>
          </ul>
        </div>

        {$this->btn($renewUrl, '🔄 Gia hạn ngay', $alertText)}
        HTML;

        return $this->wrapHtml(
            $accentColor,
            $icon,
            "Gói dịch vụ hết hạn sau {$this->daysLeft} ngày",
            htmlspecialchars($this->tenantName),
            $body,
        );
    }
}
