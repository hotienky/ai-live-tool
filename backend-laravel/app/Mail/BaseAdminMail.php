<?php

namespace App\Mail;

use App\Services\Notification\NotificationMailService;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

abstract class BaseAdminMail extends Mailable
{
    use Queueable, SerializesModels;

    public $queue = 'notifications';

    // ─── HTML layout helpers ─────────────────────────────────────

    protected function wrapHtml(string $accentColor, string $headerIcon, string $headerTitle, string $headerSub, string $body): string
    {
        $shop = NotificationMailService::getShopInfo();
        $shopName = htmlspecialchars($shop['name']);
        $year = date('Y');

        return <<<HTML
        <!DOCTYPE html>
        <html lang="vi">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9">
        <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;margin-top:24px;margin-bottom:24px;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

          <!-- Header -->
          <div style="background:linear-gradient(135deg,{$accentColor});padding:32px;text-align:center">
            <div style="font-size:40px;margin-bottom:10px">{$headerIcon}</div>
            <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800">{$headerTitle}</h1>
            <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">{$headerSub}</p>
          </div>

          <!-- Body -->
          <div style="padding:28px 32px">
            {$body}
          </div>

          <!-- Footer -->
          <div style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
            <p style="margin:0;font-size:12px;color:#94a3b8">
              Email này được gửi tự động từ hệ thống <strong>{$shopName}</strong>.<br>
              © {$year} {$shopName}. Vui lòng không trả lời email này.
            </p>
          </div>

        </div>
        </body>
        </html>
        HTML;
    }

    protected function row(string $label, string $value, string $valueStyle = ''): string
    {
        return <<<HTML
        <tr>
          <td style="padding:8px 0;color:#64748b;font-size:14px;width:45%;vertical-align:top">{$label}</td>
          <td style="padding:8px 0;font-size:14px;font-weight:600;{$valueStyle}">{$value}</td>
        </tr>
        HTML;
    }

    protected function badge(string $text, string $bg, string $color = '#fff'): string
    {
        return "<span style=\"display:inline-block;padding:3px 10px;background:{$bg};color:{$color};border-radius:20px;font-size:12px;font-weight:700\">{$text}</span>";
    }

    protected function btn(string $href, string $label, string $color = '#6366f1'): string
    {
        return <<<HTML
        <div style="text-align:center;margin-top:24px">
          <a href="{$href}" style="display:inline-block;padding:12px 28px;background:{$color};color:#fff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700">{$label}</a>
        </div>
        HTML;
    }
}
