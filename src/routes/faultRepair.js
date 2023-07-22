const express = require('express');
const { getFaultRepairHistoryOfDevice,
        getFaultDevice,
        getReparingDevice,
        getFaultInfoByConditions,
        getFaultRepairForExport,
        getMyFaultReport,
        addFaultReport,
        updateRepairDecision,
        updateRepairInfo,
        editFaultReport,
 } = require('../controllers/faultRepairController');
const { verifyTokenAdminAuth, verifyToken } = require("../controllers/middlewareController");

const router = express.Router();

router.route('/:idDevice').get(verifyTokenAdminAuth, getFaultRepairHistoryOfDevice);
router.route('/fault/statusFault').get(verifyTokenAdminAuth, getFaultDevice);
router.route('/fault/list').get(verifyTokenAdminAuth, getFaultInfoByConditions);
router.route('/fault-repair/export').get(verifyTokenAdminAuth, getFaultRepairForExport);
router.route('/fault/operator/:id').get(verifyToken, getMyFaultReport);
router.route('/fault/report').post(verifyToken, addFaultReport);
router.route('/fault/report/:id').put(verifyToken, editFaultReport);
router.route('/repair/repairing').get(verifyTokenAdminAuth, getReparingDevice);
router.route('/repair/decision/:id').put(verifyTokenAdminAuth, updateRepairDecision);
router.route('/repair/create-update/:id').put(verifyTokenAdminAuth, updateRepairInfo);

module.exports = router;