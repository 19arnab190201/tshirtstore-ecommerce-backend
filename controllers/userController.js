const User = require("../models/user");
const BigPromise = require("../middlewares/bigPromise");
const CustomError = require("../utils/customError");
const crypto = require("crypto");
const cookieToken = require("../utils/cookieToken");
const cloudinary = require("cloudinary");
const mailHelper = require("../utils/emailHelper");

exports.signup = BigPromise(async (req, res, next) => {
  console.log("req.files", req.files);
  console.log("req.body", req.body);

  if (!req.files) {
    return next(new CustomError("photo is required for signup", 400));
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return next(
      new CustomError("Please provide name, email and password!", 400)
    );
  }
  let file = req.files.photo;
  const result = await cloudinary.v2.uploader.upload(file.tempFilePath, {
    folder: "users",
    width: 150,
    crop: "scale",
  });
  const user = await User.create({
    name,
    email,
    password,
    photo: {
      id: result.public_id,
      secure_url: result.secure_url,
    },
  });
  cookieToken(user, res);
});

exports.login = BigPromise(async (req, res, next) => {
  const { email, password } = req.body;
  console.log(req.body);
  if (!email || !password) {
    return next(new CustomError("Please provide email and password!", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(new CustomError("User Not Resistered!", 400));
  }

  const isPasswordCorrect = await user.isValidatedPassword(password);

  if (!isPasswordCorrect) {
    return next(new CustomError("Invalid password!", 400));
  }

  cookieToken(user, res);
});

exports.logout = BigPromise(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

exports.forgotPassword = BigPromise(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new CustomError("There is no user with that email", 404));
  }

  const forgotToken = user.getForgotPasswordToken();
  await user.save({ validateBeforeSave: false });

  const myUrl = `${req.protocol}://${req.get(
    "host"
  )}/password/reset/${forgotToken}`;

  const message = `Your password reset token is as follow: \n\n ${myUrl} \n\n If you have not requested this email, then ignore it.`;

  try {
    await mailHelper({
      email: email,
      subject: "TSHIRT STORE Password Reset Token",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email",
    });
  } catch (error) {
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new CustomError(error.message, 500));
  }
});

exports.passwordReset = BigPromise(async (req, res, next) => {
  const token = req.params.token;

  const encryptedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    encryptedToken,
    forgotPasswordExpire: { $gt: Date.now() },
  });
  console.log("user", user);

  if (!user) {
    return next(new CustomError("Invalid token or Expired", 400));
  }

  if (!req.body.password) {
    return next(new CustomError("Password does not match", 400));
  }
  user.password = req.body.password;
  user.forgotPasswordToken = undefined;
  user.forgotPasswordExpire = undefined;

  await user.save();

  cookieToken(user, res);
  console.log("user", user);

  // res.status(200).json({
  //   status: "success",
  //   message: "Password reset success",
  // });
});

exports.getLoggedInUserDetails = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  console.log("user", user);

  res.status(200).json({
    status: true,
    user,
  });
});

exports.changePassword = BigPromise(async (req, res, next) => {
  const userId = req.user.id;
  const user = await User.findById(userId).select("+password");

  const isCorrectOldPassword = await user.isValidatedPassword(
    req.body.oldPassword
  );

  if (!isCorrectOldPassword) {
    return next(new CustomError("Old password is incorrect", 400));
  }

  user.password = req.body.newPassword;

  await user.save();

  cookieToken(user, res);
});

exports.updateUserDetails = BigPromise(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
  };
  if (req.files.photo !== "") {
    const user = await User.findById(req.user.id);
    const imageId = user.photo.id;

    const resp = await cloudinary.v2.uploader.destroy(imageId);

    const result = await cloudinary.v2.uploader.upload(
      req.files.photo.tempFilePath,
      {
        folder: "users",
        width: 150,
        crop: "scale",
      }
    );

    newData.photo = {
      id: result.public_id,
      secure_url: result.secure_url,
    };
  }
  const user = await User.findByIdAndUpdate(req.user.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

//ADMIN CONTROLLERS

exports.adminAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

exports.adminGetOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError("User not found", 400));
  }

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminUpdateOneUserDetails = BigPromise(async (req, res, next) => {
  const newData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  const user = await User.findByIdAndUpdate(req.params.id, newData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});

exports.adminDeleteOneUser = BigPromise(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new CustomError("User not found", 400));
  }

  const imageId = user.photo.id;

  await cloudinary.v2.uploader.destroy(imageId);

  await user.remove();

  res.status(200).json({
    success: true,
    message: "User deleted successfully",
  });
});

//MANAGER CONTROLLERS

exports.managerAllUsers = BigPromise(async (req, res, next) => {
  const users = await User.find({ role: "user" });

  res.status(200).json({
    success: true,
    users,
  });
});
