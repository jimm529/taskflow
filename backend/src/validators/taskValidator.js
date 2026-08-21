const { body } = require("express-validator");

const createTaskValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Task title is required")
    .isLength({ max: 120 })
    .withMessage("Task title cannot exceed 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "completed"])
    .withMessage("Status must be todo, in-progress, or completed"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("project")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Project must be a valid id"),

  body("assignedTo")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Assigned user must be a valid id"),
];

const updateTaskValidation = [
  body("title")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Task title cannot be empty")
    .isLength({ max: 120 })
    .withMessage("Task title cannot exceed 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage("Description cannot exceed 2000 characters"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "completed"])
    .withMessage("Status must be todo, in-progress, or completed"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high"])
    .withMessage("Priority must be low, medium, or high"),

  body("dueDate")
    .optional({ nullable: true })
    .isISO8601()
    .withMessage("Due date must be a valid date"),

  body("project")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Project must be a valid id"),

  body("assignedTo")
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage("Assigned user must be a valid id"),
];

module.exports = {
  createTaskValidation,
  updateTaskValidation,
};
