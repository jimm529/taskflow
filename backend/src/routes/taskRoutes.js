const express = require("express");
const {
  create,
  getMyTasks,
  getTask,
  updateTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyTasks);
router.post("/", protect, create);
router.get("/:id", protect, getTask);
router.patch("/:id", protect, updateTask);

module.exports = router;
