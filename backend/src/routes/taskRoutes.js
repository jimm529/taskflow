const express = require("express");
const {
  create,
  getMyTasks,
  getTask,
  getTaskStats,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const {
  createTaskValidation,
  updateTaskValidation,
} = require("../validators/taskValidator");
const { validate } = require("../middleware/validationMiddleware");
const router = express.Router();

router.get("/", protect, getMyTasks);
router.post("/", protect, createTaskValidation, validate, create);
router.get("/stats", protect, getTaskStats);
router.get("/:id", protect, getTask);
router.patch("/:id", protect, updateTaskValidation, validate, updateTask);
router.delete("/:id", protect, deleteTask);

module.exports = router;
