<template>
  <section class="image-banner-section" :class="{ container: !params?.fullWidth }">
    <a v-if="params?.link" :href="params.link" class="banner-link">
      <picture>
        <source v-if="params?.mobileImage" :srcset="params.mobileImage" media="(max-width: 768px)">
        <img :src="params?.desktopImage || 'https://placehold.co/1200x200/e2e8f0/64748b?text=Banner'" alt="Promo Banner" class="banner-img" referrerpolicy="no-referrer" />
      </picture>
    </a>
    <picture v-else>
      <source v-if="params?.mobileImage" :srcset="params.mobileImage" media="(max-width: 768px)">
      <img :src="params?.desktopImage || 'https://placehold.co/1200x200/e2e8f0/64748b?text=Banner'" alt="Promo Banner" class="banner-img" referrerpolicy="no-referrer" />
    </picture>
  </section>
</template>

<script setup>
defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) }
})
</script>

<style scoped>
.image-banner-section {
  margin: 24px auto;
}
.banner-link {
  display: block;
  text-decoration: none;
}
.banner-img {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--sf-radius-lg, 12px);
  object-fit: cover;
}
.image-banner-section.container {
  padding-left: var(--sf-container-px, 16px);
  padding-right: var(--sf-container-px, 16px);
}
</style>
