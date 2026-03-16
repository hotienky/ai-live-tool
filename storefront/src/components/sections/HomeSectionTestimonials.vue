<template>
  <section class="section-testimonials container">
    <h2 class="section-title">
      <MessageSquareQuote :size="22" class="section-title__accent" />
      {{ params?.title || 'Khách hàng nói gì' }}
    </h2>
    <div class="testimonials-grid" :style="{ gridTemplateColumns: `repeat(${params?.columns || 3}, 1fr)` }">
      <div v-for="(t, i) in items" :key="i" class="testimonial-card">
        <div class="testimonial-card__stars">
          <Star v-for="s in (t.rating || 5)" :key="s" :size="14" class="star-filled" />
        </div>
        <p class="testimonial-card__text">"{{ t.text }}"</p>
        <div class="testimonial-card__author">
          <div class="testimonial-card__avatar" v-if="t.avatar">
            <img :src="t.avatar" :alt="t.name" />
          </div>
          <div class="testimonial-card__avatar testimonial-card__avatar--placeholder" v-else>
            {{ (t.name || 'K')[0] }}
          </div>
          <strong>{{ t.name }}</strong>
        </div>
      </div>
    </div>
    <p v-if="!items.length" class="section-empty">Chưa có đánh giá nào được thêm</p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { MessageSquareQuote, Star } from 'lucide-vue-next'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const items = computed(() => props.content.length ? props.content : [
  { name: 'Khách hàng A', text: 'Sản phẩm rất tốt, giao hàng nhanh!', rating: 5 },
  { name: 'Khách hàng B', text: 'Chất lượng tuyệt vời, sẽ mua lại.', rating: 4 },
  { name: 'Khách hàng C', text: 'Đóng gói cẩn thận, rất hài lòng.', rating: 5 },
])
</script>

<style scoped>
.section-testimonials { padding-top: 40px; }
.testimonials-grid { display: grid; gap: 16px; }
.testimonial-card {
  padding: 24px; border-radius: var(--sf-radius-md);
  background: var(--sf-bg-card); border: 1px solid var(--sf-border);
  transition: all var(--sf-transition);
}
.testimonial-card:hover { transform: translateY(-2px); box-shadow: var(--sf-shadow-sm); }
.testimonial-card__stars { display: flex; gap: 2px; margin-bottom: 12px; }
.star-filled { color: #f59e0b; fill: #f59e0b; }
.testimonial-card__text { font-size: 14px; line-height: 1.6; color: var(--sf-text-secondary); margin: 0 0 16px; font-style: italic; }
.testimonial-card__author { display: flex; align-items: center; gap: 10px; }
.testimonial-card__avatar { width: 36px; height: 36px; border-radius: 50%; overflow: hidden; flex-shrink: 0; }
.testimonial-card__avatar img { width: 100%; height: 100%; object-fit: cover; }
.testimonial-card__avatar--placeholder {
  display: flex; align-items: center; justify-content: center;
  background: var(--sf-accent-glow); color: var(--sf-accent-light);
  font-weight: 800; font-size: 14px;
}
.testimonial-card__author strong { font-size: 13px; }
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
@media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr !important; } }
</style>
