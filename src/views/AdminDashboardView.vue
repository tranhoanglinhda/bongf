<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import {
  createPost,
  createProduct,
  deleteGiftEmail,
  deletePostItem,
  deleteProductItem,
  listGiftEmails,
  listPosts,
  listProducts,
  logoutAdmin,
  updatePostItem,
  updateProductItem,
} from '../services/repository';
import { uploadPostImage } from '../services/upload';
import type { GiftItem, PostInput, PostItem, ProductInput, ProductItem, ShopType } from '../types/models';
import { toPostExcerpt } from '../utils/postContent';

const router = useRouter();
const tab = ref<'posts' | 'products' | 'gifts'>('posts');
const loading = ref(false);

const posts = ref<PostItem[]>([]);
const products = ref<ProductItem[]>([]);
const gifts = ref<GiftItem[]>([]);
const postsLoaded = ref(false);
const productsLoaded = ref(false);
const giftsLoaded = ref(false);

const editingPostId = ref<string | null>(null);
const editingProductId = ref<string | null>(null);
const postImageMode = ref<'url' | 'upload'>('url');
const postImageFile = ref<File | null>(null);
const postImagePreview = ref('');
const postSubmitting = ref(false);
const productSubmitting = ref(false);
const postError = ref('');
const productError = ref('');
const dashboardError = ref('');
const previewObjectUrl = ref<string | null>(null);
const postEditorRef = ref<InstanceType<typeof QuillEditor> | null>(null);
const postEditorImageUploading = ref(false);

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
const POST_DESCRIPTION_SAFE_LIMIT_BYTES = 900_000;

const isRichTextEmpty = (value: string): boolean => {
  const plain = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length === 0;
};

const getUtf8ByteLength = (value: string): number => new Blob([value]).size;

const createImageFileFromDataUrl = async (dataUrl: string): Promise<File> => {
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
  return new File([blob], `embedded-image.${extension}`, { type: blob.type || 'image/jpeg' });
};

const normalizePostDescription = async (content: string): Promise<string> => {
  if (typeof window === 'undefined') return content;

  const parser = new DOMParser();
  const document = parser.parseFromString(content, 'text/html');
  const images = Array.from(document.querySelectorAll('img'));

  for (const image of images) {
    const source = image.getAttribute('src') ?? '';
    if (!source.startsWith('data:')) continue;

    const file = await createImageFileFromDataUrl(source);
    const uploadedUrl = await uploadPostImage(file, { allowInlineFallback: false });
    image.setAttribute('src', uploadedUrl);
  }

  return document.body.innerHTML;
};

const insertImageIntoPostEditor = async () => {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*';

  picker.onchange = async () => {
    const selected = picker.files?.[0] ?? null;
    if (!selected) return;
    if (postEditorImageUploading.value) return;

    postEditorImageUploading.value = true;
    postError.value = '';

    try {
      const imageUrl = await uploadPostImage(selected, { allowInlineFallback: false });
      const editor = postEditorRef.value?.getQuill();
      if (!editor) {
        postError.value = 'Editor is not ready yet. Please try inserting the image again.';
        return;
      }

      const range = editor.getSelection(true);
      const index = range?.index ?? editor.getLength();
      editor.insertEmbed(index, 'image', imageUrl, 'user');
      editor.setSelection(index + 1, 0, 'user');
    } catch (error) {
      postError.value = toUiErrorMessage(error, 'Image upload failed. Please try again.');
    } finally {
      postEditorImageUploading.value = false;
    }
  };

  picker.click();
};

const postEditorToolbar = {
  container: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['blockquote', 'link', 'image'],
    ['clean'],
  ],
  handlers: {
    image: () => {
      void insertImageIntoPostEditor();
    },
  },
};

const getPostExcerpt = (description: string): string => toPostExcerpt(description, 100);

const toUiErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) {
    return `${fallback} (${error.message})`;
  }
  return fallback;
};

