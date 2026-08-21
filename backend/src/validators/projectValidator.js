const { body } = require("express-validator");

const createProjectValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Project name is required")
    .isLength({ max: 120 })
    .withMessage("Project name cannot exceed 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Project description cannot exceed 1000 characters"),
];

const updateProjectValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Project name cannot be empty")
    .isLength({ max: 120 })
    .withMessage("Project name cannot exceed 120 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage("Project description cannot exceed 1000 characters"),
];

const projectMemberValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid member email")
    .normalizeEmail(),

  body("role")
    .optional()
    .isIn(["admin", "member"])
    .withMessage("Role must be admin or member"),
];

module.exports = {
  createProjectValidation,
  projectMemberValidation,
  updateProjectValidation,
};
