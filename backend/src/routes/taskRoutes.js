const express = require("express");
const {
  create,
  getMyTasks,
  getTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");
const { protect } = require("../middleware/authMiddleware");
const {
  createTaskValidation,
  validate,
} = require("../validators/taskValidator");
const router = express.Router();

router.get("/", protect, getMyTasks);
router.post("/", protect, createTaskValidation, validate,create);
router.get("/:id", protect, getTask);
router.patch("/:id", protect, updateTask);
router.delete("/:id", protect, deleteTask);

module.exports = router;
