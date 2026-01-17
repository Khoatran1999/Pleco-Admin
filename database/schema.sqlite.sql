-- FishMarket Pro Database Schema - SQLite Version
-- Converted from MySQL to SQLite

-- Drop tables if exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS inventory_logs;
DROP TABLE IF EXISTS inventories;
DROP TABLE IF EXISTS sale_order_items;
DROP TABLE IF EXISTS sale_orders;
DROP TABLE IF EXISTS import_order_items;
DROP TABLE IF EXISTS import_orders;
DROP TABLE IF EXISTS fishes;
DROP TABLE IF EXISTS fish_categories;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS suppliers;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

-- Roles Table
CREATE TABLE roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Users Table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role_id INTEGER NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Suppliers Table
CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    avatar TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Customers Table
CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    social TEXT,
    phone TEXT,
    address TEXT,
    customer_type TEXT DEFAULT 'retail' CHECK(customer_type IN ('retail', 'wholesale')),
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Fish Categories Table
CREATE TABLE fish_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Fishes Table
CREATE TABLE fishes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    scientific_name TEXT,
    category_id INTEGER,
    size TEXT,
    description TEXT,
    retail_price REAL NOT NULL DEFAULT 0,
    wholesale_price REAL NOT NULL DEFAULT 0,
    cost_price REAL NOT NULL DEFAULT 0,
    unit TEXT DEFAULT 'pieces',
    image TEXT,
    min_stock INTEGER DEFAULT 10,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES fish_categories(id),
    UNIQUE(name, size)
);

-- Inventories Table
CREATE TABLE inventories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fish_id INTEGER NOT NULL UNIQUE,
    quantity REAL NOT NULL DEFAULT 0,
    last_updated TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE CASCADE
);

-- Inventory Logs Table
CREATE TABLE inventory_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fish_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('import', 'sale', 'adjustment', 'loss')),
    quantity_change REAL NOT NULL,
    quantity_before REAL NOT NULL,
    quantity_after REAL NOT NULL,
    reference_type TEXT,
    reference_id INTEGER,
    loss_reason TEXT,
    note TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Import Orders Table
CREATE TABLE import_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    supplier_id INTEGER NOT NULL,
    expected_delivery TEXT,
    delivery_date TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    total_amount REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Import Order Items Table
CREATE TABLE import_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_order_id INTEGER NOT NULL,
    fish_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL DEFAULT 0,
    total_price REAL NOT NULL DEFAULT 0,
    batch_id TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (import_order_id) REFERENCES import_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (fish_id) REFERENCES fishes(id)
);

-- Sale Orders Table
CREATE TABLE sale_orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    customer_id INTEGER,
    sale_type TEXT DEFAULT 'retail' CHECK(sale_type IN ('retail', 'wholesale')),
    order_date TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')),
    subtotal REAL NOT NULL DEFAULT 0,
    discount_amount REAL NOT NULL DEFAULT 0,
    total_amount REAL NOT NULL DEFAULT 0,
    payment_method TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sale Order Items Table
CREATE TABLE sale_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_order_id INTEGER NOT NULL,
    fish_id INTEGER NOT NULL,
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    total_price REAL NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (fish_id) REFERENCES fishes(id)
);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full access'),
('manager', 'Store manager with limited admin access'),
('staff', 'Regular staff member');

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password, full_name, role_id) VALUES 
('admin', 'admin@fishmarket.com', '$2b$10$rIC/WwXlxpZPMZv7qLq9/.QKMVHqKQK5O9Qx5YHxL8sM5h5nWOJXO', 'Admin User', 1),
('alex', 'alex@fishmarket.com', '$2b$10$rIC/WwXlxpZPMZv7qLq9/.QKMVHqKQK5O9Qx5YHxL8sM5h5nWOJXO', 'Alex Morgan', 2);

-- Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES 
('Atlantic Seafoods Co.', 'John Smith', 'john@atlanticseafoods.com', '555-0101', '123 Harbor Drive, Boston, MA'),
('Pacific Fresh Catch', 'Sarah Lee', 'sarah@pacificfresh.com', '555-0102', '456 Ocean Blvd, San Francisco, CA'),
('Gulf Marine Suppliers', 'Mike Johnson', 'mike@gulfmarine.com', '555-0103', '789 Bay Street, Houston, TX');

