<template>
  <section class="section-faq container">
    <h2 class="section-title">
      <HelpCircle :size="22" class="section-title__accent" />
      {{ params?.title || 'Câu hỏi thường gặp' }}
    </h2>
    <div class="faq-list">
      <div v-for="(item, i) in items" :key="i" class="faq-item" :class="{ open: openIndex === i }">
        <button class="faq-item__question" @click="openIndex = openIndex === i ? null : i">
          <span>{{ item.question }}</span>
          <ChevronDown :size="16" class="faq-arrow" />
        </button>
        <transition name="faq-expand">
          <div v-if="openIndex === i" class="faq-item__answer">
            <p>{{ item.answer }}</p>
          </div>
        </transition>
      </div>
    </div>
    <p v-if="!items.length" class="section-empty">Chưa có câu hỏi nào</p>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue'
import { HelpCircle, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: Array, default: () => [] },
})

const openIndex = ref(null)
const items = computed(() => props.content.length ? props.content : [
  { question: 'Thời gian giao hàng bao lâu?', answer: 'Thông thường từ 2-5 ngày tùy khu vực.' },
  { question: 'Chính sách đổi trả như thế nào?', answer: 'Bạn có thể đổi trả trong vòng 7 ngày kể từ khi nhận hàng.' },
  { question: 'Có hỗ trợ thanh toán COD không?', answer: 'Có, chúng tôi hỗ trợ thanh toán khi nhận hàng (COD).' },
])
</script>

<style scoped>
.section-faq { padding-top: 40px; }
.faq-list { display: flex; flex-direction: column; gap: 8px; max-width: 800px; margin: 0 auto; }
.faq-item {
  border-radius: var(--sf-radius-md); border: 1px solid var(--sf-border);
  background: var(--sf-bg-card); overflow: hidden; transition: all var(--sf-transition);
}
.faq-item.open { border-color: var(--sf-accent); }
.faq-item__question {
  display: flex; align-items: center; justify-content: space-between; width: 100%;
  padding: 16px 20px; background: none; border: none; cursor: pointer;
  font-size: 14px; font-weight: 700; color: var(--sf-text-primary); text-align: left;
}
.faq-arrow { transition: transform 0.2s; color: var(--sf-text-muted); flex-shrink: 0; }
.faq-item.open .faq-arrow { transform: rotate(180deg); color: var(--sf-accent-light); }
.faq-item__answer { padding: 0 20px 16px; }
.faq-item__answer p { margin: 0; font-size: 14px; line-height: 1.6; color: var(--sf-text-secondary); }
.faq-expand-enter-active, .faq-expand-leave-active { transition: all 0.2s ease; overflow: hidden; }
.faq-expand-enter-from, .faq-expand-leave-to { opacity: 0; max-height: 0; }
.faq-expand-enter-to, .faq-expand-leave-from { opacity: 1; max-height: 200px; }
.section-empty { text-align: center; color: var(--sf-text-muted); padding: 40px; }
</style>
