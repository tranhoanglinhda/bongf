<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { loginAdmin } from '../services/repository';

const router = useRouter();
const email = ref('admin@abc.com');
const password = ref('12345678');
const error = ref('');

const submitLogin = () => {
  error.value = '';
  if (loginAdmin(email.value, password.value)) {
    router.push('/admin/dashboard');
    return;
  }
  error.value = 'Invalid email or password.';
};
</script>

<template>
  <section class="admin-login-page">
    <div class="admin-login-box">
      <p class="gift-icon">✢</p>
      <h1>Admin Login</h1>
      <p class="lead">BongF Dashboard</p>

      <form class="admin-form" @submit.prevent="submitLogin">
        <label>
          Email
          <input v-model="email" type="email" required />
        </label>

        <label>
          Password
          <input v-model="password" type="password" required />
        </label>

        <button class="btn btn-primary" type="submit">Sign In</button>
      </form>

      <p v-if="error" class="error-text">{{ error }}</p>
    </div>
  </section>
</template>
