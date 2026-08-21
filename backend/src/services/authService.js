const bcrypt = require("bcryptjs");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not configured");
  }

  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

const toPublicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const registerUser = async ({ name, email, password }) => {
  // Check if the email already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the user
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  return toPublicUser(user);
};

const loginUser = async ({ email, password }) => {
  // Find the user and include the password
  const user = await User.findOne({ email }).select("+password");

  // Check if the user exists
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Compare the entered password with the hashed password
  const isMatch = await bcrypt.compare(password, user.password);

  // If passwords don't match
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate JWT token
  const token = generateToken(user._id);

  return {
    token,
    user: toPublicUser(user),
  };
};

const updateUserProfile = async ({ userId, name, avatar }) => {
  const updates = {};

  if (name !== undefined) {
    updates.name = name;
  }

  if (avatar !== undefined) {
    updates.avatar = avatar || "";
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return toPublicUser(user);
};

module.exports = {
  registerUser,
  loginUser,
  updateUserProfile,
};
