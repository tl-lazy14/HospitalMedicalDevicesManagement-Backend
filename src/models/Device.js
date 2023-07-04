const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const deviceSchema = new Schema({
    deviceID: {
        type: String,
        required: true,
        unique: true,
    },
    deviceName: {
        type: String,
        required: true,
    },
    serialNumber: {
        type: String,
        required: true,
        unique: true,
    },
    classification: {
        type: String,
        required: true,
    },
    manufacturer: {
        type: String,
        required: true,
    },
    origin: {
        type: String,
        required: true,
    },
    manufacturingYear: {
        type: Number,
        required: true,
    },
    importationDate: {
        type: Date,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    storageLocation: {
        type: String,
    },
    warrantyPeriod: {
        type: Date,
    },
    maintenanceCycle: {
        type: String,
    },
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;