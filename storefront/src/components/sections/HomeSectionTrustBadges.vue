<template>
  <section class="trust-badges container">
    <div class="trust-grid">
      <div class="trust-item">
        <div class="trust-icon">
          <Truck :size="24" />
        </div>
        <div class="trust-text">
          <strong>{{ badges[0]?.title || 'Miễn phí vận chuyển' }}</strong>
          <span>{{ badges[0]?.desc || 'Cho đơn từ 500K' }}</span>
        </div>
      </div>
      <div class="trust-item">
        <div class="trust-icon">
          <RefreshCw :size="24" />
        </div>
        <div class="trust-text">
          <strong>{{ badges[1]?.title || 'Đổi trả miễn phí' }}</strong>
          <span>{{ badges[1]?.desc || 'Trong 30 ngày' }}</span>
        </div>
      </div>
      <div class="trust-item">
        <div class="trust-icon">
          <ShieldCheck :size="24" />
        </div>
        <div class="trust-text">
          <strong>{{ badges[2]?.title || 'Thanh toán an toàn' }}</strong>
          <span>{{ badges[2]?.desc || 'Bảo mật 100%' }}</span>
        </div>
      </div>
      <div class="trust-item">
        <div class="trust-icon">
          <Headphones :size="24" />
        </div>
        <div class="trust-text">
          <strong>{{ badges[3]?.title || 'Hỗ trợ 24/7' }}</strong>
          <span>{{ badges[3]?.desc || 'Tư vấn miễn phí' }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { Truck, RefreshCw, ShieldCheck, Headphones } from 'lucide-vue-next'

defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Object, default: () => ({}) },
})

const badges = [
  { title: 'Miễn phí vận chuyển', desc: 'Cho đơn từ 500K' },
  { title: 'Đổi trả miễn phí', desc: 'Trong 30 ngày' },
  { title: 'Thanh toán an toàn', desc: 'Bảo mật 100%' },
  { title: 'Hỗ trợ 24/7', desc: 'Tư vấn miễn phí' },
]
</script>

<style scoped>
.trust-badges {
  padding: 32px 0;
}
.trust-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}
.trust-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 18px;
  border-radius: var(--sf-radius-md, 12px);
  background: var(--sf-bg-card);
  border: 1px solid var(--sf-border);
  transition: all 0.25s;
}
.trust-item:hover {
  border-color: var(--sf-accent);
  transform: translateY(-2px);
  box-shadow: var(--sf-shadow-sm);
}
.trust-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--sf-accent-glow, rgba(99,102,241,0.1));
  color: var(--sf-accent-light, var(--sf-accent));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.trust-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.trust-text strong {
  font-size: 13px;
  font-weight: 700;
  color: var(--sf-text-primary);
}
.trust-text span {
  font-size: 12px;
  color: var(--sf-text-muted);
}

@media (max-width: 1024px) {
  .trust-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .trust-grid { grid-template-columns: 1fr; gap: 10px; }
  .trust-item { padding: 14px 16px; }
  .trust-icon { width: 40px; height: 40px; border-radius: 10px; }
}
</style>
