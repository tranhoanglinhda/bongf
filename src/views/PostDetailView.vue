<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { getPostById } from '../services/repository';
import type { PostItem } from '../types/models';

const route = useRoute();
const post = ref<PostItem | null>(null);
const loading = ref(true);

const createdLabel = computed(() => {
  if (!post.value) return '';
  return new Date(post.value.createdAt).toLocaleDateString('en-US');
});

onMounted(async () => {
  loading.value = true;
  post.value = await getPostById(String(route.params.idpost));
  loading.value = false;
});
</script>

<template>
  <section v-if="loading" class="state-box">Loading post...</section>

  <article v-else-if="post" class="detail-wrap">
    <img :src="post.image" :alt="post.title" class="detail-image" />
    <p class="eyebrow">BongF Blog • {{ createdLabel }}</p>
    <h1>{{ post.title }}</h1>
    <p class="detail-text">{{ post.description }}</p>
    <RouterLink to="/blog" class="text-link">← Back to Blog</RouterLink>
  </article>

  <section v-else class="state-box">Post not found.</section>
</template>
