const { User } = require("../models/user");
const { HttpError, decorator, sendEmail } = require("../helpers");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const { SECRET_KEY, ENDPOINT } = process.env;
const fs = require("fs").promises;
const path = require("path");
const Jimp = require("jimp");
const { nanoid } = require("nanoid");

const register = async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const verificationToken = nanoid();
  const avatarURL = gravatar.url(email);

  const verifyEmail = {
    to: email,
    subject: "Email verification",
    html: `<a target="_blank" href="${ENDPOINT}/users/verify/${verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL,
    verificationToken,
  });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.verify) {
    throw HttpError(401, "Email or password is wrong");
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);

  if (!isPasswordCorrect) {
    throw HttpError(401, "Email or password is wrong");
  }

  const token = jwt.sign({ id: user._id }, SECRET_KEY, { expiresIn: "24h" });

  await User.findByIdAndUpdate(user._id, { token });

  res.status(200).json({
    token: token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const logout = async (req, res, next) => {
  const { _id } = req.user;

  if (!_id) {
    throw HttpError(401, "Not authorized");
  }

  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json();
};

const getCurrent = async (req, res, next) => {
  const { email, subscription } = req.user;
  res.status(200).json({ email, subscription });
};

const changeSubscription = async (req, res, next) => {
  const body = req.body;
  const user = req.user;

  if (!user) {
    throw HttpError(401, "Not authorized");
  }

  const updatedUser = await User.findByIdAndUpdate(user._id, body, {
    new: true,
  });

  if (!updatedUser) {
    throw HttpError(404, "Not Found");
  }

  res.status(200).json(updatedUser);
};

const changeAvatar = async (req, res, next) => {
  if (!req.file) {
    throw HttpError(400, "avatar is required");
  }

  const { originalname, path: tempDir } = req.file;
  const { _id } = req.user;

  const oldDir = tempDir;
  const newDir = path.resolve("public", "avatars", originalname);

  const avatar = await Jimp.read(oldDir);
  await avatar.resize(250, 250).write(oldDir);

  /* Jimp.read(oldDir, (err, file) => {
    if (err) throw err;

    file.resize(250, 250);
  }); */

  await fs.rename(oldDir, newDir);

  const avatarURL = path.join("avatars", originalname);

  await User.findByIdAndUpdate(_id, { avatarURL });

  res.status(200).json({ avatarURL });
};

const verifyEmail = async (req, res, next) => {
  const { verificationToken } = req.params;

  const user = User.findOne({ verificationToken });

  if (!user) {
    throw HttpError(404, "User not found");
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: "",
  });
  res.status(200).json({ message: "Verification successful" });
};

const resendVerify = async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    throw HttpError(401, "Unauthorized");
  }

  if (user.verify) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Email verification",
    html: `<a target="_blank" href="${ENDPOINT}/users/verify/${user.verificationToken}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.status(200).json({ message: "Verification email sent" });
};

module.exports = {
  register: decorator(register),
  login: decorator(login),
  logout: decorator(logout),
  getCurrent: decorator(getCurrent),
  changeSubscription: decorator(changeSubscription),
  changeAvatar: decorator(changeAvatar),
  verifyEmail: decorator(verifyEmail),
  resendVerify: decorator(resendVerify),
};
