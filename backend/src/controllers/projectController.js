const {
  addProjectMember,
  createProject,
  getProjectForMember,
  getProjectsForUser,
  removeProjectMember,
  updateProject,
} = require("../services/projectService");

const create = async (req, res) => {
  try {
    const project = await createProject({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyProjects = async (req, res) => {
  try {
    const projects = await getProjectsForUser(req.user._id);

    res.status(200).json({
      success: true,
      projects,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getProject = async (req, res) => {
  try {
    const project = await getProjectForMember({
      projectId: req.params.id,
      userId: req.user._id,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      project,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid project id",
    });
  }
};

const update = async (req, res) => {
  try {
    const project = await updateProject({
      projectId: req.params.id,
      userId: req.user._id,
      updates: req.body,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

const addMember = async (req, res) => {
  try {
    const project = await addProjectMember({
      projectId: req.params.id,
      userId: req.user._id,
      email: req.body.email,
      role: req.body.role,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project member saved successfully",
      project,
    });
  } catch (error) {
    const statusCode = error.message === "User not found" ? 404 : 403;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const removeMember = async (req, res) => {
  try {
    const project = await removeProjectMember({
      projectId: req.params.id,
      userId: req.user._id,
      memberId: req.params.memberId,
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Project member removed successfully",
      project,
    });
  } catch (error) {
    res.status(403).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addMember,
  create,
  getMyProjects,
  getProject,
  removeMember,
  update,
};
