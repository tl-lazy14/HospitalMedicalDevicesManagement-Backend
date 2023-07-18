const Device = require('../models/Device');
const Using = require('../models/Using');
const FaultRepair = require('../models/FaultRepair');
const Maintenance = require('../models/Maintenance');

// Khi có sự thay đổi cần cập nhật cache: delete cache[cacheKey]
const dailyUsageStatusCache = {
    date: new Date(''),
    cache: {},
};

const isSameDate = (date1, date2) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
};

const getUsageStatus = async (deviceID) => {
  try {
    const cacheKey = `usageStatus:${deviceID}`;
    const currentDate = new Date();

    // Kiểm tra nếu ngày hiện tại khác với ngày được cập nhật lần cuối, thực hiện reset cache
    if (!isSameDate(currentDate, dailyUsageStatusCache.date)) {
        dailyUsageStatusCache.date = currentDate;
        dailyUsageStatusCache.cache = {};
    }

    if (dailyUsageStatusCache.cache[cacheKey]) {
        return dailyUsageStatusCache.cache[cacheKey];
    }

    const faultRepair = await FaultRepair.find({ device: deviceID });
    const isFault = faultRepair.find(
      (record) => record.repairStatus === 'Chờ quyết định' || record.repairStatus === "Không sửa" || (record.repairStatus === 'Sửa' && !record.startDate)
    );
    if (isFault) {
      dailyUsageStatusCache.cache[cacheKey] = 'Hỏng';
      return 'Hỏng';
    }

    const isRepairing = faultRepair.find(
      (record) =>
        record.repairStatus === "Sửa" &&
        record.startDate <= currentDate &&
        (record.finishedDate >= currentDate || !record.finishedDate)
    );
    if (isRepairing) {
      dailyUsageStatusCache.cache[cacheKey] = 'Đang sửa chữa';
      return 'Đang sửa chữa';
    }

    const maintenance = await Maintenance.find({ device: deviceID });
    const isMaintenance = maintenance.find(
      (record) =>
        record.startDate <= currentDate &&
        (record.finishedDate >= currentDate || !record.finishedDate)
    );
    if (isMaintenance) {
      dailyUsageStatusCache.cache[cacheKey] = 'Đang bảo trì';
      return 'Đang bảo trì';
    }

    const usages = await Using.find({ device: deviceID });
    const isUsing = usages.find(
      (record) => record.startDate <= currentDate && record.endDate >= currentDate
    );
    if (isUsing) {
      dailyUsageStatusCache.cache[cacheKey] = 'Đang sử dụng';
      return 'Đang sử dụng';
    }

    dailyUsageStatusCache.cache[cacheKey] = 'Sẵn sàng sử dụng';
    return 'Sẵn sàng sử dụng';
  } catch (err) {
    console.error('Error:', err);
    return 'Error';
  }
};

