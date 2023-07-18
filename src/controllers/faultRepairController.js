const FaultRepair = require('../models/FaultRepair');
const { dailyUsageStatusCache } = require('../controllers/deviceController');
const Device = require('../models/Device');
const User = require('../models/User');

const getFaultRepairHistoryOfDevice = async (req, res) => {
    try {
        const id = req.params.idDevice;
        const faults = await FaultRepair.find({ device: id }).sort({ time: -1 });
        res.status(200).json(faults);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getFaultDevice = async (req, res) => {
    try {
        const allDevice = await Device.find();
        const faultDevices = allDevice.filter(device => dailyUsageStatusCache.cache[`usageStatus:${device._id}`] === 'Hỏng');
        res.status(200).json(faultDevices);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getReparingDevice = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const repairingDevices = await FaultRepair.find({
            startDate: { $lte: new Date(endDate) },
            finishedDate: { $gte: new Date(startDate) },
        }).populate('device');

        res.json(repairingDevices);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getFaultInfoByConditions = async (req, res) => {
    try {
        const { selectedStatus, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedStatus) query.repairStatus = { $in: selectedStatus };
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
                { reporter: { $in: userIds }},
                { description: { $regex: searchQuery, $options: 'i'  } }
            ]
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listFaultReport = await FaultRepair.find(query)
            .populate('device')
            .populate('reporter')
            .sort({ time: -1 });

        const totalRecords = await FaultRepair.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const faultReport = listFaultReport.slice(startIndex, endIndex);
        
        res.status(200).json({ list: faultReport, totalRecords, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getFaultRepairForExport = async (req, res) => {
    try {
        const { selectedStatus, searchQuery } = req.query;

        const query = {};
        if (selectedStatus) query.repairStatus = { $in: selectedStatus };
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
                { reporter: { $in: userIds }},
                { description: { $regex: searchQuery, $options: 'i'  } }
            ]
        }

        const listFaultReport = await FaultRepair.find(query)
            .populate('device')
            .populate('reporter')
            .sort({ time: -1 });

        res.status(200).json({ list: listFaultReport });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const updateRepairDecision = async (req, res) => {
    try {
        const id = req.params.id;
        const { repairStatus } = req.body;

        const updatedRepairDecision = await FaultRepair.findByIdAndUpdate(id, { $set: { repairStatus: repairStatus } }, { new: true }).populate('device');

        const getDevice = await Device.findOne({ deviceID: updatedRepairDecision.device.deviceID });
        delete dailyUsageStatusCache.cache[`usageStatus:${getDevice._id}`];

        res.status(200).json(updatedRepairDecision);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const updateRepairInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const { startDate, finishedDate, repairServiceProvider, cost } = req.body;

        const updatedInfo = {
            startDate: new Date(startDate),
            finishedDate: new Date(finishedDate),
            repairServiceProvider: repairServiceProvider,
            cost: Number(cost),
        }

        const updatedRepairInfo = await FaultRepair.findByIdAndUpdate(id, { $set: updatedInfo }, { new: true }).populate('device');

        const getDevice = await Device.findOne({ deviceID: updatedRepairInfo.device.deviceID });
        delete dailyUsageStatusCache.cache[`usageStatus:${getDevice._id}`];

        res.status(200).json(updatedRepairInfo);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

module.exports = { 
    getFaultRepairHistoryOfDevice, 
    getFaultDevice, 
    getReparingDevice,
    getFaultInfoByConditions,
    getFaultRepairForExport,
    updateRepairDecision,
    updateRepairInfo,
};