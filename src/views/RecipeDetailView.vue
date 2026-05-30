<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import AppImage from '../components/AppImage.vue';
import { getRecipeById } from '../services/repository';
import type { RecipeItem } from '../types/models';

const route = useRoute();
const router = useRouter();

const recipe = ref<RecipeItem | null>(null);
const loading = ref(true);
const checked = reactive<Record<number, boolean>>({});

const toggle = (index: number) => {
  checked[index] = !checked[index];
};

const load = async (id: string) => {
  loading.value = true;
  for (const key of Object.keys(checked)) delete checked[Number(key)];
  recipe.value = await getRecipeById(id);
  loading.value = false;
};

watch(() => route.params.id, (id) => load(String(id)));
onMounted(() => load(String(route.params.id)));
</script>

<template>
  <div class="fade-in">
    <span class="back-link" @click="router.push('/recipes')"><AppIcon name="arrowL" /> Công thức</span>

    <p v-if="loading" class="empty-box">Đang tải…</p>
    <p v-else-if="!recipe" class="empty-box">Không tìm thấy công thức này.</p>

    <template v-else>
      <section class="detail-hero">
        <AppImage class="dh-img" :src="recipe.cover" :alt="recipe.vi" label="ảnh món ăn" />
        <div class="hero-overlay" />
        <div class="dh-body">
          <p class="eyebrow">{{ recipe.title }} · {{ recipe.meal }}</p>
          <h1>{{ recipe.vi }}</h1>
          <div class="meta-row">
            <span class="m"><AppIcon name="clock" /> {{ recipe.time }} phút</span>
            <span class="m"><AppIcon name="flame" /> {{ recipe.kcal }} kcal</span>
            <span class="m"><AppIcon name="users" /> {{ recipe.servings }} phần</span>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <div>
          <div class="panel">
            <h2>Cách làm</h2>
            <p class="sub">{{ recipe.blurb }}</p>
            <div class="steps">
              <div v-for="(step, index) in recipe.steps" :key="index" class="step recipe-step">
                <span class="num">{{ index + 1 }}</span>
                <div class="s-body"><h4>{{ step.name }}</h4><p>{{ step.note }}</p></div>
              </div>
            </div>
          </div>
        </div>

        <aside class="aside-sticky">
          <div class="panel">
            <h2 style="font-size: 20px">Nguyên liệu</h2>
            <p class="sub">Cho {{ recipe.servings }} phần ăn — bấm để gạch món đã chuẩn bị.</p>
            <div class="ingredients">
              <div
                v-for="(ingredient, index) in recipe.ingredients"
                :key="index"
                class="ingredient"
                :class="{ checked: checked[index] }"
                @click="toggle(index)"
              >
                <span class="tick"><AppIcon name="check" /></span>
                <span class="i-name">{{ ingredient.name }}</span>
                <span class="i-amt">{{ ingredient.amt }}</span>
              </div>
            </div>
          </div>
          <div class="panel">
            <h2 style="font-size: 20px">Dinh dưỡng</h2>
            <div class="stat-tiles" style="margin-top: 14px">
              <div class="stat-tile"><div class="n">{{ recipe.kcal }}</div><div class="l">Kcal</div></div>
              <div class="stat-tile"><div class="n">{{ recipe.protein }}</div><div class="l">Đạm</div></div>
              <div class="stat-tile"><div class="n">{{ recipe.time }}'</div><div class="l">Thời gian</div></div>
            </div>
            <span class="btn btn-primary btn-block" style="margin-top: 16px"><AppIcon name="bookmark" /> Lưu công thức</span>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.recipe-step {
  grid-template-columns: 44px 1fr;
}
</style>
