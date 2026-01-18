# 📦 Hướng Dẫn Quản Lý Database - FishMarket Pro

## 🎯 Tổng Quan

App FishMarket Pro sử dụng SQLite database với cấu hình thông minh để tự động chọn vị trí database phù hợp:

### Development Mode

- **Vị trí**: `project_root/database/fishmarket.db`
- **Mục đích**: Phát triển và testing
- **Dữ liệu**: Có thể reset/thay đổi tự do

### Production Mode (Electron App)

- **Vị trí**: `%APPDATA%/FishMarket Pro Dashboard/database/fishmarket.db`
- **Mục đích**: Lưu trữ dữ liệu thực tế của người dùng
- **Dữ liệu**: Được bảo vệ và backup tự động

## 🚀 Cách Sử Dụng

### 1. Chạy Development Mode

```bash
# Sử dụng database trong project
npm run electron:dev
```

### 2. Build Production App

```bash
# Tự động backup database trước khi build
npm run electron:build
```

### 3. Quản Lý Backup

#### Tạo Backup Mới

```bash
npm run db:backup
# Hoặc
node scripts/backup-database.js database/fishmarket.db backup
```

#### Xem Danh Sách Backup

```bash
npm run db:list
```

#### Khôi Phục Database

```bash
# Khôi phục từ backup mới nhất
npm run db:restore

# Hoặc khôi phục từ file cụ thể
node scripts/backup-database.js database/fishmarket.db restore fishmarket-backup-2026-01-18T10-30-00.db
```

## 📁 Cấu Trúc Database

```
database/
├── fishmarket.db          # Database chính (development)
├── schema.sql             # MySQL schema (legacy)
├── schema.sqlite.sql      # SQLite schema
└── backups/               # Backup folder
    ├── fishmarket-backup-2026-01-18T10-30-00.db
    ├── fishmarket-backup-2026-01-18T11-00-00.db
    └── ...
```

## 🔧 Database Paths

### Development

```
C:\Users\ADMIN\Desktop\ReactJS\fishmarket-pro-dashboard\database\fishmarket.db
```

### Production (Installed App)

```
C:\Users\[USERNAME]\AppData\Roaming\FishMarket Pro Dashboard\database\fishmarket.db
```

## 💡 Tips & Tricks

### 1. Sao Chép Database Từ Development Sang Production

```bash
# 1. Backup database development
npm run db:backup

# 2. Tìm vị trí database production
#    Mở app production -> F12 (DevTools) -> Console
#    Xem dòng: "📀 Database path: ..."

# 3. Copy file backup vào vị trí production
copy database\backups\fishmarket-backup-latest.db "%APPDATA%\FishMarket Pro Dashboard\database\fishmarket.db"
```

### 2. Reset Database Development

```bash
# Khôi phục từ backup
npm run db:restore

# Hoặc chạy lại migration
npm run migrate
```

### 3. Kiểm Tra Database Path Trong App

1. Mở app
2. Nhấn F12 để mở DevTools
3. Xem Console, tìm dòng: `📀 Database path: ...`

### 4. Sử Dụng Custom Database Path

```bash
# Set environment variable trước khi chạy
set DATABASE_PATH=D:\my-custom-database\fishmarket.db
npm run electron:dev
```

## 🔐 Bảo Vệ Dữ Liệu

### Automatic Backup

- Mỗi lần build production, database được backup tự động
- Giữ lại 10 bản backup gần nhất
- Backup được lưu với timestamp

### Manual Backup

```bash
# Backup thường xuyên trước khi thay đổi lớn
npm run db:backup
```

### Pre-Restore Safety

- Khi restore, database hiện tại được backup thành `-pre-restore.db`
- Có thể rollback nếu cần

## 📊 Database Schema

Xem chi tiết schema tại:

- SQLite: `database/schema.sqlite.sql`
- MySQL (legacy): `database/schema.sql`

## 🐛 Troubleshooting

### Database Not Found

```
❌ Database not found: [path]
```

**Giải pháp**: Chạy migration hoặc restore từ backup

```bash
npm run migrate
# hoặc
npm run db:restore
```

### Database Locked

```
❌ SQLite database is locked
```

**Giải pháp**:

1. Đóng tất cả instances của app
2. Xóa file `.db-wal` và `.db-shm` nếu có
3. Khởi động lại app

### Wrong Database in Production

```
App không thấy dữ liệu sau khi build
```

**Giải pháp**:

1. Copy database từ development vào production path
2. Hoặc set `DATABASE_PATH` environment variable

## 📞 Support

Nếu gặp vấn đề về database:

1. Kiểm tra Console logs (F12)
2. Xem database path đang được sử dụng
3. Kiểm tra backup files
4. Contact support team

---

**Version**: 1.0.0  
**Last Updated**: January 18, 2026
