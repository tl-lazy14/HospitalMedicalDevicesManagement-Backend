const express = require('express');
const { getMaintenanceHistoryOfDevice,
        getMaintenancingDevice,
        getServiceProvider,
        getMaintenanceInfoByConditions,
        getAllMaintenanceInfoForExport,
        addMaintenanceInfo,
        updateMaintenanceInfo,
        deleteMaintenanceInfo,
} = require('../controllers/maintenanceController');
const { verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route('/:idDevice').get(verifyTokenAdminAuth, getMaintenanceHistoryOfDevice);
router.route('/maintenancing/get-maintenancing-device').get(verifyTokenAdminAuth, getMaintenancingDevice);
router.route('/info/provider').get(verifyTokenAdminAuth, getServiceProvider);
router.route('/info/list').get(verifyTokenAdminAuth, getMaintenanceInfoByConditions);
router.route('/info/export').get(verifyTokenAdminAuth, getAllMaintenanceInfoForExport);
router.route('/info/add').post(verifyTokenAdminAuth, addMaintenanceInfo);
router.route('/info/crud/:id').put(verifyTokenAdminAuth, updateMaintenanceInfo).delete(verifyTokenAdminAuth, deleteMaintenanceInfo);

module.exports = router;