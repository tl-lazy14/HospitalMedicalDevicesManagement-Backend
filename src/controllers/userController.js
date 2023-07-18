const User = require("../models/User");
const UsageRequest = require('../models/UsingRequest');
const Usage = require('../models/Using');
const FaultRepair = require('../models/FaultRepair');
const PurchaseRequest = require('../models/PurchaseRequest');

const getAllUsers = async (req, res) => {
    try {
        const user = await User.find();
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
}

const getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json(err);
    }
}

const getUserNameByID = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await User.findOne({ userID: id });
        if (!user) res.status(200).json('');
        else {
          res.status(200).json(user.name);
        }
    } catch (err) {
        console.log('Error:', err);
        res.status(500).json(err);
    }
}

const getDepartmentForFilter = async (req, res) => {
    try {
        const departments = await User.distinct('department');
        const filteredDepartments = departments.filter((department) => department !== 'Administrator');
        
        filteredDepartments.sort();

        res.status(200).json(filteredDepartments);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
}

const getListOperatorByConditions = async (req, res) => {
    try {
        const { selectedDepartment, searchQuery, page, limit } = req.query;

        const query = {};
        if (selectedDepartment) query.department = { $in: selectedDepartment };
        if (searchQuery) {
            query.$or = [
                { userID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
            ]
        }
        query.isAdmin = false;

        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);

        const listOperator = await User.find(query);

        const totalRecords = await User.countDocuments(query);
        const totalPages = Math.ceil(totalRecords / parseInt(limit));

        const operatorInfo = listOperator.slice(startIndex, endIndex);
        
        res.status(200).json({ list: operatorInfo, totalRecords, totalPages });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const getListOperatorForExport = async (req, res) => {
    try {
        const { selectedDepartment, searchQuery } = req.query;

        const query = {};
        if (selectedDepartment) query.department = { $in: selectedDepartment };
        if (searchQuery) {
            query.$or = [
                { userID: { $regex: searchQuery, $options: 'i' } },
                { name: { $regex: searchQuery, $options: 'i' } },
                { email: { $regex: searchQuery, $options: 'i' } },
            ]
        }
        query.isAdmin = false;

        const listOperator = await User.find(query);
        
        res.status(200).json({ list: listOperator });
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json(err);
    }
};

const updateInfoOperator = async (req, res) => {
    try {
      const id = req.params.id;
      const infoOperator = req.body;

      const existingUserID = await User.findOne({ userID: infoOperator.userID });
      if (existingUserID && existingUserID._id != id) {
        return res.status(400).json({ error: 'Mã trùng với mã của người dùng khác. Vui lòng giữ nguyên mã người dùng cũ hoặc chọn lại.' });
      }

      const updatedInfo = {
        userID: infoOperator.userID,
        email: infoOperator.email,
        name: infoOperator.name,
        department: infoOperator.department,
      };
      const updatedOperator = await User.findByIdAndUpdate(id, updatedInfo, { new: true });
      res.status(200).json(updatedOperator);
    } catch (err) {
        console.error('Error:', err);
        res.status(500).json({ error: 'Something went wrong' });
    }
}

const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const deleteUser = await User.findByIdAndDelete(id);
        await UsageRequest.deleteMany({ requester: id });
        await Usage.deleteMany({ requester: id });
        await FaultRepair.deleteMany({ reporter: id });
        await PurchaseRequest.deleteMany({ requester: id });

        if (!deleteUser) {
          return res.status(404).json({ error: 'Không tìm thấy người vận hành này.' });
        }

        res.status(200).json(deleteUser);
    } catch (err) {
        console.error('Lỗi khi xóa:', err.message);
        res.status(500).json({ error: 'Đã xảy ra lỗi khi xóa.' });
    }
}

module.exports = { 
    getAllUsers, 
    getUserById, 
    getUserNameByID, 
    getDepartmentForFilter,
    getListOperatorByConditions,
    getListOperatorForExport,
    updateInfoOperator,
    deleteUser, 
};