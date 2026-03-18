<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const links = [
  { label: 'Home', to: '/' },
  { label: 'Blog', to: '/blog' },
  { label: 'Shop', to: '/shop' },
  { label: 'Gift', to: '/gift' },
];

const isActive = (path: string): boolean => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

const isAdmin = computed(() => route.path.startsWith('/admin'));
</script>

<template>
  <header class="site-header" v-if="!isAdmin">
    <div class="brand">
      <span class="leaf" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 9.5V14.5M7.5 8V16M16.5 8V16M19 9.5V14.5M7.5 12H16.5"
            stroke="currentColor"
            stroke-width="1.8"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </span>
      <span class="title">BongF</span>
    </div>
    <nav class="menu">
      <RouterLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="menu-link"
        :class="{ active: isActive(link.to) }"
      >
        {{ link.label }}
      </RouterLink>
    </nav>
  </header>
</template>
