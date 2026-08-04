const { createTask, getTasksByOwner } = require("../services/taskService");

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
    const tasks = await getTasksByOwner(req.user._id);

    res.status(200).json({
      success: true,
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  create,
  getMyTasks,
};
