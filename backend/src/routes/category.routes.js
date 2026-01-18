const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/category.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

// All routes require authentication
router.use(authenticate);

router.get("/", categoryController.getAll);
router.get("/:id", categoryController.getById);
router.post("/", categoryController.create);
router.put("/:id", categoryController.update);
router.delete("/:id", categoryController.delete);

module.exports = router;
