<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import RecipeCard from '../components/RecipeCard.vue';
import { listRecipes } from '../services/repository';
import { RECIPE_FILTERS } from '../utils/shopCategories';
import type { RecipeItem } from '../types/models';

const recipes = ref<RecipeItem[]>([]);
const loading = ref(true);
const activeFilter = ref<(typeof RECIPE_FILTERS)[number]>('Tất cả');

const filtered = computed(() =>
  activeFilter.value === 'Tất cả'
    ? recipes.value
    : recipes.value.filter((recipe) => recipe.meal === activeFilter.value),
);

onMounted(async () => {
  recipes.value = await listRecipes();
  loading.value = false;
});
</script>

<template>
  <div class="fade-in">
    <div style="margin-bottom: 22px">
      <p class="eyebrow">BongF Kitchen</p>
      <h1 class="display list-title">Công thức</h1>
      <p class="lead" style="max-width: 620px">
        Những món ăn lành mạnh, dễ làm — hướng dẫn nguyên liệu và từng bước chế biến rõ ràng.
      </p>
    </div>

    <div class="chip-row">
      <span
        v-for="filter in RECIPE_FILTERS"
        :key="filter"
        class="chip"
        :class="{ active: activeFilter === filter }"
        @click="activeFilter = filter"
      >
        {{ filter }}
      </span>
    </div>

    <p v-if="loading" class="empty-box" style="margin-top: 22px">Đang tải công thức…</p>
    <p v-else-if="filtered.length === 0" class="empty-box" style="margin-top: 22px">
      Chưa có công thức nào trong nhóm này.
    </p>
    <div v-else class="grid grid-3" style="margin-top: 22px">
      <RecipeCard v-for="recipe in filtered" :key="recipe.id" :recipe="recipe" />
    </div>
  </div>
</template>

<style scoped>
.list-title {
  font-size: clamp(36px, 6vw, 64px);
  margin: 8px 0;
}
</style>
