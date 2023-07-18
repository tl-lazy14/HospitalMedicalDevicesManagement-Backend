const PurchaseRequest = require('../models/PurchaseRequest');
const User = require('../models/User');

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

module.exports = { getPurchaseRequestByConditions, getPurchaseRequestForExport, updateApproveStatus };