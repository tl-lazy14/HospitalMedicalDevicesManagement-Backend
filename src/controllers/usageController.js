const Usage = require('../models/Using');
const UsageRequest = require('../models/UsingRequest');
const User = require('../models/User');
const Device = require('../models/Device');
const { dailyUsageStatusCache } = require('../controllers/deviceController');
const mongoose = require('mongoose');

const getUsageHistoryOfDevice = async (req, res) => {
    try {
        const id = req.params.idDevice;
        const usages = await Usage.find({ device: id }).populate('requester').sort({ startDate: -1 });
        res.status(200).json(usages);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getUsageRequestByConditions = async (req, res) => {
    try {
        const { selectedUsageDepartment, selectedStatus, selectedMonth, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedUsageDepartment) query.usageDepartment = { $in: selectedUsageDepartment };
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
                { deviceName: { $regex: searchQuery, $options: 'i' } },
                { requester: { $in: userIds }} 
            ]
        }
        if (selectedMonth) {
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]);
            query.$expr = {
                $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }]
            };
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listRequests = await UsageRequest.find(query)
            .populate('requester')
            .sort({ startDate: -1, endDate: -1 })

        const totalRequests = await UsageRequest.countDocuments(query);
        const totalPages = Math.ceil(totalRequests / parseInt(limit));

        const usageRequests = listRequests.slice(startIndex, endIndex);
        
        res.status(200).json({ request: usageRequests, totalRequests, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getUsageInfoByConditions = async (req, res) => {
    try {
        const { selectedUsageDepartment, selectedMonth, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedUsageDepartment) query.usageDepartment = { $in: selectedUsageDepartment };
        const users = await User.find({
            $or: [
                { userID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        const devices = await Device.find({
            $or: [
                { deviceID: { $regex: searchQuery, $options: 'i' } },
                { deviceName: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        let userIds = [];
        let deviceIds = [];
        if (users && users.length > 0) userIds = users.map(user => user._id);
        if (devices && devices.length > 0) deviceIds = devices.map(device => device._id);
        if (searchQuery) {
            query.$or = [
                { device: { $in: deviceIds } },
                { requester: { $in: userIds }} 
            ]
        }
        if (selectedMonth) {
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]);
            query.$expr = {
                $or: [
                    { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                    { $and: [{ $eq: [{ $year: '$endDate' }, year] }, { $eq: [{ $month: '$endDate' }, month] }] }
                ]
            };
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listUsageInfo = await Usage.find(query)
            .populate('device')
            .populate('requester')
            .sort({ startDate: -1, endDate: -1 })

        const totalRecords = await Usage.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const usageInfo = listUsageInfo.slice(startIndex, endIndex);
        
        res.status(200).json({ list: usageInfo, totalRecords, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getMyUsageRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const { selectedStatus, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedStatus) query.status = { $in: selectedStatus };
        if (searchQuery) {
            query.$or = [
                { usageDepartment: { $regex: searchQuery, $options: 'i' } },
                { deviceName: { $regex: searchQuery, $options: 'i' } } 
            ]
        }
        query.requester = id;

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listUsageRequest = await UsageRequest.find(query)
            .sort({ startDate: -1, endDate: -1 })

        const totalRecords = await UsageRequest.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const usageRequest = listUsageRequest.slice(startIndex, endIndex);
        
        res.status(200).json({ list: usageRequest, totalRecords, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getUsageDepartmentRequestForFilter = async (req, res) => {
    try {
        const usageDepartments = await UsageRequest.distinct('usageDepartment');
        usageDepartments.sort();

        res.status(200).json(usageDepartments);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getUsageDepartment = async (req, res) => {
    try {
        const usageDepartments = await Usage.distinct('usageDepartment');
        usageDepartments.sort();

        res.status(200).json(usageDepartments);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getAllUsageInfoForExport = async (req, res) => {
    try {
        const { selectedUsageDepartment, selectedMonth, searchQuery } = req.query;
    
        const query = {};
        if (selectedUsageDepartment) query.usageDepartment = { $in: selectedUsageDepartment };
        const users = await User.find({
            $or: [
                { userID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        const devices = await Device.find({
            $or: [
                { deviceID: { $regex: searchQuery, $options: 'i' } },
                { deviceName: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        let userIds = [];
        let deviceIds = [];
        if (users && users.length > 0) userIds = users.map(user => user._id);
        if (devices && devices.length > 0) deviceIds = devices.map(device => device._id);
        if (searchQuery) {
            query.$or = [
                { device: { $in: deviceIds } },
                { requester: { $in: userIds }} 
            ]
        }
        if (selectedMonth) {
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]);
            query.$expr = {
                $or: [
                    { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                    { $and: [{ $eq: [{ $year: '$endDate' }, year] }, { $eq: [{ $month: '$endDate' }, month] }] }
                ]
            };
        }
        const listUsageInfo = await Usage.find(query)
            .populate('device')
            .populate('requester')
            .sort({ startDate: -1, endDate: -1 })   
        
        res.status(200).json({ list: listUsageInfo });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const addUsageRequest = async (req, res) => {
    try {
        const usageRequest = req.body;
        const newUsageRequest = new UsageRequest({
            requester: new mongoose.Types.ObjectId(usageRequest.requester),
            usageDepartment: usageRequest.usageDepartment,
            deviceName: usageRequest.deviceName,
            quantity: Number(usageRequest.quantity),
            startDate: new Date(usageRequest.startDate),
            endDate: new Date(usageRequest.endDate),
        });
        await newUsageRequest.save();
        res.status(200).json({ message: 'Create usage request succesfully!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const addUsageInfo = async (req, res) => {
    try {
        const usageInfo = req.body;
        const getOperator = await User.findOne({ userID: usageInfo.requester.userID });
        for (const device of usageInfo.devices) {
            const getDevice = await Device.findOne({ deviceID: device.deviceID });
            const newUsageInfo = new Usage({
                device: new mongoose.Types.ObjectId(getDevice._id),
                usageDepartment: usageInfo.usageDepartment,
                requester: new mongoose.Types.ObjectId(getOperator._id),
                startDate: new Date(usageInfo.startDate),
                endDate: new Date(usageInfo.endDate),
            });
            await newUsageInfo.save();
            delete dailyUsageStatusCache.cache[`usageStatus:${getDevice._id}`];
        }
        res.status(200).json({ message: 'Add usage info succesfully!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getUsingDevice = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const usedDevices = await Usage.find({
            startDate: { $lte: new Date(endDate) },
            endDate: { $gte: new Date(startDate) },
        }).populate('device');

        res.json(usedDevices);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const updateApproveStatus = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;

        const updatedApproveStatus = await UsageRequest.findByIdAndUpdate(id, { $set: { status: status } }, { new: true });
        res.status(200).json(updatedApproveStatus);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const editUsageRequest = async (req, res) => {
    try {
        const id = req.params.id;
        const usageRequest = req.body;

        const updatedRequest = {
            usageDepartment: usageRequest.usageDepartment,
            deviceName: usageRequest.deviceName,
            quantity: Number(usageRequest.quantity),
            startDate: new Date(usageRequest.startDate),
            endDate: new Date(usageRequest.endDate),
        };

        const updatedUsageRequest = await UsageRequest.findByIdAndUpdate(id, updatedRequest, { new: true });
        res.status(200).json(updatedUsageRequest);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const updateUsageInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const selectedUsageInfo = req.body;

        const getDevice = await Device.findOne({ deviceID: selectedUsageInfo.device.deviceID });
        delete dailyUsageStatusCache.cache[`usageStatus:${getDevice._id}`];
        const getRequester = await User.findOne({ userID: selectedUsageInfo.requester.userID });

        const updatedInfo = {
            device: getDevice._id,
            usageDepartment: selectedUsageInfo.usageDepartment,
            requester: getRequester._id,
            startDate: new Date(selectedUsageInfo.startDate),
            endDate: new Date(selectedUsageInfo.endDate),
        };

        const updatedUsageInfo = await Usage.findByIdAndUpdate(id, updatedInfo, { new: true });
        res.status(200).json(updatedUsageInfo);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const deleteUsageRequest = async (req, res) => {
    try {
        const id = req.params.id;

        const deletedUsageRequest = await UsageRequest.findByIdAndDelete(id);

        res.status(200).json(deletedUsageRequest);
    } catch (err) {
        console.error('Lỗi khi xóa:', err.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa.' });
    }
}

const deleteUsageInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedUsageInfoRecord = await Usage.findById(id).populate('device');
        delete dailyUsageStatusCache.cache[`usageStatus:${deletedUsageInfoRecord.device?._id}`];
        const deletedUsageInfo = await Usage.findByIdAndDelete(id);

        if (!deletedUsageInfo) {
          return res.status(404).json({ error: 'Không tìm thấy bản ghi sử dụng.' });
        }

        res.status(200).json(deletedUsageInfo);
    } catch (err) {
        console.error('Lỗi khi xóa:', err.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa.' });
    }
}

module.exports = { getUsageHistoryOfDevice, 
    getUsageRequestByConditions, 
    getUsageInfoByConditions,
    getUsageDepartmentRequestForFilter, 
    getUsageDepartment, 
    getUsingDevice,
    getAllUsageInfoForExport,
    getMyUsageRequest,
    addUsageRequest,
    addUsageInfo,
    editUsageRequest,
    updateApproveStatus,
    updateUsageInfo,
    deleteUsageRequest,
    deleteUsageInfo, 
};