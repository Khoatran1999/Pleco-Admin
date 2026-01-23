# 🐟 FishMarket Pro Dashboard

Hệ thống quản lý cửa hàng cá cảnh toàn diện với theo dõi tồn kho theo thời gian thực, báo cáo bán hàng, quản lý đơn hàng và báo cáo tài chính.

## 📋 Mục lục

- [Tính năng](#-tính-năng)
- [Công nghệ sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc dự án](#-cấu-trúc-dự-án)
- [Cài đặt](#-cài-đặt)
- [Chạy ứng dụng](#-chạy-ứng-dụng)
- [API Endpoints](#-api-endpoints)
- [Tài khoản mặc định](#-tài-khoản-mặc-định)

## ✨ Tính năng

### Quản lý cơ bản

- **Dashboard**: Tổng quan doanh thu, đơn hàng, tồn kho với biểu đồ trực quan
- **Quản lý sản phẩm (Cá)**: Thêm, sửa, xóa, phân loại cá cảnh với hình ảnh
- **Quản lý danh mục**: Phân loại cá theo nhóm

### Quản lý đơn hàng

- **Đơn bán hàng**: Tạo đơn bán với chiết khấu, theo dõi trạng thái (pending → confirmed → shipped → delivered)
- **Đơn nhập hàng**: Quản lý nhập hàng từ nhà cung cấp, tự động cập nhật tồn kho
- **Báo giá (Quotation)**: Tạo và quản lý báo giá cho khách hàng

### Quản lý kho & Tài chính

- **Quản lý kho**: Theo dõi số lượng, cảnh báo hết hàng, lịch sử nhập xuất
- **Báo cáo tài chính**: Doanh thu, chi phí, lợi nhuận theo thời gian
- **Báo cáo thống kê**: Top sản phẩm bán chạy, doanh thu theo tuần/tháng

### Quản lý đối tác

- **Khách hàng**: Thông tin liên hệ, lịch sử mua hàng, tổng chi tiêu
- **Nhà cung cấp**: Thông tin liên hệ, hình ảnh, ghi chú

### Bảo mật

- **Xác thực JWT**: Đăng nhập an toàn với token
- **Phân quyền**: Hỗ trợ role-based access control
- **Bảo vệ route**: Protected routes với kiểm tra token expiry

## 🛠 Công nghệ sử dụng

### Frontend

| Công nghệ     | Phiên bản | Mô tả                  |
| ------------- | --------- | ---------------------- |
| React         | 18.2      | UI Library             |
| TypeScript    | 5.3       | Type-safe JavaScript   |
| Redux Toolkit | 2.0       | State Management       |
| React Router  | 6.14      | Routing                |
| Tailwind CSS  | 3.4       | Styling                |
| Recharts      | 2.10      | Charts & Visualization |
| Vite          | 5.0       | Build Tool             |
| Axios         | 1.6       | HTTP Client            |

### Backend

| Công nghệ | Phiên bản | Mô tả                      |
| --------- | --------- | -------------------------- |
| Node.js   | 18+       | Runtime                    |
| Express   | 4.18      | Web Framework              |
| Supabase  | 2.90      | PostgreSQL Database & Auth |
| JWT       | 9.0       | Authentication             |
| Helmet    | 7.2       | Security Headers           |
| Multer    | 2.0       | File Uploads               |

### Testing

| Công nghệ | Mô tả                   |
| --------- | ----------------------- |
| Vitest    | Unit Testing (Frontend) |
| Jest      | Unit Testing (Backend)  |

## 📁 Cấu trúc dự án

```
fishmarket-pro-dashboard/
├── package.json             # Root package (scripts)
│
├── backend/                 # Backend API
│   ├── package.json
│   └── src/
│       ├── server.js        # Express server entry
│       ├── config/
│       │   └── supabase.js  # Supabase client config
│       ├── controllers/     # Request handlers
│       │   ├── category.controller.js
│       │   ├── customer.controller.js
│       │   ├── financial.controller.js
│       │   ├── fish.controller.js
│       │   ├── importOrder.controller.js
│       │   ├── inventory.controller.js
│       │   ├── report.controller.js
│       │   ├── saleOrder.controller.js
│       │   ├── supabase-auth.controller.js
│       │   └── supplier.controller.js
│       ├── models/          # Supabase data models
│       ├── routes/          # API route definitions
│       ├── middlewares/     # Auth & error handlers
│       └── utils/           # Helper functions
│
├── frontend/                # React frontend
│   ├── package.json
│   └── src/
│       ├── App.tsx          # Main app with routing
│       ├── components/      # Reusable UI components
│       │   ├── Header.tsx
│       │   ├── Sidebar.tsx
│       │   ├── ProtectedRoute.tsx
│       │   └── ...
│       ├── screens/         # Page components
│       │   ├── Dashboard.tsx
│       │   ├── Orders.tsx
│       │   ├── NewSaleOrder.tsx
│       │   ├── Imports.tsx
│       │   ├── NewImportOrder.tsx
│       │   ├── Inventory.tsx
│       │   ├── Categories.tsx
│       │   ├── Customers.tsx
│       │   ├── Suppliers.tsx
│       │   ├── Reports.tsx
│       │   ├── Quotation.tsx
│       │   └── Login.tsx
│       ├── store/           # Redux store & slices
│       ├── services/        # API service (axios)
│       └── utils/           # Helper functions
│
├── database/
│   └── schema.postgresql.sql  # PostgreSQL schema for Supabase
│
└── scripts/                 # Utility scripts
    ├── backup-database.js
    └── check-db.js
```

## 🚀 Cài đặt

### Yêu cầu hệ thống

- Node.js 18+
- npm hoặc yarn
- Tài khoản Supabase (miễn phí)

### Bước 1: Clone và cài đặt dependencies

```bash
# Clone repository
git clone <repository-url>
cd fishmarket-pro-dashboard

# Cài đặt tất cả dependencies (root, frontend, backend)
npm run install:all
```

### Bước 2: Thiết lập Supabase

1. Đăng ký/đăng nhập tại [supabase.com](https://supabase.com)
2. Tạo project mới
3. Vào **Settings → API** để lấy:
   - `Project URL` → SUPABASE_URL
   - `anon public key` → SUPABASE_KEY
   - `service_role key` → SUPABASE_SERVICE_KEY
4. Vào **SQL Editor** và chạy nội dung file `database/schema.postgresql.sql`

### Bước 3: Cấu hình môi trường

Tạo file `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-role-key

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration (dùng cho local development)
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=24h
```

Tạo file `frontend/.env` (tham khảo `frontend/env.example`):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
# Vercel: dùng /api (relative) để gọi vào serverless function
VITE_API_URL=/api
```

### Bước 4: Tạo tài khoản admin (tùy chọn)

```bash
cd backend
node seed-admin.js
```

## 🖥 Chạy ứng dụng

### Development Mode

**Chạy cả Backend và Frontend:**

```bash
npm run dev
```

**Hoặc chạy riêng từng service:**

```bash
# Terminal 1 - Backend (http://localhost:5000)
cd backend
npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

### Production Build

```bash
# Build frontend
npm run build

# Start backend
npm start
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint             | Mô tả                       |
| ------ | -------------------- | --------------------------- |
| POST   | `/api/auth/login`    | Đăng nhập                   |
| POST   | `/api/auth/register` | Đăng ký                     |
| GET    | `/api/auth/me`       | Lấy thông tin user hiện tại |

### Fish (Cá)

| Method | Endpoint          | Mô tả                 |
| ------ | ----------------- | --------------------- |
| GET    | `/api/fishes`     | Danh sách tất cả cá   |
| GET    | `/api/fishes/:id` | Chi tiết một loại cá  |
| POST   | `/api/fishes`     | Thêm cá mới           |
| PUT    | `/api/fishes/:id` | Cập nhật thông tin cá |
| DELETE | `/api/fishes/:id` | Xóa cá                |

### Categories (Danh mục)

| Method | Endpoint              | Mô tả              |
| ------ | --------------------- | ------------------ |
| GET    | `/api/categories`     | Danh sách danh mục |
| POST   | `/api/categories`     | Thêm danh mục      |
| PUT    | `/api/categories/:id` | Cập nhật danh mục  |
| DELETE | `/api/categories/:id` | Xóa danh mục       |

### Sale Orders (Đơn bán)

| Method | Endpoint                      | Mô tả                             |
| ------ | ----------------------------- | --------------------------------- |
| GET    | `/api/sale-orders`            | Danh sách đơn bán                 |
| GET    | `/api/sale-orders/:id`        | Chi tiết đơn bán                  |
| POST   | `/api/sale-orders`            | Tạo đơn bán mới (hỗ trợ discount) |
| PUT    | `/api/sale-orders/:id`        | Cập nhật đơn bán                  |
| PUT    | `/api/sale-orders/:id/status` | Cập nhật trạng thái               |
| DELETE | `/api/sale-orders/:id`        | Xóa đơn bán                       |

### Import Orders (Đơn nhập)

| Method | Endpoint                        | Mô tả                           |
| ------ | ------------------------------- | ------------------------------- |
| GET    | `/api/import-orders`            | Danh sách đơn nhập              |
| GET    | `/api/import-orders/:id`        | Chi tiết đơn nhập               |
| POST   | `/api/import-orders`            | Tạo đơn nhập (tự động tăng kho) |
| PUT    | `/api/import-orders/:id/status` | Cập nhật trạng thái             |
| DELETE | `/api/import-orders/:id`        | Xóa đơn nhập                    |

### Inventory (Kho)

| Method | Endpoint                      | Mô tả                |
| ------ | ----------------------------- | -------------------- |
| GET    | `/api/inventory`              | Danh sách tồn kho    |
| GET    | `/api/inventory/fish/:fishId` | Tồn kho theo loại cá |
| PUT    | `/api/inventory/:id`          | Cập nhật số lượng    |
| GET    | `/api/inventory/low-stock`    | Cá sắp hết hàng      |

### Customers (Khách hàng)

| Method | Endpoint             | Mô tả                |
| ------ | -------------------- | -------------------- |
| GET    | `/api/customers`     | Danh sách khách hàng |
| GET    | `/api/customers/:id` | Chi tiết khách hàng  |
| POST   | `/api/customers`     | Thêm khách hàng      |
| PUT    | `/api/customers/:id` | Cập nhật khách hàng  |
| DELETE | `/api/customers/:id` | Xóa khách hàng       |

### Suppliers (Nhà cung cấp)

| Method | Endpoint             | Mô tả                  |
| ------ | -------------------- | ---------------------- |
| GET    | `/api/suppliers`     | Danh sách nhà cung cấp |
| GET    | `/api/suppliers/:id` | Chi tiết nhà cung cấp  |
| POST   | `/api/suppliers`     | Thêm nhà cung cấp      |
| PUT    | `/api/suppliers/:id` | Cập nhật nhà cung cấp  |
| DELETE | `/api/suppliers/:id` | Xóa nhà cung cấp       |

### Reports (Báo cáo)

| Method | Endpoint                      | Mô tả                 |
| ------ | ----------------------------- | --------------------- |
| GET    | `/api/reports/dashboard`      | Thống kê dashboard    |
| GET    | `/api/reports/weekly-revenue` | Doanh thu theo tuần   |
| GET    | `/api/reports/summary`        | Tổng hợp báo cáo      |
| GET    | `/api/reports/top-products`   | Top sản phẩm bán chạy |

### Financial (Tài chính)

| Method | Endpoint                     | Mô tả               |
| ------ | ---------------------------- | ------------------- |
| GET    | `/api/financial/overview`    | Tổng quan tài chính |
| GET    | `/api/financial/profit-loss` | Báo cáo lãi lỗ      |
| GET    | `/api/financial/cash-flow`   | Dòng tiền           |

## 🔐 Tài khoản mặc định

```
Email: admin@fishmarket.com
Password: admin123
```

## 📝 Scripts

| Script                 | Mô tả                                     |
| ---------------------- | ----------------------------------------- |
| `npm run dev`          | Chạy cả backend và frontend (development) |
| `npm run dev:frontend` | Chỉ chạy frontend                         |
| `npm run dev:backend`  | Chỉ chạy backend                          |
| `npm run build`        | Build frontend cho production             |
| `npm start`            | Chạy backend (production)                 |
| `npm run install:all`  | Cài đặt tất cả dependencies               |
| `npm test`             | Chạy tests                                |

## 🔧 Troubleshooting

### Lỗi "duplicate key value violates unique constraint"

Chạy SQL sau trong Supabase SQL Editor để reset sequences:

```sql
SELECT setval('sale_orders_id_seq', (SELECT COALESCE(MAX(id), 0) FROM sale_orders));
SELECT setval('import_orders_id_seq', (SELECT COALESCE(MAX(id), 0) FROM import_orders));
```

### Lỗi kết nối Supabase

- Kiểm tra `SUPABASE_URL` và `SUPABASE_KEY` trong file `.env`
- Đảm bảo đã enable RLS policies hoặc sử dụng `SUPABASE_SERVICE_KEY`

### Frontend không gọi được API

- Kiểm tra backend đang chạy ở port 5000
- Kiểm tra CORS đã được cấu hình trong `backend/src/server.js`

## 📄 License

MIT License
