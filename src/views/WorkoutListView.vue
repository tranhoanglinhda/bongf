<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import WorkoutCard from '../components/WorkoutCard.vue';
import { listWorkouts } from '../services/repository';
import { WORKOUT_FILTERS } from '../utils/shopCategories';
import type { WorkoutItem } from '../types/models';

const workouts = ref<WorkoutItem[]>([]);
const loading = ref(true);
const activeFilter = ref<(typeof WORKOUT_FILTERS)[number]>('Tất cả');

const filtered = computed(() =>
  activeFilter.value === 'Tất cả'
    ? workouts.value
    : workouts.value.filter((workout) => workout.levelLabel === activeFilter.value),
);

onMounted(async () => {
  workouts.value = await listWorkouts();
  loading.value = false;
});
</script>

<template>
  <div class="fade-in">
    <div style="margin-bottom: 22px">
      <p class="eyebrow">BongF Studio</p>
      <h1 class="display list-title">Bài tập</h1>
      <p class="lead" style="max-width: 620px">
        Các buổi tập có hướng dẫn từng bước — chọn theo thời lượng và cường độ phù hợp với bạn.
      </p>
    </div>

    <div class="chip-row">
      <span
        v-for="filter in WORKOUT_FILTERS"
        :key="filter"
        class="chip"
        :class="{ active: activeFilter === filter }"
        @click="activeFilter = filter"
      >
        {{ filter }}
      </span>
    </div>

    <p v-if="loading" class="empty-box" style="margin-top: 22px">Đang tải bài tập…</p>
    <p v-else-if="filtered.length === 0" class="empty-box" style="margin-top: 22px">
      Chưa có bài tập nào trong nhóm này.
    </p>
    <div v-else class="grid grid-3" style="margin-top: 22px">
      <WorkoutCard v-for="workout in filtered" :key="workout.id" :workout="workout" />
    </div>
  </div>
</template>

<style scoped>
.list-title {
  font-size: clamp(36px, 6vw, 64px);
  margin: 8px 0;
}
</style>
