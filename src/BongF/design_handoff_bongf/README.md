
# Handoff: BongF — Fitness & Cooking Redesign (port vào Vue 3)

## Overview
Đây là bản thiết kế lại toàn bộ web **BongF** ("Vintage Nature Fitness") theo hướng
**Fitness + Cooking + Linktree affiliate**. Gói này chứa các file **prototype HTML/React**
mô tả giao diện & hành vi mong muốn. Mục tiêu của bạn: **dựng lại các thiết kế này trong
repo Vue 3 + TypeScript + Vite + Firebase hiện có** (`tranhoanglinhda/bongf`), dùng đúng
các pattern sẵn có (Vue Router, SFC `.vue`, `src/style.css`, `repository.ts`).

> ⚠️ **Đừng copy thẳng file React vào repo.** Prototype viết bằng React chỉ để tham chiếu.
> Phần dùng lại được gần như 100% là **CSS** và **cấu trúc markup + class names**.

## Fidelity
**Hi-fi.** Màu, font, spacing, bo góc, shadow, hover state đều là giá trị cuối cùng.
Hãy dựng lại pixel-perfect. Tất cả token nằm trong `app.css` (`:root`), trùng khớp với
`src/style.css` gốc của bạn (cùng biến `--mint`, `--ink`, `--paper`, `--line`, `--muted`...).

---

## Cách port nhanh nhất (khuyến nghị)

### Bước 1 — CSS dùng lại nguyên vẹn
`app.css` là **framework-agnostic**. Mở `app.css`, copy toàn bộ vào `src/style.css`
(thay thế phần cũ, hoặc merge — các biến token đã tương thích). Đây là 80% công sức thiết kế.
Tất cả class (`.hero`, `.card`, `.step`, `.link-row`, `.admin-*`...) sẽ hoạt động ngay
khi markup Vue dùng đúng class.

### Bước 2 — Map component React → Vue View/Component
| Prototype (React) | File Vue tương ứng | Ghi chú |
|---|---|---|
| `Home` (screens.jsx) | `src/views/HomeView.vue` | hero + featured workout + recipes + shop teaser |
| `Workouts` + `WorkoutCard` | `src/views/WorkoutListView.vue` | thay cho phần Blog/Exercise |
| `WorkoutDetail` | `src/views/WorkoutDetailView.vue` | route `/workouts/:id` |
| `Recipes` + `RecipeCard` | `src/views/RecipeListView.vue` | route `/recipes` |
| `RecipeDetail` | `src/views/RecipeDetailView.vue` | route `/recipes/:id` |
| `Shop` (linktree) | `src/views/ShopView.vue` | thay tab Amazon/Shopee bằng 5 danh mục |
| `AdminLogin` | `src/views/AdminLoginView.vue` | đã có sẵn, chỉ đổi nội dung |
| `AdminDashboard` | `src/views/AdminDashboardView.vue` | đổi 3 tab → Bài tập / Công thức / Link |
| `Header` / `Footer` | `src/components/SiteHeader.vue` / `SiteFooter.vue` | đã có, cập nhật nav |
| Tweaks panel | (bỏ) | chỉ là công cụ xem thử của prototype, KHÔNG đưa vào production |

### Bước 3 — Chuyển JSX → template Vue
Quy tắc dịch máy móc:
- `className=` → `class=`
- `onClick={fn}` → `@click="fn"`
- `{items.map(x => <Card .../>)}` → `<Card v-for="x in items" :key="x.id" />`
- `useState` → `ref()` / `reactive()`
- `style={{a:1}}` → `:style="{ a: 1 }"`
- icon inline SVG: copy nguyên `<svg>...</svg>` vào component Vue (xem `components.jsx` object `I`).

---

## Screens / Views (chi tiết)

### 1. Home (`HomeView.vue`)
- **Layout:** `.shell` (max-width 1200px, viền 2 bên) → `.page-wrap` (padding 28px).
- **Hero** `.hero`: ảnh nền full-cover + lớp phủ tối `.hero-overlay`
  (`linear-gradient(to top, rgba(8,12,11,.86), .42 46%, .14 100%)`), nội dung trắng.
  - eyebrow (mint, uppercase, letter-spacing .2em) · h1 Cinzel `clamp(40px,6.4vw,78px)`,
    `<em>` đổi màu mint · lead trắng 86% · 2 nút (primary mint + outline) · hàng 3 stat.
