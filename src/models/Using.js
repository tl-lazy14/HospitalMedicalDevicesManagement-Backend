const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usingSchema = new Schema({
    device: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Device',
    },
    usageDepartment: {
        type: String,
        required: true,
    },
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
}, { timestamps: true });

const Using = mongoose.model('Using', usingSchema);

module.exports = Using;