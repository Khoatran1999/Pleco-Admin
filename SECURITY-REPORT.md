# 🔐 BÁO CÁO KIỂM TRA BẢO MẬT - Fishmarket Pro Dashboard

**Ngày kiểm tra:** 18/01/2026  
**Trạng thái:** ⚠️ CẦN SỬA NGAY TRƯỚC KHI DEPLOY

---

## ✅ CÁC VẤN ĐỀ ĐÃ SỬA

| Vấn đề                         | Trạng thái                           |
| ------------------------------ | ------------------------------------ |
| Hardcoded localhost URLs       | ✅ Đã sửa - Sử dụng env variable     |
| SQL Injection trong user model | ✅ Đã sửa - Thêm sanitization        |
| Thiếu rate limiting            | ✅ Đã thêm express-rate-limit        |
| Thiếu security headers         | ✅ Đã thêm helmet                    |
| File upload không validate     | ✅ Đã thêm file type/size validation |
| CORS không an toàn             | ✅ Đã cập nhật cho production        |

---

## 🚨 VẤN ĐỀ CẦN XỬ LÝ THỦ CÔNG (CRITICAL)

### 1. ❌ FILE .ENV ĐANG ĐƯỢC TRACK TRONG GIT

**Mức độ: CRITICAL**

Các file chứa thông tin nhạy cảm đang được commit vào repository:

- `.env` (root)
- `backend/.env`
- `frontend/.env`

**Thông tin bị lộ:**

- `SUPABASE_SERVICE_KEY` - Key có toàn quyền truy cập database
- `SUPABASE_JWT_SECRET` - Secret để ký JWT tokens
- `SUPABASE_ANON_KEY` - Public key (ít nghiêm trọng hơn)

**⚠️ HÀNH ĐỘNG CẦN THIẾT:**

```bash
# 1. Xóa khỏi git cache (giữ file local)
git rm --cached .env backend/.env frontend/.env

# 2. Commit thay đổi
git commit -m "Remove sensitive .env files from tracking"

# 3. QUAN TRỌNG: Đổi tất cả API keys trên Supabase Dashboard ngay lập tức!
# https://supabase.com/dashboard/project/mfahdirntoitcrgfexdp/settings/api
```

### 2. ⚠️ NPM VULNERABILITIES

**Mức độ: HIGH**

```
bcrypt 5.0.1 - 5.1.1 có lỗ hổng bảo mật thông qua tar package
```

**Cách khắc phục:**

```bash
cd backend
npm audit fix --force
# Hoặc nâng cấp lên bcrypt@6.0.0 (có thể có breaking changes)
```

---

## ❌ VẤN ĐỀ ĐÃ ĐƯỢC PHÁT HIỆN (ĐÃ SỬA)

### ~~URL API HARDCODED LOCALHOST~~ ✅ ĐÃ SỬA

// frontend/src/services/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

````

### 3. ❌ SQL INJECTION VULNERABILITIES
**Mức độ: CRITICAL**

**File: [backend/src/models/user.model.supabase.js](backend/src/models/user.model.supabase.js#L27)**
```javascript
// VULNERABLE - Dùng trong authentication!
.or(`username.eq.${username},email.eq.${username}`)
````

Attacker có thể bypass authentication bằng cách inject vào username.

**Các file khác bị ảnh hưởng:**

- `supplier.model.supabase.js` - search filter
- `fish.model.supabase.js` - search filter
- `customer.model.supabase.js` - search filter
- `category.model.supabase.js` - search filter

**Cách khắc phục:**

```javascript
// Tạo utility sanitize
function sanitizeForPostgrest(input) {
  if (typeof input !== 'string') return input;
  return input.replace(/[,."'()\\]/g, '');
}

// Sử dụng
const sanitizedUsername = sanitizeForPostgrest(username);
.or(`username.eq."${sanitizedUsername}",email.eq."${sanitizedUsername}"`)
```

---

## ⚠️ VẤN ĐỀ CAO (HIGH)

### 4. ❌ THIẾU RATE LIMITING

**Mức độ: HIGH**

Server không có rate limiting, có thể bị:

- Brute force attack trên login
- DDoS attacks
- Resource exhaustion

**Cách khắc phục:**

```bash
cd backend
npm install express-rate-limit
```

```javascript
// backend/src/server.js
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 min
  message: "Too many login attempts, please try again later.",
});

app.use("/api", limiter);
app.use("/api/auth/signin", authLimiter);
app.use("/api/auth/signup", authLimiter);
```

### 5. ❌ THIẾU SECURITY HEADERS

**Mức độ: HIGH**

Không có helmet để bảo vệ headers.

**Cách khắc phục:**

```bash
cd backend
npm install helmet
```

```javascript
// backend/src/server.js
const helmet = require("helmet");
app.use(helmet());
```

### 6. ❌ CORS CẤU HÌNH KHÔNG AN TOÀN CHO PRODUCTION

**Mức độ: HIGH**

```javascript
// backend/src/server.js - HIỆN TẠI
cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    process.env.FRONTEND_URL || "http://localhost:5173",
  ],
  credentials: true,
});
```

**Cách khắc phục cho production:**

```javascript
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.FRONTEND_URL
      : ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
