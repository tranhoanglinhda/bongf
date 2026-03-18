<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  createPost,
  createProduct,
  deletePostItem,
  deleteProductItem,
  listPosts,
  listProducts,
  logoutAdmin,
  updatePostItem,
  updateProductItem,
} from '../services/repository';
import type { PostInput, PostItem, ProductInput, ProductItem, ShopType } from '../types/models';

const router = useRouter();
const tab = ref<'posts' | 'products'>('posts');
const loading = ref(true);

const posts = ref<PostItem[]>([]);
const products = ref<ProductItem[]>([]);

const editingPostId = ref<string | null>(null);
const editingProductId = ref<string | null>(null);

const postForm = reactive<PostInput>({
  title: '',
  image: '',
  description: '',
});

const productForm = reactive<ProductInput>({
  name: '',
  image: '',
  affiliateUrl: '',
  shop: 'amazon',
});

const postSubmitLabel = computed(() => (editingPostId.value ? 'Update Post' : 'Create Post'));
const productSubmitLabel = computed(() => (editingProductId.value ? 'Update Product' : 'Create Product'));

const resetPostForm = () => {
  postForm.title = '';
  postForm.image = '';
  postForm.description = '';
  editingPostId.value = null;
};

const resetProductForm = () => {
  productForm.name = '';
  productForm.image = '';
  productForm.affiliateUrl = '';
  productForm.shop = 'amazon';
  editingProductId.value = null;
};

const loadData = async () => {
  loading.value = true;
  const [postList, productList] = await Promise.all([listPosts(), listProducts()]);
  posts.value = postList;
  products.value = productList;
  loading.value = false;
};

const submitPost = async () => {
  if (editingPostId.value) {
    await updatePostItem(editingPostId.value, { ...postForm });
  } else {
    await createPost({ ...postForm });
  }
  resetPostForm();
  await loadData();
};

const submitProduct = async () => {
  if (editingProductId.value) {
    await updateProductItem(editingProductId.value, { ...productForm });
  } else {
    await createProduct({ ...productForm });
  }
  resetProductForm();
  await loadData();
};

const editPost = (item: PostItem) => {
  editingPostId.value = item.id;
  postForm.title = item.title;
  postForm.image = item.image;
  postForm.description = item.description;
  tab.value = 'posts';
};

const editProduct = (item: ProductItem) => {
  editingProductId.value = item.id;
  productForm.name = item.name;
  productForm.image = item.image;
  productForm.affiliateUrl = item.affiliateUrl;
  productForm.shop = item.shop as ShopType;
  tab.value = 'products';
};

const removePost = async (id: string) => {
  await deletePostItem(id);
  await loadData();
};

const removeProduct = async (id: string) => {
  await deleteProductItem(id);
  await loadData();
};

const signOut = () => {
  logoutAdmin();
  router.push('/admin');
};

onMounted(loadData);
</script>

<template>
  <section class="admin-page">
    <header class="admin-top">
      <h1>Admin Dashboard</h1>
      <button class="btn btn-outline" @click="signOut">Logout</button>
    </header>

    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'posts' }" @click="tab = 'posts'">Blog Posts</button>
      <button class="tab" :class="{ active: tab === 'products' }" @click="tab = 'products'">Products</button>
    </div>

    <section v-if="loading" class="state-box">Loading data...</section>

    <section v-else class="admin-grid">
      <form v-if="tab === 'posts'" class="panel" @submit.prevent="submitPost">
        <h2>{{ editingPostId ? 'Edit Post' : 'New Post' }}</h2>
        <input v-model="postForm.title" type="text" placeholder="Title" required />
        <input v-model="postForm.image" type="url" placeholder="Image URL" required />
        <textarea v-model="postForm.description" rows="6" placeholder="Description" required />
        <div class="action-row">
          <button class="btn btn-primary" type="submit">{{ postSubmitLabel }}</button>
          <button v-if="editingPostId" class="btn btn-outline" type="button" @click="resetPostForm">Cancel</button>
        </div>
      </form>

      <form v-else class="panel" @submit.prevent="submitProduct">
        <h2>{{ editingProductId ? 'Edit Product' : 'New Product' }}</h2>
        <input v-model="productForm.name" type="text" placeholder="Product Name" required />
        <input v-model="productForm.image" type="url" placeholder="Product Image URL" required />
        <input v-model="productForm.affiliateUrl" type="url" placeholder="Affiliate URL (hidden from customer)" required />
        <select v-model="productForm.shop" required>
          <option value="amazon">Amazon</option>
          <option value="shopee">Shopee</option>
        </select>
        <div class="action-row">
          <button class="btn btn-primary" type="submit">{{ productSubmitLabel }}</button>
          <button v-if="editingProductId" class="btn btn-outline" type="button" @click="resetProductForm">Cancel</button>
        </div>
      </form>

      <div class="panel list-panel">
        <h2>{{ tab === 'posts' ? 'Post List' : 'Product List' }}</h2>

        <div v-if="tab === 'posts'" class="list-wrap">
          <article class="row-card" v-for="item in posts" :key="item.id">
            <img :src="item.image" :alt="item.title" class="thumb" />
            <div class="row-body">
              <h3>{{ item.title }}</h3>
              <p>{{ item.description.slice(0, 100) }}{{ item.description.length > 100 ? '...' : '' }}</p>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost" @click="editPost(item)">Edit</button>
              <button class="btn btn-ghost danger" @click="removePost(item.id)">Delete</button>
            </div>
          </article>
        </div>

        <div v-else class="list-wrap">
          <article class="row-card" v-for="item in products" :key="item.id">
            <img :src="item.image" :alt="item.name" class="thumb" />
            <div class="row-body">
              <h3>{{ item.name }}</h3>
              <p>{{ item.shop === 'amazon' ? 'Amazon Product' : 'Shopee Product' }}</p>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost" @click="editProduct(item)">Edit</button>
              <button class="btn btn-ghost danger" @click="removeProduct(item.id)">Delete</button>
            </div>
          </article>
        </div>
      </div>
    </section>
  </section>
</template>
