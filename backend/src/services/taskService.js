const Task = require("../models/Task");
const {
  getMemberProjectIds,
  getMembership,
  getProjectForMember,
  isProjectAdmin,
} = require("./projectService");

const allowedStatuses = ["todo", "in-progress", "completed"];
const allowedPriorities = ["low", "medium", "high"];

const permittedUpdateFields = [
  "title",
  "description",
  "status",
  "priority",
  "dueDate",
  "assignedTo",
  "project",
];

const taskPopulate = [
  {
    path: "owner",
    select: "name email avatar",
  },
  {
    path: "assignedTo",
    select: "name email avatar",
  },
  {
    path: "project",
    select: "name description owner members",
    populate: {
      path: "members.user",
      select: "name email avatar",
    },
  },
];

const toId = (value) => value?._id?.toString() || value?.toString();

const pickTaskFields = (updates) => {
  return permittedUpdateFields.reduce((safeUpdates, field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      safeUpdates[field] = updates[field];
    }

    return safeUpdates;
  }, {});
};

const getAccessibleTaskBaseQuery = async (userId) => {
  const projectIds = await getMemberProjectIds(userId);

  return {
    $or: [
      {
        owner: userId,
      },
      {
        project: {
          $in: projectIds,
        },
      },
    ],
  };
};

const buildTaskQuery = async (userId, filters = {}) => {
  const accessQuery = await getAccessibleTaskBaseQuery(userId);
  const query = {
    $and: [accessQuery],
  };

  if (filters.status) {
    if (!allowedStatuses.includes(filters.status)) {
      throw new Error("Invalid status filter");
    }

    query.$and.push({ status: filters.status });
  }

  if (filters.priority) {
    if (!allowedPriorities.includes(filters.priority)) {
      throw new Error("Invalid priority filter");
    }

    query.$and.push({ priority: filters.priority });
  }

  if (filters.project) {
    query.$and.push({ project: filters.project });
  }

  if (filters.assignedTo) {
    query.$and.push({ assignedTo: filters.assignedTo });
  }

  if (filters.search) {
    query.$and.push({
      $or: [
        {
          title: {
            $regex: filters.search,
            $options: "i",
          },
        },
        {
          description: {
            $regex: filters.search,
            $options: "i",
          },
        },
      ],
    });
  }

  return query;
};

const ensureAssignableMember = (project, assignedTo) => {
  if (!assignedTo) {
    return;
  }

  if (!getMembership(project, assignedTo)) {
    throw new Error("Assigned user must be a project member");
  }
};

const createTask = async ({
  title,
  description,
  status,
  priority,
  dueDate,
  owner,
  assignedTo,
  project,
}) => {
  if (!title || !title.trim()) {
    throw new Error("Task title is required");
  }

  let projectDocument = null;
  let assignee = assignedTo || owner;

  if (project) {
    projectDocument = await getProjectForMember({
      projectId: project,
      userId: owner,
    });

    if (!projectDocument) {
      throw new Error("Project not found");
    }

    ensureAssignableMember(projectDocument, assignee);
  } else if (assignedTo && toId(assignedTo) !== toId(owner)) {
    throw new Error("Personal tasks can only be assigned to the owner");
  }

  const task = await Task.create({
    title,
    description,
    status,
    priority,
    dueDate,
    owner,
    assignedTo: assignee,
    project,
  });

  return Task.findById(task._id).populate(taskPopulate);
};

const getTasksByOwner = async (owner, filters = {}) => {
  const query = await buildTaskQuery(owner, filters);

  const sortOptions = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    dueDate: { dueDate: 1 },
  };

  const sort = sortOptions[filters.sort] || sortOptions.newest;
  const page = Number(filters.page) || 1;
  const limit = Math.min(Number(filters.limit) || 10, 50);
  const skip = (page - 1) * limit;

  const tasks = await Task.find(query)
    .populate(taskPopulate)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const total = await Task.countDocuments(query);

  return {
    tasks,
    total,
  };
};

