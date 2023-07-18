const express = require("express");
const { verifyToken, verifyTokenAdminAuth } = require("../controllers/middlewareController");
const { 
    getAllUsers, 
    getUserById, 
    getUserNameByID, 
    getDepartmentForFilter,
    getListOperatorByConditions,
    getListOperatorForExport,
    updateInfoOperator,
    deleteUser, 
} = require("../controllers/userController");

const router = express.Router();

router.route("/").get(verifyTokenAdminAuth, getAllUsers);
router.route("/:id").get(verifyToken, getUserById).delete(verifyTokenAdminAuth, deleteUser);
router.route("/info/department").get(verifyTokenAdminAuth, getDepartmentForFilter);
router.route("/info/list").get(verifyTokenAdminAuth, getListOperatorByConditions);
router.route("/info/export").get(verifyTokenAdminAuth, getListOperatorForExport);
router.route("/getName/:id").get(verifyTokenAdminAuth, getUserNameByID);
router.route("/info/crud/:id").put(verifyTokenAdminAuth, updateInfoOperator);

module.exports = router;