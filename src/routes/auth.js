const express = require("express");
const { verifyToken, verifyTokenAdminAuth } = require("../controllers/middlewareController");
const { registerUser, loginUser, requestRefreshToken, logoutUser, changePassword } = require("../controllers/authController");

const authRoute = express.Router();

authRoute.route("/register").post(verifyTokenAdminAuth, registerUser);
authRoute.route("/login").post(loginUser);
authRoute.route("/refresh").post(requestRefreshToken);
authRoute.route("/logout").post(verifyToken, logoutUser);
authRoute.route("/change-password/:id").put(verifyToken, changePassword);

module.exports = authRoute;