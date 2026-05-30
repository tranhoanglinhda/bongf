<script setup lang="ts">
defineProps<{ value: number }>();
</script>

<template>
  <span class="level">
    <i v-for="n in 3" :key="n" :class="{ on: n <= value }" />
  </span>
</template>
