<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import AppImage from '../components/AppImage.vue';
import LevelDots from '../components/LevelDots.vue';
import RecipeCard from '../components/RecipeCard.vue';
import { listLinks, listRecipes, listWorkouts } from '../services/repository';
import { SHOP_CATEGORIES } from '../utils/shopCategories';
import type { LinkItem, RecipeItem, WorkoutItem } from '../types/models';

const router = useRouter();
const workouts = ref<WorkoutItem[]>([]);
const recipes = ref<RecipeItem[]>([]);
const links = ref<LinkItem[]>([]);

const featuredWorkout = computed(() => workouts.value[0] ?? null);
const featuredRecipes = computed(() => recipes.value.slice(0, 3));
const teaserCategories = computed(() =>
  SHOP_CATEGORIES.slice(0, 3).map((category) => ({
    ...category,
    count: links.value.filter((link) => link.cat === category.id).length,
  })),
);

const openWorkout = (id: string) => router.push(`/workouts/${id}`);

onMounted(async () => {
  const [w, r, l] = await Promise.all([listWorkouts(), listRecipes(), listLinks()]);
  workouts.value = w;
  recipes.value = r;
  links.value = l;
});
</script>

<template>
  <div class="fade-in">
    <section class="hero">
      <AppImage
        class="hero-img"
        src="https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&w=1700&q=80"
        alt=""
        label="ảnh bìa"
      />
      <div class="hero-overlay" />
      <div class="hero-content">
        <p class="eyebrow">BongF • Fitness with Bong</p>
        <h1>Move Slow,<br />Train Deep,<br /><em>Live Wild</em></h1>
        <p class="lead">
          Hướng dẫn tập luyện và nấu ăn lành mạnh lấy cảm hứng từ thiên nhiên — cùng những sản phẩm mình
          tin dùng và tuyển chọn cho hành trình của bạn.
        </p>
        <div class="cta-row">
          <RouterLink to="/workouts" class="btn btn-primary"><AppIcon name="dumbbell" /> Bắt đầu tập</RouterLink>
          <RouterLink to="/recipes" class="btn btn-outline"><AppIcon name="utensils" /> Xem công thức</RouterLink>
        </div>
        <div class="hero-stats">
          <div class="hero-stat"><div class="n">{{ workouts.length }}</div><div class="l">Bài tập</div></div>
          <div class="hero-stat"><div class="n">{{ recipes.length }}</div><div class="l">Công thức</div></div>
          <div class="hero-stat"><div class="n">{{ links.length }}+</div><div class="l">Sản phẩm</div></div>
        </div>
      </div>
    </section>

    <template v-if="featuredWorkout">
      <div class="section-head">
        <div><p class="eyebrow">Đề xuất hôm nay</p><h2>Bài tập nổi bật</h2></div>
        <RouterLink to="/workouts" class="text-link">Tất cả bài tập <AppIcon name="arrowR" /></RouterLink>
      </div>
      <article class="card clickable featured-workout" @click="openWorkout(featuredWorkout.id)">
        <div class="card-media" style="aspect-ratio: auto">
          <AppImage :src="featuredWorkout.cover" :alt="featuredWorkout.vi" label="ảnh bài tập" />
          <span class="badge"><AppIcon name="dumbbell" /> {{ featuredWorkout.focus }}</span>
        </div>
        <div class="card-body featured-body">
          <p class="kicker">{{ featuredWorkout.title }}</p>
          <h3 class="featured-title">{{ featuredWorkout.vi }}</h3>
          <p>{{ featuredWorkout.blurb }}</p>
          <div class="meta-row">
            <span class="m"><AppIcon name="clock" /> {{ featuredWorkout.duration }} phút</span>
            <span class="m"><AppIcon name="flame" /> {{ featuredWorkout.kcal }} kcal</span>
            <span class="m"><LevelDots :value="featuredWorkout.level" /> {{ featuredWorkout.levelLabel }}</span>
          </div>
          <span class="btn btn-primary featured-cta"><AppIcon name="play" /> Tập ngay</span>
        </div>
      </article>
    </template>

    <div class="section-head">
      <div><p class="eyebrow">Ăn để khỏe</p><h2>Công thức được yêu thích</h2></div>
      <RouterLink to="/recipes" class="text-link">Tất cả công thức <AppIcon name="arrowR" /></RouterLink>
    </div>
    <div class="grid grid-3">
      <RecipeCard v-for="recipe in featuredRecipes" :key="recipe.id" :recipe="recipe" />
    </div>

    <div class="section-head">
      <div><p class="eyebrow">Mình tin dùng</p><h2>Sản phẩm tuyển chọn</h2></div>
      <RouterLink to="/shop" class="text-link">Mở trang Shop <AppIcon name="arrowR" /></RouterLink>
    </div>
    <div class="grid grid-3">
      <article
        v-for="category in teaserCategories"
        :key="category.id"
        class="card clickable"
        @click="router.push({ path: '/shop', query: { cat: category.id } })"
      >
        <div class="card-body" style="gap: 12px">
          <span class="cat-head" style="margin: 0">
            <span class="ci"><AppIcon :name="category.icon" /></span>
            <span><h3 class="teaser-title">{{ category.label }}</h3></span>
          </span>
          <p>{{ category.count }} liên kết được tuyển chọn — bấm để xem & mua qua link affiliate.</p>
          <span class="text-link">Khám phá <AppIcon name="arrowR" /></span>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.featured-workout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) 1fr;
  align-items: stretch;
}
.featured-body {
  justify-content: center;
  padding: 28px 30px;
  gap: 14px;
}
.featured-title {
  font-family: var(--serif);
  font-size: 30px;
  font-weight: 600;
  line-height: 1.05;
}
.featured-cta {
  align-self: flex-start;
  margin-top: 6px;
}
.teaser-title {
  font-family: var(--serif);
  font-size: 20px;
  font-weight: 600;
}
@media (max-width: 760px) {
  .featured-workout {
    grid-template-columns: 1fr;
  }
}
</style>
