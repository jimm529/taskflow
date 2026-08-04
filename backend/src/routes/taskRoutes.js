const express = require("express");
const { create, getMyTasks } = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyTasks);
router.post("/", protect, create);

module.exports = router;