const getDevicesByConditions = async (req, res) => {
    try {
        const { selectedType, selectedManufacturer, selectedStorageLocation, selectedStatus, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedType) query.classification = { $in: selectedType };
        if (selectedManufacturer) query.manufacturer = { $in: selectedManufacturer };
        if (selectedStorageLocation) query.storageLocation = { $in: selectedStorageLocation };
        if (searchQuery) {
        query.$or = [
            { deviceID: { $regex: searchQuery, $options: 'i' } },
            { deviceName: { $regex: searchQuery, $options: 'i' } }
        ];
        }

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const devices = await Device.find(query)
            .sort({ importationDate: -1 });

        const filteredDevices = devices.map(async (device) => {
            const modifiedDevice = { ...device._doc };
            modifiedDevice.usageStatus = await getUsageStatus(device._id);
            return modifiedDevice;
        });

        const devicesWithUsageStatus = await Promise.all(filteredDevices);
        let listDevices = [];
        if (selectedStatus) {
            listDevices = devicesWithUsageStatus.filter(device => selectedStatus.includes(device.usageStatus));
        } else {
            listDevices = devicesWithUsageStatus;
        }

        const totalDevices = listDevices.length;
        const totalPages = Math.ceil(totalDevices / parseInt(limit));

        listDevices = listDevices.slice(startIndex, endIndex);
        
        res.status(200).json({ devices: listDevices, totalDevices, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getAllDevicesForExport = async (req, res) => {
  try {
    const { selectedType, selectedManufacturer, selectedStorageLocation, selectedStatus, searchQuery } = req.query;

    const query = {};
    if (selectedType) query.classification = { $in: selectedType };
    if (selectedManufacturer) query.manufacturer = { $in: selectedManufacturer };
    if (selectedStorageLocation) query.storageLocation = { $in: selectedStorageLocation };
    if (searchQuery) {
    query.$or = [
        { deviceID: { $regex: searchQuery, $options: 'i' } },
        { deviceName: { $regex: searchQuery, $options: 'i' } }
    ];
    }

    const devices = await Device.find(query)
        .sort({ importationDate: -1 });

    const filteredDevices = devices.map(async (device) => {
        const modifiedDevice = { ...device._doc };
        modifiedDevice.usageStatus = await getUsageStatus(device._id);
        return modifiedDevice;
    });

    const devicesWithUsageStatus = await Promise.all(filteredDevices);
    let listDevices = [];
    if (selectedStatus) {
        listDevices = devicesWithUsageStatus.filter(device => selectedStatus.includes(device.usageStatus));
    } else {
        listDevices = devicesWithUsageStatus;
    }
    
    res.status(200).json({ devices: listDevices });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
}

const getManufacturerForFilter = async (req, res) => {
    try {
        const manufacturers = await Device.distinct('manufacturer');
        manufacturers.sort();

        res.status(200).json(manufacturers);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getStorageForFilter = async (req, res) => {
    try {
        const storages = await Device.distinct('storageLocation');
        storages.sort();
            
        res.status(200).json(storages);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getDeviceByID = async (req, res) => {
  try {
      const id = req.params.id;
      const device = await Device.findById(id);

      if (!device) {
        return res.status(404).json({ message: 'Thiết bị không được tìm thấy' });
      }
      const responseDevice = { ...device._doc };
      responseDevice.usageStatus = await getUsageStatus(device._id);
      res.status(200).json(responseDevice);
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
}

const getDeviceDueForMaintenance = async (req, res) => {
    try {
        const currentDate = new Date();
        const twoWeeksFromNow = new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        const devices = await Device.find();
        const devicesDueForMaintenance = devices.map((device) => {
          let nextMaintenanceDate = new Date(device.importationDate);
          const cycle = Number(device.maintenanceCycle.split(' ')[0]);
          while (nextMaintenanceDate < currentDate) {
            nextMaintenanceDate = new Date(nextMaintenanceDate.getTime() + cycle * 30 * 24 * 60 * 60 * 1000);
          }
          return {
            deviceID: device.deviceID,
            deviceName: device.deviceName,
            dueForMaintenance: nextMaintenanceDate <= twoWeeksFromNow,
            date: nextMaintenanceDate,
          };
        }).filter((deviceInfo) => deviceInfo.dueForMaintenance).sort((a, b) => b.date - a.date);;

        res.status(200).json(devicesDueForMaintenance);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const addDevice = async (req, res) => {
    try {
        const { deviceID, deviceName, serialNumber, classification, manufacturer, origin, 
          manufacturingYear, importationDate, price, storageLocation, warrantyPeriod, maintenanceCycle } = req.body;

        const existingDeviceID = await Device.findOne({ deviceID: deviceID });
        if (existingDeviceID) {
          return res.status(400).json({ error: 'Mã thiết bị đã tồn tại' });
        }

        const maintenanceCycleWithUnit = `${maintenanceCycle} tháng`;

        const newDevice = new Device({
          deviceID,
          deviceName,
          serialNumber,
          classification,
          manufacturer,
          origin,
          manufacturingYear: Number(manufacturingYear),
          importationDate: new Date(importationDate),
          price: Number(price),
          storageLocation,
          warrantyPeriod: new Date(warrantyPeriod),
          maintenanceCycle: maintenanceCycleWithUnit,
        });
        const savedDevice = await newDevice.save();
        res.status(200).json(savedDevice);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

const updateDevice = async (req, res) => {
    try {
      const id = req.params.id;
      const { deviceID, deviceName, serialNumber, classification, manufacturer, origin, 
        manufacturingYear, importationDate, price, storageLocation, warrantyPeriod, maintenanceCycle } = req.body;

      const existingDeviceID = await Device.findOne({ deviceID: deviceID });
      if (existingDeviceID && existingDeviceID._id != id) {
        return res.status(400).json({ error: 'Mã thiết bị trùng với mã của thiết bị khác. Vui lòng giữ nguyên mã thiết bị cũ hoặc chọn lại.' });
      }

      const maintenanceCycleWithUnit = `${maintenanceCycle} tháng`;

      const updatedInfo = {
        deviceID,
        deviceName,
        serialNumber,
        classification,
        manufacturer,
        origin,
        manufacturingYear: Number(manufacturingYear),
        importationDate: new Date(importationDate),
        price: Number(price),
        storageLocation,
        warrantyPeriod: new Date(warrantyPeriod),
        maintenanceCycle: maintenanceCycleWithUnit,
      };
      const updatedDevice = await Device.findByIdAndUpdate(id, updatedInfo, { new: true });
      delete dailyUsageStatusCache.cache[`usageStatus:${id}`];
      res.status(200).json(updatedDevice);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

const deleteDevice = async (req, res) => {
    try {
        const id = req.params.id;
        const deleteDeviceResult = await Device.findByIdAndDelete(id);
        await Using.deleteMany({ device: id });
        await Maintenance.deleteMany({ device: id });
        await FaultRepair.deleteMany({ device: id });

        if (!deleteDeviceResult) {
          return res.status(404).json({ error: 'Không tìm thấy thiết bị.' });
        }

        delete dailyUsageStatusCache.cache[`usageStatus:${id}`];
        res.status(200).json(deleteDeviceResult);
    } catch (err) {
        console.error('Lỗi khi xóa thiết bị:', err.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa thiết bị.' });
    }
}

const getDeviceNameByID = async (req, res) => {
    try {
        const id = req.params.id;
        const device = await Device.findOne({ deviceID: id });
        if (!device) res.status(200).json('');
        else {
          res.status(200).json(device.deviceName);
        }
    } catch (err) {
        console.log('Error:', err);
        res.status(500).json(err);
    }
}

module.exports = { getDevicesByConditions, 
  getAllDevicesForExport, 
  getDeviceByID, 
  getManufacturerForFilter, 
  getStorageForFilter,
  getDeviceDueForMaintenance, 
  addDevice, 
  updateDevice, 
  deleteDevice, 
  getDeviceNameByID,
  dailyUsageStatusCache };