const getTaskByIdAndOwner = async ({ taskId, owner }) => {
  const accessQuery = await getAccessibleTaskBaseQuery(owner);

  return Task.findOne({
    _id: taskId,
    ...accessQuery,
  }).populate(taskPopulate);
};

const updateTaskByIdAndOwner = async ({ taskId, owner, updates }) => {
  const task = await getTaskByIdAndOwner({ taskId, owner });

  if (!task) {
    return null;
  }

  const safeUpdates = pickTaskFields(updates);
  const ownerId = toId(owner);
  const taskOwnerId = toId(task.owner);
  const isTaskOwner = taskOwnerId === ownerId;
  let projectDocument = null;

  if (safeUpdates.project !== undefined) {
    projectDocument = safeUpdates.project
      ? await getProjectForMember({
          projectId: safeUpdates.project,
          userId: owner,
        })
      : null;

    if (safeUpdates.project && !projectDocument) {
      throw new Error("Project not found");
    }

    if (!isTaskOwner) {
      throw new Error("Only the task owner can move tasks between projects");
    }
  } else if (task.project) {
    projectDocument = await getProjectForMember({
      projectId: task.project._id || task.project,
      userId: owner,
    });
  }

  const nextProject = Object.prototype.hasOwnProperty.call(safeUpdates, "project")
    ? safeUpdates.project
    : task.project;
  const nextAssignee = Object.prototype.hasOwnProperty.call(
    safeUpdates,
    "assignedTo"
  )
    ? safeUpdates.assignedTo
    : task.assignedTo;

  if (nextProject) {
    const assignmentProject =
      projectDocument ||
      (await getProjectForMember({
        projectId: nextProject._id || nextProject,
        userId: owner,
      }));

    if (!assignmentProject) {
      throw new Error("Project not found");
    }

    if (
      Object.prototype.hasOwnProperty.call(safeUpdates, "assignedTo") &&
      !isTaskOwner &&
      !isProjectAdmin(assignmentProject, owner)
    ) {
      throw new Error("Only task owners and project admins can assign tasks");
    }

    ensureAssignableMember(assignmentProject, nextAssignee);
  } else if (nextAssignee && toId(nextAssignee) !== taskOwnerId) {
    throw new Error("Personal tasks can only be assigned to the owner");
  }

  Object.entries(safeUpdates).forEach(([field, value]) => {
    task[field] = value === "" && field !== "description" ? undefined : value;
  });

  await task.save();

  return Task.findById(task._id).populate(taskPopulate);
};

const deleteTaskByIdAndOwner = async ({ taskId, owner }) => {
  const task = await getTaskByIdAndOwner({ taskId, owner });

  if (!task) {
    return null;
  }

  if (task.project) {
    const project = await getProjectForMember({
      projectId: task.project._id || task.project,
      userId: owner,
    });

    if (!project || (toId(task.owner) !== toId(owner) && !isProjectAdmin(project, owner))) {
      throw new Error("Only task owners and project admins can delete project tasks");
    }
  }

  await Task.deleteOne({ _id: taskId });

  return task;
};

const getTaskStatsByOwner = async (owner) => {
  const query = await buildTaskQuery(owner);
  const withStatus = (status) => ({
    $and: [query, { status }],
  });
  const withPriority = (priority) => ({
    $and: [query, { priority }],
  });

  const [total, todo, inProgress, completed, low, medium, high] =
    await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments(withStatus("todo")),
      Task.countDocuments(withStatus("in-progress")),
      Task.countDocuments(withStatus("completed")),
      Task.countDocuments(withPriority("low")),
      Task.countDocuments(withPriority("medium")),
      Task.countDocuments(withPriority("high")),
    ]);

  return {
    total,
    status: {
      todo,
      "in-progress": inProgress,
      completed,
    },
    priority: {
      low,
      medium,
      high,
    },
    completionPercentage: total ? Math.round((completed / total) * 100) : 0,
  };
};

module.exports = {
  createTask,
  deleteTaskByIdAndOwner,
  getTaskByIdAndOwner,
  getTasksByOwner,
  getTaskStatsByOwner,
  updateTaskByIdAndOwner,
};