const resetPostForm = () => {
  postForm.title = '';
  postForm.image = '';
  postForm.description = '';
  postImageMode.value = 'url';
  postImageFile.value = null;
  postImagePreview.value = '';
  postError.value = '';

  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = null;
  }

  editingPostId.value = null;
};

const resetProductForm = () => {
  productForm.name = '';
  productForm.image = '';
  productForm.affiliateUrl = '';
  productForm.shop = 'amazon';
  productError.value = '';
  editingProductId.value = null;
};

const loadPostsData = async (force = false, withLoader = true) => {
  if (!force && postsLoaded.value) return;
  if (withLoader) loading.value = true;

  try {
    posts.value = await listPosts();
    postsLoaded.value = true;
  } catch (error) {
    dashboardError.value = toUiErrorMessage(error, 'Failed to load blog posts. Please refresh and try again.');
  } finally {
    if (withLoader) loading.value = false;
  }
};

const loadProductsData = async (force = false, withLoader = true) => {
  if (!force && productsLoaded.value) return;
  if (withLoader) loading.value = true;

  try {
    products.value = await listProducts();
    productsLoaded.value = true;
  } catch (error) {
    dashboardError.value = toUiErrorMessage(error, 'Failed to load products. Please refresh and try again.');
  } finally {
    if (withLoader) loading.value = false;
  }
};

const loadGiftsData = async (force = false, withLoader = true) => {
  if (!force && giftsLoaded.value) return;
  if (withLoader) loading.value = true;

  try {
    gifts.value = await listGiftEmails();
    giftsLoaded.value = true;
  } catch (error) {
    dashboardError.value = toUiErrorMessage(error, 'Failed to load gift emails. Please refresh and try again.');
  } finally {
    if (withLoader) loading.value = false;
  }
};

const ensureTabData = async (currentTab: 'posts' | 'products' | 'gifts') => {
  dashboardError.value = '';

  if (currentTab === 'posts') {
    await loadPostsData(false, true);
    return;
  }

  if (currentTab === 'products') {
    await loadProductsData(false, true);
    return;
  }

  await loadGiftsData(false, true);
};

const submitPost = async () => {
  if (postSubmitting.value) return;
  if (postEditorImageUploading.value) {
    postError.value = 'Please wait for the editor image upload to finish.';
    return;
  }
  postError.value = '';
  postSubmitting.value = true;

  try {
    let imageUrl = postForm.image.trim();

    try {
      if (postImageMode.value === 'upload' && postImageFile.value) {
        imageUrl = await uploadPostImage(postImageFile.value);
      }
    } catch (error) {
      postError.value = toUiErrorMessage(error, 'Image upload failed. Please try again or use image URL mode.');
      return;
    }

    if (!imageUrl) {
      postError.value = 'Please provide an image URL or upload an image file.';
      return;
    }

    if (isRichTextEmpty(postForm.description)) {
      postError.value = 'Please add post content before saving.';
      return;
    }

    const normalizedDescription = await normalizePostDescription(postForm.description);
    const normalizedSize = getUtf8ByteLength(normalizedDescription);
    if (normalizedSize > POST_DESCRIPTION_SAFE_LIMIT_BYTES) {
      postError.value = 'Post content is still too large after optimizing images. Please shorten the content.';
      return;
    }

    const payload: PostInput = {
      ...postForm,
      description: normalizedDescription,
      image: imageUrl,
    };

    try {
      if (editingPostId.value) {
        await updatePostItem(editingPostId.value, payload);
      } else {
        await createPost(payload);
      }
    } catch (error) {
      postError.value = toUiErrorMessage(error, 'Failed to save post. Please check Firebase rules or try again.');
      return;
    }

    resetPostForm();
    await loadPostsData(true, false);
  } finally {
    postSubmitting.value = false;
  }
};

