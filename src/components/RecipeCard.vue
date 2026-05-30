<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import AppImage from './AppImage.vue';
import type { RecipeItem } from '../types/models';

const props = defineProps<{ recipe: RecipeItem }>();
const router = useRouter();

const open = () => router.push(`/recipes/${props.recipe.id}`);
</script>

<template>
  <article class="card clickable" @click="open">
    <div class="card-media">
      <AppImage :src="recipe.cover" :alt="recipe.vi" label="ảnh món ăn" />
      <span class="badge"><AppIcon name="clock" /> {{ recipe.time }} phút</span>
      <span class="badge right">{{ recipe.meal }}</span>
    </div>
    <div class="card-body">
      <p class="kicker">{{ recipe.title }}</p>
      <h3>{{ recipe.vi }}</h3>
      <p>{{ recipe.blurb }}</p>
      <div class="meta-row" style="margin-top: auto; padding-top: 6px">
        <span class="m"><AppIcon name="flame" /> {{ recipe.kcal }} kcal</span>
        <span class="m"><AppIcon name="users" /> {{ recipe.servings }} phần</span>
      </div>
    </div>
  </article>
</template>
