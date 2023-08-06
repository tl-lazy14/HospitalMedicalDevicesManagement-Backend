const Device = require('../models/Device');
const Using = require('../models/Using');
const FaultRepair = require('../models/FaultRepair');
const Maintenance = require('../models/Maintenance');
const UsingRequest = require('../models/UsingRequest');
const PurchaseRequest = require('../models/PurchaseRequest');

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

const getNumberDeviceByStatus = async (req, res) => {
    try {
        let total = 0;
        let available = 0;
        let using = 0;
        let failure = 0;
        let maintenance = 0;
        const allDevice = await Device.find();
        total = await Device.countDocuments();
        allDevice.map((device) => {
            const cacheKey = `usageStatus:${device._id}`;
            if (dailyUsageStatusCache.cache[cacheKey] === 'Sẵn sàng sử dụng') available++;
            else if (dailyUsageStatusCache.cache[cacheKey] === 'Đang sử dụng') using++;
            else if (dailyUsageStatusCache.cache[cacheKey] === 'Hỏng') failure++;
            else if (dailyUsageStatusCache.cache[cacheKey] === 'Đang sửa chữa'
            || dailyUsageStatusCache.cache[cacheKey] === 'Đang bảo trì') maintenance++;
        });
        res.status(200).json({ total: total, available: available, using: using, failure: failure, maintenance: maintenance });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getNumberDeviceByClassify = async (req, res) => {
    try {
        const numTypeA = await Device.countDocuments({ classification: 'TBYT Loại A' });
        const numTypeB = await Device.countDocuments({ classification: 'TBYT Loại B' });
        const numTypeC = await Device.countDocuments({ classification: 'TBYT Loại C' });
        const numTypeD = await Device.countDocuments({ classification: 'TBYT Loại D' });
        const data = [
          {
            "id": "TBYT Loại A",
            "label": "TBYT Loại A",
            "value": numTypeA,
            "color": "hsl(49, 70%, 50%)"
          },
          {
            "id": "TBYT Loại B",
            "label": "TBYT Loại B",
            "value": numTypeB,
            "color": "hsl(25, 70%, 50%)"
          },
          {
            "id": "TBYT Loại C",
            "label": "TBYT Loại C",
            "value": numTypeC,
            "color": "hsl(104, 70%, 50%)"
          },
          {
            "id": "TBYT Loại D",
            "label": "TBYT Loại D",
            "value": numTypeD,
            "color": "hsl(153, 70%, 50%)"
          }
        ];
        res.status(200).json(data);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getUsageRequestByClassify = async (req, res) => {
  try {
      const totalRecord = await UsingRequest.countDocuments();
      const accept = await UsingRequest.countDocuments({ status: 'Đã duyệt' });
      const pending = await UsingRequest.countDocuments({ status: 'Đang chờ duyệt' });
      const refuse = await UsingRequest.countDocuments({ status: 'Đã từ chối' });
      const data = [
        {
          "id": "Đã duyệt",
          "label": "Đã duyệt",
          "value": accept,
          "color": "hsl(104, 70%, 50%)"
        },
        {
          "id": "Đang chờ duyệt",
          "label": "Đang chờ duyệt",
          "value": pending,
          "color": "hsl(25, 70%, 50%)"
        },
        {
          "id": "Đã từ chối",
          "label": "Đã từ chối",
          "value": refuse,
          "color": "hsl(153, 70%, 50%)"
        }
      ];
      res.status(200).json({ total: totalRecord, data: data });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
}

const getFaultRepairByClassify = async (req, res) => {
  try {
      const totalRecord = await FaultRepair.countDocuments();
      const accept = await FaultRepair.countDocuments({ repairStatus: 'Sửa' });
      const pending = await FaultRepair.countDocuments({ repairStatus: 'Chờ quyết định' });
      const refuse = await FaultRepair.countDocuments({ repairStatus: 'Không sửa' });
      const data = [
        {
          "id": "Sửa",
          "label": "Sửa",
          "value": accept,
          "color": "hsl(104, 70%, 50%)"
        },
        {
          "id": "Chờ quyết định",
          "label": "Chờ quyết định",
          "value": pending,
          "color": "hsl(25, 70%, 50%)"
        },
        {
          "id": "Không sửa",
          "label": "Không sửa",
          "value": refuse,
          "color": "hsl(153, 70%, 50%)"
        }
      ];
      res.status(200).json({ total: totalRecord, data: data });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
}

const getPurchaseRequestByClassify = async (req, res) => {
  try {
      const totalRecord = await PurchaseRequest.countDocuments();
      const accept = await PurchaseRequest.countDocuments({ status: 'Đã duyệt' });
      const pending = await PurchaseRequest.countDocuments({ status: 'Đang chờ duyệt' });
      const refuse = await PurchaseRequest.countDocuments({ status: 'Đã từ chối' });
      const data = [
        {
          "id": "Đã duyệt",
          "label": "Đã duyệt",
          "value": accept,
          "color": "hsl(104, 70%, 50%)"
        },
        {
          "id": "Đang chờ duyệt",
          "label": "Đang chờ duyệt",
          "value": pending,
          "color": "hsl(25, 70%, 50%)"
        },
        {
          "id": "Đã từ chối",
          "label": "Đã từ chối",
          "value": refuse,
          "color": "hsl(153, 70%, 50%)"
        }
      ];
      res.status(200).json({ total: totalRecord, data: data });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
}

const getNumDeviceByMonth = async (req, res) => {
    try {
        const year = req.query.year;
        const thisDate = new Date();
        let maxMonth;
        const objMonth = {
          1: 'Tháng 1',
          2: 'Tháng 2',
          3: 'Tháng 3',
          4: 'Tháng 4',
          5: 'Tháng 5',
          6: 'Tháng 6',
          7: 'Tháng 7',
          8: 'Tháng 8',
          9: 'Tháng 9',
          10: 'Tháng 10',
          11: 'Tháng 11',
          12: 'Tháng 12'
        }
        let data = [];
        if (year == thisDate.getFullYear()) maxMonth = thisDate.getMonth() + 1;
        else maxMonth = 12;
        for (let month = 1; month <= maxMonth; month++) {
            const numDevice = await Device.countDocuments({
              $expr: {
                $and: [
                  { $eq: [{ $year: '$importationDate' }, year] },
                  { $eq: [{ $month: '$importationDate' }, month] },
                ]
              }
            });
            data.push({
              'Tháng': objMonth[month],
              'Số thiết bị': numDevice,
            });
        } 
        res.status(200).json({ data: data });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getOverviewByMonth = async (req, res) => {
  try {
      const year = req.query.year;
      const thisDate = new Date();
      let maxMonth;
      const objMonth = {
        1: 'Tháng 1',
        2: 'Tháng 2',
        3: 'Tháng 3',
        4: 'Tháng 4',
        5: 'Tháng 5',
        6: 'Tháng 6',
        7: 'Tháng 7',
        8: 'Tháng 8',
        9: 'Tháng 9',
        10: 'Tháng 10',
        11: 'Tháng 11',
        12: 'Tháng 12'
      }
      let data = [];
      if (year == thisDate.getFullYear()) maxMonth = thisDate.getMonth() + 1;
      else maxMonth = 12;
      for (let month = 1; month <= maxMonth; month++) {
          const numUsageRequest = await UsingRequest.countDocuments({
            $expr: {
              $or: [
                { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                { $and: [{ $eq: [{ $year: '$endDate' }, year] }, { $eq: [{ $month: '$endDate' }, month] }] }
              ]
            }
          });
          const numUsage = await Using.countDocuments({
            $expr: {
              $or: [
                { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                { $and: [{ $eq: [{ $year: '$endDate' }, year] }, { $eq: [{ $month: '$endDate' }, month] }] }
              ]
            }
          });
          const numFailureDevice = await FaultRepair.countDocuments({
            $expr: {
              $and: [
                { $eq: [{ $year: '$time' }, year] },
                { $eq: [{ $month: '$time' }, month] },
              ]
            }
          });
          const numFixDevice = await FaultRepair.countDocuments({
            $expr: {
              $or: [
                { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                { $and: [{ $eq: [{ $year: '$finishedDate' }, year] }, { $eq: [{ $month: '$finishedDate' }, month] }] }
              ]
            }
          });
          const numMaintenanceDevice = await Maintenance.countDocuments({
            $expr: {
              $or: [
                { $and: [{ $eq: [{ $year: '$startDate' }, year] }, { $eq: [{ $month: '$startDate' }, month] }] },
                { $and: [{ $eq: [{ $year: '$finishedDate' }, year] }, { $eq: [{ $month: '$finishedDate' }, month] }] }
              ]
            }
          });
          const numPurchaseRequest = await PurchaseRequest.countDocuments({
            $expr: {
              $and: [
                { $eq: [{ $year: '$dateOfRequest' }, year] },
                { $eq: [{ $month: '$dateOfRequest' }, month] },
              ]
            }
          });
          data.push({
            'Tháng': objMonth[month],
            'Yêu cầu sử dụng': numUsageRequest,
            'Lần sử dụng': numUsage,
            'Hỏng': numFailureDevice,
            'Sửa chữa, bảo trì': numFixDevice + numMaintenanceDevice,
            'Yêu cầu mua sắm': numPurchaseRequest
          });
      } 
      res.status(200).json({ data: data });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
}

const getCostBreakdownByMonth = async (req, res) => {
    try {
        const year = req.query.year;
        const thisDate = new Date();
        let maxMonth;
        const objMonth = {
          1: 'Tháng 1',
          2: 'Tháng 2',
          3: 'Tháng 3',
          4: 'Tháng 4',
          5: 'Tháng 5',
          6: 'Tháng 6',
          7: 'Tháng 7',
          8: 'Tháng 8',
          9: 'Tháng 9',
          10: 'Tháng 10',
          11: 'Tháng 11',
          12: 'Tháng 12'
        }
        let data = [];
        if (year == thisDate.getFullYear()) maxMonth = thisDate.getMonth() + 1;
        else maxMonth = 12;
        for (let month = 1; month <= maxMonth; month++) {
            let totalCost = 0;
            const listRepair = await FaultRepair.find({
              $expr: {
                $and: [
                  { $eq: [{ $year: '$finishedDate' }, year] },
                  { $eq: [{ $month: '$finishedDate' }, month] },
                ]
              }
            });
            for (const record of listRepair) {
              if (record.cost) totalCost += record.cost
            }
            const listMaintenance = await Maintenance.find({
              $expr: {
                $and: [
                  { $eq: [{ $year: '$finishedDate' }, year] },
                  { $eq: [{ $month: '$finishedDate' }, month] },
                ]
              }
            });
            for (const record of listMaintenance) {
              if (record.cost) totalCost += record.cost
            }
            data.push({
              'x': objMonth[month],
              'y': totalCost,
            });
        }
        const result = [{
          'id': 'costBreakdown',
          'data': data,
        }];
        res.status(200).json({ data: result });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getNumDayBetweenDate = (date1, date2) => {
    let timestamp1 = date1.getTime();
    let timestamp2 = date2.getTime();
    let timeDiff = Math.abs(timestamp2 - timestamp1); 
    let totalDay = Math.ceil(timeDiff / (1000 * 3600 * 24));
    return totalDay;
}

const getNumHourBetweenDate = (date1, date2) => {
  let timestamp1 = date1.getTime();
  let timestamp2 = date2.getTime();
  let timeDiff = Math.abs(timestamp2 - timestamp1); 
  let totalHours = timeDiff / (1000 * 3600);
  return totalHours;
}

const getNumMonthBetweenDate = (date1, date2) => {
    let yearDiff = date2.getFullYear() - date1.getFullYear();
    let monthDiff = date2.getMonth() - date1.getMonth();
    let totalMonths = yearDiff * 12 + monthDiff;
    return totalMonths;
}

const getUptime = async (req, res) => {
    try {
        const allDevice = await Device.find();
        const numDevice = await Device.countDocuments();
        const thisDate = new Date();
        let uptimeOfAllDevice = 0;
        for (const device of allDevice) {
            const totalDay = getNumDayBetweenDate(device.importationDate, thisDate);
            let totalFailureDay = 0;
            const listFailure = await FaultRepair.find({ device: device._id });
            if (listFailure) {
              listFailure.map((record) => {
                if (record.finishedDate) totalFailureDay += getNumDayBetweenDate(record.time, record.finishedDate); 
                else totalFailureDay += getNumDayBetweenDate(record.time, thisDate); 
              })
            }
            let totalMaintenanceDay = 0;
            const listMaintenance = await Maintenance.find({ device: device._id });
            if (listMaintenance) {
              listMaintenance.map((record) => {
                if (record.finishedDate) totalMaintenanceDay += getNumDayBetweenDate(record.startDate, record.finishedDate); 
                else totalMaintenanceDay += getNumDayBetweenDate(record.startDate, thisDate); 
              })
            }
            const breakdownTime = totalFailureDay + totalMaintenanceDay;
            const uptime = (totalDay - breakdownTime) / totalDay * 100;
            uptimeOfAllDevice += uptime;
        };
        const result = (uptimeOfAllDevice / numDevice).toFixed(2);
        res.status(200).json({ data: result });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getMTBF = async (req, res) => {
  try {
      const allDeviceFault = await FaultRepair.distinct('device');
      const numDevice = allDeviceFault.length;
      const thisDate = new Date();
      let MTBFOfTotal = 0;
      for (const device of allDeviceFault) {
          const getDevice = await Device.findOne({ _id: device });
          const totalTime = getNumHourBetweenDate(getDevice.importationDate, thisDate);
          let totalFailureHour = 0;
          const listFailure = await FaultRepair.find({ device: getDevice._id });
          listFailure.map((record) => {
            if (record.finishedDate) totalFailureHour += getNumHourBetweenDate(record.time, record.finishedDate); 
            else totalFailureHour += getNumHourBetweenDate(record.time, thisDate); 
          });
          const mtbf = (totalTime - totalFailureHour) / listFailure.length;
          MTBFOfTotal += mtbf;
      };
      const result = (MTBFOfTotal / numDevice).toFixed(2);
      res.status(200).json({ data: result });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

const getAgeFailureRate = async (req, res) => {
  try {
      const allDevice = await Device.find();
      const numDevice = await Device.countDocuments();
      const thisDate = new Date();
      let ageFailureRateOfAllDevice = 0;
      for (const device of allDevice) {
          const ageDevice = getNumDayBetweenDate(device.importationDate, thisDate);
          let totalFailureDay = 0;
          const listFailure = await FaultRepair.find({ device: device._id });
          if (listFailure) {
            listFailure.map((record) => {
              if (record.finishedDate) totalFailureDay += getNumDayBetweenDate(record.time, record.finishedDate); 
              else totalFailureDay += getNumDayBetweenDate(record.time, thisDate); 
            })
          }
          const ageFailueRate = totalFailureDay / ageDevice * 100;
          ageFailureRateOfAllDevice += ageFailueRate;
      };
      const result = (ageFailureRateOfAllDevice / numDevice).toFixed(2);
      res.status(200).json({ data: result });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

const getPeriodicMaintenanceRatio = async (req, res) => {
  try {
      const allDevice = await Device.find();
      const numDevice = await Device.countDocuments();
      const thisDate = new Date();
      let metricOfAllDevice = 0;
      for (const device of allDevice) {
          const numMonth = getNumMonthBetweenDate(device.importationDate, thisDate);
          const maintenanceCycle = parseInt(device.maintenanceCycle.split(' ')[0]);
          const numMaintenanceExpect = Math.floor(numMonth / maintenanceCycle);
          const numMaintenanceReality = await Maintenance.countDocuments({ device: device._id });
          const metric = numMaintenanceExpect > 0 ? numMaintenanceReality / numMaintenanceExpect * 100 : 100;
          metricOfAllDevice += metric;
      };
      const result = (metricOfAllDevice / numDevice).toFixed(2);
      res.status(200).json({ data: result });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

const getAvgRepairTime = async (req, res) => {
  try {
      const allRecord = await FaultRepair.find();
      let numRepaired = 0;
      let metricOfAll = 0;
      for (const record of allRecord) {
          if (record.startDate && record.finishedDate) {
              numRepaired++;
              const timeToRepair = getNumDayBetweenDate(record.startDate, record.finishedDate);
              metricOfAll += timeToRepair;
          }
      };
      const result = (metricOfAll / numRepaired).toFixed(2);
      res.status(200).json({ data: result });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

const getAvgMaintenanceTime = async (req, res) => {
  try {
      const allRecord = await Maintenance.find();
      let numMaintenanced = 0;
      let metricOfAll = 0;
      for (const record of allRecord) {
          if (record.startDate && record.finishedDate) {
              numMaintenanced++;
              const timeToMaintenance = getNumDayBetweenDate(record.startDate, record.finishedDate);
              metricOfAll += timeToMaintenance;
          }
      };
      const result = (metricOfAll / numMaintenanced).toFixed(2);
      res.status(200).json({ data: result });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

const getRepairMaintenanceCost = async (req, res) => {
  try {
      let total = 0;
      const allMaintenance = await Maintenance.find();
      for (const record of allMaintenance) {
          if (record.cost) total += record.cost;
      }
      const allRepair = await FaultRepair.find();
      for (const record of allRepair) {
          if (record.cost) total += record.cost;
      }
      total = Math.round(total / 1000000);
      res.status(200).json({ data: total });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

const getPurchaseCost = async (req, res) => {
  try {
      let total = 0;
      const allDevice = await Device.find();
      for (const device of allDevice) {
        total += device.price;
      }
      total = Math.round(total / 1000000);
      res.status(200).json({ data: total });
  } catch (err) {
      console.error('Error:', err);
      res.status(500).json(err);
  }
};

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
  getNumberDeviceByStatus,
  getNumberDeviceByClassify,
  getUsageRequestByClassify,
  getFaultRepairByClassify,
  getPurchaseRequestByClassify,
  getNumDeviceByMonth,
  getOverviewByMonth,
  getCostBreakdownByMonth,
  getUptime,
  getMTBF,
  getAgeFailureRate,
  getPeriodicMaintenanceRatio,
  getAvgRepairTime,
  getAvgMaintenanceTime,
  getRepairMaintenanceCost,
  getPurchaseCost,
  addDevice, 
  updateDevice, 
  deleteDevice, 
  getDeviceNameByID,
  dailyUsageStatusCache };