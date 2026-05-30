<script setup lang="ts">
import { computed } from 'vue';

/* Inline icon set ported from design_handoff_bongf/components.jsx (object `I`).
   Each entry is the inner markup of a 24x24 viewBox SVG; stroke uses currentColor. */
const ICONS: Record<string, string> = {
  leaf: '<path d="M5 9.5V14.5M7.5 8V16M16.5 8V16M19 9.5V14.5M7.5 12H16.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none" />',
  clock: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></g>',
  flame: '<path d="M12 3c.5 3-2 4-2 6.5a2 2 0 104 0c0 1 1 1.5 1 3a4.5 4.5 0 11-9 0C6 9 9.5 7 9 3c1.5.5 2.4 1.4 3 .8.4-.4.2-.5 0-.8Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />',
  dumbbell: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" /></g>',
  bolt: '<path d="M13 3 4 14h6l-1 7 9-11h-6l1-7Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />',
  utensils: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3v8a2 2 0 002 2M7 3v18M7 13V3M16 3c-1.5 0-2.5 2-2.5 5s1 4 2.5 4v9" /></g>',
  users: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3" /><path d="M3.5 19a5.5 5.5 0 0111 0M16 6a3 3 0 010 6M18 19c0-2-.7-3.4-1.8-4.3" /></g>',
  check: '<path d="M5 12.5 10 17.5 19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" />',
  arrowR: '<path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />',
  arrowUpR: '<path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />',
  arrowL: '<path d="M19 12H5M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />',
  shirt: '<path d="M8 4 4 7l2 3 2-1v9h8v-9l2 1 2-3-4-3-2 2a2 2 0 01-4 0L8 4Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />',
  pot: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h16v6a3 3 0 01-3 3H7a3 3 0 01-3-3V9Z" /><path d="M3 9h18M8 9V6h8v3M9 4l1 2M15 4l-1 2" /></g>',
  spice: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 9h10l-1 11H8L7 9Z" /><path d="M9 9V5h6v4M9 6h6" /></g>',
  drop: '<path d="M12 3c3 4 6 6.5 6 10a6 6 0 11-12 0c0-3.5 3-6 6-10Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" />',
  pill: '<g fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="8" width="17" height="8" rx="4" /><path d="M12 8v8" /></g>',
  ig: '<g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.8" r="1.1" fill="currentColor" stroke="none" /></g>',
  fb: '<path d="M13.2 20V12.9H15.7L16.1 10.1H13.2V8.35C13.2 7.54 13.45 6.8 14.66 6.8H16.2V4.36C15.93 4.32 14.98 4.24 13.88 4.24C11.58 4.24 10 5.58 10 8.04V10.1H7.5V12.9H10V20H13.2Z" fill="currentColor" />',
  yt: '<g fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M10 9.8 15 12l-5 2.2V9.8Z" fill="currentColor" stroke="none" /></g>',
  tiktok: '<path d="M14 4c.4 2.2 1.8 3.6 4 3.9v2.6c-1.5.05-2.9-.4-4-1.2v5.4a5 5 0 11-5-5c.35 0 .7.04 1 .1v2.7a2.3 2.3 0 101.6 2.2V4H14Z" fill="currentColor" />',
  play: '<path d="M8 5v14l11-7L8 5Z" fill="currentColor" />',
  bookmark: '<path d="M6 4h12v16l-6-4-6 4V4Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />',
  pencil: '<path d="M4 20h4L18.5 9.5a2 2 0 00-2.83-2.83L5 17.2 4 20Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />',
  trash: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></g>',
  plus: '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />',
  lock: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 018 0v3" /></g>',
  logout: '<g fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 7V5a2 2 0 00-2-2H6a2 2 0 00-2 2v14a2 2 0 002 2h6a2 2 0 002-2v-2M9 12h11M17 8l4 4-4 4" /></g>',
  external: '<path d="M7 17 17 7M9 7h8v8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />',
};

const props = defineProps<{ name: string }>();

const markup = computed(() => ICONS[props.name] ?? ICONS.bolt);
</script>

<template>
  <svg viewBox="0 0 24 24" aria-hidden="true" v-html="markup" />
</template>
