<script setup lang="ts">
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import AppImage from './AppImage.vue';
import LevelDots from './LevelDots.vue';
import type { WorkoutItem } from '../types/models';

const props = defineProps<{ workout: WorkoutItem }>();
const router = useRouter();

const open = () => router.push(`/workouts/${props.workout.id}`);
</script>

<template>
  <article class="card clickable" @click="open">
    <div class="card-media">
      <AppImage :src="workout.cover" :alt="workout.vi" label="ảnh bài tập" />
      <span class="badge"><AppIcon name="clock" /> {{ workout.duration }} phút</span>
      <span class="badge right">{{ workout.levelLabel }}</span>
    </div>
    <div class="card-body">
      <p class="kicker">{{ workout.title }}</p>
      <h3>{{ workout.vi }}</h3>
      <p>{{ workout.blurb }}</p>
      <div class="meta-row" style="margin-top: auto; padding-top: 6px">
        <span class="m"><AppIcon name="flame" /> {{ workout.kcal }} kcal</span>
        <span class="m"><AppIcon name="dumbbell" /> {{ workout.focus }}</span>
        <span class="m"><LevelDots :value="workout.level" /></span>
      </div>
    </div>
  </article>
</template>
