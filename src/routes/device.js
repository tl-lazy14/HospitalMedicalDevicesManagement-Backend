const express = require('express');
const { 
    getDevicesByConditions, 
    getAllDevicesForExport,
    getDeviceByID,
    getManufacturerForFilter, 
    getStorageForFilter, 
    getDeviceDueForMaintenance,
    addDevice,
    updateDevice, 
    deleteDevice,
    getDeviceNameByID,
} = require('../controllers/deviceController');
const { verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route("/").get(verifyTokenAdminAuth, getDevicesByConditions).post(verifyTokenAdminAuth, addDevice);
router.route("/devices/:id").get(verifyTokenAdminAuth, getDeviceByID).put(verifyTokenAdminAuth, updateDevice).delete(verifyTokenAdminAuth, deleteDevice);
router.route("/export").get(verifyTokenAdminAuth, getAllDevicesForExport);
router.route("/manufacturers").get(verifyTokenAdminAuth, getManufacturerForFilter);
router.route("/storage-locations").get(verifyTokenAdminAuth, getStorageForFilter);
router.route("/getName/:id").get(verifyTokenAdminAuth, getDeviceNameByID);
router.route("/maintenance/due").get(verifyTokenAdminAuth, getDeviceDueForMaintenance);

module.exports = router;