```

### 7. ❌ FILE UPLOAD KHÔNG KIỂM TRA FILE TYPE

**Mức độ: HIGH**

[backend/src/routes/supplier.routes.js](backend/src/routes/supplier.routes.js) không validate file type.

**Cách khắc phục:**

```javascript
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only images are allowed."), false);
    }
  },
});
```

---

## 📋 VẤN ĐỀ TRUNG BÌNH (MEDIUM)

### 8. ⚠️ CONSOLE.LOG CHỨA THÔNG TIN NHẠY CẢM

**Mức độ: MEDIUM**

Server log URL Supabase dashboard khi khởi động.

**Cách khắc phục:**

- Xóa hoặc điều kiện hóa các console.log trong production
- Sử dụng proper logging library như `winston` hoặc `pino`

### 9. ⚠️ ERROR HANDLING LỘ THÔNG TIN

**Mức độ: MEDIUM**

Cần đảm bảo error messages không lộ stack trace trong production.

---

## ✅ CHECKLIST TRƯỚC KHI DEPLOY LÊN VERCEL

### Environment Variables cần set trên Vercel:

**Frontend (Vercel):**

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=https://your-backend-domain.com/api
```

**Backend (nếu deploy riêng):**

```
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
SUPABASE_JWT_SECRET=your-jwt-secret
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### Các bước cần thực hiện:

- [ ] **1. Xóa .env files khỏi git** (CRITICAL)
- [ ] **2. Đổi tất cả Supabase API keys** (CRITICAL - keys đã bị lộ)
- [ ] **3. Sửa hardcoded localhost URLs** (CRITICAL)
- [ ] **4. Thêm input sanitization cho SQL queries** (CRITICAL)
- [ ] **5. Thêm rate limiting** (HIGH)
- [ ] **6. Thêm helmet security headers** (HIGH)
- [ ] **7. Cập nhật CORS cho production** (HIGH)
- [ ] **8. Thêm file type validation cho uploads** (HIGH)
- [ ] **9. Review và remove sensitive console.logs** (MEDIUM)
- [ ] **10. Set up proper logging** (MEDIUM)

---

## 🔧 FILE CẦN CẬP NHẬT .GITIGNORE

```gitignore
# Environment files - NEVER COMMIT!
.env
.env.local
.env.*.local
*/.env
backend/.env
frontend/.env

# Keep example files
!.env.example
!*/.env.example
```

---

## 📝 LƯU Ý QUAN TRỌNG

1. **SAU KHI XÓA .ENV KHỎI GIT**: Cần regenerate TẤT CẢ API keys trên Supabase vì chúng đã bị lộ trong git history

2. **Để xóa hoàn toàn khỏi git history** (nếu đã push lên remote):

```bash
# Cẩn thận - thao tác này rewrite history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env backend/.env frontend/.env" \
  --prune-empty --tag-name-filter cat -- --all

# Hoặc sử dụng BFG Repo-Cleaner (nhanh hơn)
bfg --delete-files .env
```

3. **Nếu repo đã public**: Keys đã bị compromise, PHẢI regenerate ngay lập tức

---

_Báo cáo được tạo bởi security audit tool_
