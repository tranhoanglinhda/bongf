<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { listPosts } from '../services/repository';
import type { PostCategory, PostItem } from '../types/models';
import { POST_CATEGORY_FILTERS, getPostCategoryLabel } from '../utils/postCategories';
import { toPostExcerpt } from '../utils/postContent';

const posts = ref<PostItem[]>([]);
const loading = ref(true);
const error = ref('');
const activeCategory = ref<PostCategory | 'all'>('all');

const filteredPosts = computed(() =>
  activeCategory.value === 'all'
    ? posts.value
    : posts.value.filter((post) => post.category === activeCategory.value),
);

const toUiErrorMessage = (unknownError: unknown, fallback: string): string => {
  if (unknownError instanceof Error && unknownError.message.trim()) {
    return `${fallback} (${unknownError.message})`;
  }
  return fallback;
};

const loadPosts = async () => {
  loading.value = true;
  error.value = '';

  try {
    posts.value = await listPosts();
  } catch (unknownError) {
    error.value = toUiErrorMessage(unknownError, 'Failed to load posts. Please refresh and try again.');
  } finally {
    loading.value = false;
  }
};

const getPostExcerpt = (content: string): string => toPostExcerpt(content, 120);

onMounted(loadPosts);
</script>

<template>
  <section class="page-head">
    <p class="eyebrow">BongF Journal</p>
    <h1>Blog</h1>
    <p class="lead">A place for mindful fitness articles shaped by calm, consistency, and nature.</p>
  </section>

  <section v-if="loading" class="state-box">Loading posts...</section>
  <section v-else-if="error" class="state-box">{{ error }}</section>
  <section v-else-if="posts.length === 0" class="state-box">No posts yet. Add one from the Admin Dashboard.</section>

  <section v-else class="category-bar">
    <button
      v-for="filter in POST_CATEGORY_FILTERS"
      :key="filter.value"
      type="button"
      class="category-chip"
      :class="{ active: activeCategory === filter.value }"
      @click="activeCategory = filter.value"
    >
      {{ filter.label }}
    </button>
  </section>

  <section v-if="!loading && !error && posts.length > 0 && filteredPosts.length === 0" class="state-box">
    No posts found in this category.
  </section>

  <section v-else-if="!loading && !error && filteredPosts.length > 0" class="post-grid">
    <article class="post-card" v-for="post in filteredPosts" :key="post.id">
      <img :src="post.image" :alt="post.title" class="cover" />
      <div class="body">
        <p class="post-category">{{ getPostCategoryLabel(post.category) }}</p>
        <h2>{{ post.title }}</h2>
        <p>{{ getPostExcerpt(post.description) }}</p>
        <RouterLink :to="`/blog/${post.id}`" class="text-link">Read details</RouterLink>
      </div>
    </article>
  </section>
</template>
