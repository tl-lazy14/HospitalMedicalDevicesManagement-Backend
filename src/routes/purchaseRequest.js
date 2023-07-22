const express = require('express');
const { 
    getPurchaseRequestByConditions, 
    getPurchaseRequestForExport, 
    getMyPurchaseRequest,
    addPurchaseRequest,
    updateApproveStatus,
    editPurchaseRequest,
    deletePurchaseRequest, 
} = require('../controllers/purchaseController');
const { verifyToken, verifyTokenAdminAuth } = require("../controllers/middlewareController");

const router = express.Router();

router.route('/list-request').get(verifyTokenAdminAuth, getPurchaseRequestByConditions);
router.route('/export').get(verifyTokenAdminAuth, getPurchaseRequestForExport);
router.route('/operator/:id').get(verifyToken, getMyPurchaseRequest);
router.route('/create').post(verifyToken, addPurchaseRequest);
router.route('/status/:id').put(verifyTokenAdminAuth, updateApproveStatus);
router.route('/crud/:id').put(verifyToken, editPurchaseRequest).delete(verifyToken, deletePurchaseRequest);

module.exports = router;