const onPostImageChange = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const selectedFile = target.files?.[0] ?? null;
  postImageFile.value = selectedFile;

  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
    previewObjectUrl.value = null;
  }

  if (!selectedFile) {
    postImagePreview.value = '';
    return;
  }

  previewObjectUrl.value = URL.createObjectURL(selectedFile);
  postImagePreview.value = previewObjectUrl.value;
};

const submitProduct = async () => {
  if (productSubmitting.value) return;
  productError.value = '';
  productSubmitting.value = true;

  try {
    try {
      if (editingProductId.value) {
        await updateProductItem(editingProductId.value, { ...productForm });
      } else {
        await createProduct({ ...productForm });
      }
    } catch (error) {
      productError.value = toUiErrorMessage(error, 'Failed to save product. Please check Firebase rules or try again.');
      return;
    }

    resetProductForm();
    await loadProductsData(true, false);
  } finally {
    productSubmitting.value = false;
  }
};

const editPost = (item: PostItem) => {
  editingPostId.value = item.id;
  postForm.title = item.title;
  postForm.image = item.image;
  postForm.description = item.description;
  postImageMode.value = 'url';
  postImageFile.value = null;
  postImagePreview.value = item.image;
  postError.value = '';
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
  await loadPostsData(true, false);
};

const removeProduct = async (id: string) => {
  await deleteProductItem(id);
  await loadProductsData(true, false);
};

const removeGift = async (id: string) => {
  await deleteGiftEmail(id);
  await loadGiftsData(true, false);
};

const formatGiftDate = (dateText: string): string =>
  new Date(dateText).toLocaleString('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const signOut = () => {
  logoutAdmin();
  router.push('/admin4869');
};

onUnmounted(() => {
  if (previewObjectUrl.value) {
    URL.revokeObjectURL(previewObjectUrl.value);
  }
});

watch(tab, (nextTab) => {
  void ensureTabData(nextTab);
});

onMounted(async () => {
  await ensureTabData('posts');
});
</script>

