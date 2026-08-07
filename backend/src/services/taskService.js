const Task = require("../models/Task");

const allowedStatuses = ["todo", "in-progress", "completed"];
const allowedPriorities = ["low", "medium", "high"];

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

const getTasksByOwner = async (owner, filters = {}) => {
  const query = { owner };

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    dueDate: { dueDate: 1 },
  };

  // Status filter
  if (filters.status) {
    if (!allowedStatuses.includes(filters.status)) {
      throw new Error("Invalid status filter");
    }

    query.status = filters.status;
  }

  // Priority filter
  if (filters.priority) {
    if (!allowedPriorities.includes(filters.priority)) {
      throw new Error("Invalid priority filter");
    }

    query.priority = filters.priority;
  }
   
  // Search by title
  if (filters.search) {
    query.title = {
      $regex: filters.search,
      $options: "i",
    };
  }

  // Sorting
  const sort = sortOptions[filters.sort] || sortOptions.newest;

  // Pagination
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 10;
  const skip = (page - 1) * limit;

  // Fetch tasks
  const tasks = await Task.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit);

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

const deleteTaskByIdAndOwner = async ({ taskId, owner }) => {
  const task = await Task.findOneAndDelete({
    _id: taskId,
    owner,
  });

  return task;
};

module.exports = {
  createTask,
  getTasksByOwner,
  getTaskByIdAndOwner,
  updateTaskByIdAndOwner,
  deleteTaskByIdAndOwner,
};
