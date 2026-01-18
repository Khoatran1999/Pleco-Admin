# 💰 FINANCIAL DASHBOARD - Implementation Guide

## Overview

A comprehensive financial dashboard for the FishMarket Pro application that tracks revenue, costs, profit, cash flow, and inventory risk.

**Domain**: Ornamental Fish & Aquarium Products  
**Target Users**: Fish shop owner, Shop manager, Small business operator  
**Focus**: Business health and profitability (NO TAX/VAT logic)

---

## 📊 Dashboard Features

### 1. **KPI Cards** (Top Section)

Displays real-time financial metrics:

- **Total Revenue**: Sum of completed sales orders
  - Shows current vs. previous period
  - Percentage change indicator
- **Net Profit**: Revenue - Cost of Goods Sold
  - Calculated from completed sales minus delivered imports
  - Color-coded change indicator
- **Total Orders**: Count of sale orders
  - Average order value displayed
  - Trend comparison
- **Cash Balance**: Net cash position
  - Simplified calculation: Total revenue - Total costs
  - Dead loss rate displayed

### 2. **Revenue Over Time** (Line Chart)

- Time-series revenue visualization
- Grouping options: Daily / Weekly / Monthly
- Date range filterable (7, 14, 30, 60, 90 days)
- Gradient area chart with smooth curves

### 3. **Orders & Profit** (Bar Chart)

- Dual-axis bar chart
- Orange bars: Order count per period
- Green bars: Profit per period
- Same time grouping as revenue chart

### 4. **Inventory Risk Panel** (Table)

Focus on live fish mortality risk:

- **Product name** with SKU
- **Days in stock**: Age of inventory
- **Risk level**:
  - 🔴 HIGH: >30 days
  - 🟠 MEDIUM: 14-30 days
  - 🟢 LOW: <14 days
- **Estimated loss value**: Quantity × Cost price
- **Overall dead loss rate**: Percentage shown

### 5. **Cash Flow** (Line Chart)

- Dual-line visualization:
  - Purple: Individual transactions (sales/imports)
  - Green: Running balance
- Shows cash in (sales) and cash out (imports)
- Transaction descriptions included

### 6. **Top Products Table**

Sortable product performance table:

- **Columns**: Product | Qty Sold | Revenue | Cost | Profit | Margin %
- **Filters**:
  - All Products
  - High Profit (>50% margin)
  - Slow Moving (<5 units sold)
  - Loss Making (negative margin)
- **Color-coded margins**:
  - Green: >50%
  - Blue: 20-50%
  - Orange: 0-20%
  - Red: <0%

---

## 🗄️ Database Schema

### Key Tables Used

```sql
-- Revenue source
sale_orders (id, total_amount, status='completed', order_date)
sale_order_items (sale_order_id, fish_id, quantity, unit_price, total_price)

-- Cost source
import_orders (id, total_amount, status='delivered', created_at)
import_order_items (import_order_id, fish_id, quantity, unit_price)

-- Inventory & losses
inventories (fish_id, quantity, last_updated)
inventory_logs (fish_id, type='loss', quantity_change)

-- Product data
fishes (id, name, cost_price, retail_price, wholesale_price)
fish_categories (id, name)
```

### Database Views Created

File: `database/financial-views.sql`

1. **vw_daily_financial_summary**: Revenue/cost/profit by day
2. **vw_product_profitability**: Per-product profit calculations
3. **vw_inventory_risk**: Age and risk assessment
4. **vw_cash_flow**: Transaction history with running balance
5. **vw_top_products**: Performance categorization
6. **vw_financial_kpis**: Aggregate metrics for KPI cards

---

## 🔌 API Endpoints

Base URL: `/api/financial`

### 1. GET `/kpis`

**Query Params**: `?days=30`  
**Response**:

```json
{
  "success": true,
  "data": {
    "revenue": { "current": 15000, "previous": 12000, "change": 25.0 },
    "netProfit": { "current": 5000, "previous": 4000, "change": 25.0 },
    "totalOrders": { "current": 45, "previous": 38, "change": 18.4 },
    "cashBalance": { "current": 5000 },
    "avgOrderValue": { "current": 333.33, "previous": 315.78, "change": 5.6 },
    "deadLossRate": { "current": 2.5 }
  }
}
```

### 2. GET `/revenue-over-time`

**Query Params**: `?startDate=2026-01-01&endDate=2026-01-18&groupBy=day`  
**Response**:

```json
{
  "success": true,
  "data": {
    "data": [
      { "period": "2026-01-01", "revenue": 1200 },
      { "period": "2026-01-02", "revenue": 1500 }
    ]
  }
}
```

### 3. GET `/orders-profit`

