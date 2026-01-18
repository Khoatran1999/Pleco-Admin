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
    const ext = path.extname(file.originalname).toLowerCase();
    // Sanitize filename - only allow safe characters
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  },
});

// File filter for security - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

  const ext = path.extname(file.originalname).toLowerCase();
  const isValidType = allowedTypes.includes(file.mimetype);
  const isValidExt = allowedExtensions.includes(ext);

  if (isValidType && isValidExt) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
    files: 1, // Only 1 file at a time
  },
});

router.use(authenticate);

router.get("/", supplierController.getAll);
router.get("/:id", supplierController.getById);
router.post("/", upload.single("avatar"), supplierController.create);
router.put("/:id", upload.single("avatar"), supplierController.update);
router.delete("/:id", supplierController.delete);

module.exports = router;
