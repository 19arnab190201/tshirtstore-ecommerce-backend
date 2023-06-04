const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    trim: true,
    maxlength: [40, "A user name must have less or equal then 40 characters"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email"],
  },
  password: {
    type: String,
    required: [true, "Please provide a password"],
    minlength: [8, "Please provide at least 8 characters"],
    select: false,
  },
  role: {
    type: String,
    default: "user",
  },
  photo: {
    id: {
      type: String,
      required: true,
    },
    secure_url: {
      type: String,
      required: true,
    },
  },

  forgotPasswordToken: String,
  forgotPasswordExpire: Date,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypting password using bcrypt
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

//Validate password with passed on password
userSchema.methods.isValidatedPassword = async function (passwordSent) {
  return await bcrypt.compare(passwordSent, this.password);
};

//Create and return JWT token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN * 24 * 60 * 60 * 1000,
  });
};

//Generate password reset token
userSchema.methods.getForgotPasswordToken = function () {
  const forgotPasswordToken = crypto.randomBytes(20).toString("hex");

  this.forgotPasswordToken = crypto
    .createHash("sha256")
    .update(forgotPasswordToken)
    .digest("hex");

  this.forgotPasswordExpire = Date.now() + 20 * 60 * 1000;

  return forgotPasswordToken;
};

module.exports = mongoose.model("User", userSchema);
