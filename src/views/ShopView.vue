<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import AppImage from '../components/AppImage.vue';
import { listLinks } from '../services/repository';
import { SHOP_CATEGORIES } from '../utils/shopCategories';
import type { LinkItem } from '../types/models';

const route = useRoute();
const links = ref<LinkItem[]>([]);
const active = ref<string>('all');

const visibleCategories = computed(() =>
  active.value === 'all' ? SHOP_CATEGORIES : SHOP_CATEGORIES.filter((category) => category.id === active.value),
);

const linksFor = (categoryId: string) => links.value.filter((link) => link.cat === categoryId);

watch(
  () => route.query.cat,
  (cat) => {
    active.value = typeof cat === 'string' && cat ? cat : 'all';
  },
  { immediate: true },
);

onMounted(async () => {
  links.value = await listLinks();
});
</script>

<template>
  <div class="fade-in">
    <div class="profile-head">
      <AppImage
        class="avatar"
        src="https://images.unsplash.com/photo-1594381898411-846e7d193883?auto=format&fit=crop&w=300&q=80"
        alt="BongF"
        label="avatar"
      />
      <div>
        <h1>BongF</h1>
        <p class="handle">@fitnesswithbong</p>
      </div>
      <p class="bio">
        Tất cả sản phẩm mình thực sự dùng & yêu thích cho hành trình tập luyện và ăn uống lành mạnh. Mua qua
        link để ủng hộ mình nhé 🌿
      </p>
      <div class="social-row">
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"><AppIcon name="ig" /></a>
        <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok"><AppIcon name="tiktok" /></a>
        <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube"><AppIcon name="yt" /></a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"><AppIcon name="fb" /></a>
      </div>
    </div>

    <div class="chip-row shop-filters">
      <span class="chip" :class="{ active: active === 'all' }" @click="active = 'all'">Tất cả</span>
      <span
        v-for="category in SHOP_CATEGORIES"
        :key="category.id"
        class="chip"
        :class="{ active: active === category.id }"
        @click="active = category.id"
      >
        <span class="ico"><AppIcon :name="category.icon" /></span>{{ category.label }}
      </span>
    </div>

    <div v-for="category in visibleCategories" :key="category.id">
      <div class="cat-head">
        <span class="ci"><AppIcon :name="category.icon" /></span>
        <span>
          <h3>{{ category.label }}</h3>
          <span class="count">{{ linksFor(category.id).length }} sản phẩm</span>
        </span>
      </div>
      <div class="link-list">
        <a
          v-for="link in linksFor(category.id)"
          :key="link.id"
          class="link-row"
          :href="link.affiliateUrl"
          target="_blank"
          rel="noopener nofollow sponsored"
        >
          <AppImage class="link-thumb" :src="link.thumb" :alt="link.name" label="ảnh" />
          <div class="link-main">
            <h4>{{ link.name }}</h4>
            <p>{{ link.note }}</p>
            <div class="link-meta">
              <span class="shop-badge" :class="link.shop">{{ link.shop }}</span>
              <span class="link-price">{{ link.price }}</span>
            </div>
          </div>
          <span class="link-go"><AppIcon name="arrowUpR" /></span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.shop-filters {
  justify-content: center;
  max-width: 660px;
  margin: 20px auto 0;
}
</style>
