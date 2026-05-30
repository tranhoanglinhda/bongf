<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';

const route = useRoute();
const open = ref(false);

interface NavLink {
  label: string;
  to: string;
  matcher: (path: string) => boolean;
}

const links: NavLink[] = [
  { label: 'Trang chủ', to: '/', matcher: (path) => path === '/' },
  { label: 'Bài tập', to: '/workouts', matcher: (path) => path.startsWith('/workouts') },
  { label: 'Công thức', to: '/recipes', matcher: (path) => path.startsWith('/recipes') },
  { label: 'Shop', to: '/shop', matcher: (path) => path.startsWith('/shop') },
];

const isActive = (link: NavLink): boolean => link.matcher(route.path);
const isAdmin = computed(() => route.path.startsWith('/admin4869'));

watch(
  () => route.fullPath,
  () => {
    open.value = false;
  },
);
</script>

<template>
  <header class="site-header" v-if="!isAdmin">
    <RouterLink to="/" class="brand" aria-label="BongF trang chủ">
      <span class="leaf" aria-hidden="true"><AppIcon name="leaf" /></span>
      <span class="brand-text">
        <span class="title">BongF</span>
        <span class="tag">Fitness with Bong</span>
      </span>
    </RouterLink>

    <button class="menu-btn" type="button" :aria-expanded="open" aria-label="Menu" @click="open = !open">
      {{ open ? '✕' : '☰' }}
    </button>

    <nav class="menu" :class="{ open }">
      <RouterLink
        v-for="link in links"
        :key="link.label"
        :to="link.to"
        class="menu-link"
        :class="{ active: isActive(link) }"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </header>
</template>
