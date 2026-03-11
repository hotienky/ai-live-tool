<template>
  <footer class="site-footer">
    <div class="site-footer__inner container">
      <div class="site-footer__brand">
        <Store :size="18" />
        <span>{{ storeName || 'Shop' }}</span>
      </div>
      <p class="site-footer__copy">
        © {{ year }} {{ storeName || 'Shop' }}. Powered by AI Live Tool
      </p>
      <div class="site-footer__links">
        <a href="#">Về chúng tôi</a>
        <a href="#">Chính sách</a>
        <a href="#">Liên hệ</a>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { Store } from 'lucide-vue-next'
defineProps({ storeName: { type: String, default: '' } })
const year = new Date().getFullYear()
</script>

<style scoped>
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--sf-border);
  background: var(--sf-bg-secondary);
}

.site-footer__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  flex-wrap: wrap;
  gap: 16px;
}

.site-footer__brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 15px;
  color: var(--sf-text-primary);
}

.site-footer__brand svg {
  color: var(--sf-accent-light);
}

.site-footer__copy {
  font-size: 12px;
  color: var(--sf-text-muted);
}

.site-footer__links {
  display: flex;
  gap: 20px;
}

.site-footer__links a {
  font-size: 13px;
  color: var(--sf-text-secondary);
  transition: color 0.2s;
}

.site-footer__links a:hover {
  color: var(--sf-accent-light);
}

@media (max-width: 768px) {
  .site-footer__inner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
