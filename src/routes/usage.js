const express = require('express');
const { 
    getUsageHistoryOfDevice,
    getUsageRequestByConditions,
    getUsageInfoByConditions,
    getUsageDepartmentRequestForFilter,
    getUsageDepartment,
    getUsingDevice,
    getAllUsageInfoForExport,
    addUsageInfo,
    updateApproveStatus,
    updateUsageInfo,
    deleteUsageInfo,
} = require('../controllers/usageController');
const { verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route('/history/:idDevice').get(verifyTokenAdminAuth, getUsageHistoryOfDevice);
router.route('/request/department').get(verifyTokenAdminAuth, getUsageDepartmentRequestForFilter);
router.route('/request/list-request').get(verifyTokenAdminAuth, getUsageRequestByConditions);
router.route('/request/status/:id').put(verifyTokenAdminAuth, updateApproveStatus);
router.route('/info').post(verifyTokenAdminAuth, addUsageInfo);
router.route('/info/department').get(verifyTokenAdminAuth, getUsageDepartment);
router.route('/info/list-usage').get(verifyTokenAdminAuth, getUsageInfoByConditions);
router.route('/info/crud/:id').put(verifyTokenAdminAuth, updateUsageInfo).delete(verifyTokenAdminAuth, deleteUsageInfo);
router.route('/info/using').get(verifyTokenAdminAuth, getUsingDevice);
router.route('/export').get(verifyTokenAdminAuth, getAllUsageInfoForExport);

module.exports = router;