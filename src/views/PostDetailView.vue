<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import DOMPurify from 'dompurify';
import { getPostById } from '../services/repository';
import type { PostItem } from '../types/models';
import { toRenderablePostHtml } from '../utils/postContent';

const route = useRoute();
const post = ref<PostItem | null>(null);
const loading = ref(true);
const error = ref('');

const toUiErrorMessage = (unknownError: unknown, fallback: string): string => {
  if (unknownError instanceof Error && unknownError.message.trim()) {
    return `${fallback} (${unknownError.message})`;
  }
  return fallback;
};

const createdLabel = computed(() => {
  if (!post.value) return '';
  return new Date(post.value.createdAt).toLocaleDateString('en-US');
});

const safePostHtml = computed(() => {
  if (!post.value) return '';
  return DOMPurify.sanitize(toRenderablePostHtml(post.value.description));
});

onMounted(async () => {
  loading.value = true;
  error.value = '';

  try {
    post.value = await getPostById(String(route.params.idpost));
  } catch (unknownError) {
    error.value = toUiErrorMessage(unknownError, 'Failed to load post. Please refresh and try again.');
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
    <div class="detail-text" v-html="safePostHtml"></div>
    <RouterLink to="/blog" class="text-link">← Back to Blog</RouterLink>
  </article>

  <section v-else class="state-box">Post not found.</section>
</template>
