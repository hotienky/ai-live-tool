<template>
  <div :style="{ height: params?.height || '40px' }" aria-hidden="true"></div>
</template>

<script setup>
defineProps({
  params: { type: Object, default: () => ({}) },
  content: { type: [Array, String, Object], default: null },
  section: { type: Object, default: () => ({}) },
})
</script>
