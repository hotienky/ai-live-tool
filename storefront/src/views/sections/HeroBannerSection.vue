<template>
  <section class="blk-hero" :style="heroStyle">
    <div class="blk-hero__inner" :style="{ textAlign: params?.text_align || 'center' }">
      <h2 v-if="params?.title" class="blk-hero__title">{{ params.title }}</h2>
      <p v-if="params?.subtitle" class="blk-hero__subtitle">{{ params.subtitle }}</p>
      <a
        v-if="params?.button_text && params?.button_url"
        :href="params.button_url"
        class="blk-hero__btn"
      >{{ params.button_text }}</a>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) },
})

const heroStyle = computed(() => ({
  minHeight: props.params?.min_height || '340px',
  backgroundImage: props.params?.image ? `url(${props.params.image})` : undefined,
  backgroundSize: 'cover',
  backgroundPosition: props.params?.bg_position || 'center',
}))
</script>

<style scoped>
.blk-hero {
  position: relative;
  background: var(--sf-accent-glow, #f3f0ff);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.blk-hero__inner {
  position: relative;
  z-index: 1;
  padding: 48px 24px;
  max-width: 720px;
  width: 100%;
}
.blk-hero__title {
  font-size: clamp(28px, 5vw, 52px);
  font-weight: 900;
  line-height: 1.15;
  color: var(--sf-text-primary);
  margin: 0 0 12px;
}
.blk-hero__subtitle {
  font-size: 18px;
  color: var(--sf-text-secondary);
  margin: 0 0 24px;
}
.blk-hero__btn {
  display: inline-block;
  padding: 12px 28px;
  background: var(--sf-accent);
  color: #fff;
  border-radius: var(--sf-radius-md, 10px);
  font-weight: 700;
  text-decoration: none;
  transition: filter 0.2s;
}
.blk-hero__btn:hover { filter: brightness(1.1); }
</style>
