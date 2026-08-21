const express = require("express");
const {
  register,
  login,
  getMe,
  updateProfile,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authRateLimit } = require("../middleware/rateLimit");

const router = express.Router();
const {
  registerValidation,
  updateProfileValidation,
} = require("../validators/authValidator");
const { validate } = require("../middleware/validationMiddleware");

router.post("/register", authRateLimit, registerValidation, validate, register);
router.post("/login", authRateLimit, login);
router.get("/me", protect, getMe);
router.patch(
  "/profile",
  protect,
  updateProfileValidation,
  validate,
  updateProfile
);

module.exports = router;
