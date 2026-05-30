<script setup lang="ts">
import { ref, watch } from 'vue';

const props = withDefaults(
  defineProps<{
    src?: string;
    alt?: string;
    label?: string;
  }>(),
  { src: '', alt: '', label: 'ảnh' },
);

const failed = ref(false);

watch(
  () => props.src,
  () => {
    failed.value = false;
  },
);
</script>

<template>
  <div v-if="failed || !src" class="ph">{{ label }}</div>
  <img v-else :src="src" :alt="alt" loading="lazy" @error="failed = true" />
</template>
