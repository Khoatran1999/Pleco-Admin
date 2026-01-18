-- FishMarket Pro Database Schema - PostgreSQL for Supabase
-- Converted from SQLite to PostgreSQL

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS inventory_logs CASCADE;
DROP TABLE IF EXISTS inventories CASCADE;
DROP TABLE IF EXISTS sale_order_items CASCADE;
DROP TABLE IF EXISTS sale_orders CASCADE;
DROP TABLE IF EXISTS import_order_items CASCADE;
DROP TABLE IF EXISTS import_orders CASCADE;
DROP TABLE IF EXISTS fishes CASCADE;
DROP TABLE IF EXISTS fish_categories CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Roles Table
CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Users Table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role_id BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- Suppliers Table
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    avatar VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Customers Table
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    social VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    customer_type VARCHAR(20) DEFAULT 'retail' CHECK(customer_type IN ('retail', 'wholesale')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fish Categories Table
CREATE TABLE fish_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Fishes Table
CREATE TABLE fishes (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category_id BIGINT,
    size VARCHAR(100),
    description TEXT,
    retail_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    wholesale_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    cost_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) DEFAULT 'pieces',
    image VARCHAR(500),
    min_stock INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (category_id) REFERENCES fish_categories(id) ON DELETE SET NULL,
    UNIQUE(name, size)
);

-- Inventories Table
CREATE TABLE inventories (
    id BIGSERIAL PRIMARY KEY,
    fish_id BIGINT NOT NULL UNIQUE,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE CASCADE
);

-- Inventory Logs Table
CREATE TABLE inventory_logs (
    id BIGSERIAL PRIMARY KEY,
    fish_id BIGINT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK(type IN ('import', 'sale', 'adjustment', 'loss')),
    quantity_change NUMERIC(10,2) NOT NULL,
    quantity_before NUMERIC(10,2) NOT NULL,
    quantity_after NUMERIC(10,2) NOT NULL,
    reference_type VARCHAR(50),
    reference_id BIGINT,
    loss_reason TEXT,
    note TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Import Orders Table
CREATE TABLE import_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL,
    expected_delivery TIMESTAMP,
    delivery_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Import Order Items Table
CREATE TABLE import_order_items (
    id BIGSERIAL PRIMARY KEY,
    import_order_id BIGINT NOT NULL,
    fish_id BIGINT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    batch_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (import_order_id) REFERENCES import_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE RESTRICT
);

-- Sale Orders Table
CREATE TABLE sale_orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id BIGINT,
    sale_type VARCHAR(20) DEFAULT 'retail' CHECK(sale_type IN ('retail', 'wholesale')),
    order_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'completed', 'cancelled')),
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50),
    notes TEXT,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sale Order Items Table
CREATE TABLE sale_order_items (
    id BIGSERIAL PRIMARY KEY,
    sale_order_id BIGINT NOT NULL,
    fish_id BIGINT NOT NULL,
    quantity NUMERIC(10,2) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    FOREIGN KEY (sale_order_id) REFERENCES sale_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (fish_id) REFERENCES fishes(id) ON DELETE RESTRICT
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_fishes_category ON fishes(category_id);
CREATE INDEX idx_fishes_sku ON fishes(sku);
CREATE INDEX idx_fishes_size ON fishes(size);
CREATE INDEX idx_fishes_active ON fishes(is_active);
CREATE INDEX idx_inventories_fish ON inventories(fish_id);
CREATE INDEX idx_import_orders_supplier ON import_orders(supplier_id);
CREATE INDEX idx_import_orders_status ON import_orders(status);
CREATE INDEX idx_import_order_items_order ON import_order_items(import_order_id);
CREATE INDEX idx_import_order_items_fish ON import_order_items(fish_id);
CREATE INDEX idx_sale_orders_customer ON sale_orders(customer_id);
CREATE INDEX idx_sale_orders_status ON sale_orders(status);
CREATE INDEX idx_sale_orders_type ON sale_orders(sale_type);
CREATE INDEX idx_sale_orders_date ON sale_orders(order_date);
CREATE INDEX idx_sale_order_items_order ON sale_order_items(sale_order_id);
CREATE INDEX idx_sale_order_items_fish ON sale_order_items(fish_id);
CREATE INDEX idx_inventory_logs_fish ON inventory_logs(fish_id);
CREATE INDEX idx_inventory_logs_type ON inventory_logs(type);
CREATE INDEX idx_inventory_logs_date ON inventory_logs(created_at);

-- Insert default roles
INSERT INTO roles (name, description) VALUES 
('admin', 'Administrator with full access'),
('manager', 'Store manager with limited admin access'),
('staff', 'Regular staff member');

-- Insert default admin user (password: admin123)
-- Note: Same bcrypt hash from SQLite version
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

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to relevant tables
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fish_categories_updated_at BEFORE UPDATE ON fish_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_fishes_updated_at BEFORE UPDATE ON fishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_import_orders_updated_at BEFORE UPDATE ON import_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sale_orders_updated_at BEFORE UPDATE ON sale_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional but recommended for Supabase
-- Uncomment these if you want to use RLS

-- ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fish_categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fishes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE import_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE import_order_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sale_orders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sale_order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (example for authenticated users)
-- Uncomment and customize based on your security requirements

-- CREATE POLICY "Enable read access for authenticated users" ON fishes
--     FOR SELECT
--     USING (auth.role() = 'authenticated');

-- CREATE POLICY "Enable all access for service role" ON fishes
--     FOR ALL
--     USING (auth.role() = 'service_role');

-- Comments for documentation
COMMENT ON TABLE roles IS 'User roles and permissions';
COMMENT ON TABLE users IS 'System users with authentication';
COMMENT ON TABLE suppliers IS 'Fish suppliers information';
COMMENT ON TABLE customers IS 'Customer database';
COMMENT ON TABLE fish_categories IS 'Fish product categories';
COMMENT ON TABLE fishes IS 'Fish products catalog';
COMMENT ON TABLE inventories IS 'Current inventory levels';
COMMENT ON TABLE inventory_logs IS 'Inventory change history';
COMMENT ON TABLE import_orders IS 'Purchase orders from suppliers';
COMMENT ON TABLE import_order_items IS 'Items in import orders';
COMMENT ON TABLE sale_orders IS 'Sales orders to customers';
COMMENT ON TABLE sale_order_items IS 'Items in sale orders';

-- Schema migration completed successfully
SELECT 'FishMarket Pro PostgreSQL Schema Created Successfully!' AS message;
