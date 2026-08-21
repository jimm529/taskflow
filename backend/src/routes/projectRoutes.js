const express = require("express");
const {
  addMember,
  create,
  getMyProjects,
  getProject,
  removeMember,
  update,
} = require("../controllers/projectController");
const { protect } = require("../middleware/authMiddleware");
const { validate } = require("../middleware/validationMiddleware");
const {
  createProjectValidation,
  projectMemberValidation,
  updateProjectValidation,
} = require("../validators/projectValidator");

const router = express.Router();

router.get("/", protect, getMyProjects);
router.post("/", protect, createProjectValidation, validate, create);
router.get("/:id", protect, getProject);
router.patch("/:id", protect, updateProjectValidation, validate, update);
router.post("/:id/members", protect, projectMemberValidation, validate, addMember);
router.delete("/:id/members/:memberId", protect, removeMember);

module.exports = router;
