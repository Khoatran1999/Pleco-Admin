const express = require("express");

// Auth routes removed; keep a placeholder route to indicate auth is disabled.
const router = express.Router();

router.get("/info", (req, res) => {
  res.json({
    success: true,
    message: "Authentication is disabled in this build.",
  });
});

module.exports = router;
