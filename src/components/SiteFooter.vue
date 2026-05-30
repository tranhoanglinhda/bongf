<script setup lang="ts">
import AppIcon from './AppIcon.vue';
</script>

<template>
  <footer class="site-footer">
    <div class="footer-main">
      <p class="footer-brand">
        <span class="leaf" aria-hidden="true"><AppIcon name="leaf" /></span>
        BongF • Fitness With Bong
      </p>
      <div class="footer-social">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><AppIcon name="ig" /></a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><AppIcon name="fb" /></a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><AppIcon name="yt" /></a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><AppIcon name="tiktok" /></a>
      </div>
    </div>
    <hr class="divider" style="margin: 0" />
    <div class="footer-main">
      <p class="footer-fine">© 2026 BongF. Move slow, train deep, live wild. — Một số liên kết là tiếp thị liên kết.</p>
      <RouterLink to="/admin4869" class="footer-fine text-link" style="color: var(--muted)">Admin</RouterLink>
    </div>
  </footer>
</template>
