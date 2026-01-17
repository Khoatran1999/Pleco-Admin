require("dotenv").config();
const express = require("express");
const cors = require("cors");
const routes = require("./routes");
const errorHandler = require("./middlewares/error.middleware");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5000;
const isElectron = process.versions && process.versions.electron;

// Middleware
app.use(
  cors({
    origin: isElectron
      ? true // Allow all origins in Electron
      : [
          "http://localhost:5173",
          "http://localhost:5174",
          "http://192.168.1.102:5173",
        ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// In Electron mode, serve static frontend files
if (isElectron) {
  const frontendPath = path.join(__dirname, "..", "..", "frontend", "dist");
  console.log(`📂 Serving static frontend from: ${frontendPath}`);
  app.use(express.static(frontendPath));
}

// API Routes
app.use("/api", routes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
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
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📚 API available at http://localhost:${PORT}/api`);
  });
}

module.exports = app;
