require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const path = require("path");
const supabase = require("./config/supabase");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      process.env.FRONTEND_URL || "http://localhost:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// API Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  // Non-blocking Supabase check
  supabase
    .from("roles")
    .select("count")
    .limit(1)
    .then(({ error }) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        supabase: error ? "disconnected" : "connected",
      });
    })
    .catch((err) => {
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        supabase: "error",
        error: err.message,
      });
    });
});

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// Start server when run directly
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
    console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth`);
    console.log(`\n⚠️  Database setup required!`);
    console.log(`📝 Steps to setup Supabase:`);
    console.log(
      `   1. Go to: https://supabase.com/dashboard/project/mfahdirntoitcrgfexdp/editor`,
    );
    console.log(`   2. Click "SQL Editor" → "New Query"`);
    console.log(`   3. Copy from: database/schema.postgresql.sql`);
    console.log(`   4. Paste and run the SQL`);
    console.log(`   5. Server will auto-detect when ready\n`);
  });

  // Test Supabase connection after server starts (non-blocking)
  setTimeout(() => {
    supabase
      .from("roles")
      .select("count")
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.log(`❌ Database not ready: ${error.message}`);
        } else {
          console.log(`✅ Supabase connected and ready!`);
        }
      })
      .catch((err) => {
        console.log(`⚠️  Database check failed: ${err.message}`);
      });
  }, 1000);
}

module.exports = app;
