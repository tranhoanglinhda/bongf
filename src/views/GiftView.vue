<script setup lang="ts">
import { ref } from 'vue';
import { createGiftEmail } from '../services/repository';

const email = ref('');
const loading = ref(false);
const success = ref('');
const error = ref('');

const submitGift = async () => {
  success.value = '';
  error.value = '';

  if (!email.value.includes('@')) {
    error.value = 'Please enter a valid Gmail address.';
    return;
  }

  loading.value = true;
  try {
    await createGiftEmail(email.value.trim());
    success.value = 'Success! BongF will send your gift to this Gmail.';
    email.value = '';
  } catch {
    error.value = 'Something went wrong. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <section class="gift-wrap">
    <p class="gift-icon">✦</p>
    <p class="eyebrow">BongF Gift</p>
    <h1>Claim Your Gift</h1>
    <p class="lead">Enter your Gmail to receive an exclusive fitness gift from BongF.</p>

    <form class="gift-form" @submit.prevent="submitGift">
      <input v-model="email" type="email" placeholder="yourname@gmail.com" required />
      <button class="btn btn-primary" :disabled="loading">
        {{ loading ? 'Submitting...' : 'Claim Gift' }}
      </button>
    </form>

    <p v-if="success" class="success-text">{{ success }}</p>
    <p v-if="error" class="error-text">{{ error }}</p>
  </section>
</template>