-- Insert sample customers
INSERT INTO customers (name, email, phone, address, customer_type) VALUES 
('Restaurant Oceanic', 'orders@oceanic.com', '555-0201', '100 Main St, New York, NY', 'wholesale'),
('SeaFood Express', 'contact@seafoodexpress.com', '555-0202', '200 Market Ave, Chicago, IL', 'wholesale'),
('Fresh Fish Market', 'info@freshfishmarket.com', '555-0203', '300 River Rd, Miami, FL', 'retail');

-- Insert default fish categories
INSERT INTO fish_categories (name, description) VALUES 
('Freshwater', 'Fish living in freshwater environments'),
('Saltwater', 'Fish from ocean/marine environments'),
('Invertebrates', 'Aquatic invertebrates like corals, anemones'),
('Shellfish', 'Crabs, shrimps, lobsters, and mollusks'),
('Tropical', 'Tropical ornamental fish'),
('Coldwater', 'Fish suitable for cold water aquariums');

-- Insert sample fishes with size variations
INSERT INTO fishes (sku, name, scientific_name, category_id, size, retail_price, wholesale_price, cost_price, image, min_stock) VALUES 
('SKU-001-S', 'Ocellaris Clownfish', 'Amphiprion ocellaris', 2, 'Small (2-3cm)', 24.99, 20.00, 15.00, 'https://picsum.photos/seed/clownfish/80/80', 10),
('SKU-001-M', 'Ocellaris Clownfish', 'Amphiprion ocellaris', 2, 'Medium (4-5cm)', 34.99, 28.00, 22.00, 'https://picsum.photos/seed/clownfish/80/80', 10),
('SKU-001-L', 'Ocellaris Clownfish', 'Amphiprion ocellaris', 2, 'Large (6-7cm)', 49.99, 40.00, 32.00, 'https://picsum.photos/seed/clownfish/80/80', 5),
('SKU-002', 'Neon Tetra', 'Paracheirodon innesi', 1, 'Standard', 2.50, 1.80, 1.50, 'https://picsum.photos/seed/tetra/80/80', 20),
('SKU-003-S', 'Betta Fish (Siamese)', 'Betta splendens', 1, 'Small', 15.00, 12.00, 8.00, 'https://picsum.photos/seed/betta/80/80', 5),
('SKU-003-L', 'Betta Fish (Siamese)', 'Betta splendens', 1, 'Large', 25.00, 20.00, 15.00, 'https://picsum.photos/seed/betta/80/80', 5),
('SKU-004', 'Emperor Angelfish', 'Pomacanthus imperator', 2, 'Medium', 120.00, 100.00, 80.00, 'https://picsum.photos/seed/angelfish/80/80', 3),
('SKU-005', 'Blue Crab', 'Callinectes sapidus', 4, 'Standard', 22.00, 18.00, 12.00, 'https://picsum.photos/seed/crab/80/80', 15),
('SKU-006', 'Atlantic Salmon', 'Salmo salar', 1, 'Medium', 18.50, 15.00, 10.00, 'https://picsum.photos/seed/salmon1/80/80', 20),
('SKU-007', 'Bluefin Tuna', 'Thunnus thynnus', 2, 'Large', 22.50, 18.00, 14.00, 'https://picsum.photos/seed/tuna1/80/80', 25),
('SKU-008', 'Tiger Prawns', 'Penaeus monodon', 4, 'Jumbo', 30.00, 24.00, 18.00, 'https://picsum.photos/seed/prawns1/80/80', 30);

-- Insert initial inventory
INSERT INTO inventories (fish_id, quantity) VALUES 
(1, 45),
(2, 20),
(3, 10),
(4, 8),
(5, 15),
(6, 12),
(7, 3),
(8, 12),
(9, 50),
(10, 28),
(11, 35);

-- Create indexes for better performance
CREATE INDEX idx_fishes_category ON fishes(category_id);
CREATE INDEX idx_fishes_sku ON fishes(sku);
CREATE INDEX idx_fishes_size ON fishes(size);
CREATE INDEX idx_import_orders_status ON import_orders(status);
CREATE INDEX idx_sale_orders_status ON sale_orders(status);
CREATE INDEX idx_sale_orders_type ON sale_orders(sale_type);
CREATE INDEX idx_inventory_logs_fish ON inventory_logs(fish_id);
CREATE INDEX idx_inventory_logs_type ON inventory_logs(type);
