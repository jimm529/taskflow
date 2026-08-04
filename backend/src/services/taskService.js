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

module.exports = {
  createTask,
  getTasksByOwner,
};
