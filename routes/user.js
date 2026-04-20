const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const wrapAsync = require("../utils/wrapAsync.js");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
// register route
router.get("/signup", userController.renderSignupForm);

router.post("/signup", wrapAsync(userController.signup));

// login route
router.get("/login", userController.renderLoginForm);

router.post("/login", saveRedirectUrl, passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login"
})
    , userController.login);

// logout route
router.get("/logout", userController.logout);


module.exports = router;