<template>
  <span class="loci-logo" :aria-label="alt" role="img" v-html="raw" />
</template>

<script setup>
import raw from '../assets/logo.svg?raw'

defineProps({
  alt: { type: String, default: 'Loci' },
})
</script>

<style scoped>
.loci-logo {
  display: inline-block;
  line-height: 0;
  color: inherit;
}
.loci-logo :deep(svg) {
  display: block;
  height: 100%;
  width: auto;
}
</style>
