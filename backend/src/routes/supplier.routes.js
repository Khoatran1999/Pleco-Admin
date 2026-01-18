const express = require("express");
const supplierController = require("../controllers/supplier.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const router = express.Router();

// configure multer storage
const uploadDir = path.join(__dirname, "..", "..", "uploads", "suppliers");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}${ext}`;
    cb(null, name);
  },
});

const upload = multer({ storage });

router.use(authenticate);

router.get("/", supplierController.getAll);
router.get("/:id", supplierController.getById);
router.post("/", upload.single("avatar"), supplierController.create);
router.put("/:id", upload.single("avatar"), supplierController.update);
router.delete("/:id", supplierController.delete);

module.exports = router;