- **Section "Bài tập nổi bật":** 1 card lớn 2 cột (ảnh trái / nội dung phải) → click sang detail.
- **Section "Công thức được yêu thích":** grid 3 cột `RecipeCard`.
- **Section "Sản phẩm tuyển chọn":** 3 card danh mục → click mở Shop theo category.

### 2. Workout List (`WorkoutListView.vue`)
- Tiêu đề Cinzel + lead. Hàng chip lọc cấp độ: `Tất cả / Dễ / Trung bình / Khó` (`.chip.active`).
- Grid 3 cột `.card.clickable`: ảnh 4:3 + badge thời lượng (góc trái) + badge cấp độ (góc phải),
  body có kicker (tên EN), h3 (tên VN), mô tả, meta-row (kcal / focus / level dots).

### 3. Workout Detail (`WorkoutDetailView.vue`)
- `.detail-hero` (ảnh + overlay, cao 380px) với eyebrow, h1, meta-row.
- `.detail-grid` 2 cột (1.55fr / 1fr):
  - **Trái** `.panel` "Các động tác": list `.step` (số tròn 40px + tên + mô tả + giá trị reps/giây).
    Bấm số → đánh dấu hoàn thành (đổi nền mint + dấu check). Đếm "Hoàn thành X/N".
  - **Phải** (sticky top 92px): panel "Tổng quan" 4 ô `.stat-tile` (kcal/phút/động tác/cấp độ);
    panel "Dụng cụ" (tag-pill) + mẹo + nút "Lưu buổi tập".

### 4. Recipe List & Detail
- List: như Workout nhưng lọc theo bữa (`Bữa sáng/trưa/tối/Đồ uống`), meta = kcal + số phần.
- Detail: trái = "Cách làm" (steps đánh số, không cột giá trị); phải = "Nguyên liệu"
  (list `.ingredient` có ô tick — bấm để gạch ngang `line-through`), panel "Dinh dưỡng" (3 ô).

### 5. Shop / Linktree (`ShopView.vue`)
- `.profile-head`: avatar tròn 104px, tên Cinzel, `@handle` (mint), bio, 4 icon mạng xã hội.
- Hàng chip lọc: `Tất cả` + 5 danh mục (có icon).
- Mỗi danh mục: `.cat-head` (icon + tên + số sản phẩm) rồi list `.link-row` rộng tối đa 620px:
  ảnh 60px + tên + ghi chú + `.shop-badge` (amazon/shopee/lazada/tiktok, mỗi sàn 1 màu) + giá +
  nút tròn mũi tên. `target="_blank" rel="noopener nofollow sponsored"` cho link affiliate thật.

### 6. Admin Dashboard (`AdminDashboardView.vue`)
- `.admin-bar`: tiêu đề + nút "Xem website" + "Đăng xuất".
- `.admin-tabs`: 3 tab **Bài tập / Công thức / Link affiliate** (kèm số lượng).
- `.admin-grid` 2 cột: form (trái, sticky) + danh sách (phải).
  - Form đổi field theo tab (xem `admin.jsx` để biết đủ field từng loại).
  - Danh sách `.admin-row`: thumbnail + tên + meta + nút sửa (pencil) / xoá (trash).
- Nút "Thêm" / "Cập nhật" (khi đang sửa hiện thêm nút "Huỷ").

---

## Interactions & Behavior
- **Điều hướng:** SPA. Trong Vue dùng **Vue Router** thay cho `route` state thủ công.
  Routes gợi ý: `/`, `/workouts`, `/workouts/:id`, `/recipes`, `/recipes/:id`, `/shop`
  (+ `?cat=` để mở sẵn 1 danh mục), `/admin`, `/admin/dashboard`.
