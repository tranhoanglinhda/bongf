# BongF - Vintage Nature Fitness Web

Website Vue 3 cho hệ thống khách hàng + quản trị viên:

- Khách: `abc.com`
- Admin: `abc.com/admin`

## Stack

- Vue 3 + TypeScript + Vite
- Vue Router
- Firebase Firestore (posts, products, gifts)

## Tinh nang

- Customer pages:
	- `/` Home
	- `/blog` Danh sach bai viet
	- `/blog/:idpost` Chi tiet bai viet
	- `/shop` Product tabs (Amazon / Shopee)
	- `/gift` Nhan qua bang Gmail
- Admin pages:
	- `/admin` Dang nhap admin (email/password)
	- `/admin/dashboard` CRUD Blog + Product

## Firebase Collections

- `posts`: title, image, description, createdAt
- `products`: name, image, affiliateUrl, shop, createdAt
- `gifts`: email, createdAt

## Cau hinh moi truong

1. Tao file `.env` tu `.env.example`.
2. Dien thong tin Firebase va tai khoan admin.

Neu chua co Firebase config, app se fallback sang localStorage de demo giao dien va luong CRUD.

## Chay du an

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy Vercel

- Framework preset: `Vite`
- Build command: `npm run build`
- Output directory: `dist`
- Them cac bien moi truong trong Vercel theo `.env.example`
