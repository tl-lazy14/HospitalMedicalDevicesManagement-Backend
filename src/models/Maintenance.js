const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const maintenanceSchema = new Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    },
    startDate: {
        type: Date,
        required: true,
    },
    finishedDate: {
        type: Date,
    },
    performer: {
        type: String,
    },
    cost: {
        type: Number,
    },
    maintenanceServiceProvider: {
        type: String,
    },
}, { timestamps: true });

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;