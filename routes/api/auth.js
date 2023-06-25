const express = require("express");
const {
  authSchema,
  subscrUpdateSchema,
  userEmailSchema,
} = require("../../models/user");
const {
  authValidation,
  userSubscrUpdate,
  postValidation,
} = require("../../middlwares/bodyValidation");
const authCtrl = require("../../controllers/auth");
const inspectToken = require("../../middlwares/inspectToken");
const upload = require("../../middlwares/filesUpload");

const router = express.Router();

router.post("/register", authValidation(authSchema), authCtrl.register);

router.post("/login", authValidation(authSchema), authCtrl.login);

router.post("/logout", inspectToken, authCtrl.logout);

router.get("/current", inspectToken, authCtrl.getCurrent);

router.get("/verify/:verificationToken", authCtrl.verifyEmail);

router.post("/verify", postValidation(userEmailSchema), authCtrl.resendVerify);

router.patch(
  "/",
  inspectToken,
  userSubscrUpdate(subscrUpdateSchema),
  authCtrl.changeSubscription
);

router.patch(
  "/avatars",
  inspectToken,
  upload.single("avatar"),
  authCtrl.changeAvatar
);

module.exports = router;
