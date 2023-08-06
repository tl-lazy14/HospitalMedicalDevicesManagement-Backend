const express = require('express');
const { 
    getDevicesByConditions, 
    getAllDevicesForExport,
    getDeviceByID,
    getManufacturerForFilter, 
    getStorageForFilter, 
    getDeviceDueForMaintenance,
    getNumberDeviceByStatus,
    getNumberDeviceByClassify,
    getUsageRequestByClassify,
    getFaultRepairByClassify,
    getPurchaseRequestByClassify,
    getNumDeviceByMonth,
    getOverviewByMonth,
    getCostBreakdownByMonth,
    getUptime,
    getMTBF,
    getAgeFailureRate,
    getPeriodicMaintenanceRatio,
    getAvgRepairTime,
    getAvgMaintenanceTime,
    getRepairMaintenanceCost,
    getPurchaseCost,
    addDevice,
    updateDevice, 
    deleteDevice,
    getDeviceNameByID,
} = require('../controllers/deviceController');
const { verifyTokenAdminAuth, verifyToken } = require("../controllers/middlewareController");

const router = express.Router();

router.route("/").get(verifyTokenAdminAuth, getDevicesByConditions).post(verifyTokenAdminAuth, addDevice);
router.route("/devices/:id").get(verifyTokenAdminAuth, getDeviceByID).put(verifyTokenAdminAuth, updateDevice).delete(verifyTokenAdminAuth, deleteDevice);
router.route("/export").get(verifyTokenAdminAuth, getAllDevicesForExport);
router.route("/manufacturers").get(verifyTokenAdminAuth, getManufacturerForFilter);
router.route("/storage-locations").get(verifyTokenAdminAuth, getStorageForFilter);
router.route("/getName/:id").get(verifyToken, getDeviceNameByID);
router.route("/maintenance/due").get(verifyTokenAdminAuth, getDeviceDueForMaintenance);
router.route('/dashboard/numDeviceByStatus').get(verifyTokenAdminAuth, getNumberDeviceByStatus);
router.route('/dashboard/classify-device').get(verifyTokenAdminAuth, getNumberDeviceByClassify);
router.route('/dashboard/classify-usage-request').get(verifyTokenAdminAuth, getUsageRequestByClassify);
router.route('/dashboard/classify-fault-repair').get(verifyTokenAdminAuth, getFaultRepairByClassify);
router.route('/dashboard/classify-purchase-request').get(verifyTokenAdminAuth, getPurchaseRequestByClassify);
router.route('/dashboard/numDeviceByMonth').get(verifyTokenAdminAuth, getNumDeviceByMonth);
router.route('/dashboard/overviewByMonth').get(verifyTokenAdminAuth, getOverviewByMonth);
router.route('/dashboard/cost-breakdown-month').get(verifyTokenAdminAuth, getCostBreakdownByMonth);
router.route('/dashboard/uptime').get(verifyTokenAdminAuth, getUptime);
router.route('/dashboard/mtbf').get(verifyTokenAdminAuth, getMTBF);
router.route('/dashboard/ageFailureRate').get(verifyTokenAdminAuth, getAgeFailureRate);
router.route('/dashboard/periodicMaintenance').get(verifyTokenAdminAuth, getPeriodicMaintenanceRatio);
router.route('/dashboard/avgRepairTime').get(verifyTokenAdminAuth, getAvgRepairTime);
router.route('/dashboard/avgMaintenanceTime').get(verifyTokenAdminAuth, getAvgMaintenanceTime);
router.route('/dashboard/repairMaintenanceCost').get(verifyTokenAdminAuth, getRepairMaintenanceCost);
router.route('/dashboard/purchaseCost').get(verifyTokenAdminAuth, getPurchaseCost);

module.exports = router;