-- ================================================
-- FINANCIAL DASHBOARD - DATABASE VIEWS
-- ================================================
-- Purpose: Pre-aggregated views for financial metrics
-- Author: Financial Dashboard Implementation
-- Date: 2026-01-18
-- ================================================

-- ================================================
-- 1. DAILY FINANCIAL SUMMARY VIEW
-- ================================================
-- Aggregates revenue, cost, and profit by day
CREATE OR REPLACE VIEW vw_daily_financial_summary AS
SELECT
    date_trunc('day', COALESCE(s.order_date, i.created_at))::date AS transaction_date,
    COALESCE(SUM(s.total_amount), 0) AS revenue,
    COALESCE(SUM(i.total_amount), 0) AS cost,
    COALESCE(SUM(s.total_amount), 0) - COALESCE(SUM(i.total_amount), 0) AS profit,
    COUNT(DISTINCT s.id) AS sale_orders_count,
    COUNT(DISTINCT i.id) AS import_orders_count
FROM
    (SELECT order_date, total_amount, id FROM sale_orders WHERE status = 'completed') s
FULL OUTER JOIN
    (SELECT created_at, total_amount, id FROM import_orders WHERE status = 'delivered') i
ON date_trunc('day', s.order_date) = date_trunc('day', i.created_at)
GROUP BY transaction_date
ORDER BY transaction_date DESC;

-- ================================================
-- 2. PRODUCT PROFITABILITY VIEW
-- ================================================
-- Calculates profit per product (fish)
CREATE OR REPLACE VIEW vw_product_profitability AS
SELECT
    f.id AS fish_id,
    f.sku,
    f.name,
    f.category_id,
    fc.name AS category_name,
    f.cost_price,
    f.retail_price,
    f.wholesale_price,
    
    -- Sales metrics
    COALESCE(SUM(soi.quantity), 0) AS total_quantity_sold,
    COALESCE(SUM(soi.total_price), 0) AS total_revenue,
    
    -- Cost metrics (weighted average from imports)
    COALESCE(AVG(ioi.unit_price), f.cost_price) AS avg_import_cost,
    COALESCE(SUM(soi.quantity * COALESCE(ioi.unit_price, f.cost_price)), 0) AS total_cost,
    
    -- Profit metrics
    COALESCE(SUM(soi.total_price), 0) - COALESCE(SUM(soi.quantity * COALESCE(ioi.unit_price, f.cost_price)), 0) AS total_profit,
    
    -- Margin percentage
    CASE 
        WHEN SUM(soi.total_price) > 0 THEN
            ((SUM(soi.total_price) - SUM(soi.quantity * COALESCE(ioi.unit_price, f.cost_price))) / SUM(soi.total_price)) * 100
        ELSE 0
    END AS profit_margin_percentage,
    
    -- Current inventory
    COALESCE(inv.quantity, 0) AS current_stock,
    COALESCE(inv.quantity * f.cost_price, 0) AS inventory_value
    
FROM fishes f
LEFT JOIN fish_categories fc ON f.category_id = fc.id
LEFT JOIN sale_order_items soi ON f.id = soi.fish_id
LEFT JOIN sale_orders so ON soi.sale_order_id = so.id AND so.status = 'completed'
LEFT JOIN import_order_items ioi ON f.id = ioi.fish_id
LEFT JOIN import_orders io ON ioi.import_order_id = io.id AND io.status = 'delivered'
LEFT JOIN inventories inv ON f.id = inv.fish_id
WHERE f.is_active = true
GROUP BY f.id, f.sku, f.name, f.category_id, fc.name, f.cost_price, f.retail_price, f.wholesale_price, inv.quantity
ORDER BY total_profit DESC;

-- ================================================
-- 3. INVENTORY RISK VIEW
-- ================================================
-- Tracks fish inventory with age and mortality risk
CREATE OR REPLACE VIEW vw_inventory_risk AS
SELECT
    f.id AS fish_id,
    f.sku,
    f.name,
    fc.name AS category_name,
    inv.quantity AS current_stock,
    inv.last_updated,
    EXTRACT(DAY FROM NOW() - inv.last_updated) AS days_in_stock,
    
    -- Risk calculation
    CASE
        WHEN EXTRACT(DAY FROM NOW() - inv.last_updated) > 30 THEN 'HIGH'
        WHEN EXTRACT(DAY FROM NOW() - inv.last_updated) > 14 THEN 'MEDIUM'
        ELSE 'LOW'
    END AS risk_level,
    
    -- Estimated loss value (cost * quantity)
    inv.quantity * f.cost_price AS estimated_loss_value,
    
    -- Historical loss data
    COALESCE(SUM(CASE WHEN il.type = 'loss' THEN ABS(il.quantity_change) ELSE 0 END), 0) AS total_losses,
    COALESCE(SUM(CASE WHEN il.type = 'loss' THEN ABS(il.quantity_change) * f.cost_price ELSE 0 END), 0) AS total_loss_value,
    
    -- Loss rate percentage
    CASE
        WHEN SUM(CASE WHEN il.type = 'import' THEN il.quantity_change ELSE 0 END) > 0 THEN
            (SUM(CASE WHEN il.type = 'loss' THEN ABS(il.quantity_change) ELSE 0 END) / 
             SUM(CASE WHEN il.type = 'import' THEN il.quantity_change ELSE 0 END)) * 100
        ELSE 0
    END AS loss_rate_percentage
    
