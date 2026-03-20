<?php

namespace App\Mail;

use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;

class LowStockMail extends BaseAdminMail
{
    public function __construct(
        public readonly object $product,
        public readonly int    $currentStock,
        public readonly int    $threshold,
        public readonly bool   $outOfStock = false,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->outOfStock
            ? "🚨 Hết hàng: {$this->product->name}"
            : "⚠️ Tồn kho thấp: {$this->product->name} (còn {$this->currentStock})";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(htmlString: $this->buildHtml());
    }

    private function buildHtml(): string
    {
        $p          = $this->product;
        $productUrl = config('app.url') . "/admin/products/{$p->id}";

        if ($this->outOfStock) {
            $alertBox = <<<HTML
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:20px;margin-bottom:20px;text-align:center">
              <p style="margin:0;font-size:36px">📦❌</p>
              <p style="margin:8px 0 0;font-size:18px;font-weight:800;color:#dc2626">Hết hàng hoàn toàn!</p>
              <p style="margin:4px 0 0;font-size:14px;color:#64748b">Sản phẩm này hiện không còn tồn kho</p>
            </div>
            HTML;
            $accentColor = '#ef4444,#dc2626';
            $icon = '🚨';
            $headerTitle = 'Sản phẩm hết hàng';
        } else {
            $pct = $this->threshold > 0 ? round(($this->currentStock / $this->threshold) * 100) : 0;
            $barColor = $pct <= 30 ? '#ef4444' : '#f97316';
            $alertBox = <<<HTML
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px;margin-bottom:20px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                <span style="font-size:14px;color:#64748b">Tồn kho hiện tại</span>
                <span style="font-size:24px;font-weight:800;color:{$barColor}">{$this->currentStock}</span>
              </div>
              <div style="background:#e2e8f0;border-radius:4px;height:8px;overflow:hidden">
                <div style="width:{$pct}%;background:{$barColor};height:100%;border-radius:4px;transition:width 0.3s"></div>
              </div>
              <p style="margin:8px 0 0;font-size:12px;color:#94a3b8">Ngưỡng cảnh báo: {$this->threshold} sản phẩm</p>
            </div>
            HTML;
            $accentColor = '#f97316,#ea580c';
            $icon = '⚠️';
            $headerTitle = 'Tồn kho thấp';
        }

        $sku = $p->sku ? "<br><span style='font-size:12px;color:#94a3b8'>SKU: {$p->sku}</span>" : '';

        $body = <<<HTML
        <p style="margin:0 0 16px;font-size:15px;color:#334155">
          Vui lòng bổ sung hàng sớm để tránh ảnh hưởng đến đơn hàng của khách.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;margin-bottom:16px">
          <p style="margin:0;font-size:16px;font-weight:700;color:#1e293b">{$p->name}{$sku}</p>
          <table style="width:100%;border-collapse:collapse;margin-top:12px">
            {$this->row('SKU', $p->sku ?? '—')}
            {$this->row('Giá bán', number_format($p->price ?? 0) . 'đ')}
            {$this->row('Tồn kho hiện tại', '<strong style="color:' . ($this->outOfStock ? '#dc2626' : '#f97316') . '">' . $this->currentStock . '</strong>')}
          </table>
        </div>

        {$alertBox}

        {$this->btn($productUrl, '📦 Cập nhật tồn kho', $this->outOfStock ? '#ef4444' : '#f97316')}
        HTML;

        return $this->wrapHtml(
            $accentColor,
            $icon,
            $headerTitle,
            htmlspecialchars($p->name),
            $body,
        );
    }
}
