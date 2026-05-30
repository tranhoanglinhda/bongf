<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import AppImage from '../components/AppImage.vue';
import {
  createLink,
  createRecipe,
  createWorkout,
  deleteLink,
  deleteRecipe,
  deleteWorkout,
  listLinks,
  listRecipes,
  listWorkouts,
  logoutAdmin,
  updateLink,
  updateRecipe,
  updateWorkout,
} from '../services/repository';
import { LEVEL_LABELS, MEAL_TYPES, SHOP_CATEGORIES, SHOP_TYPES, getCategoryLabel } from '../utils/shopCategories';
import type {
  LinkItem,
  RecipeItem,
  WorkoutItem,
  WorkoutLevel,
  LevelLabel,
  MealType,
  LinkCategory,
  ShopType,
} from '../types/models';

type Tab = 'workout' | 'recipe' | 'link';

const router = useRouter();
const tab = ref<Tab>('workout');
const loading = ref(false);
const error = ref('');
const submitting = ref(false);

const workouts = ref<WorkoutItem[]>([]);
const recipes = ref<RecipeItem[]>([]);
const links = ref<LinkItem[]>([]);

const editId = ref<string | null>(null);
/** Existing item being edited — used to preserve steps / tags / ingredients not shown in the form. */
const editingItem = ref<WorkoutItem | RecipeItem | LinkItem | null>(null);

const workoutForm = reactive({
  vi: '',
  title: '',
  cover: '',
  levelLabel: 'Dễ' as LevelLabel,
  level: 1 as WorkoutLevel,
  duration: 10,
  kcal: 100,
  focus: 'Toàn thân',
  blurb: '',
});

const recipeForm = reactive({
  vi: '',
  title: '',
  cover: '',
  meal: 'Bữa sáng' as MealType,
  time: 10,
  servings: 1,
  kcal: 300,
  protein: '',
  blurb: '',
});

const linkForm = reactive({
  name: '',
  cat: 'apparel' as LinkCategory,
  shop: 'shopee' as ShopType,
  price: '',
  thumb: '',
  affiliateUrl: '',
  note: '',
});

const tabLabel = computed(() => (tab.value === 'workout' ? 'bài tập' : tab.value === 'recipe' ? 'công thức' : 'link'));

const resetForms = () => {
  Object.assign(workoutForm, {
    vi: '', title: '', cover: '', levelLabel: 'Dễ', level: 1, duration: 10, kcal: 100, focus: 'Toàn thân', blurb: '',
  });
  Object.assign(recipeForm, {
    vi: '', title: '', cover: '', meal: 'Bữa sáng', time: 10, servings: 1, kcal: 300, protein: '', blurb: '',
  });
  Object.assign(linkForm, {
    name: '', cat: 'apparel', shop: 'shopee', price: '', thumb: '', affiliateUrl: '', note: '',
  });
  editId.value = null;
  editingItem.value = null;
};

const switchTab = (next: Tab) => {
  tab.value = next;
  resetForms();
};

const setLevel = (label: LevelLabel, index: number) => {
  workoutForm.levelLabel = label;
  workoutForm.level = (index + 1) as WorkoutLevel;
};

const loadAll = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [w, r, l] = await Promise.all([listWorkouts(), listRecipes(), listLinks()]);
    workouts.value = w;
    recipes.value = r;
    links.value = l;
  } catch (loadError) {
    error.value = loadError instanceof Error ? loadError.message : 'Không tải được dữ liệu.';
  } finally {
    loading.value = false;
  }
};

