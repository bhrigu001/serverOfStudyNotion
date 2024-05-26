const express = require("express");
const router = express.Router();

//Importing required controller and middleware
const {
    login,
    signUp,
    sendOTP,
    changePassword,
  } = require("../controllers/Auth");
  const {
    resetPasswordToken,
    resetPassword,
  } = require("../controllers/ResetPassword");
  
  const { auth } = require("../middlewares/auth");


//Route for login
router.post("/login",login);

//Route for signup
router.post("/signup",signUp);

// Route for sending OTP to the user's email
router.post("/sendotp", sendOTP);

// Route for Changing the password
router.post("/changepassword", auth, changePassword);


router.post("/reset-password-token", resetPasswordToken)

// Route for resetting user's password after verification
router.post("/reset-password", resetPassword)

// Export the router for use in the main application
module.exports = router













































































































