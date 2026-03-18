import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import BlogView from '../views/BlogView.vue';
import PostDetailView from '../views/PostDetailView.vue';
import ShopView from '../views/ShopView.vue';
import GiftView from '../views/GiftView.vue';
import AdminLoginView from '../views/AdminLoginView.vue';
import AdminDashboardView from '../views/AdminDashboardView.vue';
import { isAdminLoggedIn } from '../services/repository';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/blog', name: 'blog', component: BlogView },
    { path: '/blog/:idpost', name: 'post-detail', component: PostDetailView },
    { path: '/shop', name: 'shop', component: ShopView },
    { path: '/gift', name: 'gift', component: GiftView },
    { path: '/admin4869', name: 'admin-login', component: AdminLoginView },
    {
      path: '/admin4869/dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: { requiresAdmin: true },
    },
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
  blog: 'Blog • BongF',
  'post-detail': 'Post Detail • BongF',
  shop: 'Shop • BongF',
  gift: 'Gift • BongF',
  'admin-login': 'Admin Login • BongF',
  'admin-dashboard': 'Admin Dashboard • BongF',
};

router.afterEach((to) => {
  const name = String(to.name ?? 'home');
  document.title = routeTitles[name] ?? 'BongF • Fitness With Bong';
});

export default router;
