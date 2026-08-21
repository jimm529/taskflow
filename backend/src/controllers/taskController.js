const {
  createTask,
  getTasksByOwner,
  getTaskByIdAndOwner,
  updateTaskByIdAndOwner,
  deleteTaskByIdAndOwner,
  getTaskStatsByOwner,
} = require("../services/taskService");

const create = async (req, res) => {
  try {
    const task = await createTask({
      ...req.body,
      owner: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMyTasks = async (req, res) => {
  try {
    const result = await getTasksByOwner(req.user._id, req.query);

    res.status(200).json({
      success: true,
      count: result.total,
      tasks: result.tasks,
    });
  } catch (error) {
    const statusCode = error.message.startsWith("Invalid") ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await getTaskByIdAndOwner({
      taskId: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      task,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid task id",
    });
  }
};

const getTaskStats = async (req, res) => {
  try {
    const stats = await getTaskStatsByOwner(req.user._id);

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await updateTaskByIdAndOwner({
      taskId: req.params.id,
      owner: req.user._id,
      updates: req.body,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    const statusCode = error.message.includes("Only") ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await deleteTaskByIdAndOwner({
      taskId: req.params.id,
      owner: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Task deleted successfully",
    });
  } catch (error) {
    const statusCode = error.message.includes("Only") ? 403 : 400;

    res.status(statusCode).json({
      success: false,
      message: statusCode === 403 ? error.message : "Invalid task id",
    });
  }
};

module.exports = {
  create,
  getMyTasks,
  getTask,
  getTaskStats,
  updateTask,
  deleteTask,
};
