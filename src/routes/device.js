const express = require('express');
const { 
    getDevicesByConditions, 
    getAllDevicesForExport,
    getManufacturerForFilter, 
    getStorageForFilter, 
    addDevice,
    updateDevice, 
    deleteDevice,
} = require('../controllers/deviceController');
const { verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route("/").get(verifyTokenAdminAuth, getDevicesByConditions).post(verifyTokenAdminAuth, addDevice);
router.route("/:id").put(verifyTokenAdminAuth, updateDevice).delete(verifyTokenAdminAuth, deleteDevice);
router.route("/export").get(verifyTokenAdminAuth, getAllDevicesForExport);
router.route("/manufacturers").get(verifyTokenAdminAuth, getManufacturerForFilter);
router.route("/storage-locations").get(verifyTokenAdminAuth, getStorageForFilter);

module.exports = router;