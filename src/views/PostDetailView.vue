<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getPostById } from '../services/repository';
import type { PostItem } from '../types/models';

const route = useRoute();
const post = ref<PostItem | null>(null);
const loading = ref(true);
const error = ref('');

const createdLabel = computed(() => {
  if (!post.value) return '';
  return new Date(post.value.createdAt).toLocaleDateString('en-US');
});

onMounted(async () => {
  loading.value = true;
  error.value = '';

  try {
    post.value = await getPostById(String(route.params.idpost));
  } catch {
    error.value = 'Failed to load post. Please refresh and try again.';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section v-if="loading" class="state-box">Loading post...</section>
  <section v-else-if="error" class="state-box">{{ error }}</section>

  <article v-else-if="post" class="detail-wrap">
    <img :src="post.image" :alt="post.title" class="detail-image" />
    <p class="eyebrow">BongF Blog • {{ createdLabel }}</p>
    <h1>{{ post.title }}</h1>
    <p class="detail-text">{{ post.description }}</p>
    <RouterLink to="/blog" class="text-link">← Back to Blog</RouterLink>
  </article>

  <section v-else class="state-box">Post not found.</section>
</template>