<template>
  <section class="admin-page">
    <nav class="admin-navbar">
      <div class="admin-navbar-links">
        <button class="tab" :class="{ active: tab === 'posts' }" @click="tab = 'posts'">Blog Posts</button>
        <button class="tab" :class="{ active: tab === 'products' }" @click="tab = 'products'">Products</button>
        <button class="tab" :class="{ active: tab === 'gifts' }" @click="tab = 'gifts'">Gift Emails</button>
      </div>

      <div class="admin-navbar-links">
        <RouterLink to="/" class="btn btn-outline">View Website</RouterLink>
      </div>
    </nav>

    <header class="admin-top">
      <h1>Admin Dashboard</h1>
      <button class="btn btn-outline" @click="signOut">Logout</button>
    </header>

    <section v-if="dashboardError" class="state-box">{{ dashboardError }}</section>

    <section class="admin-grid">
      <form v-if="tab === 'posts'" class="panel" @submit.prevent="submitPost">
        <h2>{{ editingPostId ? 'Edit Post' : 'New Post' }}</h2>
        <input v-model="postForm.title" type="text" placeholder="Title" required />

        <div class="media-picker">
          <p class="picker-label">Post Image</p>
          <div class="tabs picker-tabs">
            <button
              class="tab"
              :class="{ active: postImageMode === 'url' }"
              type="button"
              @click="postImageMode = 'url'"
            >
              Image URL
            </button>
            <button
              class="tab"
              :class="{ active: postImageMode === 'upload' }"
              type="button"
              @click="postImageMode = 'upload'"
            >
              Upload from device
            </button>
          </div>

          <input
            v-if="postImageMode === 'url'"
            v-model="postForm.image"
            type="url"
            placeholder="https://example.com/post-image.jpg"
          />
          <input v-else type="file" accept="image/*" @change="onPostImageChange" />

          <img
            v-if="postImageMode === 'upload' && postImagePreview"
            :src="postImagePreview"
            alt="Post preview"
            class="upload-preview"
          />
        </div>

        <div class="editor-wrap">
          <p class="picker-label">Post Content</p>
          <QuillEditor
            ref="postEditorRef"
            v-model:content="postForm.description"
            content-type="html"
            theme="snow"
            :toolbar="postEditorToolbar"
            placeholder="Write your post content here..."
          />
          <p class="editor-hint">Use the toolbar to format text, add links, and insert images.</p>
        </div>
        <p v-if="postError" class="error-text">{{ postError }}</p>
        <div class="action-row">
          <button class="btn btn-primary" type="submit" :disabled="postSubmitting || postEditorImageUploading">
            {{ postSubmitting ? 'Processing...' : postEditorImageUploading ? 'Uploading image...' : postSubmitLabel }}
          </button>
          <button v-if="editingPostId" class="btn btn-outline" type="button" :disabled="postSubmitting" @click="resetPostForm">Cancel</button>
        </div>
      </form>

      <form v-else-if="tab === 'products'" class="panel" @submit.prevent="submitProduct">
        <h2>{{ editingProductId ? 'Edit Product' : 'New Product' }}</h2>
        <input v-model="productForm.name" type="text" placeholder="Product Name" required />
        <input v-model="productForm.image" type="url" placeholder="Product Image URL" required />
        <input v-model="productForm.affiliateUrl" type="url" placeholder="Affiliate URL (hidden from customer)" required />
        <select v-model="productForm.shop" required>
          <option value="amazon">Amazon</option>
          <option value="shopee">Shopee</option>
        </select>
        <p v-if="productError" class="error-text">{{ productError }}</p>
        <div class="action-row">
          <button class="btn btn-primary" type="submit" :disabled="productSubmitting">
            {{ productSubmitting ? 'Processing...' : productSubmitLabel }}
          </button>
          <button v-if="editingProductId" class="btn btn-outline" type="button" :disabled="productSubmitting" @click="resetProductForm">Cancel</button>
        </div>
      </form>

      <section v-else class="panel gifts-panel">
        <h2>Gift Data</h2>
        <p>Customers who submitted Gmail in the Gift section will appear in the list.</p>
      </section>

      <div class="panel list-panel">
        <h2>{{ tab === 'posts' ? 'Post List' : tab === 'products' ? 'Product List' : 'Gift Email List' }}</h2>

        <p v-if="loading" class="state-box">Loading {{ tab === 'posts' ? 'posts' : tab === 'products' ? 'products' : 'gift emails' }}...</p>

        <div v-else-if="tab === 'posts'" class="list-wrap">
          <p v-if="posts.length === 0" class="state-box">No blog posts yet. Create one from the form.</p>
          <article class="row-card" v-for="item in posts" :key="item.id">
            <img :src="item.image" :alt="item.title" class="thumb" />
            <div class="row-body">
              <h3>{{ item.title }}</h3>
              <p>{{ getPostExcerpt(item.description) }}</p>
            </div>
            <div class="row-actions">
              <button class="btn btn-ghost" @click="editPost(item)">Edit</button>
              <button class="btn btn-ghost danger" @click="removePost(item.id)">Delete</button>
            </div>
          </article>
        </div>

        <div v-else-if="tab === 'products'" class="list-wrap">
          <p v-if="products.length === 0" class="state-box">No products yet. Create one from the form.</p>
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

        <div v-else class="list-wrap">
          <article class="row-card gift-row" v-for="item in gifts" :key="item.id">
            <div class="row-body gift-body">
              <h3>{{ item.email }}</h3>
              <p>Submitted: {{ formatGiftDate(item.createdAt) }}</p>
            </div>
            <div class="row-actions gift-actions">
              <button class="btn btn-ghost danger" @click="removeGift(item.id)">Delete</button>
            </div>
          </article>

          <p v-if="gifts.length === 0" class="state-box">No Gmail data submitted yet.</p>
        </div>
      </div>
    </section>
  </section>
</template>