**Query Params**: `?startDate=2026-01-01&endDate=2026-01-18&groupBy=day`  
**Response**:

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "period": "2026-01-01",
        "orders": 5,
        "revenue": 1200,
        "cost": 800,
        "profit": 400
      }
    ]
  }
}
```

### 4. GET `/inventory-risk`

**Response**:

```json
{
  "success": true,
  "data": {
    "data": {
      "items": [
        {
          "fish_id": 1,
          "name": "Goldfish",
          "quantity": 50,
          "days_in_stock": 35,
          "risk_level": "HIGH",
          "estimated_loss_value": 500,
          "loss_rate": 2.5
        }
      ],
      "overall_loss_rate": 2.1
    }
  }
}
```

### 5. GET `/cash-flow`

**Query Params**: `?startDate=2026-01-01&endDate=2026-01-18&limit=50`  
**Response**:

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "date": "2026-01-01",
        "type": "CASH_IN",
        "amount": 1200,
        "description": "Sale Order #SO-001",
        "running_balance": 1200
      }
    ]
  }
}
```

### 6. GET `/top-products`

**Query Params**: `?sortBy=profit&limit=10&category=all`  
**Response**:

```json
{
  "success": true,
  "data": {
    "data": [
      {
        "fish_id": 1,
        "name": "Goldfish",
        "quantity_sold": 100,
        "revenue": 5000,
        "cost": 3000,
        "profit": 2000,
        "profit_margin": 40.0,
        "performance_category": "NORMAL"
      }
    ]
  }
}
```

---

## 🎨 Frontend Implementation

### Component Structure

```
FinancialDashboard.tsx (main component)
├── KPI Cards Section
│   ├── Revenue Card
│   ├── Net Profit Card
│   ├── Total Orders Card
│   └── Cash Balance Card
├── Charts Row
│   ├── Revenue Over Time (Area Chart)
│   └── Orders & Profit (Bar Chart)
├── Inventory Risk Panel (Table)
├── Cash Flow Chart (Line Chart)
└── Top Products Table
```

### State Management

```typescript
const [kpis, setKpis] = useState<KPIData | null>(null);
const [revenueChart, setRevenueChart] = useState<any[]>([]);
const [profitChart, setProfitChart] = useState<any[]>([]);
const [inventoryRisk, setInventoryRisk] = useState<any>({
  items: [],
  overall_loss_rate: 0,
});
const [cashFlow, setCashFlow] = useState<any[]>([]);
const [topProducts, setTopProducts] = useState<ProductData[]>([]);
const [dateRange, setDateRange] = useState(30);
const [productCategory, setProductCategory] = useState("all");
const [chartGrouping, setChartGrouping] = useState("day");
```

### Chart Libraries Used

- **recharts**: Area, Bar, and Line charts
- **TailwindCSS**: Styling and responsive design
- **Material Symbols**: Icons

---

## 🚀 Setup Instructions

### 1. Database Setup

```bash
# Connect to your PostgreSQL database
psql -U your_user -d fishmarket_db

# Run the financial views SQL file
\i database/financial-views.sql
```

### 2. Backend Setup

Files created:

- `backend/src/models/financial.model.supabase.js`
- `backend/src/controllers/financial.controller.js`
- `backend/src/routes/financial.routes.js`

Routes automatically registered in `backend/src/routes/index.js`

### 3. Frontend Setup

Files created:

- `frontend/src/screens/FinancialDashboard.tsx`

Route added to:

- `frontend/src/App.tsx` → `/financial`
- `frontend/src/components/Sidebar.tsx` → Navigation link

### 4. Start the Application

```bash
# Backend
cd backend
npm install
npm start

# Frontend
cd frontend
npm install
npm run dev
```

### 5. Access the Dashboard

Navigate to: `http://localhost:5173/financial`

---

## 📈 Business Metrics Explained

### Revenue

Sum of all `sale_orders` where `status = 'completed'`

### Cost

Sum of all `import_orders` where `status = 'delivered'`

### Net Profit

```
Net Profit = Total Revenue - Total Cost
```

### Profit Margin (Per Product)

```
Margin % = ((Revenue - Cost) / Revenue) × 100
```

### Dead Loss Rate

```
Loss Rate = (Total Losses / Total Imports) × 100
```

Where:

- Total Losses = Sum of `inventory_logs.quantity_change` where `type = 'loss'`
- Total Imports = Sum of `inventory_logs.quantity_change` where `type = 'import'`

### Cash Balance (Simplified)

```
Cash Balance = Total Revenue - Total Cost
```

_Note: This is a simplified model. Real cash accounting would include:_

- Accounts receivable
- Accounts payable
- Payment timing
- Bank reconciliation

### Inventory Risk

Risk level determined by age:

```
if (days_in_stock > 30) risk = "HIGH"
else if (days_in_stock > 14) risk = "MEDIUM"
else risk = "LOW"
```

---

## 🎯 Usage Scenarios

### Scenario 1: Monthly Review

1. Set date range to "Last 30 Days"
2. Review KPI cards for overall performance
3. Check Net Profit trend
4. Identify top profitable products
5. Export CSV for stakeholder report

### Scenario 2: Inventory Risk Management

1. Navigate to Inventory Risk Panel
2. Sort by highest risk (days in stock)
3. Identify fish >30 days old
4. Take action:
   - Run promotions
   - Adjust pricing
   - Plan disposal if needed

