const express = require("express");
const { verifyToken, verifyTokenAdminAuth } = require("../controllers/middlewareController");
const { getAllUsers, getUserById, deleteUser } = require("../controllers/userController");

const router = express.Router();

router.route("/").get(verifyTokenAdminAuth, getAllUsers);
router.route("/:id").get(verifyToken, getUserById).delete(verifyTokenAdminAuth, deleteUser);

module.exports = router;