const express = require('express');
const { getFaultRepairHistoryOfDevice,
        getFaultDevice,
        getReparingDevice,
        getFaultInfoByConditions,
        getFaultRepairForExport,
        updateRepairDecision,
        updateRepairInfo,
 } = require('../controllers/faultRepairController');
const { verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route('/:idDevice').get(verifyTokenAdminAuth, getFaultRepairHistoryOfDevice);
router.route('/fault/statusFault').get(verifyTokenAdminAuth, getFaultDevice);
router.route('/repair/repairing').get(verifyTokenAdminAuth, getReparingDevice);
router.route('/fault/list').get(verifyTokenAdminAuth, getFaultInfoByConditions);
router.route('/fault-repair/export').get(verifyTokenAdminAuth, getFaultRepairForExport);
router.route('/repair/decision/:id').put(verifyTokenAdminAuth, updateRepairDecision);
router.route('/repair/create-update/:id').put(verifyTokenAdminAuth, updateRepairInfo);

module.exports = router;