const Project = require("../models/Project");
const User = require("../models/User");

const memberPopulate = {
  path: "members.user",
  select: "name email avatar",
};

const ownerPopulate = {
  path: "owner",
  select: "name email avatar",
};

const toId = (value) => value?.toString();

const getMembership = (project, userId) => {
  const id = toId(userId);

  return project.members.find((member) => toId(member.user?._id || member.user) === id);
};

const isProjectAdmin = (project, userId) => {
  const membership = getMembership(project, userId);

  return Boolean(membership && ["owner", "admin"].includes(membership.role));
};

const getMemberProjectIds = async (userId) => {
  const projects = await Project.find({
    "members.user": userId,
  }).select("_id");

  return projects.map((project) => project._id);
};

const getProjectForMember = async ({ projectId, userId }) => {
  return Project.findOne({
    _id: projectId,
    "members.user": userId,
  })
    .populate(ownerPopulate)
    .populate(memberPopulate);
};

const getProjectsForUser = async (userId) => {
  return Project.find({
    "members.user": userId,
  })
    .sort({ updatedAt: -1 })
    .populate(ownerPopulate)
    .populate(memberPopulate);
};

const createProject = async ({ name, description, owner }) => {
  const project = await Project.create({
    name,
    description,
    owner,
    members: [
      {
        user: owner,
        role: "owner",
      },
    ],
  });

  return getProjectForMember({
    projectId: project._id,
    userId: owner,
  });
};

const updateProject = async ({ projectId, userId, updates }) => {
  const project = await Project.findOne({
    _id: projectId,
    "members.user": userId,
  });

  if (!project) {
    return null;
  }

  if (!isProjectAdmin(project, userId)) {
    throw new Error("Only project owners and admins can update this project");
  }

  if (updates.name !== undefined) {
    project.name = updates.name;
  }

  if (updates.description !== undefined) {
    project.description = updates.description;
  }

  await project.save();

  return getProjectForMember({ projectId, userId });
};

const addProjectMember = async ({ projectId, userId, email, role = "member" }) => {
  const project = await Project.findOne({
    _id: projectId,
    "members.user": userId,
  });

  if (!project) {
    return null;
  }

  if (!isProjectAdmin(project, userId)) {
    throw new Error("Only project owners and admins can add members");
  }

  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const existingMember = getMembership(project, user._id);

  if (existingMember) {
    existingMember.role = role;
  } else {
    project.members.push({
      user: user._id,
      role,
    });
  }

  await project.save();

  return getProjectForMember({ projectId, userId });
};

const removeProjectMember = async ({ projectId, userId, memberId }) => {
  const project = await Project.findOne({
    _id: projectId,
    "members.user": userId,
  });

  if (!project) {
    return null;
  }

  if (!isProjectAdmin(project, userId)) {
    throw new Error("Only project owners and admins can remove members");
  }

  if (toId(project.owner) === toId(memberId)) {
    throw new Error("Project owner cannot be removed");
  }

  project.members = project.members.filter(
    (member) => toId(member.user) !== toId(memberId)
  );

  await project.save();

  return getProjectForMember({ projectId, userId });
};

module.exports = {
  addProjectMember,
  createProject,
  getMemberProjectIds,
  getMembership,
  getProjectForMember,
  getProjectsForUser,
  isProjectAdmin,
  removeProjectMember,
  updateProject,
};
