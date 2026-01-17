-- FishMarket Pro Database Schema
-- MySQL Database

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
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

-- Suppliers Table
CREATE TABLE suppliers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20),
    address TEXT,
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    social VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    customer_type ENUM('retail', 'wholesale') DEFAULT 'retail',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fish Categories Table (dynamic categories)
CREATE TABLE fish_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Fishes Table (with size - each fish+size combo is unique)
CREATE TABLE fishes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    scientific_name VARCHAR(150),
    category_id INT,
    size VARCHAR(50),
    description TEXT,
    retail_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    wholesale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) DEFAULT 'pieces',
    image VARCHAR(255),
    min_stock INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES fish_categories(id),
    UNIQUE KEY unique_fish_size (name, size)
);

-- Inventories Table
CREATE TABLE inventories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fish_id INT NOT NULL UNIQUE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE CASCADE
);

-- Inventory Logs Table (added 'loss' type for damage/loss tracking)
CREATE TABLE inventory_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fish_id INT NOT NULL,
    type ENUM('import', 'sale', 'adjustment', 'loss') NOT NULL,
    quantity_change DECIMAL(10, 2) NOT NULL,
    quantity_before DECIMAL(10, 2) NOT NULL,
    quantity_after DECIMAL(10, 2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id INT,
    loss_reason TEXT,
    note TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Import Orders Table
CREATE TABLE import_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id INT NOT NULL,
    expected_delivery DATE,
    delivery_date DATE,
    status ENUM('pending', 'confirmed', 'delivered', 'cancelled') DEFAULT 'pending',
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Import Order Items Table (unit_price can be 0)
CREATE TABLE import_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    import_order_id INT NOT NULL,
    fish_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    batch_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_order_id) REFERENCES import_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (fish_id) REFERENCES fishes(id)
);

-- Sale Orders Table (added sale_type for retail/wholesale)
CREATE TABLE sale_orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id INT,
    sale_type ENUM('retail', 'wholesale') DEFAULT 'retail',
    order_date DATE NOT NULL,
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Sale Order Items Table
CREATE TABLE sale_order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sale_order_id INT NOT NULL,
    fish_id INT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
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
