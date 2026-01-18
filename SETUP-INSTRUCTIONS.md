# 🚀 Setup Instructions - Supabase Migration

## ✅ Hoàn thành được:

- Backend server chạy thành công trên http://localhost:5000
- Environment variables đã được cấu hình
- Tất cả models, controllers, routes đã được chuyển sang Supabase
- Real-time service đã được tạo
- Frontend auth slice đã được update

## ⚠️ Cần làm ngay: Setup Database

### Bước 1: Tạo Tables trong Supabase

1. **Mở Supabase SQL Editor**:

   ```
   https://supabase.com/dashboard/project/mfahdirntoitcrgfexdp/editor
   ```

2. **Click "SQL Editor" → "New Query"**

3. **Copy toàn bộ nội dung từ file**:

   ```
   database/schema.postgresql.sql
   ```

4. **Paste và click "Run"** (hoặc Ctrl+Enter)

5. **Verify**: Bạn sẽ thấy 12 tables được tạo:
   - roles
   - users
   - suppliers
   - customers
   - fish_categories
   - fishes
   - inventories
   - inventory_logs
   - import_orders
   - import_order_items
   - sale_orders
   - sale_order_items

### Bước 2: Test Backend

Sau khi tạo tables, restart backend server (sẽ tự động reload):

```bash
# Test health endpoint
curl http://localhost:5000/health

# Hoặc truy cập browser:
http://localhost:5000/health
```

Bạn sẽ thấy:

```json
{
  "status": "ok",
  "timestamp": "2026-01-18T...",
  "supabase": "connected"
}
```

### Bước 3: Test Auth Endpoints

```bash
# Sign up new user
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fishmarket.com",
    "password": "Admin123!",
    "username": "admin",
    "full_name": "Admin User",
    "role_id": 1
  }'

# Sign in
curl -X POST http://localhost:5000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fishmarket.com",
    "password": "Admin123!"
  }'
```

### Bước 4: Start Frontend

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy trên: http://localhost:5173

### Bước 5: (Optional) Migrate Data từ SQLite

Nếu bạn muốn chuyển data từ SQLite database cũ:

```bash
# Đảm bảo file SQLite tồn tại
ls database/fishmarket.db

# Chạy migration script
npm install better-sqlite3  # Tạm thời để migrate
node scripts/migrate-sqlite-to-supabase.js
```

## 🎯 Testing Checklist

- [ ] Health endpoint returns "connected"
- [ ] Sign up user thành công
- [ ] Sign in và nhận được access_token
- [ ] Get profile với Bearer token
- [ ] Frontend login page hoạt động
- [ ] Real-time updates khi thay đổi inventory
- [ ] Dashboard hiển thị data

## 🔥 API Endpoints Available

### Authentication

- POST `/api/auth/signup` - Register new user
- POST `/api/auth/signin` - Login
- POST `/api/auth/signout` - Logout
- GET `/api/auth/profile` - Get user profile (requires token)
- POST `/api/auth/reset-password` - Reset password
- PUT `/api/auth/update-password` - Update password (requires token)
- POST `/api/auth/refresh-token` - Refresh access token

### Resources (Protected)

- GET `/api/categories` - List fish categories
- GET `/api/suppliers` - List suppliers
- GET `/api/customers` - List customers
- GET `/api/fishes` - List fish products
- GET `/api/inventory` - Inventory status
- GET `/api/import-orders` - Import orders
- GET `/api/sale-orders` - Sale orders
- GET `/api/reports` - Reports & analytics

## 📝 Next Steps After Database Setup

1. **Test authentication flow** trong frontend
2. **Enable Row Level Security (RLS)** trên Supabase cho production
3. **Setup Storage buckets** cho images:
   - `suppliers` bucket
   - `fish-images` bucket
4. **Configure real-time** trong Supabase dashboard
5. **Deploy** lên production

## 🆘 Troubleshooting

### Server không connect được Supabase

- Kiểm tra `.env` có đúng keys không
- Verify SUPABASE_URL và SUPABASE_SERVICE_KEY
- Check network connection

### Frontend không gọi được API

- Verify backend đang chạy trên port 5000
- Check CORS settings trong `server.js`
- Verify `VITE_API_URL` trong `frontend/.env`

### Real-time không hoạt động

- Enable Realtime trong Supabase dashboard
- Check table settings → Enable realtime
- Verify WebSocket connection

---

**Current Status**: ✅ Backend Ready | ⏳ Database Setup Required | ⏳ Frontend Testing