FROM inventories inv
JOIN fishes f ON inv.fish_id = f.id
LEFT JOIN fish_categories fc ON f.category_id = fc.id
LEFT JOIN inventory_logs il ON f.id = il.fish_id
WHERE inv.quantity > 0 AND f.is_active = true
GROUP BY f.id, f.sku, f.name, fc.name, inv.quantity, inv.last_updated, f.cost_price
ORDER BY 
    CASE
        WHEN EXTRACT(DAY FROM NOW() - inv.last_updated) > 30 THEN 1
        WHEN EXTRACT(DAY FROM NOW() - inv.last_updated) > 14 THEN 2
        ELSE 3
    END,
    estimated_loss_value DESC;

-- ================================================
-- 4. CASH FLOW VIEW
-- ================================================
-- Tracks cash in (sales) and cash out (imports)
CREATE OR REPLACE VIEW vw_cash_flow AS
SELECT
    transaction_date,
    transaction_type,
    amount,
    description,
    SUM(amount) OVER (ORDER BY transaction_date, transaction_type) AS running_balance
FROM (
    -- Cash IN: Completed sales
    SELECT
        order_date::date AS transaction_date,
        'CASH_IN' AS transaction_type,
        total_amount AS amount,
        'Sale Order #' || order_number AS description
    FROM sale_orders
    WHERE status = 'completed'
    
    UNION ALL
    
    -- Cash OUT: Delivered imports
    SELECT
        created_at::date AS transaction_date,
        'CASH_OUT' AS transaction_type,
        -total_amount AS amount,
        'Import Order #' || order_number AS description
    FROM import_orders
    WHERE status = 'delivered'
) cash_transactions
ORDER BY transaction_date DESC, transaction_type;

-- ================================================
-- 5. TOP PRODUCTS VIEW
-- ================================================
-- Products sorted by different metrics
CREATE OR REPLACE VIEW vw_top_products AS
SELECT
    *,
    -- Performance indicators
    CASE
        WHEN total_quantity_sold = 0 THEN 'NO_SALES'
        WHEN profit_margin_percentage < 0 THEN 'LOSS_MAKING'
        WHEN total_quantity_sold < 5 THEN 'SLOW_MOVING'
        WHEN profit_margin_percentage > 50 THEN 'HIGH_PROFIT'
        ELSE 'NORMAL'
    END AS performance_category
FROM vw_product_profitability;

-- ================================================
-- 6. FINANCIAL KPIs VIEW
-- ================================================
-- Aggregate KPIs for dashboard cards
CREATE OR REPLACE VIEW vw_financial_kpis AS
SELECT
    -- Revenue metrics
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM sale_orders 
     WHERE status = 'completed' 
     AND order_date >= CURRENT_DATE - INTERVAL '30 days') AS revenue_30d,
    
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM sale_orders 
     WHERE status = 'completed' 
     AND order_date >= CURRENT_DATE - INTERVAL '7 days') AS revenue_7d,
    
    -- Cost metrics
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM import_orders 
     WHERE status = 'delivered' 
     AND created_at >= CURRENT_DATE - INTERVAL '30 days') AS cost_30d,
    
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM import_orders 
     WHERE status = 'delivered' 
     AND created_at >= CURRENT_DATE - INTERVAL '7 days') AS cost_7d,
    
    -- Orders count
    (SELECT COUNT(*) 
     FROM sale_orders 
     WHERE order_date >= CURRENT_DATE - INTERVAL '30 days') AS orders_30d,
    
    (SELECT COUNT(*) 
     FROM sale_orders 
     WHERE status = 'completed' 
     AND order_date >= CURRENT_DATE - INTERVAL '30 days') AS completed_orders_30d,
    
    -- Average order value
    (SELECT COALESCE(AVG(total_amount), 0) 
     FROM sale_orders 
     WHERE status = 'completed' 
     AND order_date >= CURRENT_DATE - INTERVAL '30 days') AS avg_order_value_30d,
    
    -- Inventory value
    (SELECT COALESCE(SUM(inv.quantity * f.cost_price), 0) 
     FROM inventories inv 
     JOIN fishes f ON inv.fish_id = f.id) AS total_inventory_value,
    
    -- Dead loss rate
    (SELECT 
        CASE
            WHEN SUM(CASE WHEN type = 'import' THEN quantity_change ELSE 0 END) > 0 THEN
                (SUM(CASE WHEN type = 'loss' THEN ABS(quantity_change) ELSE 0 END) / 
                 SUM(CASE WHEN type = 'import' THEN quantity_change ELSE 0 END)) * 100
            ELSE 0
        END
     FROM inventory_logs 
     WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') AS dead_loss_rate_30d,
    
    -- Net profit
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM sale_orders 
     WHERE status = 'completed' 
     AND order_date >= CURRENT_DATE - INTERVAL '30 days') -
    (SELECT COALESCE(SUM(total_amount), 0) 
     FROM import_orders 
     WHERE status = 'delivered' 
     AND created_at >= CURRENT_DATE - INTERVAL '30 days') AS net_profit_30d;

-- ================================================
-- GRANT PERMISSIONS (adjust as needed)
-- ================================================
-- GRANT SELECT ON vw_daily_financial_summary TO authenticated;
-- GRANT SELECT ON vw_product_profitability TO authenticated;
-- GRANT SELECT ON vw_inventory_risk TO authenticated;
-- GRANT SELECT ON vw_cash_flow TO authenticated;
-- GRANT SELECT ON vw_top_products TO authenticated;
-- GRANT SELECT ON vw_financial_kpis TO authenticated;

-- ================================================
-- INDEXING RECOMMENDATIONS
-- ================================================
-- Already covered by existing indexes in schema.postgresql.sql
-- Additional indexes can be added if query performance is slow

-- ================================================
-- MAINTENANCE NOTES
-- ================================================
-- These views are computed on-demand
-- For large datasets, consider:
-- 1. Materialized views with scheduled refresh
-- 2. Separate analytics database
-- 3. Pre-aggregation tables with triggers