### Scenario 3: Product Performance Analysis

1. Use Top Products Table
2. Switch filter to "High Profit" products
3. Compare margins across categories
4. Identify products to promote
5. Switch to "Slow Moving" to identify clearance items

### Scenario 4: Cash Flow Monitoring

1. Review Cash Flow chart
2. Check running balance trend
3. Identify large expense periods
4. Plan for upcoming inventory purchases

---

## 🔧 Customization Options

### Adjust Risk Thresholds

Edit `backend/src/models/financial.model.supabase.js`:

```javascript
// Line ~350
let riskLevel = "LOW";
if (daysInStock > 30)
  riskLevel = "HIGH"; // Change 30 to your threshold
else if (daysInStock > 14) riskLevel = "MEDIUM"; // Change 14
```

### Add New KPI

1. Add query in `financial.model.supabase.js` → `getKPIs()`
2. Update return object with new metric
3. Add KPI card in `FinancialDashboard.tsx`
4. Style with TailwindCSS

### Change Chart Colors

Edit `FinancialDashboard.tsx`:

```typescript
// Revenue chart gradient
<linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#136dec" stopOpacity={0.3} />  // Change color here
</linearGradient>
```

---

## ⚡ Performance Optimization

### For Large Datasets (>10,000 orders)

#### 1. Use Materialized Views

```sql
CREATE MATERIALIZED VIEW mv_daily_financial_summary AS
SELECT * FROM vw_daily_financial_summary;

-- Refresh daily
CREATE OR REPLACE FUNCTION refresh_financial_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_daily_financial_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule with pg_cron or external cron job
SELECT cron.schedule('refresh-financial-views', '0 1 * * *',
  $$SELECT refresh_financial_views()$$);
```

#### 2. Add Indexes

```sql
CREATE INDEX idx_sale_orders_date_status ON sale_orders(order_date, status);
CREATE INDEX idx_import_orders_date_status ON import_orders(created_at, status);
CREATE INDEX idx_inventory_logs_type_date ON inventory_logs(type, created_at);
```

#### 3. Implement Caching

```javascript
// In backend controller
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

async getKPIs(req, res, next) {
  const cacheKey = `kpis_${req.query.days}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json({ success: true, data: cached });

  // ... fetch data ...
  cache.set(cacheKey, kpis);
  res.json({ success: true, data: kpis });
}
```

---

## 🐛 Troubleshooting

### Issue: KPIs showing zero

**Solution**: Ensure you have:

1. Completed sale orders (`status = 'completed'`)
2. Delivered import orders (`status = 'delivered'`)
3. Sample data in database

### Issue: Charts not rendering

**Solution**: Check:

1. Data array format matches chart `dataKey`
2. Browser console for errors
3. recharts library installed: `npm install recharts`

### Issue: Inventory risk empty

**Solution**: Verify:

1. `inventories` table has data with `quantity > 0`
2. `last_updated` timestamp exists
3. `fishes` table linked via foreign key

### Issue: 401 Unauthorized on API calls

**Solution**:

1. Check `access_token` in localStorage
2. Verify auth middleware in routes
3. Re-login if token expired

---

## 📝 Testing Checklist

- [ ] KPIs load and display correctly
- [ ] Revenue chart shows trend data
- [ ] Profit chart displays orders and profit bars
- [ ] Inventory risk table populates
- [ ] Cash flow chart renders transactions
- [ ] Top products table shows data
- [ ] Date range filter works (7, 14, 30, 60, 90 days)
- [ ] Chart grouping switches (day/week/month)
- [ ] Product category filter works (all/profitable/slow/loss)
- [ ] CSV export generates valid file
- [ ] Responsive design works on mobile
- [ ] Loading states display
- [ ] Error handling works

---

## 🚧 Future Enhancements

### Phase 2 Features

- [ ] Expense tracking (utilities, rent, salaries)
- [ ] Profit & Loss statement export
- [ ] Budget vs. actual comparison
- [ ] Customer lifetime value (CLV)
- [ ] Product category breakdown
- [ ] Supplier cost comparison
- [ ] Seasonal trend analysis

### Phase 3 Features

- [ ] Multi-store support
- [ ] Currency conversion
- [ ] Tax/VAT calculations (if required)
- [ ] Automated alerts (low profit, high risk)
- [ ] Email reports scheduling
- [ ] Mobile app version
- [ ] Advanced forecasting (ML-based)

---

## 📚 References

- **Recharts Documentation**: https://recharts.org/
- **TailwindCSS**: https://tailwindcss.com/
- **PostgreSQL Views**: https://www.postgresql.org/docs/current/sql-createview.html
- **Supabase Docs**: https://supabase.com/docs

---

## 👥 Support

For issues or questions:

1. Check this documentation first
2. Review API endpoint responses
3. Check browser console for frontend errors
4. Review backend logs for API errors
5. Verify database views are created correctly

---

**Last Updated**: January 18, 2026  
**Version**: 1.0.0  
**Author**: FishMarket Pro Development Team
