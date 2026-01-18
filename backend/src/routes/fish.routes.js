const express = require("express");
const fishController = require("../controllers/fish.controller");
const { authenticate } = require("../middlewares/supabase-auth.middleware");

const router = express.Router();

router.use(authenticate);

router.get("/", fishController.getAll);
router.get("/:id", fishController.getById);
router.post("/", fishController.create);
router.put("/:id", fishController.update);
router.delete("/:id", fishController.delete);

module.exports = router;
