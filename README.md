# 🐟 FishMarket Pro Dashboard

Hệ thống quản lý cửa hàng cá cảnh toàn diện với theo dõi tồn kho theo thời gian thực, báo cáo bán hàng và quản lý đơn hàng.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [Build Desktop App](#-build-desktop-app-electron)
- [API Endpoints](#-api-endpoints)

## ✨ Tính năng

- **Dashboard**: Tổng quan doanh thu, đơn hàng, tồn kho
- **Quản lý sản phẩm (Cá)**: Thêm, sửa, xóa, phân loại cá cảnh
- **Quản lý đơn hàng**: Tạo đơn bán, theo dõi trạng thái
- **Quản lý nhập hàng**: Đơn nhập từ nhà cung cấp
- **Quản lý kho**: Theo dõi số lượng, cảnh báo hết hàng
- **Báo cáo**: Doanh thu theo tuần, top sản phẩm bán chạy
- **Quản lý khách hàng & Nhà cung cấp**
- **Báo giá (Quotation)**: Tạo báo giá cho khách hàng

## 🛠 Công nghệ sử dụng

### Frontend

- React 18 + TypeScript
- Redux Toolkit (State management)
- React Router v6
- Tailwind CSS
- Recharts (Charts)
- Vite (Build tool)

### Backend

- Node.js + Express
- SQLite (Production/Electron)
- MySQL (Development - optional)
- JWT Authentication
- Multer (File uploads)

### Desktop

- Electron
- electron-builder

## 📁 Cấu trúc dự án

```
fishmarket-pro-dashboard/
├── electron.js              # Electron main process
├── preload.js               # Electron preload script
├── package.json             # Root package (scripts & Electron config)
│
├── backend/                 # Backend API
│   ├── package.json
│   └── src/
│       ├── server.js        # Express server
│       ├── config/
│       │   ├── db.js        # MySQL config (dev)
│       │   └── db.sqlite.js # SQLite config (production)
│       ├── controllers/     # Request handlers
│       ├── models/          # Database models
│       ├── routes/          # API routes
│       └── middlewares/     # Auth, error handlers
│
├── frontend/                # React frontend
│   ├── package.json
│   └── src/
│       ├── App.tsx          # Main app component
│       ├── components/      # Reusable components
│       ├── screens/         # Page components
│       ├── services/        # API service
│       ├── store/           # Redux store & slices
│       └── utils/           # Helper functions
│
├── database/
│   ├── fishmarket.db        # SQLite database
│   ├── schema.sql           # MySQL schema
│   └── schema.sqlite.sql    # SQLite schema
│
├── scripts/
│   └── migrate-mysql-to-sqlite.js  # Migration script
│
└── build/                   # Electron build resources
    └── icon.png
```

## 🚀 Cài đặt

### Yêu cầu

- Node.js 18+
- npm hoặc yarn

### Bước 1: Clone và cài đặt dependencies

```bash
# Cài đặt tất cả dependencies (root, frontend, backend)
npm run install:all
```

Hoặc cài đặt từng phần:

```bash
# Root (Electron)
npm install

# Frontend
cd frontend && npm install

# Backend
cd backend && npm install
```

### Bước 2: Cấu hình môi trường

File `.env` ở thư mục root (cho migration từ MySQL):

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=fishmarket_db
DB_PORT=3306
JWT_SECRET=your-secret-key
PORT=5000
```

File `backend/.env`:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=fishmarket_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## 🖥 Chạy ứng dụng

### Chạy Web (Development)

**Terminal 1 - Backend:**

```bash
cd backend
npm run dev
```

Backend chạy tại: `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend chạy tại: `http://localhost:5173`

Hoặc chạy cả hai cùng lúc từ root:

```bash
npm run dev
```

### Chạy Electron (Development)

```bash
npm run electron:dev
```

Ứng dụng Electron sẽ mở với hot-reload cho frontend.

## 📦 Build Desktop App (Electron)

### Build thử nghiệm (unpacked)

```bash
npm run electron:build:dir
```

Output: `dist/win-unpacked/FishMarket Pro Dashboard.exe`

### Build installer

```bash
npm run electron:build
```

Output: `dist/FishMarket Pro Dashboard Setup 1.0.0.exe`

### Sau khi build

Cần copy thêm:

1. **Database**: Copy `database/fishmarket.db` vào `dist/win-unpacked/resources/app/backend/database/`
2. **Uploads**: Copy `backend/uploads/` vào `dist/win-unpacked/resources/app/backend/uploads/`

```powershell
# PowerShell commands
Copy-Item "database\fishmarket.db" "dist\win-unpacked\resources\app\backend\database\" -Force
Copy-Item "backend\uploads" "dist\win-unpacked\resources\app\backend\uploads" -Recurse -Force
```

## 🔄 Migration từ MySQL sang SQLite

Nếu có dữ liệu từ MySQL cần chuyển sang SQLite:

```bash
npm run migrate
```

Script sẽ:

1. Kết nối MySQL database
2. Export dữ liệu từ tất cả các bảng
3. Tạo SQLite database mới
4. Import dữ liệu và verify

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Mô tả              |
| ------ | -------------------- | ------------------ |
| POST   | `/api/auth/login`    | Đăng nhập          |
| POST   | `/api/auth/register` | Đăng ký            |
| GET    | `/api/auth/me`       | Lấy thông tin user |

### Fish (Cá)

| Method | Endpoint          | Mô tả        |
| ------ | ----------------- | ------------ |
| GET    | `/api/fishes`     | Danh sách cá |
| GET    | `/api/fishes/:id` | Chi tiết cá  |
| POST   | `/api/fishes`     | Thêm cá mới  |
| PUT    | `/api/fishes/:id` | Cập nhật     |
| DELETE | `/api/fishes/:id` | Xóa          |

### Categories

| Method | Endpoint          | Mô tả          |
| ------ | ----------------- | -------------- |
| GET    | `/api/categories` | Danh sách loại |
| POST   | `/api/categories` | Thêm loại      |

### Sale Orders

| Method | Endpoint                      | Mô tả               |
| ------ | ----------------------------- | ------------------- |
| GET    | `/api/sale-orders`            | Danh sách đơn bán   |
| POST   | `/api/sale-orders`            | Tạo đơn bán         |
| PUT    | `/api/sale-orders/:id/status` | Cập nhật trạng thái |

### Import Orders

| Method | Endpoint             | Mô tả              |
| ------ | -------------------- | ------------------ |
| GET    | `/api/import-orders` | Danh sách đơn nhập |
| POST   | `/api/import-orders` | Tạo đơn nhập       |

### Reports

| Method | Endpoint                      | Mô tả            |
| ------ | ----------------------------- | ---------------- |
| GET    | `/api/reports/dashboard`      | Dashboard stats  |
| GET    | `/api/reports/weekly-revenue` | Doanh thu tuần   |
| GET    | `/api/reports/summary`        | Tổng hợp báo cáo |

### Customers & Suppliers

| Method | Endpoint         | Mô tả                  |
| ------ | ---------------- | ---------------------- |
| GET    | `/api/customers` | Danh sách khách hàng   |
| GET    | `/api/suppliers` | Danh sách nhà cung cấp |

## 🔐 Tài khoản mặc định

```
Username: admin
Password: admin123
```

## 📝 Scripts

| Script                       | Mô tả                       |
| ---------------------------- | --------------------------- |
| `npm run dev`                | Chạy cả backend và frontend |
| `npm run dev:frontend`       | Chỉ chạy frontend           |
| `npm run dev:backend`        | Chỉ chạy backend            |
| `npm run build`              | Build frontend              |
| `npm run electron:dev`       | Chạy Electron dev mode      |
| `npm run electron:build`     | Build Electron installer    |
| `npm run electron:build:dir` | Build Electron unpacked     |
| `npm run migrate`            | Migrate MySQL → SQLite      |
| `npm run install:all`        | Cài đặt tất cả dependencies |

## 📄 License

MIT License
