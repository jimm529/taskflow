const bcrypt = require("bcryptjs");
const User = require("../models/User");

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

  return user;
};

module.exports = {
  registerUser,
};