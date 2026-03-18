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

## Spark Free Mode (Khuyen nghi)

- Giu project o Firebase Spark (free) va khong nang cap Blaze neu chua can.
- Dat canh bao usage trong Firebase Console de theo doi read/write.
- App da duoc toi uu de giam read:
	- Khong preload tab admin o background.
	- Query list co `limit` (mac dinh 50, doi bang `VITE_FIRESTORE_LIST_LIMIT`).
	- Co cache ngan han trong runtime de tranh goi lap lai lien tuc.

## Cau hinh moi truong

1. Tao file `.env` tu `.env.example`.
2. Dien thong tin Firebase va tai khoan admin.
3. Khoi dong lai dev server sau khi cap nhat `.env`.

### Kiem tra nhanh Firebase da ket noi chua

- Neu Console in ra: `Firebase config is missing. Falling back to localStorage mode.` thi app dang chay localStorage.
- Neu khong co canh bao tren va CRUD tao duoc bai viet, du lieu se luu tren Firestore collection `posts`.

### Firestore Rules (de test nhanh)

Neu da co config Firebase nhung van khong luu duoc bai viet, kha nang cao la bi chan boi Security Rules. Co the tam thoi dung rules test:

```txt
rules_version = '2';
service cloud.firestore {
	match /databases/{database}/documents {
		match /posts/{document=**} {
			allow read, write: if true;
		}
		match /products/{document=**} {
			allow read, write: if true;
		}
		match /gifts/{document=**} {
			allow read, write: if true;
		}
	}
}
```

Luu y: rules tren chi nen dung de test nhanh, sau do can siet lai theo auth/role.

### Storage Rules (de upload anh test nhanh)

```txt
rules_version = '2';
service firebase.storage {
	match /b/{bucket}/o {
		match /posts/{allPaths=**} {
			allow read, write: if true;
		}
	}
}
```

Luu y: rules tren chi nen dung de test nhanh, sau do can siet lai theo auth/role.

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
