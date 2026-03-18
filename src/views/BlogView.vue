<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { listPosts } from '../services/repository';
import type { PostItem } from '../types/models';

const posts = ref<PostItem[]>([]);
const loading = ref(true);

const loadPosts = async () => {
  loading.value = true;
  posts.value = await listPosts();
  loading.value = false;
};

onMounted(loadPosts);
</script>

<template>
  <section class="page-head">
    <p class="eyebrow">BongF Journal</p>
    <h1>Blog</h1>
    <p class="lead">A place for mindful fitness articles shaped by calm, consistency, and nature.</p>
  </section>

  <section v-if="loading" class="state-box">Loading posts...</section>
  <section v-else-if="posts.length === 0" class="state-box">No posts yet. Add one from the Admin Dashboard.</section>

  <section v-else class="post-grid">
    <article class="post-card" v-for="post in posts" :key="post.id">
      <img :src="post.image" :alt="post.title" class="cover" />
      <div class="body">
        <h2>{{ post.title }}</h2>
        <p>{{ post.description.slice(0, 120) }}{{ post.description.length > 120 ? '...' : '' }}</p>
        <RouterLink :to="`/blog/${post.id}`" class="text-link">Read details</RouterLink>
      </div>
    </article>
  </section>
</template>
