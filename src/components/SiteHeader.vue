<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';

const route = useRoute();
const mobileMenuOpen = ref(false);

interface NavLink {
  label: string;
  to: RouteLocationRaw;
  matcher: (path: string) => boolean;
}

const links: NavLink[] = [
  { label: 'Home', to: '/', matcher: (path) => path === '/' },
  { label: 'Blog', to: '/blog', matcher: (path) => path.startsWith('/blog') },
  { label: 'Shop', to: '/shop', matcher: (path) => path.startsWith('/shop') },
  { label: 'Gift', to: '/gift', matcher: (path) => path.startsWith('/gift') },
];

const isActive = (link: NavLink): boolean => link.matcher(route.path);

const isAdmin = computed(() => route.path.startsWith('/admin4869'));

const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value;
};

watch(
  () => route.fullPath,
  () => {
    mobileMenuOpen.value = false;
  },
);
</script>

<template>
  <header class="site-header" v-if="!isAdmin">
    <RouterLink to="/" class="brand-link" aria-label="Go to BongF home page">
      <span class="brand">
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
      </span>
    </RouterLink>

    <button class="mobile-menu-btn" type="button" @click="toggleMobileMenu" :aria-expanded="mobileMenuOpen">
      <span aria-hidden="true">{{ mobileMenuOpen ? '✕' : '☰' }}</span>
      <span class="sr-only">{{ mobileMenuOpen ? 'Close menu' : 'Open menu' }}</span>
    </button>

    <div class="menu-wrap" :class="{ open: mobileMenuOpen }">
      <nav class="menu">
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
    </div>
  </header>
</template>