- **Hover:** card nâng `translateY(-4px)` + shadow đậm + ảnh `scale(1.05)`; nút `translateY(-2px)`.
- **Animation vào trang:** `.fade-in` (`fadeUp` 0.5s) — có thể giữ hoặc bỏ.
- **Toggle states:** step hoàn thành, ingredient đã chuẩn bị → lưu cục bộ trong component.
- **Responsive:** 1200 → 900 (admin-grid 1 cột) → 760 (menu thu gọn nút hamburger) → 520/390.

## State Management
- **Public:** dữ liệu workouts/recipes/links đọc từ Firestore qua `repository.ts`.
- **Admin:** CRUD ghi Firestore (đã có `createPost/updatePostItem/deletePostItem` v.v. — đổi tên/clone cho 3 collection mới).
- **Auth admin:** giữ `loginAdmin()` hiện có.

### Firestore — đề xuất đổi data model
File `src/types/models.ts` thay/bổ sung:
```ts
export interface WorkoutItem { id; vi; title; cover; level: 1|2|3; levelLabel; duration; kcal; focus; blurb;
  tags: string[]; equipment: string[]; steps: { name; note; val; unit }[]; createdAt }
export interface RecipeItem  { id; vi; title; cover; meal; time; servings; kcal; blurb;
  tags: string[]; ingredients: { name; amt }[]; steps: { name; note }[]; createdAt }
export interface LinkItem    { id; name; cat: 'apparel'|'kitchen'|'spices'|'skincare'|'supplement';
  shop: 'shopee'|'amazon'|'lazada'|'tiktok'; price; note; thumb; affiliateUrl; createdAt }
```
Collections gợi ý: `workouts`, `recipes`, `links`. (Có thể bỏ `gifts` nếu không dùng.)
Xem cấu trúc dữ liệu mẫu đầy đủ trong `data.js`.

---

## Design Tokens (từ `app.css :root`)
| Token | Giá trị |
|---|---|
| `--mint` / accent | `#33ffcc` |
| `--accent-deep` | `#0d7d63` (mint đậm cho text trên nền sáng) |
| `--ink` | `#0f1113` |
| `--paper` / `--paper-deep` | `#f8f8f5` / `#f0f0eb` |
| `--line` | `#d9d9d2` |
| `--muted` | `#5f6468` |
| `--shadow` | `0 14px 40px rgba(15,17,19,.08)` |
| `--shadow-lg` | `0 28px 70px rgba(15,17,19,.14)` |
| `--radius` / `--radius-lg` | `14px` / `22px` |
| Font display | `Cinzel` (serif) — tiêu đề |
| Font body | `Plus Jakarta Sans` |
| Dark mode | thêm class `dark` lên `<body>` (xem block `body.dark` trong CSS) |
| Badge sàn | amazon `#fff3e0/#b85c00` · shopee `#ffece4/#d8500f` · lazada `#eef0ff/#2c3bb0` · tiktok `#eef7f5/#0d7d63` |

## Assets
- **Ảnh:** tất cả là Unsplash (URL trong `data.js` + hero trong `screens.jsx`/`Shop`).
  Khi lên production nên thay bằng ảnh thật của bạn (upload Firebase Storage như repo đang làm).
- **Icon:** SVG inline, không cần thư viện ngoài. Toàn bộ trong object `I` của `components.jsx` —
  copy thẳng từng `<svg>` vào Vue.
- **Font:** Google Fonts import sẵn ở đầu `app.css` (Cinzel + Plus Jakarta Sans + Fraunces).

## Files trong gói này
- `app.css` — **stylesheet hoàn chỉnh, dùng lại trực tiếp** (quan trọng nhất).
- `screens.jsx` — markup + logic Home / Workouts / Recipes / Shop (tham chiếu cấu trúc).
- `admin.jsx` — markup + logic Admin login & dashboard CRUD.
- `components.jsx` — Header, Footer, bộ icon SVG (object `I`), component `Img` fallback.
- `data.js` — dữ liệu mẫu đầy đủ (dùng để seed Firestore & xem schema).
- `app.jsx` — cách ghép router + tweaks (chỉ tham chiếu; Vue dùng Vue Router).
- `BongF Fitness & Cooking.html` — mở file này bằng trình duyệt để xem prototype chạy thật.
