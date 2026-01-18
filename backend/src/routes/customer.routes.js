const express = require("express");
const customerController = require("../controllers/customer.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", customerController.getAll);
router.get("/search", customerController.search);
router.get("/:id", customerController.getById);
router.post("/", customerController.create);
router.put("/:id", customerController.update);
router.delete("/:id", customerController.delete);

module.exports = router;
