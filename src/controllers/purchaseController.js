const PurchaseRequest = require('../models/PurchaseRequest');
const User = require('../models/User');
const mongoose = require('mongoose');

const getPurchaseRequestByConditions = async (req, res) => {
    try {
        const { selectedStatus, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedStatus) query.status = { $in: selectedStatus };
        const users = await User.find({
            $or: [
                { userID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        let userIds = [];
        if (users && users.length > 0) userIds = users.map(user => user._id);
        if (searchQuery) {
            query.$or = [
                { requester: { $in: userIds } },
                { deviceName: { $regex: searchQuery, $options: 'i' }} 
            ]
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listPurchaseRequest = await PurchaseRequest.find(query)
            .populate('requester')
            .sort({ dateOfRequest: -1 });

        const totalRequests = await PurchaseRequest.countDocuments(query);
        const totalPages = Math.ceil(totalRequests / parseInt(limit));

        const purchaseRequest = listPurchaseRequest.slice(startIndex, endIndex);
        
        res.status(200).json({ list: purchaseRequest, totalRequests, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getPurchaseRequestForExport = async (req, res) => {
    try {
        const { selectedStatus, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedStatus) query.status = { $in: selectedStatus };
        const users = await User.find({
            $or: [
                { userID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        let userIds = [];
        if (users && users.length > 0) userIds = users.map(user => user._id);
        if (searchQuery) {
            query.$or = [
                { requester: { $in: userIds } },
                { deviceName: { $regex: searchQuery, $options: 'i' }} 
            ]
        }

        const listPurchaseRequest = await PurchaseRequest.find(query)
            .populate('requester')
            .sort({ dateOfRequest: -1 });
        
        res.status(200).json({ list: listPurchaseRequest });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getMyPurchaseRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const { selectedStatus, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedStatus) query.status = { $in: selectedStatus };
        if (searchQuery) { query.deviceName = { $regex: searchQuery, $options: 'i' } };

        query.requester = id;

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listRequest = await PurchaseRequest.find(query)
            .sort({ dateOfRequest: -1 });

        const totalRecords = await PurchaseRequest.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const requests = listRequest.slice(startIndex, endIndex);
        
        res.status(200).json({ list: requests, totalRecords, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const addPurchaseRequest = async (req, res) => {
    try {
        const request = req.body;
        const newRequest = new PurchaseRequest({
            requester: new mongoose.Types.ObjectId(request.requester),
            deviceName: request.deviceName,
            quantity: Number(request.quantity),
            unitPriceEstimated: Number(request.unitPriceEstimated),
            totalAmountEstimated: Number(request.unitPriceEstimated) * Number(request.quantity),
            dateOfRequest: new Date(),
        });
        await newRequest.save();
        res.status(200).json({ message: 'Create purchase request succesfully!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const updateApproveStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

        const updatedApproveStatus = await PurchaseRequest.findByIdAndUpdate(id, { $set: { status: status } }, { new: true });
        res.status(200).json(updatedApproveStatus);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const editPurchaseRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const request = req.body;

        const updatedRequest = {
            deviceName: request.deviceName,
            quantity: Number(request.quantity),
            unitPriceEstimated: Number(request.unitPriceEstimated),
            totalAmountEstimated: Number(request.unitPriceEstimated) * Number(request.quantity),
            dateOfRequest: new Date(),
        };

        const update = await PurchaseRequest.findByIdAndUpdate(id, updatedRequest, { new: true });
        res.status(200).json(update);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const deletePurchaseRequest = async (req, res) => {
    try {
        const id = req.params.id;

        const deletedRequest = await PurchaseRequest.findByIdAndDelete(id);

        res.status(200).json(deletedRequest);
    } catch (err) {
        console.error('Lỗi khi xóa:', err.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa.' });
    }
}

module.exports = { 
    getPurchaseRequestByConditions, 
    getPurchaseRequestForExport, 
    getMyPurchaseRequest,
    addPurchaseRequest,
    updateApproveStatus,
    editPurchaseRequest,
    deletePurchaseRequest,
};