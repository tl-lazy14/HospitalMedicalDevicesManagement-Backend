const User = require("../models/User");

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

const deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        res.status(200).json("Delete Succesfully");
    } catch (err) {
        res.status(500).json(err);
    }
}

module.exports = { getAllUsers, getUserById, deleteUser };