import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import WorkoutListView from '../views/WorkoutListView.vue';
import WorkoutDetailView from '../views/WorkoutDetailView.vue';
import RecipeListView from '../views/RecipeListView.vue';
import RecipeDetailView from '../views/RecipeDetailView.vue';
import ShopView from '../views/ShopView.vue';
import AdminLoginView from '../views/AdminLoginView.vue';
import AdminDashboardView from '../views/AdminDashboardView.vue';
import { isAdminLoggedIn } from '../services/repository';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/workouts', name: 'workouts', component: WorkoutListView },
    { path: '/workouts/:id', name: 'workout-detail', component: WorkoutDetailView },
    { path: '/recipes', name: 'recipes', component: RecipeListView },
    { path: '/recipes/:id', name: 'recipe-detail', component: RecipeDetailView },
    { path: '/shop', name: 'shop', component: ShopView },
    { path: '/admin4869', name: 'admin-login', component: AdminLoginView },
    {
      path: '/admin4869/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAdmin: true },
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior() {
    return { top: 0 };
  },
});

router.beforeEach((to) => {
  if (to.meta.requiresAdmin && !isAdminLoggedIn()) {
    return { name: 'admin-login' };
  }

  if (to.name === 'admin-login' && isAdminLoggedIn()) {
    return { name: 'admin-dashboard' };
  }

  return true;
});

const routeTitles: Record<string, string> = {
  home: 'BongF • Fitness With Bong',
  workouts: 'Bài tập • BongF',
  'workout-detail': 'Bài tập • BongF',
  recipes: 'Công thức • BongF',
  'recipe-detail': 'Công thức • BongF',
  shop: 'Shop • BongF',
  'admin-login': 'Admin Login • BongF',
  'admin-dashboard': 'Admin Dashboard • BongF',
};

router.afterEach((to) => {
  const name = String(to.name ?? 'home');
  document.title = routeTitles[name] ?? 'BongF • Fitness With Bong';
});

export default router;
