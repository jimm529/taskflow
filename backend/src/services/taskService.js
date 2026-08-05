const Task = require("../models/Task");

const createTask = async ({ title, description, priority, dueDate, owner }) => {
  if (!title || !title.trim()) {
    throw new Error("Task title is required");
  }

  const task = await Task.create({
    title,
    description,
    priority,
    dueDate,
    owner,
  });

  return task;
};

const getTasksByOwner = async (owner) => {
  const tasks = await Task.find({ owner }).sort({ createdAt: -1 });

  return tasks;
};

const getTaskByIdAndOwner = async ({ taskId, owner }) => {
  const task = await Task.findOne({
    _id: taskId,
    owner,
  });

  return task;
};

const updateTaskByIdAndOwner = async ({ taskId, owner, updates }) => {
  const task = await Task.findOneAndUpdate(
    {
      _id: taskId,
      owner,
    },
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  return task;
};

module.exports = {
  createTask,
  getTasksByOwner,
  getTaskByIdAndOwner,
  updateTaskByIdAndOwner,
};
