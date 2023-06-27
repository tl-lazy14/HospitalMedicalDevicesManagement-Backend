const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const faultRepairSchema = new Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    },
    reporter: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    time: {
        type: Date,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    repairStatus: {
        type: String,
    },
    startDate: {
        type: Date,
    },
    finishedDate: {
        type: Date,
    },
    repairServiceProvider: {
        type: String,
    },
    cost: {
        type: Int16Array,
    },
}, { timestamps: true });

const FaultRepair = mongoose.model('FaultRepair', faultRepairSchema);

module.exports = FaultRepair;