const editWorkout = (item: WorkoutItem) => {
  switchTab('workout');
  editId.value = item.id;
  editingItem.value = item;
  Object.assign(workoutForm, {
    vi: item.vi, title: item.title, cover: item.cover, levelLabel: item.levelLabel,
    level: item.level, duration: item.duration, kcal: item.kcal, focus: item.focus, blurb: item.blurb,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const editRecipe = (item: RecipeItem) => {
  switchTab('recipe');
  editId.value = item.id;
  editingItem.value = item;
  Object.assign(recipeForm, {
    vi: item.vi, title: item.title, cover: item.cover, meal: item.meal, time: item.time,
    servings: item.servings, kcal: item.kcal, protein: item.protein === '—' ? '' : item.protein, blurb: item.blurb,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const editLink = (item: LinkItem) => {
  switchTab('link');
  editId.value = item.id;
  editingItem.value = item;
  Object.assign(linkForm, {
    name: item.name, cat: item.cat, shop: item.shop, price: item.price,
    thumb: item.thumb, affiliateUrl: item.affiliateUrl, note: item.note,
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const save = async () => {
  if (submitting.value) return;
  submitting.value = true;
  error.value = '';

  try {
    if (tab.value === 'workout') {
      const original = editingItem.value as WorkoutItem | null;
      const payload = {
        ...workoutForm,
        tags: original?.tags ?? [],
        equipment: original?.equipment ?? ['Thảm tập'],
        steps: original?.steps ?? [],
      };
      if (editId.value) await updateWorkout(editId.value, payload);
      else await createWorkout(payload);
    } else if (tab.value === 'recipe') {
      const original = editingItem.value as RecipeItem | null;
      const payload = {
        ...recipeForm,
        protein: recipeForm.protein.trim() || '—',
        tags: original?.tags ?? [],
        ingredients: original?.ingredients ?? [],
        steps: original?.steps ?? [],
      };
      if (editId.value) await updateRecipe(editId.value, payload);
      else await createRecipe(payload);
    } else {
      const payload = { ...linkForm, affiliateUrl: linkForm.affiliateUrl.trim() || '#' };
      if (editId.value) await updateLink(editId.value, payload);
      else await createLink(payload);
    }

    resetForms();
    await loadAll();
  } catch (saveError) {
    error.value = saveError instanceof Error ? saveError.message : 'Lưu không thành công.';
  } finally {
    submitting.value = false;
  }
};

const removeWorkout = async (id: string) => {
  await deleteWorkout(id);
  await loadAll();
};
const removeRecipe = async (id: string) => {
  await deleteRecipe(id);
  await loadAll();
};
const removeLink = async (id: string) => {
  await deleteLink(id);
  await loadAll();
};

const signOut = () => {
  logoutAdmin();
  router.push('/admin4869');
};

watch(tab, () => {
  error.value = '';
});

onMounted(loadAll);
</script>

<template>
  <div class="fade-in">
    <div class="admin-bar">
      <div class="a-title">
        <span class="leaf"><AppIcon name="leaf" /></span>
        <h1>Admin Dashboard</h1>
      </div>
      <div class="admin-actions">
        <RouterLink to="/" class="btn btn-outline btn-sm"><AppIcon name="external" /> Xem website</RouterLink>
        <button class="btn btn-ghost btn-sm" type="button" @click="signOut"><AppIcon name="logout" /> Đăng xuất</button>
      </div>
    </div>

    <div class="admin-tabs">
      <span class="admin-tab" :class="{ active: tab === 'workout' }" @click="switchTab('workout')">
        <AppIcon name="dumbbell" /> Bài tập <span style="opacity: 0.6">({{ workouts.length }})</span>
      </span>
      <span class="admin-tab" :class="{ active: tab === 'recipe' }" @click="switchTab('recipe')">
        <AppIcon name="utensils" /> Công thức <span style="opacity: 0.6">({{ recipes.length }})</span>
      </span>
      <span class="admin-tab" :class="{ active: tab === 'link' }" @click="switchTab('link')">
        <AppIcon name="bolt" /> Link affiliate <span style="opacity: 0.6">({{ links.length }})</span>
      </span>
    </div>

    <p v-if="error" class="error-text" style="margin-bottom: 14px">{{ error }}</p>

    <div class="admin-grid">
      <div class="panel admin-form-panel">
        <h2 style="font-size: 21px">{{ editId ? 'Sửa' : 'Thêm mới' }} {{ tabLabel }}</h2>
        <form @submit.prevent="save">
          <template v-if="tab === 'workout'">
            <label class="field"><span>Tên (Tiếng Việt)</span><input v-model="workoutForm.vi" placeholder="Khởi động buổi sáng" required /></label>
            <label class="field"><span>Tên hiển thị (kicker)</span><input v-model="workoutForm.title" placeholder="Morning Flow" /></label>
            <label class="field"><span>Ảnh bìa (URL)</span><input v-model="workoutForm.cover" type="url" placeholder="https://..." /></label>
            <div class="seg">
              <button
                v-for="(label, index) in LEVEL_LABELS"
                :key="label"
                type="button"
                :class="{ on: workoutForm.levelLabel === label }"
                @click="setLevel(label, index)"
              >
                {{ label }}
              </button>
            </div>
            <div class="form-grid-2">
              <label class="field"><span>Thời lượng (phút)</span><input v-model.number="workoutForm.duration" type="number" /></label>
              <label class="field"><span>Kcal</span><input v-model.number="workoutForm.kcal" type="number" /></label>
            </div>
            <label class="field"><span>Nhóm cơ / focus</span><input v-model="workoutForm.focus" /></label>
            <label class="field"><span>Mô tả</span><textarea v-model="workoutForm.blurb" /></label>
          </template>

          <template v-else-if="tab === 'recipe'">
            <label class="field"><span>Tên món (Tiếng Việt)</span><input v-model="recipeForm.vi" placeholder="Salad ức gà nướng" required /></label>
            <label class="field"><span>Tên hiển thị (kicker)</span><input v-model="recipeForm.title" placeholder="Garden Chicken" /></label>
            <label class="field"><span>Ảnh bìa (URL)</span><input v-model="recipeForm.cover" type="url" placeholder="https://..." /></label>
            <label class="field">
              <span>Bữa ăn</span>
              <select v-model="recipeForm.meal">
                <option v-for="meal in MEAL_TYPES" :key="meal" :value="meal">{{ meal }}</option>
              </select>
            </label>
            <div class="form-grid-3">
              <label class="field"><span>Phút</span><input v-model.number="recipeForm.time" type="number" /></label>
              <label class="field"><span>Phần</span><input v-model.number="recipeForm.servings" type="number" /></label>
              <label class="field"><span>Kcal</span><input v-model.number="recipeForm.kcal" type="number" /></label>
            </div>
            <label class="field"><span>Đạm (vd: 38g)</span><input v-model="recipeForm.protein" placeholder="38g" /></label>
            <label class="field"><span>Mô tả</span><textarea v-model="recipeForm.blurb" /></label>
          </template>

          <template v-else>
            <label class="field"><span>Tên sản phẩm</span><input v-model="linkForm.name" placeholder="Legging tập nâng mông" required /></label>
            <label class="field">
              <span>Danh mục</span>
              <select v-model="linkForm.cat">
                <option v-for="category in SHOP_CATEGORIES" :key="category.id" :value="category.id">{{ category.label }}</option>
              </select>
            </label>
            <label class="field">
              <span>Sàn</span>
              <select v-model="linkForm.shop">
                <option v-for="shop in SHOP_TYPES" :key="shop" :value="shop">{{ shop }}</option>
              </select>
            </label>
            <div class="form-grid-2">
              <label class="field"><span>Giá</span><input v-model="linkForm.price" placeholder="₫389k" /></label>
              <label class="field"><span>Ảnh (URL)</span><input v-model="linkForm.thumb" type="url" placeholder="https://..." /></label>
            </div>
            <label class="field"><span>Link affiliate</span><input v-model="linkForm.affiliateUrl" type="url" placeholder="https://..." /></label>
            <label class="field"><span>Ghi chú ngắn</span><input v-model="linkForm.note" /></label>
          </template>

          <div class="form-actions">
            <button class="btn btn-primary" type="submit" :disabled="submitting" style="flex: 1">
              <AppIcon :name="editId ? 'pencil' : 'plus'" /> {{ submitting ? 'Đang lưu…' : editId ? 'Cập nhật' : 'Thêm' }}
            </button>
            <button v-if="editId" class="btn btn-outline" type="button" @click="resetForms">Huỷ</button>
          </div>
        </form>
      </div>

      <div class="panel">
        <h2 style="font-size: 21px">Danh sách</h2>
        <p class="sub">Bấm sửa để chỉnh, hoặc xoá khỏi danh sách.</p>

        <p v-if="loading" class="empty-box">Đang tải…</p>

        <div v-else-if="tab === 'workout'" class="admin-list">
          <div v-if="workouts.length === 0" class="empty-box">Chưa có mục nào. Thêm từ form bên trái.</div>
          <div v-for="item in workouts" :key="item.id" class="admin-row">
            <AppImage class="thumb" :src="item.cover" label="ảnh" />
            <div class="r-body">
              <h4>{{ item.vi }}</h4>
              <p>{{ item.levelLabel }} · {{ item.duration }} phút · {{ item.kcal }} kcal</p>
            </div>
            <div class="r-actions">
              <button class="icon-btn" title="Sửa" @click="editWorkout(item)"><AppIcon name="pencil" /></button>
              <button class="icon-btn danger" title="Xoá" @click="removeWorkout(item.id)"><AppIcon name="trash" /></button>
            </div>
          </div>
        </div>

        <div v-else-if="tab === 'recipe'" class="admin-list">
          <div v-if="recipes.length === 0" class="empty-box">Chưa có mục nào. Thêm từ form bên trái.</div>
          <div v-for="item in recipes" :key="item.id" class="admin-row">
            <AppImage class="thumb" :src="item.cover" label="ảnh" />
            <div class="r-body">
              <h4>{{ item.vi }}</h4>
              <p>{{ item.meal }} · {{ item.time }} phút · {{ item.kcal }} kcal</p>
            </div>
            <div class="r-actions">
              <button class="icon-btn" title="Sửa" @click="editRecipe(item)"><AppIcon name="pencil" /></button>
              <button class="icon-btn danger" title="Xoá" @click="removeRecipe(item.id)"><AppIcon name="trash" /></button>
            </div>
          </div>
        </div>

        <div v-else class="admin-list">
          <div v-if="links.length === 0" class="empty-box">Chưa có mục nào. Thêm từ form bên trái.</div>
          <div v-for="item in links" :key="item.id" class="admin-row">
            <AppImage class="thumb" :src="item.thumb" label="ảnh" />
            <div class="r-body">
              <h4>{{ item.name }}</h4>
              <p>{{ getCategoryLabel(item.cat) }} · {{ item.shop }} · {{ item.price }}</p>
            </div>
            <div class="r-actions">
              <button class="icon-btn" title="Sửa" @click="editLink(item)"><AppIcon name="pencil" /></button>
              <button class="icon-btn danger" title="Xoá" @click="removeLink(item.id)"><AppIcon name="trash" /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 11px;
}
.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 11px;
}
.form-actions {
  display: flex;
  gap: 9px;
  margin-top: 4px;
}
</style>
