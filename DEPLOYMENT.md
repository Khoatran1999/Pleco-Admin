# 🚀 Hướng Dẫn Deploy FishMarket Pro Dashboard

## 📋 Tổng Quan Kiến Trúc

```
┌─────────────────────────────────────────┐
│              VERCEL                      │
│  ┌─────────────┐    ┌─────────────┐     │
│  │  Frontend   │───▶│  Backend    │     │
│  │  (Static)   │    │ (Serverless)│     │
│  └─────────────┘    └──────┬──────┘     │
└────────────────────────────┼────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │    Supabase     │
                    │   (Database)    │
                    └─────────────────┘
```

**Tất cả trên 1 platform Vercel:**

- Frontend: Static files (Vite build)
- Backend: Serverless Functions (Express)
- Database: Supabase (PostgreSQL)

---

## 1️⃣ Chuẩn Bị Supabase

### Đã có Supabase project? → Bỏ qua bước này

### Chưa có? Tạo mới:

1. Truy cập [supabase.com](https://supabase.com)
2. **New Project** → Chọn region gần nhất
3. Vào **SQL Editor** → Chạy file `database/schema.postgresql.sql`
4. Vào **Settings → API** → Lưu:
   - `Project URL`
   - `anon public key`
   - `service_role key`

---

## 2️⃣ Deploy lên Vercel (1 click!)

### Bước 1: Push code lên GitHub

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Bước 2: Import vào Vercel

1. Truy cập [vercel.com](https://vercel.com) → Đăng nhập với GitHub
2. Click **Add New** → **Project**
3. Chọn repo `fishmarket-pro-dashboard`
4. **KHÔNG thay đổi gì** - Vercel sẽ tự detect từ `vercel.json`

### Bước 3: Thêm Environment Variables

Trong màn hình deploy, expand **Environment Variables** và thêm:

| Name                   | Value                            |
| ---------------------- | -------------------------------- |
| `SUPABASE_URL`         | `https://xxx.supabase.co`        |
| `SUPABASE_KEY`         | `eyJhbGci...` (anon key)         |
| `SUPABASE_SERVICE_KEY` | `eyJhbGci...` (service role key) |
| `JWT_SECRET`           | `your-secret-min-32-chars`       |
| `JWT_EXPIRES_IN`       | `24h`                            |
| `NODE_ENV`             | `production`                     |

### Bước 4: Deploy!

Click **Deploy** → Đợi 2-3 phút

### Bước 5: Test

Truy cập URL Vercel cung cấp và đăng nhập:

```
Email: admin@fishmarket.com
Password: admin123
```

---

## 🔧 Cấu Trúc Project cho Vercel

```
fishmarket-pro-dashboard/
├── vercel.json          # Vercel configuration
├── api/
│   └── index.js         # Serverless entry point → Express app
├── frontend/
│   ├── .env.production  # VITE_API_URL=/api
│   └── dist/            # Build output (static files)
└── backend/
    └── src/
        └── server.js    # Express app (exported as module)
```

---

## 📡 API Routing trên Vercel

| Request                                 | Được route đến                   |
| --------------------------------------- | -------------------------------- |
| `https://app.vercel.app/`               | `frontend/dist/index.html`       |
| `https://app.vercel.app/dashboard`      | `frontend/dist/index.html` (SPA) |
| `https://app.vercel.app/api/auth/login` | `api/index.js` → Express         |
| `https://app.vercel.app/api/fishes`     | `api/index.js` → Express         |

---

## 🔧 Troubleshooting

### Build failed: "Cannot find module"

```bash
# Đảm bảo dependencies đã được cài trong root
npm install
```

### API returns 500

- Kiểm tra Environment Variables trong Vercel Dashboard
- Xem logs: **Vercel Dashboard → Project → Functions tab**

### CORS Error

- Không cần cấu hình CORS vì FE và BE cùng domain!

### Database connection failed

- Kiểm tra `SUPABASE_URL` và `SUPABASE_SERVICE_KEY` đúng chưa
- Đảm bảo Supabase project không bị pause

### Cold start chậm

- Serverless functions cần ~1-2s khởi động lần đầu
- Upgrade Vercel Pro để warm functions

---

## 📊 Chi Phí

| Service  | Free Tier    | Giới hạn                              |
| -------- | ------------ | ------------------------------------- |
| Vercel   | Hobby (Free) | 100GB bandwidth, 100 hours serverless |
| Supabase | Free         | 500MB database, 2GB bandwidth         |

**→ Hoàn toàn MIỄN PHÍ cho project nhỏ/trung bình!**

---

## 🔄 Auto Deploy

Mỗi khi push code lên GitHub → Vercel tự động:

1. Pull code mới
2. Build frontend
3. Deploy serverless functions
4. Update production

**Zero downtime deployment!**

---

## 📝 Checklist

- [ ] Supabase project đã có schema
- [ ] Push code lên GitHub
- [ ] Import project vào Vercel
- [ ] Thêm 6 environment variables
- [ ] Deploy thành công
- [ ] Test đăng nhập
- [ ] Test tạo đơn hàng
