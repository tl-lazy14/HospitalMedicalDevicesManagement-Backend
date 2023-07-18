const Maintenance = require('../models/Maintenance');
const { dailyUsageStatusCache } = require('../controllers/deviceController');
const Device = require('../models/Device');
const mongoose = require('mongoose');

const getMaintenanceHistoryOfDevice = async (req, res) => {
    try {
        const id = req.params.idDevice;
        const maintenances = await Maintenance.find({ device: id }).sort({ startDate: -1 });
        res.status(200).json(maintenances);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getMaintenancingDevice = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        const maintenancingDevices = await Maintenance.find({
            startDate: { $lte: new Date(endDate) },
            finishedDate: { $gte: new Date(startDate) },
        }).populate('device');

        res.json(maintenancingDevices);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getServiceProvider = async (req, res) => {
    try {
        const providers = await Maintenance.distinct('maintenanceServiceProvider');
        providers.sort();

        res.status(200).json(providers);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getMaintenanceInfoByConditions = async (req, res) => {
    try {
        const { selectedProviders, selectedMonth, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedProviders) query.maintenanceServiceProvider = { $in: selectedProviders };
        const devices = await Device.find({
            $or: [
                { deviceID: { $regex: searchQuery, $options: 'i' } },
                { deviceName: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        let deviceIds = [];
        if (devices && devices.length > 0) deviceIds = devices.map(device => device._id);
        if (searchQuery) {
            query.$or = [
                { device: { $in: deviceIds } },
                { performer: { $regex: searchQuery, $options: 'i' } } 
            ]
        }
        if (selectedMonth) {
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]);
            query.$expr = {
                $or: [
                    { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                    { $and: [{ $eq: [{ $year: '$finishedDate' }, year] }, { $eq: [{ $month: '$finishedDate' }, month] }] }
                ]
            };
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listMaintenanceInfo = await Maintenance.find(query)
            .populate('device')
            .sort({ startDate: -1, finishedDate: -1 })

        const totalRecords = await Maintenance.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const maintenanceInfo = listMaintenanceInfo.slice(startIndex, endIndex);
        
        res.status(200).json({ list: maintenanceInfo, totalRecords, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getAllMaintenanceInfoForExport = async (req, res) => {
    try {
        const { selectedProviders, selectedMonth, searchQuery } = req.query;

        const query = {};
        if (selectedProviders) query.maintenanceServiceProvider = { $in: selectedProviders };
        const devices = await Device.find({
            $or: [
                { deviceID: { $regex: searchQuery, $options: 'i' } },
                { deviceName: { $regex: searchQuery, $options: 'i' } }
            ]
        });
        let deviceIds = [];
        if (devices && devices.length > 0) deviceIds = devices.map(device => device._id);
        if (searchQuery) {
            query.$or = [
                { device: { $in: deviceIds } },
                { performer: { $regex: searchQuery, $options: 'i' } } 
            ]
        }
        if (selectedMonth) {
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]);
            query.$expr = {
                $or: [
                    { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                    { $and: [{ $eq: [{ $year: '$finishedDate' }, year] }, { $eq: [{ $month: '$finishedDate' }, month] }] }
                ]
            };
        }

        const listMaintenanceInfo = await Maintenance.find(query)
            .populate('device')
            .sort({ startDate: -1, finishedDate: -1 })
        
        res.status(200).json({ list: listMaintenanceInfo });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const addMaintenanceInfo = async (req, res) => {
    try {
        const maintenanceInfo = req.body;
        const getDevice = await Device.findOne({ deviceID: maintenanceInfo.device.deviceID });
        const newMaintenanceInfo = new Maintenance({
            device: new mongoose.Types.ObjectId(getDevice._id),
            startDate: new Date(maintenanceInfo.startDate),
            finishedDate: new Date(maintenanceInfo.finishedDate),
            performer: maintenanceInfo.performer,
            cost: Number(maintenanceInfo.cost),
            maintenanceServiceProvider: maintenanceInfo.maintenanceServiceProvider,
        });
        await newMaintenanceInfo.save();
        delete dailyUsageStatusCache.cache[`usageStatus:${getDevice._id}`];
        res.status(200).json({ messag: 'Add maintenance info succesfully!' });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const updateMaintenanceInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const selectedMaintenanceInfo = req.body;

        const getDevice = await Device.findOne({ deviceID: selectedMaintenanceInfo.device.deviceID });
        delete dailyUsageStatusCache.cache[`usageStatus:${getDevice._id}`];

        const updatedInfo = {
            device: getDevice._id,
            startDate: new Date(selectedMaintenanceInfo.startDate),
            finishedDate: new Date(selectedMaintenanceInfo.finishedDate),
            performer: selectedMaintenanceInfo.performer,
            cost: Number(selectedMaintenanceInfo.cost),
            maintenanceServiceProvider: selectedMaintenanceInfo.maintenanceServiceProvider,
        };

        const updatedMaintenanceInfo = await Maintenance.findByIdAndUpdate(id, updatedInfo, { new: true });
        res.status(200).json(updatedMaintenanceInfo);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const deleteMaintenanceInfo = async (req, res) => {
    try {
        const id = req.params.id;
        const deletedMaintenanceInfoRecord = await Maintenance.findById(id).populate('device');
        delete dailyUsageStatusCache.cache[`usageStatus:${deletedMaintenanceInfoRecord.device?._id}`];

        const deletedMaintenanceInfo = await Maintenance.findByIdAndDelete(id);

        if (!deletedMaintenanceInfo) {
          return res.status(404).json({ error: 'Không tìm thấy bản ghi.' });
        }

        res.status(200).json(deletedMaintenanceInfo);
    } catch (err) {
        console.error('Lỗi khi xóa:', err.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa thông tin bảo trì.' });
    }
}

module.exports = { 
    getMaintenanceHistoryOfDevice, 
    getMaintenancingDevice,
    getServiceProvider,
    getMaintenanceInfoByConditions,
    getAllMaintenanceInfoForExport,
    addMaintenanceInfo,
    updateMaintenanceInfo,
    deleteMaintenanceInfo,
};