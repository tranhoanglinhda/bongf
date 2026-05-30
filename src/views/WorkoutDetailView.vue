<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import AppImage from '../components/AppImage.vue';
import LevelDots from '../components/LevelDots.vue';
import { getWorkoutById } from '../services/repository';
import type { WorkoutItem } from '../types/models';

const route = useRoute();
const router = useRouter();

const workout = ref<WorkoutItem | null>(null);
const loading = ref(true);
const done = reactive<Record<number, boolean>>({});

const completed = computed(() => Object.values(done).filter(Boolean).length);

const toggle = (index: number) => {
  done[index] = !done[index];
};

const load = async (id: string) => {
  loading.value = true;
  for (const key of Object.keys(done)) delete done[Number(key)];
  workout.value = await getWorkoutById(id);
  loading.value = false;
};

watch(() => route.params.id, (id) => load(String(id)));
onMounted(() => load(String(route.params.id)));
</script>

<template>
  <div class="fade-in">
    <span class="back-link" @click="router.push('/workouts')"><AppIcon name="arrowL" /> Bài tập</span>

    <p v-if="loading" class="empty-box">Đang tải…</p>
    <p v-else-if="!workout" class="empty-box">Không tìm thấy bài tập này.</p>

    <template v-else>
      <section class="detail-hero">
        <AppImage class="dh-img" :src="workout.cover" :alt="workout.vi" label="ảnh bài tập" />
        <div class="hero-overlay" />
        <div class="dh-body">
          <p class="eyebrow">{{ workout.title }} · {{ workout.focus }}</p>
          <h1>{{ workout.vi }}</h1>
          <div class="meta-row">
            <span class="m"><AppIcon name="clock" /> {{ workout.duration }} phút</span>
            <span class="m"><AppIcon name="flame" /> {{ workout.kcal }} kcal</span>
            <span class="m"><AppIcon name="dumbbell" /> {{ workout.steps.length }} động tác</span>
            <span class="m"><LevelDots :value="workout.level" /> {{ workout.levelLabel }}</span>
          </div>
        </div>
      </section>

      <div class="detail-grid">
        <div>
          <div class="panel">
            <h2>Các động tác</h2>
            <p class="sub">Hoàn thành {{ completed }}/{{ workout.steps.length }} — bấm vào số thứ tự để đánh dấu.</p>
            <div class="steps">
              <div v-for="(step, index) in workout.steps" :key="index" class="step">
                <span class="num" :class="{ 'num-done': done[index] }" @click="toggle(index)">
                  <AppIcon v-if="done[index]" name="check" />
                  <template v-else>{{ index + 1 }}</template>
                </span>
                <div class="s-body"><h4>{{ step.name }}</h4><p>{{ step.note }}</p></div>
                <div class="s-val">{{ step.val }} <small>{{ step.unit }}</small></div>
              </div>
            </div>
          </div>
        </div>

        <aside class="aside-sticky">
          <div class="panel">
            <h2 style="font-size: 20px">Tổng quan</h2>
            <div class="stat-tiles" style="margin-top: 14px">
              <div class="stat-tile"><div class="n">{{ workout.kcal }}</div><div class="l">Kcal</div></div>
              <div class="stat-tile"><div class="n">{{ workout.duration }}</div><div class="l">Phút</div></div>
              <div class="stat-tile"><div class="n">{{ workout.steps.length }}</div><div class="l">Động tác</div></div>
              <div class="stat-tile"><div class="n">{{ workout.levelLabel }}</div><div class="l">Cấp độ</div></div>
            </div>
          </div>
          <div class="panel">
            <h2 style="font-size: 20px">Dụng cụ</h2>
            <div class="chip-row" style="margin-top: 12px">
              <span v-for="item in workout.equipment" :key="item" class="tag-pill">{{ item }}</span>
            </div>
            <hr class="divider" />
            <p class="sub" style="margin: 0">Mẹo</p>
            <p class="tip-text">
              Khởi động 3 phút trước khi vào bài, giữ nhịp thở đều và uống đủ nước giữa các hiệp.
            </p>
            <span class="btn btn-primary btn-block" style="margin-top: 16px"><AppIcon name="bookmark" /> Lưu buổi tập</span>
          </div>
        </aside>
      </div>
    </template>
  </div>
</template>

<style scoped>
.num-done {
  background: var(--accent) !important;
  color: #07120e !important;
  cursor: pointer;
}
.step .num {
  cursor: pointer;
}
.tip-text {
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
  margin-top: 6px;
}
</style>
