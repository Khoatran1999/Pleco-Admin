/**
 * Supabase Authentication Routes
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/supabase-auth.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

// Public routes
router.post("/signup", authController.signUp);
router.post("/signin", authController.signIn);
router.post("/signout", authController.signOut);
router.post("/reset-password", authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);

// Protected routes
router.get("/profile", authenticate, authController.getProfile);
router.put("/update-password", authenticate, authController.updatePassword);

module.exports = router;
