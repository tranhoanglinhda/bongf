<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import { loginAdmin } from '../services/repository';

const router = useRouter();
const email = ref('admin@abc.com');
const password = ref('12345678');
const error = ref('');

const submitLogin = () => {
  error.value = '';
  if (loginAdmin(email.value, password.value)) {
    router.push('/admin4869/dashboard');
    return;
  }
  error.value = 'Email hoặc mật khẩu chưa hợp lệ.';
};
</script>

<template>
  <div class="admin-login fade-in">
    <div class="box">
      <div class="mark"><AppIcon name="lock" /></div>
      <h1>Admin</h1>
      <p class="lead">BongF Dashboard · Khu vực quản trị</p>

      <form @submit.prevent="submitLogin">
        <label class="field">
          <span>Email</span>
          <input v-model="email" type="email" required />
        </label>
        <label class="field">
          <span>Mật khẩu</span>
          <input v-model="password" type="password" required />
        </label>
        <p v-if="error" class="error-text">{{ error }}</p>
        <button class="btn btn-primary btn-block" type="submit"><AppIcon name="lock" /> Đăng nhập</button>
      </form>

      <p class="hint">
        <RouterLink to="/" class="text-link">← Về trang chủ</RouterLink>
      </p>
    </div>
  </div>
</template>
