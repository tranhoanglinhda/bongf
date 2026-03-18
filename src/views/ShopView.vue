<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { listProducts } from '../services/repository';
import type { ProductItem } from '../types/models';

const products = ref<ProductItem[]>([]);
const loading = ref(true);
const error = ref('');
const active = ref<'all' | 'amazon' | 'shopee'>('all');

const filteredProducts = computed(() => {
  if (active.value === 'all') return products.value;
  return products.value.filter((item) => item.shop === active.value);
});

const loadProducts = async () => {
  loading.value = true;
  error.value = '';

  try {
    products.value = await listProducts();
  } catch {
    error.value = 'Failed to load products. Please refresh and try again.';
  } finally {
    loading.value = false;
  }
};

onMounted(loadProducts);
</script>

<template>
  <section class="page-head">
    <p class="eyebrow">BongF Store</p>
    <h1>Shop</h1>
    <p class="lead">Products are organized into two marketplaces: Amazon and Shopee.</p>
  </section>

  <div class="tabs">
    <button class="tab" :class="{ active: active === 'all' }" @click="active = 'all'">All</button>
    <button class="tab" :class="{ active: active === 'amazon' }" @click="active = 'amazon'">Amazon Product</button>
    <button class="tab" :class="{ active: active === 'shopee' }" @click="active = 'shopee'">Shopee Product</button>
  </div>

  <section v-if="loading" class="state-box">Loading products...</section>
  <section v-else-if="error" class="state-box">{{ error }}</section>
  <section v-else-if="filteredProducts.length === 0" class="state-box">No products available in this category.</section>

  <section v-else class="product-grid">
    <article class="product-card" v-for="item in filteredProducts" :key="item.id">
      <img :src="item.image" :alt="item.name" class="cover" />
      <div class="body">
        <p class="label">{{ item.shop === 'amazon' ? 'Amazon' : 'Shopee' }}</p>
        <h2>{{ item.name }}</h2>
        <a :href="item.affiliateUrl" target="_blank" rel="noopener nofollow sponsored" class="btn btn-primary">
          Buy Now
        </a>
      </div>
    </article>
  </section>
</template>
