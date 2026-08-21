const mongoose = require("mongoose");

const projectMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    role: {
      type: String,
      enum: ["owner", "admin", "member"],
      default: "member",
    },
  },
  {
    _id: false,
  }
);

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 1000,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: {
      type: [projectMemberSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

projectSchema.index({ "members.user": 1 });

projectSchema.pre("validate", function ensureOwnerMember(next) {
  const ownerId = this.owner?.toString();

  if (ownerId && !this.members.some((member) => member.user?.toString() === ownerId)) {
    this.members.unshift({
      user: this.owner,
      role: "owner",
    });
  }

  next();
});

module.exports = mongoose.model("Project", projectSchema);
