<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';

const route = useRoute();
const isAdminRoute = computed(() => route.path.startsWith('/admin4869'));
</script>

<template>
  <div class="shell" :class="{ 'admin-shell': isAdminRoute }">
    <SiteHeader />
    <main class="page-wrap">
      <RouterView />
    </main>
    <SiteFooter v-if="!isAdminRoute" />
  </div>
</template>
