const { body } = require("express-validator");

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required"),

  body("email")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

const updateProfileValidation = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Name cannot be empty")
    .isLength({ max: 80 })
    .withMessage("Name cannot exceed 80 characters"),

  body("avatar")
    .optional({ checkFalsy: true })
    .trim()
    .isURL()
    .withMessage("Avatar must be a valid URL"),
];

module.exports = {
  registerValidation,
  updateProfileValidation,
};
