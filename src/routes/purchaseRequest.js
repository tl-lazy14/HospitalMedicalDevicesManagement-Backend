const express = require('express');
const { getPurchaseRequestByConditions, getPurchaseRequestForExport, updateApproveStatus } = require('../controllers/purchaseController');
const { verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route('/list-request').get(verifyTokenAdminAuth, getPurchaseRequestByConditions);
router.route('/export').get(verifyTokenAdminAuth, getPurchaseRequestForExport);
router.route('/status/:id').put(verifyTokenAdminAuth, updateApproveStatus);

module.exports = router;